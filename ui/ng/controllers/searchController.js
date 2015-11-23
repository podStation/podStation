myApp.controller('searchController', ['$scope', '$routeParams', '$http', '$location', function($scope, $routeParams, $http, $location) {
	$scope.searchTerms = $routeParams.searchTerms;

	var url = 'http://api.digitalpodcast.com/v2r/search/?appid=0f56b00cfbdc051c29b88171e67507f3&format=rssopml&keywords=' + $scope.searchTerms;

	$http.get(url).then(function(response) {
		$scope.searchResults = [];

		var xml = $($.parseXML(response.data));

		xml.find('opml > body > outline').each(function() {
			var feed = $(this);

			var searchResult = {};

			searchResult.title = feed.attr('text');
			searchResult.description = feed.attr('description');
			searchResult.link = feed.attr('htmlUrl');
			searchResult.feedUrl = feed.attr('xmlUrl');
			searchResult.subscribed = false;

			chrome.runtime.getBackgroundPage(function(bgPage) {
				$scope.$apply(function() {
					searchResult.subscribed = bgPage.podcastManager.getPodcast(searchResult.feedUrl) !== undefined;
				});
			});

			searchResult.addPodcast = function() {
				var that = this;

				chrome.runtime.getBackgroundPage(function(bgPage) {
					$scope.$apply(function() {
						bgPage.podcastManager.addPodcast(that.feedUrl);

						$location.path('/Podcasts');
					});
				});
			};

			$scope.searchResults.push(searchResult);
		});
	});
}]);
