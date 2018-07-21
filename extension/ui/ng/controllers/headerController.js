myApp.controller('headerController', ['$scope', '$location', 'analyticsService', function($scope, $location, analyticsService) {
	$scope.entry = "";

	$scope.editBoxKeyPress = function(event) {
		if(event.which === 13) {
			$scope.searchPodcast();
		}
	}

	$scope.addPodcast = function() {
		var podcastURL = $scope.entry;

		chrome.runtime.getBackgroundPage(function(bgPage) {
			analyticsService.trackEvent('feed', 'add_by_feed_url');
			bgPage.podcastManager.addPodcast(podcastURL);
		});

		$scope.entry = "";

		$location.path('/Podcasts');
	};

	$scope.searchPodcast = function() {
		$location.path('/Search/' + $scope.entry);
	};
}]);
