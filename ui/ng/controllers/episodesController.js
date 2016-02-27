myApp.controller('lastEpisodesController', ['$scope', '$routeParams', 'episodePlayer',
	function($scope, $routeParams, episodePlayer) {

	$scope.episodes = [];
	$scope.numberEpisodes = parseInt($routeParams.numberEpisodes ? $routeParams.numberEpisodes : 0);

	$scope.updateEpisodes = function() {
		var that = this;
		this.episodes = [];

		chrome.runtime.getBackgroundPage(function(bgPage) {
			$scope.$apply(function(){
				var storedEpisodeContainers = bgPage.podcastManager.getAllEpisodes();

				storedEpisodeContainers.forEach(function(storedEpisodeContainer, index) {
					var episodeForController;

					episodeForController = {
						fromStoredEpisode: function(storedEpisodeContainer) {
							this.link = storedEpisodeContainer.episode.link;
							this.title = storedEpisodeContainer.episode.title ? storedEpisodeContainer.episode.title : storedEpisodeContainer.episode.url;
							this.image = storedEpisodeContainer.podcast.image;
							this.podcastIndex = storedEpisodeContainer.podcastIndex;
							this.podcastTitle = storedEpisodeContainer.podcast.title;
							this.url = storedEpisodeContainer.episode.enclosure.url;
							this.description = storedEpisodeContainer.episode.description;
							this.pubDate = formatDate(new Date(storedEpisodeContainer.episode.pubDate));
							this.play = function() {
								episodePlayer.play({
									title: this.title,
									url: this.url
								});
							}
						}
					};

					episodeForController.fromStoredEpisode(storedEpisodeContainer);

					that.episodes.push(episodeForController);
				});
			});
		});
	};

	$scope.myPagingFunction = function() {
		$scope.numberEpisodes += 20;
		console.log('Paging function - ' + $scope.numberEpisodes);
	};

	chrome.runtime.onMessage.addListener(function(message) {
		if(!message.type){
			return;
		}

		if(message.type === 'podcastChanged') {
			$scope.$apply(function() {
				$scope.updateEpisodes();
			});
		}
	});

	$scope.updateEpisodes();
}]);

myApp.controller('episodesController', ['$scope', '$routeParams', 'episodePlayer',
	function($scope, $routeParams, episodePlayer) {

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
							this.play = function() {
								episodePlayer.play({
									title: this.title,
									url: this.url
								});
							}
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
		if(!message.type){
			return;
		}

		if(message.type === 'podcastChanged') {
			$scope.$apply(function() {
				$scope.updateEpisodes();
			});
		}
	});
}]);
