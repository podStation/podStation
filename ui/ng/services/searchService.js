(function() {
	'use strict';

	angular
		.module('podstationApp')
		.factory('searchService', ['$http', '$q', searchService]);

	function searchService($http, $q) {
		var service = {
			search: search
		};

		var SearchResult = function() {
			this.title = '';
			this.feedUrl = '';
			this.description = '';
			this.link = '';
			this.itunesLink = '';
			this.image = '';

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

		function mergeInResult(searchResult, searchResults) {
			var searchResultToMergeWith = searchResults.find(function(item) {
				return item.feedUrl === searchResult.feedUrl;
			});

			if(searchResultToMergeWith) {
				searchResultToMergeWith.merge(searchResult);
			}
			else {
				searchResults.push(searchResult);
			}
		}

		function search(searchTerms, callback) {
			var searchResults = [];

			var searchDigitalPodcastFinished = false;
			var searchiTunesFinished = false;

			// Search with digitalpodcast
			$http.get('http://api.digitalpodcast.com/v2r/search/', {
				params : {
					"appid": "0f56b00cfbdc051c29b88171e67507f3",
					"format": "rssopml",
					"keywords": searchTerms
				}
			}).then(function(response) {

				var xml = $($.parseXML(response.data));

				xml.find('opml > body > outline').each(function() {
					var feed = $(this);

					var searchResult = new SearchResult;

					searchResult.title = feed.attr('text');
					searchResult.description = feed.attr('description');
					searchResult.link = feed.attr('htmlUrl');
					searchResult.feedUrl = feed.attr('xmlUrl');
					searchResult.subscribed = false;

					mergeInResult(searchResult, searchResults);
				});

				callback('resultAvailable', searchResults);
			
			}).finally(function() {
				searchDigitalPodcastFinished = true;

				if(searchDigitalPodcastFinished && searchiTunesFinished) {
					callback('searchFinished');
				}
			});
			
			// Search with iTunes
			$http.get('https://itunes.apple.com/search', {
				params: {
					"media": "podcast",
					"term": searchTerms
				}
			}).then(function(response) {
				response.data.results.forEach(function(result) {
					var searchResult = new SearchResult;

					searchResult.title = result.collectionName;
					searchResult.itunesLink = result.collectionViewUrl;
					searchResult.feedUrl = result.feedUrl;
					searchResult.subscribed = false;
					searchResult.image = result.artworkUrl100;

					mergeInResult(searchResult, searchResults);
				});

				callback('resultAvailable', searchResults);
			}).finally(function() {
				searchiTunesFinished = true;

				if(searchDigitalPodcastFinished && searchiTunesFinished) {
					callback('searchFinished');
				}
			});
		}

		return service;
	}

})();