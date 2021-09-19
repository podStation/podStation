import $ from 'jquery';

function searchService($http, podcastIndexOrgService) {
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
		this.imageOriginal = '';

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
		const searchResults = [];

		const searchEngines = [
			{
				name: 'iTunes',
				fn: searchiTunes,
			},
			{
				name: 'Digital Podcast Search Service',
				fn: searchDigitalPodcastSearchService
			},
			{
				name: 'Podcastindex.org',
				fn: searchPodcastIndexOrg
			}
		];

		const searchEngineRequestsFinished = {};

		searchEngines.map((se) => {
			searchEngineRequestsFinished[se.name] = false;

			se.fn(searchTerms).then((partialSearchResults) => {
				partialSearchResults.forEach((psr) => mergeInResult(psr, searchResults));
				// TODO: sort results
				callback('resultAvailable', searchResults);
			}).finally(() => {
				searchEngineRequestsFinished[se.name] = true;

				if(Object.values(searchEngineRequestsFinished).indexOf(false) < 0) {
					callback('searchFinished');
				}
			});
		});
	}

	function searchDigitalPodcastSearchService(searchTerms) {
		// Search with digitalpodcast
		return $http.get('http://api.digitalpodcast.com/v2r/search/', {
			params : {
				"appid": "0f56b00cfbdc051c29b88171e67507f3",
				"format": "rssopml",
				"keywords": searchTerms
			}
		}).then(function(response) {
			const searchResults = [];

			var xml = $($.parseXML(response.data));

			xml.find('opml > body > outline').each(function() {
				var feed = $(this);

				var searchResult = new SearchResult;

				searchResult.title = feed.attr('text');
				searchResult.description = feed.attr('description');
				searchResult.link = feed.attr('htmlUrl');
				searchResult.feedUrl = feed.attr('xmlUrl');

				searchResults.push(searchResult);
			});

			return searchResults;
		});
	}

	function searchiTunes(searchTerms) {
		return $http.get('https://itunes.apple.com/search', {
			params: {
				"media": "podcast",
				"term": searchTerms
			}
		}).then(function(response) {
			const searchResults = [];

			response.data.results.forEach(function(result) {
				var searchResult = new SearchResult;

				searchResult.title = result.collectionName;
				searchResult.itunesLink = result.collectionViewUrl;
				searchResult.feedUrl = result.feedUrl;
				searchResult.image = result.artworkUrl100;

				searchResults.push(searchResult);
			});

			return searchResults;
		});
	}

	function searchPodcastIndexOrg(searchTerms) {
		return podcastIndexOrgService.search(searchTerms).then(function(response) {
			const searchResults = [];

			response.data.feeds.forEach(function(result) {
				var searchResult = new SearchResult;

				searchResult.title = result.title;
				searchResult.description = result.description;
				searchResult.feedUrl = result.url;
				searchResult.imageOriginal = result.image;

				searchResults.push(searchResult);
			});

			return searchResults;
		});
	}

	return service;
}

export default searchService;