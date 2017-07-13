myApp.controller('lastEpisodesController', ['$scope', '$routeParams', 'episodePlayer', 'messageService', 'storageService',
	function($scope, $routeParams, episodePlayer, messageService, storageService) {

	$scope.listType = 'big_list';
	$scope.episodes = [];
	$scope.numberEpisodes = 50;

	var episodesLoaded = false;
	var optionsLoaded = false;

	$scope.updateEpisodes = function() {
		var that = this;

		chrome.runtime.getBackgroundPage(function(bgPage) {
			$scope.$apply(function(){
				that.episodes = [];
				var storedEpisodeContainers = bgPage.podcastManager.getAllEpisodes();

				that.episodes = storedEpisodeContainers.map(function(storedEpisodeContainer) {
					var episode = {};

					episode.link = storedEpisodeContainer.episode.link;
					episode.title = storedEpisodeContainer.episode.title ? storedEpisodeContainer.episode.title : storedEpisodeContainer.episode.url;
					episode.image = storedEpisodeContainer.podcast.image;
					episode.podcastIndex = storedEpisodeContainer.podcastIndex;
					episode.podcastTitle = storedEpisodeContainer.podcast.title;
					episode.podcastUrl = storedEpisodeContainer.podcast.url;
					episode.url = storedEpisodeContainer.episode.enclosure.url;
					episode.description = storedEpisodeContainer.episode.description;
					episode.pubDate = formatDate(new Date(storedEpisodeContainer.episode.pubDate));
					episode.guid = storedEpisodeContainer.episode.guid;
					episode.isInPlaylist = false;

					return episode;
				});

				updateIsInPlaylist();

				episodesLoaded = true;
			});
		});
	};

	$scope.myPagingFunction = function() {
		$scope.numberEpisodes += 20;
		console.log('Paging function - ' + $scope.numberEpisodes);
	};

	$scope.listTypeChanged = listTypeChanged;
	$scope.ready = ready;

	storageService.loadSyncUIOptions(function(uiOptions) {
		$scope.listType = uiOptions.llt;
		optionsLoaded = true;
	});

	messageService.for('podcast').onMessage('changed', function(messageContent) {
		if(messageContent.episodeListChanged) {
			$scope.$apply(function() {
				$scope.updateEpisodes();
			});
		}
	});

	messageService.for('playlist').onMessage('changed', function() { updateIsInPlaylist() });

	$scope.updateEpisodes();

	return;

	function listTypeChanged() {
		storageService.loadSyncUIOptions(function(uiOptions) {
			uiOptions.llt = $scope.listType;

			return true;
		});
	}

	function ready() {
		return episodesLoaded && optionsLoaded;
	}

	function updateIsInPlaylist() {
		messageService.for('playlist').sendMessage('get', {}, function(playlist) {
			$scope.$apply(function() {
				$scope.episodes.forEach(function(episode) {
					episode.isInPlaylist = playlist.entries.find(function(entry) {
						return entry.podcastUrl  === episode.podcastUrl &&
							entry.episodeGuid === episode.guid;
					}) !== undefined;
				});
			});
		});
	}
}]);

