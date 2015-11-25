myApp.controller('searchController', ['$scope', '$routeParams', '$http', '$location', function($scope, $routeParams, $http, $location) {
	$scope.searchTerms = $routeParams.searchTerms;

	$scope.searchResults = [];

	var SearchResult = function() {
		this.title = '';
		this.feedUrl = '';
		this.description = '';
		this.link = '';
		this.itunesLink = '';
		this.image = '';

		this.addPodcast = function() {
			var that = this;

			chrome.runtime.getBackgroundPage(function(bgPage) {
				$scope.$apply(function() {
					bgPage.podcastManager.addPodcast(that.feedUrl);

					$location.path('/Podcasts');
				});
			});
		};

		this.checkIsSubscribed = function() {
			var that = this;

			chrome.runtime.getBackgroundPage(function(bgPage) {
				$scope.$apply(function() {
					that.subscribed = bgPage.podcastManager.getPodcast(that.feedUrl) !== undefined;
				});
			});
		};

		this.merge = function(otherSearchResult) {
			if(otherSearchResult.description !== '')
				this.description = otherSearchResult.description;

			if(otherSearchResult.link !== '')
				this.link = otherSearchResult.link;

			if(otherSearchResult.image !== '')
				this.image = otherSearchResult.image;

			if(otherSearchResult.itunesLink !== '')
				this.itunesLink = otherSearchResult.itunesLink;
		}

		return this;
	}

	function mergeInResult(searchResult) {
		var searchResultToMergeWith = $scope.searchResults.find(function(item) {
			return item.feedUrl === searchResult.feedUrl;
		});

		if(searchResultToMergeWith) {
			searchResultToMergeWith.merge(searchResult);
		}
		else {
			searchResult.checkIsSubscribed();
			$scope.searchResults.push(searchResult);
		}
	}

	function searchInDigitalPodcast() {
		var url = 'http://api.digitalpodcast.com/v2r/search/?appid=0f56b00cfbdc051c29b88171e67507f3&format=rssopml&keywords=' + $scope.searchTerms;

		$http.get(url).then(function(response) {

			var xml = $($.parseXML(response.data));

			xml.find('opml > body > outline').each(function() {
				var feed = $(this);

				var searchResult = new SearchResult;

				searchResult.title = feed.attr('text');
				searchResult.description = feed.attr('description');
				searchResult.link = feed.attr('htmlUrl');
				searchResult.feedUrl = feed.attr('xmlUrl');
				searchResult.subscribed = false;

				mergeInResult(searchResult);
			});
		});
	}

	function searchItunes() {
		var url = 'https://itunes.apple.com/search?media=podcast&term=' + $scope.searchTerms;

		$http.get(url).then(function(response) {
			response.data.results.forEach(function(result) {
				var searchResult = new SearchResult;

				searchResult.title = result.collectionName;
				searchResult.itunesLink = result.collectionViewUrl;
				searchResult.feedUrl = result.feedUrl;
				searchResult.subscribed = false;
				searchResult.image = result.artworkUrl100;

				mergeInResult(searchResult);
			});
		});
	}

	function search() {
		$scope.searchResults = [];

		searchItunes();
		searchInDigitalPodcast();
	}

	search();
}]);
