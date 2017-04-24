const electron = require('electron');
const ipc = electron.ipcRenderer;
const {dialog} = electron.remote;
const jQuery = require("jquery");
let $ = jQuery;
var angular = require('angular');
const fs = require('fs');
require('angular-hotkeys');

let app = angular.module('calibrator', ['cfp.hotkeys']);

app.controller('CalibratorCtrl', ['hotkeys', '$scope', function (hotkeys, $scope) {
    let self = this;

    self.step = -1;
    self.lastStep = 80;
    self.paused = false;
    self.started = false;

    hotkeys.add({
        combo: 'space',
        description: 'Next step of calibration',
        //action: 'keyup',
        callback: function () {
            next();
        }
    });

    self.range = function (num) {
        return new Array(num);
    };

    function next() {
        var x = (((self.step) % 10 + 1) * 130) - 85;
        var y = ((Math.floor(self.step / 10) + 1) * 130 - 85);

        if (self.step < self.lastStep && !self.paused) {
            self.paused = true;
            ipc.send('step', self.step, x, y);
            self.started = true;
        }
    }

    self.save = function () {
        ipc.send('save');
    };

    ipc.on('step-complete', function (event, data) {
        event.returnValue = '';
        self.paused = false;
        self.step++;
        self.started = false;
        $scope.$apply();
    });


}]);

