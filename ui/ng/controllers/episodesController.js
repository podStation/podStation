myApp.controller('lastEpisodesController', ['$scope', '$routeParams', 'episodePlayer', 'messageService',
	function($scope, $routeParams, episodePlayer, messageService) {

	$scope.episodes = [];
	$scope.numberEpisodes = parseInt($routeParams.numberEpisodes ? $routeParams.numberEpisodes : 0);

	$scope.updateEpisodes = function() {
		var that = this;

		chrome.runtime.getBackgroundPage(function(bgPage) {
			$scope.$apply(function(){
				that.episodes = [];
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
							this.podcastUrl = storedEpisodeContainer.podcast.url;
							this.url = storedEpisodeContainer.episode.enclosure.url;
							this.description = storedEpisodeContainer.episode.description;
							this.pubDate = formatDate(new Date(storedEpisodeContainer.episode.pubDate));
							this.guid = storedEpisodeContainer.episode.guid;
							this.play = function() {
								episodePlayer.play({
									title: this.title,
									url: this.url,
									guid: this.guid,
									podcastUrl: this.podcastUrl
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

	messageService.for('podcast').onMessage('changed', function(messageContent) {
		if(messageContent.episodeListChanged) {
			$scope.$apply(function() {
				$scope.updateEpisodes();
			});
		}
	});

	$scope.updateEpisodes();
}]);

myApp.controller('episodesController', ['$scope', '$routeParams', 'episodePlayer', 'messageService',
	function($scope, $routeParams, episodePlayer, messageService) {

	$scope.episodes = [];
	$scope.numberEpisodes = 20;
	$scope.podcastUrl = '';

	$scope.updateEpisodes = function() {
		var that = this;
		
		this.episodes = [];
		this.podcastTitle = '';

		chrome.runtime.getBackgroundPage(function(bgPage) {
			var storedPodcast = bgPage.podcastManager.getPodcast(parseInt($routeParams.podcastIndex));

			$scope.podcastUrl = storedPodcast.url;

			$scope.$apply(function() {
				that.podcastImage = storedPodcast.image;
				that.podcastTitle = storedPodcast.title;
			});

			// the following part is more expensive, we let the browser update 
			// the content on the screen before going on.
			setTimeout(function() {
				$scope.$apply(function() {
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
			} ,1);
		});
	};

	$scope.myPagingFunction = function() {
		$scope.numberEpisodes += 20;
		console.log('Paging function - ' + $scope.numberEpisodes);
	};

	messageService.for('podcast').onMessage('changed', function(messageContent) {
		if(messageContent.episodeListChanged && messageContent.podcast.url === $scope.podcastUrl) {
			$scope.$apply(function() {
				$scope.updateEpisodes();
			});
		}
	});

	$scope.updateEpisodes();
}]);
