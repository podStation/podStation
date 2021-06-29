function WelcomeController($scope, $http, messageService, analyticsService) {
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
		analyticsService.trackEvent('feed', 'add_by_recommendations', recommendation.feedUrl);
		messageService.for('podcastManager').sendMessage('addPodcasts', {podcasts:[recommendation.feedUrl]});
	}
}

export default WelcomeController;