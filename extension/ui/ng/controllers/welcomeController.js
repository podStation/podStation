'use strict';

(() => {
    angular.module('podstationApp').controller('welcomeController', ['$scope', '$http', 'messageService', WelcomeController]);

    function WelcomeController($scope, $http, messageService) {
        var controller = this;

        controller.addPodcast = addPodcast;

        initialize();

        messageService.for('podcastManager').onMessage('podcastListChanged', () => {
            initialize();
        });
        
        return controller;

        function initialize() {
            controller.language = navigator.language;
            controller.recommendations = [];

            $http.get('/resources/author-recommendations.' + controller.language + '.json').then((result) => {
                controller.recommendations = result.data.recommendations;

                const messagePayload = {
                    feeds: controller.recommendations.map((recommendation) => recommendation.feedUrl)
                }

                messageService.for('podcastManager').sendMessage('checkIsSubscribed', messagePayload, (response) => {
                    $scope.$apply(() => {
                        controller.recommendations.forEach((recommendation) => {
                            recommendation.subscribed = response[recommendation.feedUrl];
                        });
                    })
                });
            });
        }

        function addPodcast(recommendation) {
            messageService.for('podcastManager').sendMessage('addPodcasts', {podcasts:[recommendation.feedUrl]});
        }
    }
})();