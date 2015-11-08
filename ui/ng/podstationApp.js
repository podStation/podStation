var myApp = angular.module('podstationApp', ['ngRoute', 'ngSanitize']);

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

		chrome.runtime.getBackgroundPage(function(bgPage) {
			that.podcasts = [];

			bgPage.podcastManager.podcastList.forEach(function(podcast, index) {
				$scope.$apply(function() {
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

							// As the bgPage is an event page, it is better not to thrust
							// in the contet of the bgPage variable at this moment.
							chrome.runtime.getBackgroundPage(function(bgPage) {
								bgPage.podcastManager.updatePodcast(that1.url);
							});
						},
						delete: function(storedPodcast) {
							var that1 = this;

							// As the bgPage is an event page, it is better not to thrust
							// in the contet of the bgPage variable at this moment.
							chrome.runtime.getBackgroundPage(function(bgPage) {
								bgPage.podcastManager.deletePodcast(that1.url);
							});
						}
					};

					podcastForController.fromStoredPodcast(podcast);

					that.podcasts.push(podcastForController);
				});
			});
		});
	};

	$scope.updatePodcast = function(storedPodcast) {
		this.podcasts.forEach(function(podcast) {
			if(podcast.url === storedPodcast.url) {
				podcast.fromStoredPodcast(storedPodcast);
				return false;
			}
		});
	}

	$scope.updatePodcastList();

	chrome.runtime.onMessage.addListener(function(message) {
		$scope.$apply(function() {
			if(!message.type){
				return;
			}

			if(message.type === 'podcastListChanged') {
				$scope.updatePodcastList();
			}
			else if(message.type === 'podcastChanged') {
				$scope.updatePodcast(message.podcast);
			}
		});
	});
});

myApp.controller('lastEpisodesController', ['$scope', '$routeParams', function($scope, $routeParams) {
	$scope.episodes = [];

	$scope.updateEpisodes = function() {
		var that = this;
		var numberEpisodes = $routeParams.numberEpisodes ? $routeParams.numberEpisodes : 20;
		this.episodes = [];

		chrome.runtime.getBackgroundPage(function(bgPage) {
			$scope.$apply(function(){
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
				});
			});
		});
	};

	$scope.updateEpisodes();

	chrome.runtime.onMessage.addListener(function(message) {
		$scope.$apply(function() {
			if(!message.type){
				return;
			}

			if(message.type === 'podcastChanged') {
				$scope.updateEpisodes();
			}
		});
	});
}]);

myApp.controller('episodesController', ['$scope', '$routeParams', function($scope, $routeParams) {
	$scope.episodes = [];

	$scope.updateEpisodes = function() {
		var that = this;
		this.episodes = [];

		chrome.runtime.getBackgroundPage(function(bgPage) {
			$scope.$apply(function(){
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
				});
			});
		});
	};

	$scope.updateEpisodes();

	chrome.runtime.onMessage.addListener(function(message) {
		$scope.$apply(function() {
			if(!message.type){
				return;
			}

			if(message.type === 'podcastChanged') {
				$scope.updateEpisodes();
			}
		});
	});
}]);

myApp.config(['$routeProvider', '$compileProvider', function ($routeProvider, $compileProvider) {
	var whiteList = /^\s*(https?|ftp|mailto|chrome-extension):/;
	$compileProvider.aHrefSanitizationWhitelist(whiteList);
	$compileProvider.imgSrcSanitizationWhitelist(whiteList);

	$routeProvider.when('/Podcasts', {
		templateUrl: '/ui/ng/partials/podcasts.html',
		controller: 'podcastsController'
	}).when('/LastEpisodes/:numberEpisodes', {
		templateUrl: '/ui/ng/partials/lastEpisodes.html',
		controller: 'lastEpisodesController'
	}).when('/Episodes/:podcastIndex', {
		templateUrl: '/ui/ng/partials/episodes.html',
		controller: 'episodesController'
	}).when('/About', {
		templateUrl: '/ui/ng/partials/about.html',
		controller: 'episodesController'
	}).otherwise({
		redirectTo: '/LastEpisodes/20'
	});
}]);
