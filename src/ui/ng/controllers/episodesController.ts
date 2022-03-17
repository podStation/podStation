import {formatDate} from '../../common';

declare var chrome: any;

export type ControllerEpisode = {
	link?: string;
	title?: string;
	image?: string;
	podcastIndex?: number;
	podcastTitle?: string;
	podcastUrl?: string;
	url?: string;
	description?: string;
	pubDateUnformatted?: Date;
	pubDate?: string;
	guid?: string;
	isInPlaylist: boolean;
	participants?: [];
	duration?: number;
	lastTimePlayed?: Date;
	lastTimePlayedFormatted?: string;
	pausedAt?: number;
}

function updateIsInPlaylist($scope: any, messageService: any, podcastDataService: any, episodes?: ControllerEpisode[]) {
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
	episodes: ControllerEpisode[] = [];
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
					const episode: ControllerEpisode = {
						isInPlaylist: false,
					};

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
	return new EpisodeControllerClass($scope, $routeParams, episodePlayer, messageService, storageServiceUI, podcastDataService, socialService);
}

class EpisodeControllerClass {
	$scope: any;
	$routeParams: any;
	episodePlayer: any;
	messageService: any;
	storageServiceUI: any;
	socialService: any;
	podcastDataService: any;

	listType: string = 'big_list';
	sorting: string = 'by_pubdate_descending';
	episodes: ControllerEpisode[] = [];
	numberEpisodes: number = 50;
	podcastUrl: string = '';
	podcastTitle: string = '';
	podcastImage: string = '';

	constructor($scope: any, $routeParams: any, episodePlayer: any, messageService: any, storageServiceUI: any, podcastDataService: any, socialService: any) {
		this.$scope = $scope;
		this.$routeParams = $routeParams;
		this.episodePlayer = episodePlayer;
		this.messageService = messageService;
		this.storageServiceUI = storageServiceUI;
		this.socialService = socialService;
		this.podcastDataService = podcastDataService;

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
	
		messageService.for('playlist').onMessage('changed', () => { updateIsInPlaylist($scope, messageService, podcastDataService, this.episodes); });

		this.updateEpisodes();
	}

	updateEpisodes() {
		this.episodes = [];
		this.podcastTitle = '';

		chrome.runtime.getBackgroundPage((bgPage: any) => {
			const storedPodcast = bgPage.podcastManager.getPodcast(parseInt(this.$routeParams.podcastIndex));

			this.podcastUrl = storedPodcast.url;

			this.$scope.$apply(() => {
				this.podcastImage = storedPodcast.image;
				this.podcastTitle = storedPodcast.title;
			});

			// the following part is more expensive, we let the browser update 
			// the content on the screen before going on.
			setTimeout(() => {
				this.$scope.$apply(() => {
					this.episodes = storedPodcast.episodes.map((storedEpisode: any) => {
						const episode: ControllerEpisode = {
							isInPlaylist: false,
						};

						episode.podcastUrl = storedPodcast.url;
						episode.link = storedEpisode.link;
						episode.title = storedEpisode.title ? storedEpisode.title : storedEpisode.url;
						episode.url = storedEpisode.enclosure.url;
						episode.description = storedEpisode.description;
						episode.pubDateUnformatted = new Date(storedEpisode.pubDate);
						episode.pubDate = formatDate(episode.pubDateUnformatted);
						episode.guid = storedEpisode.guid;
						episode.participants = storedEpisode.participants && storedEpisode.participants.map(this.socialService.participantMapping);
						episode.duration = storedEpisode.duration;

						return episode;
					});

					updateIsInPlaylist(this.$scope, this.messageService, this.podcastDataService, this.episodes);
				});
			} ,1);
		});
	};

	myPagingFunction() {
		this.numberEpisodes += 20;
		console.log('Paging function - ' + this.numberEpisodes);
	};

	listTypeChanged() {
		this.storageServiceUI.loadSyncUIOptions((uiOptions: any) => {
			uiOptions.elt = this.$scope.listType;

			return true;
		});
	}

