import searchService from '../services/searchService';

/**
 * 
 * @param {*} $scope 
 * @param {*} $routeParams 
 * @param {*} $location 
 * @param {*} searchService 
 * @param {*} analyticsService 
 */
function SearchController($scope, $routeParams, $location, searchService, analyticsService) {
	$scope.searchTerms = $routeParams.searchTerms;

	$scope.searchResults = [];
	$scope.addPodcast = addPodcast;

	function addPodcast(searchResult) {
		chrome.runtime.getBackgroundPage(function(bgPage) {
			$scope.$apply(function() {
				analyticsService.trackEvent('feed', 'add_by_search');
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
}

export default SearchController;