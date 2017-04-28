const electron = require('electron');
const {app, BrowserWindow} = electron;
const ipc = electron.ipcMain;
const dialog = electron.dialog;
const path = require('path');
const url = require('url');
const robot = require("robotjs");
const SerialPort = require("serialport");
const readline = require('readline');
const fs = require('fs');
const brain = require('brain');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let canvas = null;
let calibrator = null;
var previousQuit = false;
var theme = 'selection';
var currentlyTransparent = false;
var self = this;

var jsonData = {data: [0, 0, 0, 0, 0, 0, 0, 0]};
var sender = null;
var time;
var initTime = Date.now();
var lastSent = 0;
var lastReceived = 0;
var paused = true;

var calibratorSender = null;
var calibratorX = 0;
var calibratorY = 0;
var calibratorStep = 0;
var calibrating = false;
var calibratorScreenWidth = 0;
var calibratorScreenHeight = 0;

var net;
var trained = false;
var trainingSender = null;

var stylusEvent = null;

var screenTopCornerX = 0;
var screenTopCornerY = 0;

self.ports = [];
self.currentPortIndex = 0;

var mouseDown = false;
var lastx = null;
var lasty = null;
var initialMousedown;
var firstContact = false;
var cumulativeDistance = 0;

// https://github.com/EmergingTechnologyAdvisors/node-serialport/blob/4.0.7/README.md#serialport-path-options-opencallback
var usbPort = new SerialPort('/dev/cu.usbserial-A6005DPO',
    {
        baudRate: 115200,
        parser: SerialPort.parsers.raw
    }
);

// Get info about available ports
function getPorts() {
    SerialPort.list(function (err, ports) {
        self.ports = ports;
        ports.forEach(function (port, i) {
            if (port.manufacturer == "FTDI") {
                self.currentPortIndex = i;
            }
        });
    });
}
getPorts();

var stdin = process.stdin;
stdin.setRawMode(true);
stdin.resume();
stdin.setEncoding('utf8');

stdin.on('data', function (key) {
    // ctrl-c ( end of text )
    if (key === '\u0003') {
        if (previousQuit) {
            usbPort.close();
            stdin.setRawMode(false);
            process.exit();
        } else {
            console.log('\rsending stop to board, ctrl-c again to quit');
            writeSerial('\x03');
            previousQuit = true;
        }
    } else {
        // write the key to stdout all normal like
        writeSerial(key);
        previousQuit = false;
    }
});

usbPort.on('open', function () {
    writeSerial('\r');
});

function sleep(delay) {
    var start = new Date().getTime();
    while (new Date().getTime() < start + delay);
}

function dist(i, j, x, y) {
    return Math.sqrt(Math.pow((x - i), 2) + Math.pow(y - j, 2));
}

robot.setMouseDelay(0);
function controlMouse(data) {
    var output = net.run({
        0: data[0] / 4095,
        1: data[1] / 4095,
        2: data[2] / 4095,
        3: data[3] / 4095,
        4: data[4] / 4095,
        5: data[5] / 4095,
        6: data[6] / 4095,
        7: data[7] / 4095
    });
    var x = Math.round(output.x * (calibratorScreenWidth - 1));
    var y = Math.round(output.y * (calibratorScreenHeight - 1));
    // console.log(screenTopCornerX + x, screenTopCornerY + y, output.onScreen);
    if (output.onScreen > .99) {
        if (lastx === null) {
            lastx = x;
            lasty = y;
        }
        var distance = dist(lastx, lasty, x, y);
        if (!mouseDown || (
            (Date.now() - initialMousedown) > 300
            || (distance < 10 && distance > 3))) {
            if (!mouseDown) {
                while (robot.getMousePos().x !== (screenTopCornerX + x) && robot.getMousePos().y !== (screenTopCornerY + y)) {
                    robot.moveMouse(screenTopCornerX + x, screenTopCornerY + y);
                }
                robot.mouseToggle("down");
                console.log("mouse down", robot.getMousePos().x, robot.getMousePos().y);
                mouseDown = true;
                firstContact = true;
                cumulativeDistance = 0;
            }
            if (firstContact) {
                firstContact = false;
                initialMousedown = Date.now();
            } else {
                cumulativeDistance += distance;
                firstContact = false;
                if (cumulativeDistance > 30 || (Date.now() - initialMousedown > 300) && distance < 300) {
                    console.log("mouse drag", cumulativeDistance, Date.now() - initialMousedown);
                    robot.dragMouse(screenTopCornerX + x, screenTopCornerY + y);
                }
            }
        }
        lastx = x;
        lasty = y;
    } else {
        if (mouseDown) {
            console.log("mouse up", robot.getMousePos().x, robot.getMousePos().y);
            robot.mouseToggle("up");
            mouseDown = false;
            if (Date.now() - initialMousedown < 300 && cumulativeDistance <= 30) {
                robot.mouseClick();
                console.log("mouse click", robot.getMousePos().x, robot.getMousePos().y);
            }
        }
    }
}

