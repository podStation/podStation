var myApp = angular.module('podstationApp', ['ngRoute', 'ngSanitize']);

/*myApp.factory('podcastManagerGetter', function() {
	var podcastManager
});*/

myApp.controller('headerController', ['$scope', function($scope) {
	$scope.entry = "";

	$scope.addPodcast = function() {
		var podcastURL = $scope.entry;

		chrome.runtime.getBackgroundPage(function(bgPage) {
			bgPage.podcastManager.addPodcast(podcastURL);
		});

		$scope.entry = "";
	};
}]);

myApp.controller('podcastsController', function($scope) {
	$scope.podcasts = [];

	function getStatusClass(status) {
		if(status === 'updating') {
			return 'fa-refresh fa-spin';
		}
		else if(status === 'loaded') {
			return 'fa-check';
		}
		else if(status === 'failed') {
			return 'fa-close';
		}
		else {
			return 'fa-question'
		}
	}

	$scope.updatePodcastList = function() {
		var that = this;
		this.podcasts = [];

		chrome.runtime.getBackgroundPage(function(bgPage) {
			bgPage.podcastManager.podcastList.forEach(function(podcast, index) {
				var podcastForController;

				podcastForController = {
					fromStoredPodcast: function(storedPodcast) {
						this.index = index;
						this.link =  storedPodcast.link;
						this.title =  storedPodcast.title ? storedPodcast.title : storedPodcast.url;
						this.image = storedPodcast.image;
						this.url =  storedPodcast.url;
						this.description =  storedPodcast.description;
						this.episodesNumber =  storedPodcast.episodes.length;
						this.pubDate =  storedPodcast.pubDate ? formatDate(new Date(storedPodcast.pubDate)) : undefined;
						this.statusClass =  getStatusClass(storedPodcast.status);
					},
					update: function() {
						var that1 = this;

						bgPage.podcastManager.updatePodcast(this.url, function(storedPodcast) {
							// as we are responting to an http request that is not done
							// throug $http, we need to use $apply
							$scope.$apply(function() {
								that1.fromStoredPodcast(storedPodcast);
							});
						});

						that1.fromStoredPodcast(bgPage.podcastManager.getPodcast(this.url));
					},
					delete: function(storedPodcast) {
						bgPage.podcastManager.deletePodcast(this.url);

						// We still use the index of the podcast in the array,
						// therefore we need to update the whole list again.
						$scope.updatePodcastList();
					}
				};

				podcastForController.fromStoredPodcast(podcast);

				that.podcasts.push(podcastForController);
			});
		});
	}

	$scope.updatePodcastList();
});

myApp.controller('lastEpisodesController', ['$scope', function($scope) {
	$scope.episodes = [];

	$scope.updateEpisodes = function() {
		var that = this;
		var numberEpisodes = 20;
		this.episodes = [];

		chrome.runtime.getBackgroundPage(function(bgPage) {
			var storedEpisodeContainers = bgPage.podcastManager.getAllEpisodes();

			storedEpisodeContainers.forEach(function(storedEpisodeContainer, index) {
				var episodeForController;

				if(index >= numberEpisodes) {
					return false;
				}

				episodeForController = {
					fromStoredEpisode: function(storedEpisodeContainer) {
						this.link = storedEpisodeContainer.episode.link;
						this.title = storedEpisodeContainer.episode.title ? storedEpisodeContainer.episode.title : storedEpisodeContainer.episode.url;
						this.image = storedEpisodeContainer.podcast.image;
						this.url = storedEpisodeContainer.episode.enclosure.url;
						this.description = storedEpisodeContainer.episode.description;
						this.pubDate = formatDate(new Date(storedEpisodeContainer.episode.pubDate));
					}
				};

				episodeForController.fromStoredEpisode(storedEpisodeContainer);

				that.episodes.push(episodeForController);
			})
		});
	};

	$scope.updateEpisodes();
}]);

myApp.controller('episodesController', ['$scope', '$routeParams', function($scope, $routeParams) {
	$scope.episodes = [];

	$scope.updateEpisodes = function() {
		var that = this;
		this.episodes = [];

		chrome.runtime.getBackgroundPage(function(bgPage) {
			var storedPodcast = bgPage.podcastManager.getPodcast(parseInt($routeParams.podcastIndex));

			that.podcastImage = storedPodcast.image;
			that.podcastTitle = storedPodcast.title;

			storedPodcast.episodes.forEach(function(storedEpisode) {
				var episodeForController;

				episodeForController = {
					fromStoredEpisode: function(storedEpisode) {
						this.link = storedEpisode.link;
						this.title = storedEpisode.title ? storedEpisode.title : storedEpisode.url;
						// this.image = podcast ? podcast.image : undefined;
						this.url = storedEpisode.enclosure.url;
						this.description = storedEpisode.description;
						this.pubDate = formatDate(new Date(storedEpisode.pubDate));
					}
				};

				episodeForController.fromStoredEpisode(storedEpisode);

				that.episodes.push(episodeForController);
			})
		});
	};

	$scope.updateEpisodes();
}]);

myApp.config(['$routeProvider', '$compileProvider', function ($routeProvider, $compileProvider) {
	$compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|chrome-extension):/);

	$routeProvider.when('/Podcasts', {
		templateUrl: '/ui/ng/partials/podcasts.html',
		controller: 'podcastsController'
	}).when('/LastEpisodes', {
		templateUrl: '/ui/ng/partials/lastEpisodes.html',
		controller: 'lastEpisodesController'
	}).when('/Episodes/:podcastIndex', {
		templateUrl: '/ui/ng/partials/episodes.html',
		controller: 'episodesController'
	}).when('/About', {
		templateUrl: '/ui/ng/partials/about.html',
		controller: 'episodesController'
	}).otherwise({
		redirectTo: '/LastEpisodes'
	});
}]);
