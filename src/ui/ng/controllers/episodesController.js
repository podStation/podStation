import {formatDate} from '../../common';

function LastEpisodesController($scope, $routeParams, episodePlayer, messageService, storageServiceUI, socialService, podcastDataService) {
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
					episode.pubDateUnformatted = new Date(storedEpisodeContainer.episode.pubDate);
					episode.pubDate = formatDate(episode.pubDateUnformatted);
					episode.guid = storedEpisodeContainer.episode.guid;
					episode.isInPlaylist = false;
					episode.participants = storedEpisodeContainer.episode.participants && storedEpisodeContainer.episode.participants.map(socialService.participantMapping);
					episode.duration = storedEpisodeContainer.episode.duration;

					return episode;
				});

				updateIsInPlaylist($scope, messageService, podcastDataService);

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

	storageServiceUI.loadSyncUIOptions(function(uiOptions) {
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

	messageService.for('playlist').onMessage('changed', function() { updateIsInPlaylist($scope, messageService, podcastDataService); });

	$scope.updateEpisodes();

	return;

	function listTypeChanged() {
		storageServiceUI.loadSyncUIOptions(function(uiOptions) {
			uiOptions.llt = $scope.listType;

			return true;
		});
	}

	function ready() {
		return episodesLoaded && optionsLoaded;
	}
}

function EpisodeController($scope, $routeParams, episodePlayer, messageService, storageServiceUI, podcastDataService) {

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
					that.episodes = storedPodcast.episodes.map(function(storedEpisode) {
						var episode = {};

						episode.podcastUrl = storedPodcast.url;
						episode.link = storedEpisode.link;
						episode.title = storedEpisode.title ? storedEpisode.title : storedEpisode.url;
						episode.url = storedEpisode.enclosure.url;
						episode.description = storedEpisode.description;
						episode.pubDateUnformatted = new Date(storedEpisode.pubDate);
						episode.pubDate = formatDate(episode.pubDateUnformatted);
						episode.guid = storedEpisode.guid;
						episode.participants = storedEpisode.participants && storedEpisode.participants.map(socialService.participantMapping);
						episode.duration = storedEpisode.duration;

						return episode;
					});

					updateIsInPlaylist($scope, messageService, podcastDataService);
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

	storageServiceUI.loadSyncUIOptions(function(uiOptions) {
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

	messageService.for('playlist').onMessage('changed', function() { updateIsInPlaylist($scope, messageService, podcastDataService); });

	$scope.updateEpisodes();

	return;

	function listTypeChanged() {
		storageServiceUI.loadSyncUIOptions(function(uiOptions) {
			uiOptions.elt = $scope.listType;

			return true;
		});
	}

	function sortingChanged() {
		storageServiceUI.loadSyncUIOptions(function(uiOptions) {
			uiOptions.es = $scope.sorting;

			return true;
		});
	}

	function isReverseOrder() {
		return $scope.sorting === 'by_pubdate_descending';
	}
}

function EpisodesInProgressController($scope, $routeParams, episodePlayer, messageService, storageServiceUI, podcastDataService) {

	$scope.listType = 'big_list';
	$scope.orderByField = 'lastTimePlayed';
	$scope.episodes = [];

	var episodesLoaded = false;
	var optionsLoaded = false;

	$scope.updateEpisodes = function() {
		var that = this;

		chrome.runtime.getBackgroundPage(function(bgPage) {
			bgPage.podcastManager.getEpisodesInProgress().then(function(episodesInProgress) {
				that.episodes = [];
				
				episodesInProgress.forEach(function(episodeInProgress) {
					const podcast = episodeInProgress.podcast;
					const episode = episodeInProgress.episode;

					let episodeForController = {
						fromStoredEpisode: function(episode) {
							this.link = episode.link;
							this.title = episode.title ? episode.title : episode.url;
							this.image = podcast.image;
							this.podcastTitle = podcast.title;
							this.podcastUrl = podcast.url;
							this.url = episode.enclosure.url;
							this.guid = episode.guid;
							this.lastTimePlayed = episodeInProgress.episodeUserData.lastTimePlayed;
							this.lastTimePlayedFormatted = formatDate(this.lastTimePlayed);
							this.pausedAt = episodeInProgress.episodeUserData.currentTime;
							this.participants = episode.participants && episode.participants.map(socialService.participantMapping);
							this.duration = episode.duration;
						}
					};

					episodeForController.fromStoredEpisode(episode);
					that.episodes.push(episodeForController);
				});

				updateIsInPlaylist($scope, messageService, podcastDataService);

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

	storageServiceUI.loadSyncUIOptions(function(uiOptions) {
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

	messageService.for('playlist').onMessage('changed', function() { updateIsInPlaylist($scope, messageService, podcastDataService); });

	$scope.updateEpisodes();

	return;

	function listTypeChanged() {
		storageServiceUI.loadSyncUIOptions(function(uiOptions) {
			uiOptions.ilt = $scope.listType;

			return true;
		});
	}

	function ready() {
		return episodesLoaded && optionsLoaded;
	}
}

function updateIsInPlaylist($scope, messageService, podcastDataService) {
	messageService.for('playlist').sendMessage('get', {}, function(playlist) {
		$scope.$apply(function() {
			$scope.episodes.forEach(function(episode) {
				episode.isInPlaylist = playlist.entries.find(function(entry) {
					return podcastDataService.episodeMatchesId(episode, null, entry);
				}) !== undefined;
			});
		});
	});
}

export { LastEpisodesController, EpisodeController, EpisodesInProgressController };