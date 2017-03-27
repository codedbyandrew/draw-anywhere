const electron = require('electron');
const shell = electron.shell;
const ipc = electron.ipcRenderer;
const clipboard = electron.clipboard;
const nativeImage = electron.nativeImage;
const {dialog} = electron.remote;
const jQuery = require("jquery");
let $ = jQuery;
var angular = require('angular');
const fs = require('fs');
require('angular-animate');
require('angular-ui-bootstrap');
require('angular-ui-switch');
require('angular-canvas-painter');
require('angular-hotkeys');
const bootstrap = require('bootstrap');
const tinycolor = require('tinycolor2');
require('angularjs-color-picker');
const trimCanvas = require('trim-canvas');
const Ocrad = require('ocrad.js');

let app = angular.module('canvas', ['ui.bootstrap', 'uiSwitch', 'ngAnimate', 'pw.canvas-painter', 'color.picker', 'cfp.hotkeys']);

app.controller('CanvasCtrl', ['$scope', '$window', 'hotkeys', '$document', function ($scope, $window, hotkeys, $document) {
    let self = this;

    self.strokeAdjustTemplate = "strokeAdjustTemplate.html";
    self.configurationTemplate = "configurationTemplate.html";
    self.OCRTemplate = "OCRTemplate.html";

    let pixelRatio = window.devicePixelRatio;
    self.canvasOptions = {
        width: pixelRatio * ($window.innerWidth), //px
        height: pixelRatio * ($window.innerHeight), //px
        backgroundColor: 'rgba(255,255,255,0)',
        color: 'rgba(0, 0, 0, 1)',
        lineWidth: 10, //px
        opacity: 1, //0-1
        undo: true, // boolean or a number of versions to keep in memory
        customCanvasId: 'myCanvas' // define a custom value for the id attribute of the canvas element (default: 'pwCanvasMain')
    };
    self.version = 0;

    self.colorPickerConfig = {
        required: true,
        disabled: false,
        // validation
        restrictToFormat: true,
        allowEmpty: false,
        // color
        format: 'rgb',
        hue: true,
        saturation: false,
        lightness: false, // Note: In the square mode this is HSV and in round mode this is HSL
        alpha: true,
        swatch: false,
        swatchOnly: true,
        // popup
        inline: true
    };

    self.colorPickerEvents = {
        onChange: function (api, color, $event) {
            self.toggleEraser(false, color);
        }
    };

    self.dragOptions = {
        start: function (e) {
            self.cover = true;
            $scope.$apply();
        },
        drag: function (e) {
            self.cover = true;
            $scope.$apply();
        },
        stop: function (e) {
            self.cover = false;
            $scope.$apply();
        },
        container: 'drag-region',
        element: document.getElementById('toolbar'),
        top: true,
        left: false
    };

    self.cover = false;
    self.currentlyTransparent = false;
    self.currentPort = '';
    self.ports = [];
    self.drawing = false;
    self.gridVisible = true;
    self.lineShadow = true;
    self.theme = "selection";
    self.verticalToolbar = false;
    self.erasing = false;

    self.OCR = false;
    self.recognizedText = '';

    ipc.send('drawableOpened');

    ipc.on('windowConfig', function (event, config) {
        event.returnValue = '';
        self.currentlyTransparent = config.currentlyTransparent;
        self.theme = config.theme;
        self.ports = config.ports;
        self.currentPort = config.ports[config.currentPort];
        $scope.$apply();
    });

    $scope.$watch(function () {
        return self.lineShadow;
    }, function () {
        self.toggleLineShadow(self.lineShadow);
    });

    $scope.$watch(function () {
        return self.version;
    }, function () {
        if (self.OCR) {
            if (self.version === 0) {
                self.recognizedText = "";
                return;
            }
            setTimeout(function () {
                let canvas = document.getElementById(self.canvasOptions.customCanvasId);
                let newCanvas = cloneCanvas(canvas);
                newCanvas = trimCanvas.default(newCanvas);
                let context = newCanvas.getContext('2d');
                let w = canvas.width;
                let h = canvas.height;
                let compositeOperation = context.globalCompositeOperation;
                context.globalCompositeOperation = "destination-over";
                context.fillStyle = 'rgb(255,255,255)';
                context.fillRect(0, 0, w, h);
                context.globalCompositeOperation = compositeOperation;
                self.recognizedText = Ocrad(newCanvas);
                $scope.$apply();
            }, 100);
        }
    });

    hotkeys.add({
        combo: 'command+z',
        description: 'Undo last stroke',
        callback: function () {
            if (self.version > 0) {
                self.version--;
            }
        }
    });

    hotkeys.add({
        combo: 'command+c',
        description: 'Copy canvas to clipboard',
        action: 'keydown',
        callback: function () {
            self.copyToClipboard();
        }
    });

    hotkeys.add({
        combo: 'command+n',
        description: 'New canvas',
        callback: function () {
            self.version = 0;
        }
    });

    hotkeys.add({
        combo: 'command+s',
        description: 'Save canvas',
        action: 'keydown',
        callback: function (e) {
            e.preventDefault();
            self.saveCanvas();
        }
    });

    hotkeys.add({
        combo: 'tab',
        description: 'Toggle background visibility',
        callback: function () {
            self.toggleVibrancy();
        }
    });

    hotkeys.add({
        combo: 'g',
        description: 'Toggle grid',
        callback: function () {
            self.gridVisible = !self.gridVisible;
        }
    });

    hotkeys.add({
        combo: 'alt',
        description: 'Quick toggle',
        callback: function () {
            self.quickToggle();
        }
    });

    hotkeys.add({
        combo: 'command+r',
        description: 'Reload',
        callback: function () {
        }
    });

    hotkeys.add({
        combo: 'e',
        description: 'Toggle erase',
        callback: function () {
            self.toggleEraser();
        }
    });

    let w = angular.element($window);
    w.bind('resize', function () {
        // only update canvas if it has grown in one dimension
        //TODO: fix for retina pixelratio
        if ($window.innerWidth > self.canvasOptions.width || $window.innerHeight > (self.canvasOptions.height)) {
            document.getElementById(self.canvasOptions.customCanvasId).width = $window.innerWidth;
            document.getElementById(self.canvasOptions.customCanvasId).height = $window.innerHeight;
            document.getElementById(self.canvasOptions.customCanvasId + "Tmp").width = $window.innerWidth;
            document.getElementById(self.canvasOptions.customCanvasId + "Tmp").height = $window.innerHeight;
        }
    });

    $document.ready(function () {
        let canvasTmp = document.getElementById(self.canvasOptions.customCanvasId + "Tmp");
        let canvas = document.getElementById(self.canvasOptions.customCanvasId);
        let contextTmp = canvasTmp.getContext("2d");
        contextTmp.scale(pixelRatio, pixelRatio);
        canvasTmp.style.width = canvasTmp.width * (1 / pixelRatio) + "px";
        canvasTmp.style.height = canvasTmp.height * (1 / pixelRatio) + "px";
        canvas.style.width = canvas.width * (1 / pixelRatio) + "px";
        canvas.style.height = canvas.height * (1 / pixelRatio) + "px";
        self.toggleLineShadow(true);
    });

    self.toggleLineShadow = function (enabled) {
        let canvasTmp = document.getElementById(self.canvasOptions.customCanvasId + "Tmp");
        let contextTmp = canvasTmp.getContext("2d");
        if (enabled) {
            contextTmp.shadowColor = "rgba(0, 0, 0, .47)";
            contextTmp.shadowOffsetX = 0;
            contextTmp.shadowOffsetY = 26 * pixelRatio;
            contextTmp.shadowBlur = 43 * pixelRatio;
        } else {
            contextTmp.shadowColor = "rgba(0, 0, 0, 0)";
        }
        self.lineShadow = enabled;
    };

    self.toggleVibrancy = function () {
        self.currentlyTransparent = !self.currentlyTransparent;
        ipc.send('toggleVibrancy', self.currentlyTransparent);
    };

    self.updateTheme = function () {
        ipc.send('updateTheme', self.theme);
    };

    self.copyToClipboard = function () {
        if (self.version === 0) {
            return;
        }
        $('#drag-region').addClass('flash');
        setTimeout(function () {
            $("#drag-region").removeClass("flash");
        }, 1000);

        let canvas = document.getElementById(self.canvasOptions.customCanvasId);
        let newCanvas = cloneCanvas(canvas);
        newCanvas = trimCanvas.default(newCanvas);
        let image = newCanvas.toDataURL("image/png");
        clipboard.writeImage(nativeImage.createFromDataURL(image));
    };

    self.saveCanvas = function () {
        if (self.version === 0) {
            return;
        }
        dialog.showSaveDialog(
            {
                title: 'Save canvas',
                filters: [{name: 'Image', extensions: ['png', 'jpeg', 'bmp']}]
            }
            , function (fileName) {
                if (fileName === undefined) return;
                let canvas = document.getElementById(self.canvasOptions.customCanvasId);
                let newCanvas = cloneCanvas(canvas);
                newCanvas = trimCanvas.default(newCanvas);
                let image;
                let ext = fileName.substring(fileName.lastIndexOf('.'));
                switch (ext) {
                    case 'png':
                        image = nativeImage.createFromDataURL(newCanvas.toDataURL("image/png")).toPNG();
                        break;
                    case 'jpeg':
                        image = nativeImage.createFromDataURL(newCanvas.toDataURL("image/jpeg")).toJPEG();
                        break;
                    case 'bmp':
                        image = nativeImage.createFromDataURL(newCanvas.toDataURL("image/bmp")).toBitmap();
                        break;
                    default:
                        console.log("Unsupported image file type:", ext);
                        image = nativeImage.createFromDataURL(newCanvas.toDataURL("image/png")).toPNG();
                }
                fs.writeFile(fileName, image, function (err) {
                });
            });
    };

    self.setPort = function (portName) {
        if (!portName) {
            portName = self.currentPort;
        }
        self.currentPort = portName;
        ipc.send('setPort', portName);
    };

    self.displayHelp = function () {
        hotkeys.toggleCheatSheet();
    };

    self.openInBrowser = function (url) {
        shell.openExternal(url);
    };

    self.getTooltipPlacement = function () {
        if (self.verticalToolbar) {
            if (self.dragOptions.left) {
                return 'right-top';
            } else {
                return 'left-top';
            }
        } else {
            if (self.dragOptions.top) {
                return 'bottom-left';
            } else {
                return 'top-left';
            }
        }
    };

    let previousCompositeOperation;
    let previousColor;
    let shadow;
    self.toggleEraser = function (enabled, color) {
        if (enabled !== undefined) {
            if ((!enabled && !self.erasing) || (enabled && self.erasing)) {
                return;
            }
            self.erasing = enabled;
        } else {
            self.erasing = !self.erasing;
        }
        let canvasTmp = document.getElementById(self.canvasOptions.customCanvasId);
        let context = canvasTmp.getContext('2d');
        if (self.erasing) {
            shadow = self.lineShadow;
            if (self.lineShadow) {
                self.toggleLineShadow(false);
            }
            previousCompositeOperation = context.globalCompositeOperation;
            previousColor = self.canvasOptions.color;
            self.canvasOptions.color = invertRGB(self.canvasOptions.color);
            context.globalCompositeOperation = "destination-out";
            context.strokeStyle = "rgba(255,255,255,1)";
        } else {
            if (shadow) {
                self.toggleLineShadow(true);
            }
            context.globalCompositeOperation = previousCompositeOperation;
            if (color === undefined) {
                self.canvasOptions.color = previousColor;
            }
        }
    };

    self.undoStroke = function () {
        self.version = self.version - 1;
    };

    self.toggleMinimize = function () {

    };

    // These toggle options need to be at the end of this document, since the functions are not yet defined until here
    self.toggleFn = self.undoStroke;
    self.quickToggleOptions = [
        {value: "Hide/Show canvas", fn: self.toggleVibrancy},
        {value: "Undo last stroke", fn: self.undoStroke},
        {value: "Minimize/Maximize window", fn: self.toggleMinimize},
        {value: "Toggle eraser", fn: self.toggleEraser}
    ];

    self.quickToggle = function () {
        console.log(self.toggleFn);
        self.toggleFn();
    }

}]);

