myApp.controller('searchController', ['$scope', '$routeParams', '$location', 'searchService', function($scope, $routeParams, $location, searchService) {
	$scope.searchTerms = $routeParams.searchTerms;

	$scope.searchResults = [];
	$scope.addPodcast = addPodcast;

	function addPodcast(searchResult) {
		chrome.runtime.getBackgroundPage(function(bgPage) {
			$scope.$apply(function() {
				bgPage.podcastManager.addPodcast(searchResult.feedUrl);

				$location.path('/Podcasts');
			});
		});
	};

	function fillIsSubscribed(searchResults) {
		chrome.runtime.getBackgroundPage(function(bgPage) {
			$scope.$apply(function() {
				searchResults.forEach(function(searchResult) {
					searchResult.subscribed = bgPage.podcastManager.getPodcast(searchResult.feedUrl) !== undefined;
				});
			});
		});
	}

	function search() {
		$scope.searchResults = [];

		searchService.search($scope.searchTerms, function(event, eventData) {
			switch(event) {
				case 'resultAvailable':
					$scope.searchResults = eventData;
					fillIsSubscribed($scope.searchResults);
					break;
			}
		});
	}

	search();
}]);
