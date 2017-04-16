const electron = require('electron');
const {app, BrowserWindow} = electron;
const ipc = electron.ipcMain;
const path = require('path');
const url = require('url');
const robot = require("robotjs");
const SerialPort = require("serialport");
const readline = require('readline');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let canvas = null;
var previousQuit = false;
var theme = 'selection';
var currentlyTransparent = false;
var self = this;

self.ports = [];
self.currentPortIndex = 0;

// https://github.com/EmergingTechnologyAdvisors/node-serialport/blob/4.0.7/README.md#serialport-path-options-opencallback
var usbPort = new SerialPort('/dev/cu.usbserial-A6005DPO',
    {
        baudRate: 115200,
        parser: SerialPort.parsers.readline(/(?:\n)|(.*: )$|(?:.*:~\$ )$/)
    }
);

// interface for reading from the terminal
// https://nodejs.org/api/readline.html#readline_readline_createinterface_options
const terminal = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'DE1> '
});

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

terminal.on('line', function (input) {
    writeSerial(input + '\r\n');
    terminal.prompt();
    previousQuit = false;
});

terminal.on('SIGINT', function () {
    if (previousQuit) {
        usbPort.close();
        terminal.close();
    } else {
        console.log('sending stop to board, ctrl-c again to quit');
        writeSerial('\x03');
        previousQuit = true;
    }
});

// Node.js application will not terminate until the readline.Interface is closed
// Called when close is called
terminal.on('close', function () {
    process.exit(0);
});

usbPort.on('open', function () {
    // stty -echo hides echoed response.  stty echo shows response
    writeSerial('stty -echo\r');
    terminal.prompt();
});

usbPort.on('data', function (data) {
    if (data != undefined) {
        if (data.indexOf('{') == 0 && data.lastIndexOf('}') == data.length() - 1) {
            // data is json
            var obj = JSON.parse(data);
            console.log(obj);
        }
        if (data.length > 0) {
            process.stdout.write('\r' + data + '\n');
        }
    }
    terminal.prompt();
});

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

function createCanvasWindow(width, height) {
    canvas = new BrowserWindow({
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

function launchWindow(openCanvas) {
    const {x, y, width, height} = electron.screen.getPrimaryDisplay().workArea;
    if (openCanvas) {
        createCanvasWindow(width, height);
    }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', function () {
    launchWindow(true);

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

    ipc.on('drawableOpened', function (event, arg) {
        var config = {};
        config.currentlyTransparent = currentlyTransparent;
        config.theme = theme;
        config.ports = self.ports;
        config.currentPort = self.currentPortIndex;
        event.sender.send('windowConfig', config);
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
    terminal.close();
});

app.on('activate', function () {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.

        if (canvas !== null) {
            canvas.show();
        }
        launchWindow(canvas === null);

    }
);


