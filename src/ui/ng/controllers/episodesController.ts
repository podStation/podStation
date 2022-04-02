import { PodcastDataServiceClass } from '../../../reuse/ng/services/podcastDataService';
import IPodcastEngine from '../../../reuse/podcast-engine/podcastEngine';
import {formatDate} from '../../common';

declare var chrome: any;

export type ControllerEpisode = {
	link?: string;
	title?: string;
	image?: string;
	podcastIndex?: number;
	podcastTitle?: string;
	/** Probably not used */
	podcastUrl?: string;
	podcastId?: number;
	/** Url of the episode enclosure */
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

function updateIsInPlaylist($scope: any, messageService: any, podcastDataService: PodcastDataServiceClass, episodes?: ControllerEpisode[]) {
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

function LastEpisodesController($scope: any, messageService: any, storageServiceUI: any, socialService: any, podcastDataService: PodcastDataServiceClass, podcastEngine: IPodcastEngine) {
	return new LastEpisodesControllerClass($scope, messageService, storageServiceUI, socialService, podcastDataService, podcastEngine);
}

class LastEpisodesControllerClass {

	$scope: any;
	messageService: any;
	storageServiceUI: any;
	socialService: any;
	podcastDataService: PodcastDataServiceClass;
	private podcastEngine: IPodcastEngine;

	listType: string = 'big_list';
	episodes: ControllerEpisode[] = [];
	// numberEpisodes: number = 50;
	private nextPageOffset: number = 0;
	private nextPageSize: number = 50;
	private readonly PAGE_SIZE = 20;

	private episodesLoaded = false; 
	private optionsLoaded = false;

	constructor($scope: any, messageService: any, storageServiceUI: any, socialService: any, podcastDataService: PodcastDataServiceClass, podcastEngine: IPodcastEngine) {
		this.$scope = $scope;
		this.messageService = messageService;
		this.storageServiceUI = storageServiceUI;
		this.socialService = socialService;
		this.podcastDataService = podcastDataService;
		this.podcastEngine = podcastEngine;

		storageServiceUI.loadSyncUIOptions((uiOptions: any) => {
			this.listType = uiOptions.llt;
			this.optionsLoaded = true;
		});

		this.fetchNextPage();
	}

	async fetchNextPage() {
		const nextPageEpisodes = await this.podcastEngine.getLastEpisodes(this.nextPageOffset, this.nextPageSize);
		this.episodes.push(...nextPageEpisodes.map((episode) => {
			const controllerEpisode: ControllerEpisode = {
				...episode, 
				isInPlaylist: false,
				pubDate: formatDate(episode.pubDate),
				pubDateUnformatted: episode.pubDate,
				image: episode.podcast?.imageUrl,
				podcastTitle: episode.podcast?.title,
				url: episode.enclosureUrl,
			};

			return controllerEpisode; 
		}));

		this.nextPageOffset += this.PAGE_SIZE;
		this.nextPageSize = this.PAGE_SIZE;
		this.episodesLoaded = true;

		this.$scope.$apply();
	}

	myPagingFunction() {
		this.fetchNextPage();
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

function EpisodeController($scope: any, $routeParams: any, messageService: any, storageServiceUI: any, podcastDataService: PodcastDataServiceClass, socialService: any) {
	return new EpisodeControllerClass($scope, $routeParams, messageService, storageServiceUI, podcastDataService, socialService);
}

class EpisodeControllerClass {
	$scope: any;
	$routeParams: any;
	messageService: any;
	storageServiceUI: any;
	socialService: any;
	podcastDataService: PodcastDataServiceClass;

	listType: string = 'big_list';
	sorting: string = 'by_pubdate_descending';
	episodes: ControllerEpisode[] = [];
	numberEpisodes: number = 50;
	podcastUrl: string = '';
	podcastTitle: string = '';
	podcastImage: string = '';

	constructor($scope: any, $routeParams: any, messageService: any, storageServiceUI: any, podcastDataService: PodcastDataServiceClass, socialService: any) {
		this.$scope = $scope;
		this.$routeParams = $routeParams;
		this.messageService = messageService;
		this.storageServiceUI = storageServiceUI;
		this.socialService = socialService;
		this.podcastDataService = podcastDataService;

		storageServiceUI.loadSyncUIOptions((uiOptions: any) => {
			$scope.listType = uiOptions.elt;
			$scope.sorting = uiOptions.es;
		});
	
		messageService.for('podcast').onMessage('changed', (messageContent: any) => {
			if(messageContent.episodeListChanged && messageContent.podcast.url === this.podcastUrl) {
				$scope.$apply(function() {
					this.updateEpisodes();
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

function EpisodesInProgressController($scope: any, messageService: any, storageServiceUI: any, podcastDataService: PodcastDataServiceClass, socialService: any) {
	return new EpisodesInProgressControllerClass($scope, messageService, storageServiceUI, podcastDataService, socialService);
}

class EpisodesInProgressControllerClass {
	$scope: any;
	messageService: any;
	storageServiceUI: any;
	socialService: any;
	podcastDataService: PodcastDataServiceClass;

	listType = 'big_list';
	orderByField = 'lastTimePlayed';
	episodes: ControllerEpisode[] = [];

	private episodesLoaded = false;
	private optionsLoaded = false;

	constructor($scope: any, messageService: any, storageServiceUI: any, podcastDataService: PodcastDataServiceClass, socialService: any) {
		this.$scope = $scope;
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
	
		messageService.for('podcastManager').onMessage('podcastSyncInfoChanged', () => {
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