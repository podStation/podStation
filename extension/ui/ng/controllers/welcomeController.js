'use strict';

(() => {
    angular.module('podstationApp').controller('welcomeController', ['$http', WelcomeController]);

    function WelcomeController($http) {
        var controller = this;

        initialize();

        return controller;

        function initialize() {
            controller.language = navigator.language;
            controller.recommendations = [];

            $http.get('/resources/author-recommendations.' + controller.language + '.json').then((result) => {
                controller.recommendations = result.data.recommendations;
            });
        }
    }
})();