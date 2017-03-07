(function () {

    const electron = require('electron');
    const ipc = electron.ipcRenderer;

    var app = angular.module('drawable', ['ui.bootstrap', 'ngAnimate', 'pw.canvas-painter', 'colorpicker.module']);

    app.controller('DrawableCtrl', ['$scope', '$window', function ($scope, $window) {
        var self = this;

        self.strokeAdjustTemplate = "strokeAdjustTemplate.html";

        self.canvasOptions = {
            width: $window.innerWidth, //px
            height: $window.innerHeight - 36, //px
            backgroundColor: 'rgba(255,255,255,0)',
            color: 'rgba(255, 255, 0, 1)',
            lineWidth: 5, //px
            opacity: 1, //0-1
            undo: true, // boolean or a number of versions to keep in memory
            customCanvasId: 'myCustomId' // define a custom value for the id attribute of the canvas element (default: 'pwCanvasMain')
        };

        self.cover = false;

        this.dragOptions = {
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
            container: 'drawable-region',
        };

        var w = angular.element($window);
        w.bind('resize', function () {
            // only update canvas if it has grown in one dimension
            if ($window.innerWidth > self.canvasOptions.width || $window.innerHeight > (self.canvasOptions.height + 36)) {
                document.getElementById(self.canvasOptions.customCanvasId).width = $window.innerWidth;
                document.getElementById(self.canvasOptions.customCanvasId).height = $window.innerHeight - 36;
                document.getElementById(self.canvasOptions.customCanvasId + "Tmp").width = $window.innerWidth;
                document.getElementById(self.canvasOptions.customCanvasId + "Tmp").height = $window.innerHeight - 36;
            }
        });
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
                    if (container) {
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
})();