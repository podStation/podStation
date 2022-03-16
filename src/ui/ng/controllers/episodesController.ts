import {formatDate} from '../../common';

declare var chrome: any;

function updateIsInPlaylist($scope: any, messageService: any, podcastDataService: any, episodes?: []) {
	messageService.for('playlist').sendMessage('get', {}, (playlist: any) => {
		$scope.$apply(() => {
			// transition phase, we support episodes on scope and as a dedicated argument
			($scope.episodes || episodes).forEach((episode: any) => {
				episode.isInPlaylist = playlist.entries.find((entry: any) => {
					return podcastDataService.episodeMatchesId(episode, null, entry);
				}) !== undefined;
			});
		});
	});
}

function LastEpisodesController($scope: any, $routeParams: any, episodePlayer: any , messageService: any, storageServiceUI: any, socialService: any, podcastDataService: any) {
	return new LastEpisodesControllerClass($scope, $routeParams, episodePlayer , messageService, storageServiceUI, socialService, podcastDataService);
}

class LastEpisodesControllerClass {

	$scope: any;
	$routeParams: any;
	episodePlayer: any;
	messageService: any;
	storageServiceUI: any;
	socialService: any;
	podcastDataService: any;

	listType: string = 'big_list';
	episodes: [] = [];
	numberEpisodes: number = 50;

	private episodesLoaded = false; 
	private optionsLoaded = false;

	constructor($scope: any, $routeParams: any, episodePlayer: any , messageService: any, storageServiceUI: any, socialService: any, podcastDataService: any) {
		this.$scope = $scope;
		this.$routeParams = $routeParams;
		this.episodePlayer = episodePlayer;
		this.messageService = messageService;
		this.storageServiceUI = storageServiceUI;
		this.socialService = socialService;
		this.podcastDataService = podcastDataService;

		storageServiceUI.loadSyncUIOptions((uiOptions: any) => {
			this.listType = uiOptions.llt;
			this.optionsLoaded = true;
		});

		messageService.for('podcast').onMessage('changed', (messageContent: any) => {
			if(messageContent.episodeListChanged) {
				this.$scope.$apply(() => {
					this.updateEpisodes();
				});
			}
		});

		messageService.for('playlist').onMessage('changed', () => { updateIsInPlaylist($scope, messageService, podcastDataService, this.episodes); });
		
		this.updateEpisodes();
	}

	updateEpisodes() {
		chrome.runtime.getBackgroundPage((bgPage: any) => {
			this.$scope.$apply(() => {
				this.episodes = [];
				const storedEpisodeContainers = bgPage.podcastManager.getAllEpisodes();

				this.episodes = storedEpisodeContainers.map((storedEpisodeContainer: any) => {
					const episode: any = {};

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
					episode.participants = storedEpisodeContainer.episode.participants && storedEpisodeContainer.episode.participants.map(this.socialService.participantMapping);
					episode.duration = storedEpisodeContainer.episode.duration;

					return episode;
				});

				updateIsInPlaylist(this.$scope, this.messageService, this.podcastDataService, this.episodes);

				this.episodesLoaded = true;
			});
		});
	};

	myPagingFunction() {
		this.numberEpisodes += 20;
		console.log('Paging function - ' + this.numberEpisodes);
	};

	listTypeChanged() {
		this.storageServiceUI.loadSyncUIOptions((uiOptions: any) => {
			uiOptions.llt = this.listType;

			return true;
		});
	}

	ready() {
		return this.episodesLoaded && this.optionsLoaded;
	}
}

function EpisodeController($scope: any, $routeParams: any, episodePlayer: any, messageService: any, storageServiceUI: any, podcastDataService: any, socialService: any) {

	$scope.listType = 'big_list';
	$scope.sorting = 'by_pubdate_descending';
	$scope.episodes = [];
	$scope.numberEpisodes = 50;
	$scope.podcastUrl = '';

	$scope.updateEpisodes = function() {
		var that = this;
		
		this.episodes = [];
		this.podcastTitle = '';

		chrome.runtime.getBackgroundPage((bgPage: any) => {
			var storedPodcast = bgPage.podcastManager.getPodcast(parseInt($routeParams.podcastIndex));

			$scope.podcastUrl = storedPodcast.url;

			$scope.$apply(function() {
				that.podcastImage = storedPodcast.image;
				that.podcastTitle = storedPodcast.title;
			});

			// the following part is more expensive, we let the browser update 
			// the content on the screen before going on.
			setTimeout(() => {
				$scope.$apply(() => {
					this.episodes = storedPodcast.episodes.map((storedEpisode: any) => {
						const episode: any = {};

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

	storageServiceUI.loadSyncUIOptions((uiOptions: any) => {
		$scope.listType = uiOptions.elt;
		$scope.sorting = uiOptions.es;
	});

	messageService.for('podcast').onMessage('changed', (messageContent: any) => {
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
		storageServiceUI.loadSyncUIOptions((uiOptions: any) => {
			uiOptions.elt = $scope.listType;

			return true;
		});
	}

	function sortingChanged() {
		storageServiceUI.loadSyncUIOptions((uiOptions: any) => {
			uiOptions.es = $scope.sorting;

			return true;
		});
	}

	function isReverseOrder() {
		return $scope.sorting === 'by_pubdate_descending';
	}
}

function EpisodesInProgressController($scope: any, $routeParams: any, episodePlayer: any, messageService: any, storageServiceUI: any, podcastDataService: any, socialService: any) {

	$scope.listType = 'big_list';
	$scope.orderByField = 'lastTimePlayed';
	$scope.episodes = [];

	var episodesLoaded = false;
	var optionsLoaded = false;

	$scope.updateEpisodes = () => {
		var that = $scope;

		chrome.runtime.getBackgroundPage((bgPage: any) => {
			bgPage.podcastManager.getEpisodesInProgress().then((episodesInProgress: any) => {
				that.episodes = [];
				
				episodesInProgress.forEach((episodeInProgress: any) => {
					const podcast = episodeInProgress.podcast;
					const episode = episodeInProgress.episode;

					let episodeForController = {
						fromStoredEpisode: function (episode: any) {
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

	storageServiceUI.loadSyncUIOptions((uiOptions: any) => {
		$scope.listType = uiOptions.ilt;
		optionsLoaded = true;
	});

	messageService.for('podcast').onMessage('changed', (messageContent: any) => {
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
		storageServiceUI.loadSyncUIOptions((uiOptions: any) => {
			uiOptions.ilt = $scope.listType;

			return true;
		});
	}

	function ready() {
		return episodesLoaded && optionsLoaded;
	}
}

export { LastEpisodesController, EpisodeController, EpisodesInProgressController };