	sortingChanged() {
		this.storageServiceUI.loadSyncUIOptions((uiOptions: any) => {
			uiOptions.es = this.$scope.sorting;

			return true;
		});
	}

	isReverseOrder() {
		return this.$scope.sorting === 'by_pubdate_descending';
	}
}

function EpisodesInProgressController($scope: any, $routeParams: any, episodePlayer: any, messageService: any, storageServiceUI: any, podcastDataService: any, socialService: any) {
	return new EpisodesInProgressControllerClass($scope, $routeParams, episodePlayer , messageService, storageServiceUI, podcastDataService, socialService);
}

class EpisodesInProgressControllerClass {
	$scope: any;
	$routeParams: any;
	episodePlayer: any;
	messageService: any;
	storageServiceUI: any;
	socialService: any;
	podcastDataService: any;

	listType = 'big_list';
	orderByField = 'lastTimePlayed';
	episodes: ControllerEpisode[] = [];

	private episodesLoaded = false;
	private optionsLoaded = false;

	constructor($scope: any, $routeParams: any, episodePlayer: any, messageService: any, storageServiceUI: any, podcastDataService: any, socialService: any) {
		this.$scope = $scope;
		this.$routeParams = $routeParams;
		this.episodePlayer = episodePlayer;
		this.messageService = messageService;
		this.storageServiceUI = storageServiceUI;
		this.socialService = socialService;
		this.podcastDataService = podcastDataService;

		storageServiceUI.loadSyncUIOptions((uiOptions: any) => {
			$scope.listType = uiOptions.ilt;
			this.optionsLoaded = true;
		});
	
		messageService.for('podcast').onMessage('changed', (messageContent: any) => {
			if(messageContent.episodeListChanged) {
				$scope.$apply(() => {
					this.updateEpisodes();
				});
			}
		});
	
		messageService.for('podcastManager').onMessage('podcastSyncInfoChanged', function() {
			$scope.$apply(() => {
				this.updateEpisodes();
			});
		});
	
		messageService.for('playlist').onMessage('changed', () =>{ updateIsInPlaylist($scope, messageService, podcastDataService, this.episodes); });
	
		this.updateEpisodes();
	}

	updateEpisodes() {
		chrome.runtime.getBackgroundPage((bgPage: any) => {
			bgPage.podcastManager.getEpisodesInProgress().then((episodesInProgress: any) => {
				this.episodes = episodesInProgress.map((episodeInProgress: any) => {
					const podcast = episodeInProgress.podcast;
					const episode = episodeInProgress.episode;

					const controllerEpisode: ControllerEpisode = {
						isInPlaylist: false,
					};

					controllerEpisode.link = episode.link;
					controllerEpisode.title = episode.title ? episode.title : episode.url;
					controllerEpisode.image = podcast.image;
					controllerEpisode.podcastTitle = podcast.title;
					controllerEpisode.podcastUrl = podcast.url;
					controllerEpisode.url = episode.enclosure.url;
					controllerEpisode.guid = episode.guid;
					controllerEpisode.lastTimePlayed = episodeInProgress.episodeUserData.lastTimePlayed;
					controllerEpisode.lastTimePlayedFormatted = formatDate(controllerEpisode.lastTimePlayed);
					controllerEpisode.pausedAt = episodeInProgress.episodeUserData.currentTime;
					controllerEpisode.participants = episode.participants && episode.participants.map(this.socialService.participantMapping);
					controllerEpisode.duration = episode.duration;

					return controllerEpisode;
				});

				updateIsInPlaylist(this.$scope, this.messageService, this.podcastDataService, this.episodes);

				this.episodesLoaded = true;
			});
				
		});
	};

	myPagingFunction = function() {
		this.numberEpisodes += 20;
		console.log('Paging function - ' + this.numberEpisodes);
	};

	listTypeChanged() {
		this.storageServiceUI.loadSyncUIOptions((uiOptions: any) => {
			uiOptions.ilt = this.listType;

			return true;
		});
	}

	ready() {
		return this.episodesLoaded && this.optionsLoaded;
	}
}

export { LastEpisodesController, EpisodeController, EpisodesInProgressController };