const electron = require('electron');
const ipc = electron.ipcRenderer;
const {dialog} = electron.remote;
var angular = require('angular');
const fs = require('fs');
require('angular-hotkeys');

let app = angular.module('trainer', ['cfp.hotkeys']);

app.controller('TrainerCtrl', ['hotkeys', '$scope', function (hotkeys, $scope) {
    var self = this;

    self.advanced = true;
    self.form = {
        fileName: '',
        iterations: 30000,
        error: .00001,
        rate: .05,
        layers: 3,
        architecture: [8, 8, 8]
    };
    self.training = false;

    self.openFile = function () {
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
                self.form.fileName = filePath[0];
                $scope.$apply();
            }
        );
    };

    self.updateArray = function () {
        if (self.form.architecture.length > self.form.layers) {
            self.form.architecture = self.form.architecture.slice(0, self.form.layers);
        }
    };

    self.range = function (num) {
        return new Array(num);
    };

    self.startTraining = function () {
        ipc.send('train', self.form);
    }

}]);