var suppressOutput = false;
var data = '';
usbPort.on('data', function (buffer) {
    if (!suppressOutput) {
        process.stdout.write(buffer);
    }
    let delimiter = /(?:\n)/;
    let encoding = 'utf8';
    // Delimiter buffer saved in closure

    // Collect data
    data += buffer.toString(encoding);
    // Split collected data by delimiter
    var parts = data.split(delimiter);
    data = parts.pop();
    parts.forEach(function (part) {
        processNewLine(part)
    });
});

function processNewLine(data) {
    if (data != undefined) {
        if (data.indexOf('{') == 0) {
            try {
                jsonData = JSON.parse(data);
                if (!suppressOutput) {
                    console.log("\r\n(suppressing large output)");
                    suppressOutput = true;
                }
                if (jsonData.uart) {
                    if (stylusEvent != null) {
                        stylusEvent.send('stylusRx');
                        stylusEvent = null;
                    }
                    console.log("toggle pushed");
                } else if (jsonData.data) {
                    if (calibrating) {
                        calibrate(jsonData);
                    }
                    if (trained) {
                        controlMouse(jsonData.data);
                    }
                    if (time == undefined) {
                        time = Date.now();
                    }
                    jsonData.rate = Date.now() - time;
                    jsonData.time = (Date.now() - initTime) / 1000;
                    time = Date.now();
                    if (paused) {
                        sendDataToCanvas();
                    }
                    lastReceived++;
                }
            } catch (error) {
                suppressOutput = false;
            }
        } else if (data.length > 0) {
            if (suppressOutput) {
                console.log(data);
                suppressOutput = false;
            }
        }
    }
}

usbPort.on('error', function (err) {
    console.log('Error: ', err.message);
});

function writeSerial(data) {
    usbPort.write(data, function (err) {
        if (err) {
            return console.log('Error on write: ', err.message);
        }
    });
}

function createCalibrationWindow(width, height, x, y) {
    let displays = electron.screen.getAllDisplays();
    let externalDisplay = displays.find((display) => {
        return display.bounds.x !== 0 || display.bounds.y !== 0
    });
    var height, width, x, y;
    if (externalDisplay) {
        x = externalDisplay.bounds.x;
        y = externalDisplay.bounds.y;
        calibratorScreenWidth = externalDisplay.size.width;
        calibratorScreenHeight = externalDisplay.size.height;
    } else {
        var primaryDisplay = electron.screen.getPrimaryDisplay();
        x = primaryDisplay.bounds.x;
        y = primaryDisplay.bounds.y;
        calibratorScreenWidth = primaryDisplay.size.width;
        calibratorScreenHeight = primaryDisplay.size.height;
    }

    calibrator = new BrowserWindow({

        x: x,
        y: y,
        width: width,
        height: height,
        transparent: false,
        resizable: true,
        fullscreenable: true,
        fullscreen: true,
        hasShadow: true,  // buggy, on window resize transparent ghost shadows appear
        useContentSize: true,
        vibrancy: 'light',
        webPreferences: {
            experimentalFeatures: true
        }
    });

    // and load the index.html of the app.
    calibrator.loadURL(url.format({
        pathname: path.join(__dirname, 'calibrator.html'),
        protocol: 'file:',
        slashes: true
    }));

    calibrator.once('ready-to-show', function () {
        calibrator.show();
        calibrator.focus();
    });

    // Open the DevTools.
    // canvas.webContents.openDevTools();

    // Emitted when the window is closed.
    calibrator.on('closed', function () {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        calibrator = null;
    });
}

