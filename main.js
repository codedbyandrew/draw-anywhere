const electron = require('electron')
const {app, BrowserWindow} = electron;
const path = require('path');
const url = require('url');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let toolbar;
let drawable;

function createBackgroundWindow(width, height) {
    drawable = new BrowserWindow({
        width: width,
        height: height,
        transparent: true,
        frame: false,
        toolbar: false,
        resizable: true,
        fullscreenable: false,
        hasShadow: false,
    });

    // and load the index.html of the app.
    drawable.loadURL(url.format({
        pathname: path.join(__dirname, 'background.html'),
        protocol: 'file:',
        slashes: true
    }));

    // Open the DevTools.
    // drawable.webContents.openDevTools();

    // Emitted when the window is closed.
    drawable.on('closed', function () {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        drawable = null
    });

}

function createToolWindow(x, y, width) {
    // Create the browser window.
    toolbar = new BrowserWindow({
        width: 460,
        height: 37,
        titleBarStyle: 'hidden-inset',
        useContentSize: true,
        frame: true,
        toolbar: true,
        resizable: false,
        fullscreenable: false,
        alwaysOnTop: true,
        backgroundColor: '#242424'
    });

    // and load the index.html of the app.
    toolbar.loadURL(url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file:',
        slashes: true
    }));

    toolbar.setPosition(Math.round(width / 2 - 460 / 2 + x), y + 20);

    // Open the DevTools.
    // toolbar.webContents.openDevTools();

    // Emitted when the window is closed.
    toolbar.on('closed', function () {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        toolbar = null
    });
}

function launchWindows(openToolbar, openDragable) {
    const {x, y, width, height} = electron.screen.getPrimaryDisplay().workArea;
    if (openDragable) {
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
    launchWindows(true, true);
});

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
});

app.on('activate',
    function () {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        launchWindows(toolbar === null, drawable === null);
    }
);