myApp.controller('episodesController', ['$scope', '$routeParams', 'episodePlayer', 'messageService', 'storageService',
	function($scope, $routeParams, episodePlayer, messageService, storageService) {

	$scope.listType = 'big_list';
	$scope.sorting = 'by_pubdate_descending';
	$scope.episodes = [];
	$scope.numberEpisodes = 50;
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
								this.url = storedEpisode.enclosure.url;
								this.description = storedEpisode.description;
								this.pubDateUnformatted = new Date(storedEpisode.pubDate);
								this.pubDate = formatDate(this.pubDateUnformatted);
								this.guid = storedEpisode.guid;
								this.play = function() {
									episodePlayer.play({
										episodeGuid: this.guid,
										podcastUrl: storedPodcast.url
									});
								}
								this.addToPlaylist = function() {
									messageService.for('playlist').sendMessage('add', {
										podcastUrl: storedPodcast.url,
										episodeGuid: this.guid
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

	$scope.listTypeChanged = listTypeChanged;
	$scope.sortingChanged = sortingChanged;
	$scope.isReverseOrder = isReverseOrder;

	storageService.loadSyncUIOptions(function(uiOptions) {
		$scope.listType = uiOptions.elt;
		$scope.sorting = uiOptions.es;
	});

	messageService.for('podcast').onMessage('changed', function(messageContent) {
		if(messageContent.episodeListChanged && messageContent.podcast.url === $scope.podcastUrl) {
			$scope.$apply(function() {
				$scope.updateEpisodes();
			});
		}
	});

	$scope.updateEpisodes();

	return;

	function listTypeChanged() {
		storageService.loadSyncUIOptions(function(uiOptions) {
			uiOptions.elt = $scope.listType;

			return true;
		});
	}

	function sortingChanged() {
		storageService.loadSyncUIOptions(function(uiOptions) {
			uiOptions.es = $scope.sorting;

			return true;
		});
	}

	function isReverseOrder() {
		return $scope.sorting === 'by_pubdate_descending';
	}
}]);

myApp.controller('episodesInProgressController', ['$scope', '$routeParams', 'episodePlayer', 'messageService', 'storageService',
	function($scope, $routeParams, episodePlayer, messageService, storageService) {

	$scope.listType = 'big_list';
	$scope.episodes = [];

	var episodesLoaded = false;
	var optionsLoaded = false;

	// copied from episodePlayerController
	// TODO: put in a service to be reused
	function formatSeconds(seconds) {
		var date = new Date(null);
		date.setSeconds(seconds);

		// this will work fine as long as less than 24hs, which is reasonable
		return date.toISOString().substr(11, 8);
	}

	$scope.updateEpisodes = function() {
		var that = this;

		chrome.runtime.getBackgroundPage(function(bgPage) {
			bgPage.podcastManager.podcastList.forEach(function(podcast, index) {

				messageService.for('podcastManager').sendMessage('getSyncPodcastInfo', { url: podcast.url }, function(syncPodcastInfo) {
					$scope.$apply(function() {
						that.episodes = that.episodes.filter(function(item) {
							return item.podcastUrl !== podcast.url; 
						});

						if(!syncPodcastInfo) {
							return;
						}
						
						syncPodcastInfo.e.forEach(function(syncEpisodeInfo) {
							var episode = podcast.episodes.find(function(episode) {
								return episode.guid === syncEpisodeInfo.i;
							});

							if(!episode) {
								return;
							}
						
							episodeForController = {
								fromStoredEpisode: function(episode) {
									this.link = episode.link;
									this.title = episode.title ? episode.title : episode.url;
									this.image = podcast.image;
									this.podcastTitle = podcast.title;
									this.podcastUrl = podcast.url;
									this.url = episode.enclosure.url;
									this.guid = episode.guid;
									this.lastTimePlayed = new Date(syncEpisodeInfo.l);
									this.lastTimePlayedFormatted = formatDate(this.lastTimePlayed);;
									this.pausedAt = formatSeconds(syncEpisodeInfo.t);
									this.play = function() {
										episodePlayer.play({
											episodeGuid: this.guid,
											podcastUrl: this.podcastUrl
										});
									};
									this.remove = function() {
										messageService.for('podcastManager').sendMessage('setEpisodeInProgress', {
											url: this.podcastUrl,
											episodeId: this.guid,
											currentTime: 0
										});
									}
								}
							};

							episodeForController.fromStoredEpisode(episode);
							that.episodes.push(episodeForController);
						});

						that.episodes.sort(function(a, b) {
							return b.lastTimePlayed - a.lastTimePlayed;
						});

						episodesLoaded = true;
					});
				});
			});
		});
	};

	$scope.myPagingFunction = function() {
		$scope.numberEpisodes += 20;
		console.log('Paging function - ' + $scope.numberEpisodes);
	};

	$scope.listTypeChanged = listTypeChanged;
	$scope.ready = ready;

	storageService.loadSyncUIOptions(function(uiOptions) {
		$scope.listType = uiOptions.ilt;
		optionsLoaded = true;
	});

	messageService.for('podcast').onMessage('changed', function(messageContent) {
		if(messageContent.episodeListChanged) {
			$scope.$apply(function() {
				$scope.updateEpisodes();
			});
		}
	});

	messageService.for('podcastManager').onMessage('podcastSyncInfoChanged', function() {
		$scope.$apply(function() {
			$scope.updateEpisodes();
		});
	});

	$scope.updateEpisodes();

	return;

	function listTypeChanged() {
		storageService.loadSyncUIOptions(function(uiOptions) {
			uiOptions.ilt = $scope.listType;

			return true;
		});
	}

	function ready() {
		return episodesLoaded && optionsLoaded;
	}
}]);