function createCanvasWindow(width, height, x, y) {

    canvas = new BrowserWindow({
        x: x,
        y: y,
        width: width,
        height: height,
        transparent: true,
        titleBarStyle: 'hidden-inset',
        show: false,
        frame: false,
        resizable: true,
        fullscreenable: false,
        hasShadow: true,  // buggy, on window resize transparent ghost shadows appear
        useContentSize: true,
        vibrancy: theme,
        webPreferences: {
            experimentalFeatures: true
        }
    });

    // and load the index.html of the app.
    canvas.loadURL(url.format({
        pathname: path.join(__dirname, 'canvas.html'),
        protocol: 'file:',
        slashes: true
    }));

    canvas.once('ready-to-show', function () {
        canvas.show();
    });

    // Open the DevTools.
    // canvas.webContents.openDevTools();

    // Emitted when the window is closed.
    canvas.on('closed', function () {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        canvas = null;
    });


}

function launchWindow() {
    let displays = electron.screen.getAllDisplays();
    let externalDisplay = displays.find((display) => {
        return display.bounds.x !== 0 || display.bounds.y !== 0
    });
    var height, width, x, y;
    if (externalDisplay) {
        height = externalDisplay.workArea.height;
        width = externalDisplay.workArea.width;
        x = externalDisplay.bounds.x + externalDisplay.workArea.x;
        y = externalDisplay.bounds.y + externalDisplay.workArea.y;
        screenTopCornerX = externalDisplay.bounds.x;
        screenTopCornerY = externalDisplay.bounds.y;
        calibratorScreenWidth = externalDisplay.size.width;
        calibratorScreenHeight = externalDisplay.size.height;
    } else {
        var primaryDisplay = electron.screen.getPrimaryDisplay();
        height = primaryDisplay.workArea.height;
        width = primaryDisplay.workArea.width;
        x = primaryDisplay.bounds.x + primaryDisplay.workArea.x;
        y = primaryDisplay.bounds.y + primaryDisplay.workArea.x;
        screenTopCornerX = primaryDisplay.bounds.x;
        screenTopCornerY = primaryDisplay.bounds.y;
        calibratorScreenWidth = primaryDisplay.size.width;
        calibratorScreenHeight = primaryDisplay.size.height;
    }
    createCanvasWindow(width, height, x, y);
}

function sendDataToCanvas() {
    if (lastSent != lastReceived) {
        sender.send('rxData', jsonData);
    } else {
        paused = true;
    }
    lastSent = lastReceived;
}

var count = 0;
var trainingData = [];
function calibrate(data) {
    if ((calibratorStep === -1 && count >= 800) || (calibratorStep !== -1 && count >= 10)) {
        calibrating = false;
        count = 0;
        calibratorSender.send('step-complete');
        if (calibratorStep === 79) {
            //startTraining
        }
    } else {
        var training = {
            input: {
                0: data.data[0] / 4095,
                1: data.data[1] / 4095,
                2: data.data[2] / 4095,
                3: data.data[3] / 4095,
                4: data.data[4] / 4095,
                5: data.data[5] / 4095,
                6: data.data[6] / 4095,
                7: data.data[7] / 4095
            },
            output: {}
        };
        training.output.onScreen = (calibratorX >= 0) ? 1 : 0;
        if (calibratorX >= 0) {
            training.output.x = calibratorX / (calibratorScreenWidth - 1);
            training.output.y = calibratorY / (calibratorScreenHeight - 1);
        }
        trainingData.push(training);
    }
    count++;
}

