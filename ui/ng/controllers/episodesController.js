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