app.directive('ngDraggable', function ($document) {
    return {
        restrict: 'A',
        scope: {
            dragOptions: '=ngDraggable'
        },
        link: function (scope, elem, attr) {
            let startX, startY, x = 0, y = 0,
                start, stop, drag, container, element, width, height, rotated, id;

            // Obtain drag options
            if (scope.dragOptions) {
                start = scope.dragOptions.start;
                drag = scope.dragOptions.drag;
                stop = scope.dragOptions.stop;
                element = scope.dragOptions.element;
                id = scope.dragOptions.container;
            }

            // Bind mousedown event
            elem.on('mousedown', function (e) {
                if (id) {
                    container = document.getElementById(id).getBoundingClientRect();
                }
                rotated = $('#' + element.id).hasClass('rotated');
                if (rotated) {
                    height = element.offsetWidth;
                    width = element.offsetHeight;
                } else {
                    width = element.offsetWidth;
                    height = element.offsetHeight;
                }

                e.preventDefault();
                startX = e.clientX - element.offsetLeft;
                startY = e.clientY - element.offsetTop;
                if (start) {
                    start(e);
                }
                $document.on('mousemove', mousemove);
                $document.on('mouseup', mouseup);
            });

            // Handle drag event
            function mousemove(e) {
                y = e.clientY - startY;
                x = e.clientX - startX;
                setPosition();
                if (drag) drag(e);
            }

            // Unbind drag events
            function mouseup(e) {
                $document.unbind('mousemove', mousemove);
                $document.unbind('mouseup', mouseup);
                if (stop) stop(e);
            }

            // Move element, within container if provided
            function setPosition() {
                if (container) {
                    if (x < (rotated ? (width - container.left) : container.left)) {
                        x = rotated ? (width + container.left) : container.left;
                    } else if (x > (rotated ? container.right : (container.right - width))) {
                        x = rotated ? container.right : (container.right - width);
                    }
                    if (y < container.top) {
                        y = container.top;
                    } else if (y > container.bottom - height - container.top) {
                        y = container.bottom - height - container.top;
                    }
                }

                element.style.top = y + 'px';
                element.style.left = x + 'px';

                scope.dragOptions.top = ((y - container.top) < (container.height / 2));
                scope.dragOptions.left = ((x - container.left) < (container.width / 2));
            }
        }
    }
});

function cloneCanvas(oldCanvas) {

    // create a new canvas
    let newCanvas = document.createElement('canvas');
    let context = newCanvas.getContext('2d');

    // set dimensions
    newCanvas.width = oldCanvas.width;
    newCanvas.height = oldCanvas.height;

    // apply the old canvas to the new one
    context.drawImage(oldCanvas, 0, 0);

    return newCanvas;
}

function invertRGB(rgbColor) {
    let rgb = tinycolor(rgbColor).toRgb();
    let color = new tinycolor({r: 255 - rgb.r, g: 255 - rgb.g, b: 255 - rgb.b});
    return color.toRgbString();
}