var currentIteration;
var currentError;
function trainingCallback(data) {
    currentError = data.error;
    currentIteration = data.iterations;
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', function () {

    launchWindow();

    ipc.on('toggleVibrancy', function (event, arg) {
        currentlyTransparent = arg;
        if (!arg) {
            canvas.setVibrancy(theme);
            canvas.setHasShadow(true);
        } else {
            canvas.setVibrancy('');
            canvas.setHasShadow(false);
        }

    });

    ipc.on('updateTheme', function (event, arg) {
        theme = arg;
        if (!currentlyTransparent) {
            canvas.setVibrancy(arg);
        }
    });

    ipc.on('getData', function (event, arg) {
        sender = event.sender;
        paused = false;
        sendDataToCanvas();
    });

    ipc.on('drawableOpened', function (event, arg) {
        var config = {};
        config.currentlyTransparent = currentlyTransparent;
        config.theme = theme;
        config.ports = self.ports;
        config.currentPort = self.currentPortIndex;
        event.sender.send('windowConfig', config);
    });

    ipc.on('launchCalibration', function (event, arg) {
        createCalibrationWindow();
    });

    ipc.on('step', function (event, step, x, y) {
        calibratorSender = event.sender;
        calibratorX = x;
        calibratorY = y;
        calibratorStep = step;
        console.log('step', calibratorStep, calibratorX, calibratorY);
        calibrating = true;
    });

    ipc.on('save', function (event) {
        dialog.showSaveDialog(
            {
                title: 'Save training data',
                filters: [{name: 'JSON', extensions: ['json']}]
            }
            , function (fileName) {
                fs.writeFile(fileName, JSON.stringify(trainingData), function (err) {
                });
            });
    });

    ipc.on('train', function (event) {
        dialog.showOpenDialog(
            {
                multiSelections: false,
                openDirectory: false,
                filters: [{name: 'JSON', extensions: ['json']}]
            },
            function (filePath) {
                if (filePath == undefined) {
                    return;
                }
                console.log(filePath);
                fs.readFile(filePath[0], (err, data) => {
                    if (err) throw err;
                    net = new brain.NeuralNetwork({hiddenLayers: [8, 8]});
                    var trainingData = JSON.parse(data);
                    var result = net.train(trainingData, {
                        errorThresh: 0.00005,  // error threshold to reach
                        iterations: 50000,   // maximum training iterations
                        log: true,           // console.log() progress periodically
                        logPeriod: 100,       // number of iterations between logging
                        learningRate: 0.05,    // learning rate
                        callback: trainingCallback
                    });
                    console.log(JSON.stringify(result));
                    trained = true;
                    dialog.showSaveDialog(
                        {
                            title: 'Save neural net',
                            filters: [{name: 'JSON', extensions: ['json']}]
                        }
                        , function (fileName) {
                            fs.writeFile(fileName, JSON.stringify(net.toJSON()), function (err) {
                            });
                        });
                });
            }
        );
    });

    ipc.on('load', function (event) {
        dialog.showOpenDialog(
            {
                multiSelections: false,
                openDirectory: false,
                filters: [{name: 'JSON', extensions: ['json']}]
            },
            function (filePath) {
                if (filePath == undefined) {
                    return;
                }
                net = new brain.NeuralNetwork();
                console.log(filePath);
                fs.readFile(filePath[0], (err, data) => {
                    if (err) throw err;
                    net.fromJSON(JSON.parse(data));
                });
                trained = true;
            });
    });

    ipc.on('getStylus', function (event) {
        stylusEvent = event.sender;
    })


});
// Quit when all windows are closed.
app.on('window-all-closed', function () {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('will-quit', function () {
    usbPort.close();
    stdin.setRawMode(false);
});

app.on('activate', function () {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.

        if (canvas !== null) {
            canvas.show();
        }
        launchWindow();

    }
);


