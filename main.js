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
let toolpanel = null;
let drawable = null;
var previousQuit = false;

// https://github.com/EmergingTechnologyAdvisors/node-serialport#new_module_serialport--SerialPort_new
var usbPort = new SerialPort('/dev/cu.usbserial-A6005DPO',
    {
        baudRate: 115200,
        parser: SerialPort.parsers.raw
    }
);

// interface for reading from the terminal
// https://nodejs.org/api/readline.html#readline_readline_createinterface_options
const terminal = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'DE1> '
});

// Get info about available ports, currently only used in debugging
SerialPort.list(function (err, ports) {
    ports.forEach(function (port) {
        console.log(port.comName + ", " + port.manufacturer + ", " + port.serialNumber);
    });
});

terminal.on('line', function (input) {
    writeSerial(input + '\r');
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
    if (data.indexOf('{') == 0 && data.lastIndexOf('}') == data.length() - 1) {
        // data is json
        var obj = JSON.parse(data);
        console.log(obj);
    }
    terminal.prompt();
});

usbPort.on('error', function (err) {
    console.log('Error: ', err.message);
});

function writeSerial(data) {
    usbPort.write(input, function (err) {
        if (err) {
            return console.log('Error on write: ', err.message);
        }
    });
}

function createBackgroundWindow(width, height) {
    drawable = new BrowserWindow({
        width: width,
        height: height,
        transparent: true,
        titleBarStyle: 'hidden-inset',
        show: false,
        frame: true,
        resizable: true,
        fullscreenable: false,
        hasShadow: false,
        useContentSize: true,
        vibrancy: 'dark'
    });

    // and load the index.html of the app.
    drawable.loadURL(url.format({
        pathname: path.join(__dirname, 'drawable.html'),
        protocol: 'file:',
        slashes: true
    }));

    drawable.once('ready-to-show', function () {
        drawable.show();
    });


    // Open the DevTools.
    // drawable.webContents.openDevTools();

    // Emitted when the window is closed.
    drawable.on('closed', function () {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        drawable = null;
        if (toolpanel !== null) {
            toolpanel.close();
        }
    });

    drawable.on('blur', function () {
        /*drawable.hide();
         if (toolpanel === null) {
         launchWindows(toolpanel === null, false);
         } else {
         toolpanel.show();
         // TODO: update location to match in-window toolpanel
         }*/
    });

    drawable.on('focus', function () {
        if (toolpanel !== null) {
            toolpanel.hide();
        }
    })

}

function createToolWindow(x, y, width) {
    // Create the browser window.
    toolpanel = new BrowserWindow({
        width: 219,
        height: 37,
        titleBarStyle: 'hidden-inset',
        useContentSize: true,
        show: false,
        frame: true,
        toolbar: true,
        resizable: false,
        fullscreenable: false,
        alwaysOnTop: true,
        backgroundColor: '#242424',
        acceptFirstMouse: true
    });

    // and load the index.html of the app.
    toolpanel.loadURL(url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file:',
        slashes: true
    }));

    toolpanel.setPosition(Math.round(width / 2 - 219 / 2 + x), y + 20);

    // Open the DevTools.
    // toolpanel.webContents.openDevTools();

    toolpanel.once('ready-to-show', function () {
        toolpanel.show();
    });

    // Emitted when the window is closed.
    toolpanel.on('closed', function () {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        toolpanel = null;
        if (drawable !== null) {
            drawable.focus();
        }
    });
}

function launchWindows(openToolbar, openDraggable) {
    const {x, y, width, height} = electron.screen.getPrimaryDisplay().workArea;
    if (openDraggable) {
        createBackgroundWindow(width, height);
    }
    if (openToolbar) {
        createToolWindow(x, y, width);
    }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', function () {
    launchWindows(false, true);

    ipc.on("toolbarDraw", function (event, arg) {
        event.returnValue = '';
        toolpanel.hide();
        drawable.show();
    });

    ipc.on('toggleVibrancy', function (event, arg) {
        if (arg) {
            drawable.setVibrancy('dark');
        } else {
            drawable.setVibrancy('');
        }
    });
});

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', function () {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (toolpanel !== null) {
            toolpanel.show();
        }

        if (drawable !== null) {
            drawable.show();
        }
        launchWindows(toolpanel === null, drawable === null);

    }
);


