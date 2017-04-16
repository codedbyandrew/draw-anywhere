var app = angular.module("myApp", ['ngRoute', 'ngAnimate']);

app.config(['$routeProvider', '$locationProvider',
    function ($routeProvider, $locationProvider) {
        $locationProvider.html5Mode({
            enabled: true,
            requireBase: false
        });
    }
]);

app.controller("myCtrl", function ($scope, $routeParams, $location) {
    $scope.pins = [
        {"name": "D00", "usage": ""},
        {"name": "D01", "usage": "DE1XBEEOUT(RX)"},
        {"name": "D02", "usage": ""},
        {"name": "D03", "usage": "DE1XBEEIN(TX)"},
        {"name": "D04", "usage": ""},
        {"name": "D05", "usage": "CS8"},
        {"name": "D06", "usage": ""},
        {"name": "D07", "usage": "RECEIVER8"},
        {"name": "D08", "usage": ""},
        {"name": "D09", "usage": "CS7"},
        {"name": "D10", "usage": ""},
        {"name": "D11", "usage": "RECEIVER7"},
        {"name": "D12", "usage": ""},
        {"name": "D13", "usage": "CS6"},
        {"name": "D14", "usage": ""},
        {"name": "D15", "usage": "RECEIVER6"},
        {"name": "D16", "usage": ""},
        {"name": "D17", "usage": "CS5"},
        {"name": "D18", "usage": ""},
        {"name": "D19", "usage": "RECEIVER5"},
        {"name": "D20", "usage": ""},
        {"name": "D21", "usage": "CS4"},
        {"name": "D22", "usage": ""},
        {"name": "D23", "usage": "RECEIVER4"},
        {"name": "D24", "usage": ""},
        {"name": "D25", "usage": "CS3"},
        {"name": "D26", "usage": ""},
        {"name": "D27", "usage": "RECEIVER3"},
        {"name": "D28", "usage": ""},
        {"name": "D29", "usage": "CS2"},
        {"name": "D30", "usage": ""},
        {"name": "D31", "usage": "RECEIVER2"},
        {"name": "D32", "usage": ""},
        {"name": "D33", "usage": "CS1"},
        {"name": "D34", "usage": "SCLK"},
        {"name": "D35", "usage": "RECEIVER1"}
    ];

    $scope.location = $location.search();
    if ($scope.location.v === undefined) {
        $location.search('v', '');
        $scope.location = $location.search();
    }

    $scope.sortBy = "name";
    $scope.sortByToggle = function (name) {
        if ($scope.sortBy.includes(name)) {
            if (name == $scope.sortBy) {
                $scope.sortBy = "-" + name;
            } else {
                $scope.sortBy = name;
            }
        } else {
            $scope.sortBy = name;
        }
    };

    $scope.navigate = function (location) {
        $location.search('v', location);
    }
});

app.directive('pageFooter', function () {
    return {
        restrict: 'E',
        templateUrl: './site/directives/page-footer.html'
    };
});

app.directive('pageNav', function () {
    return {
        restrict: 'E',
        templateUrl: './site/directives/page-nav.html'
    };
});

app.directive('documentation', function () {
    return {
        restrict: 'E',
        templateUrl: './site/directives/pins.html'
    };
});

app.directive('home', function () {
    return {
        restrict: 'E',
        templateUrl: './site/directives/home.html'
    };
});

app.directive('software', function () {
    return {
        restrict: 'E',
        templateUrl: './site/directives/software.html'
    };
});

app.directive('hardware', function () {
    return {
        restrict: 'E',
        templateUrl: './site/directives/hardware.html'
    };
});