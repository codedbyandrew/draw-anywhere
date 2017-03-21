const electron = require('electron');
const ipc = electron.ipcRenderer;
const clipboard = electron.clipboard;
const nativeImage = electron.nativeImage;
const trimCanvas = require('trim-canvas');
var $ = require("jquery");

var app = angular.module('drawable', ['ui.bootstrap', 'uiSwitch', 'ngAnimate', 'pw.canvas-painter', 'colorpicker.module', 'cfp.hotkeys']);

app.controller('DrawableCtrl', ['$scope', '$window', 'hotkeys', '$document', function ($scope, $window, hotkeys, $document) {
    var self = this;

    self.strokeAdjustTemplate = "strokeAdjustTemplate.html";
    self.configurationTemplate = "configurationTemplate.html";

    var pixelRatio = window.devicePixelRatio;
    self.canvasOptions = {
        width: pixelRatio * $window.innerWidth, //px
        height: pixelRatio * $window.innerHeight, //px
        backgroundColor: 'rgba(255,255,255,0)',
        color: 'rgba(255, 255, 0, 1)',
        lineWidth: 5, //px
        opacity: 1, //0-1
        undo: true, // boolean or a number of versions to keep in memory
        customCanvasId: 'myCanvas' // define a custom value for the id attribute of the canvas element (default: 'pwCanvasMain')
    };
    self.version = 0;

    self.cover = false;
    self.vibrancy = true;
    self.circularToolbar = false;
    self.verticalToolbar = false;
    self.currentPort = '';
    self.ports = [];
    self.drawing = false;
    self.gridVisible = true;
    self.lineShadow = true;

    ipc.send('drawableOpened');

    ipc.on('windowConfig', function (event, config) {
        event.returnValue = '';
        self.vibrancy = config.vibrancy;
        self.ports = config.ports;
        self.currentPort = config.currentPort;
        $scope.$apply();
        console.log(config);
    });

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
        container: 'drawable-region'
    };

    hotkeys.add({
        combo: 'command+z',
        description: 'Undo draw strokes',
        callback: function () {
            if (self.version > 0) {
                self.version--;
            }
        }
    });

    hotkeys.add({
        combo: 'command+c',
        description: 'Copy canvas to clipboard',
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
        description: 'Open circular toolbar',
        callback: function () {
            self.circularToolbar = !self.circularToolbar;
        }
    });

    var w = angular.element($window);
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
        var canvasTmp = document.getElementById(self.canvasOptions.customCanvasId + "Tmp");
        var canvas = document.getElementById(self.canvasOptions.customCanvasId);
        var contextTmp = canvasTmp.getContext("2d");
        contextTmp.scale(2, 2);
        contextTmp.shadowColor = "rgba(0, 0, 0, .47)";
        contextTmp.shadowOffsetX = 0;
        contextTmp.shadowOffsetY = 26 * pixelRatio;
        contextTmp.shadowBlur = 43 * pixelRatio;
        canvasTmp.style.width = canvasTmp.width * (1 / pixelRatio) + "px";
        canvasTmp.style.height = canvasTmp.height * (1 / pixelRatio) + "px";
        canvas.style.width = canvas.width * (1 / pixelRatio) + "px";
        canvas.style.height = canvas.height * (1 / pixelRatio) + "px";
    });

    self.toggleVibrancy = function () {
        self.vibrancy = !self.vibrancy;
        ipc.send('toggleVibrancy', self.vibrancy);
    };

    self.copyToClipboard = function () {
        var canvas = document.getElementById(self.canvasOptions.customCanvasId);
        var newCanvas = cloneCanvas(canvas);
        newCanvas = trimCanvas.default(newCanvas);
        var image = newCanvas.toDataURL("image/png");
        clipboard.writeImage(nativeImage.createFromDataURL(image));
        $("#drawable-region").addClass("flash");
        setTimeout(function () {
            $("#drawable-region").removeClass("flash");
        }, 1000);
    };

    self.setPort = function (portName) {
        self.currentPort = portName;
        ipc.send('setPort', portName);
    }

}]);

app.directive('ngDraggable', function ($document) {
    return {
        restrict: 'A',
        scope: {
            dragOptions: '=ngDraggable'
        },
        link: function (scope, elem, attr) {
            var startX, startY, x = 0, y = 0,
                start, stop, drag, container, enabled;

            var width = elem[0].offsetWidth,
                height = elem[0].offsetHeight;

            // Obtain drag options
            if (scope.dragOptions) {
                start = scope.dragOptions.start;
                drag = scope.dragOptions.drag;
                stop = scope.dragOptions.stop;
                var id = scope.dragOptions.container;
                if (id) {
                    container = document.getElementById(id).getBoundingClientRect();
                }
            }

            // Bind mousedown event
            elem.on('mousedown', function (e) {
                e.preventDefault();
                startX = e.clientX - elem[0].offsetLeft;
                startY = e.clientY - elem[0].offsetTop;
                if (start) start(e);
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
                if (container && !elem[0].classList.contains('verticalToolbar')) {
                    if (x < container.left) {
                        x = container.left;
                    } else if (x > container.right - width) {
                        x = container.right - width;
                    }
                    if (y < container.top) {
                        y = container.top;
                    } else if (y > container.bottom - height) {
                        y = container.bottom - height;
                    }
                }

                elem.css({
                    top: y + 'px',
                    left: x + 'px'
                });
            }
        }
    }
});

function cloneCanvas(oldCanvas) {

    // create a new canvas
    var newCanvas = document.createElement('canvas');
    var context = newCanvas.getContext('2d');

    // set dimensions
    newCanvas.width = oldCanvas.width;
    newCanvas.height = oldCanvas.height;

    // apply the old canvas to the new one
    context.drawImage(oldCanvas, 0, 0);

    // return the new canvas
    return newCanvas;
}