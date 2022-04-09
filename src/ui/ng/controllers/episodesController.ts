import { PodcastDataServiceClass } from '../../../reuse/ng/services/podcastDataService';
import IPodcastEngine from '../../../reuse/podcast-engine/podcastEngine';
import { LocalPodcastId } from '../../../reuse/podcast-engine/storageEngine';
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
	podcastId?: LocalPodcastId;
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

class PagedEpisodes {
	private episodes: ControllerEpisode[] = [];
	private isReadingPage: boolean = false;
	private nextPageOffset: number = 0;
	private nextPageSize: number = 50;
	private readonly PAGE_SIZE = 20;

	getEpisodes(): ControllerEpisode[] {
		// I tried returning [...this.episodes], but angular goes haywire.
		// possibly because a new value is returned every time the expression is 
		// evaluated, so returning the same reference all the time seems to be
		// the way to go.
		return this.episodes;
	}

	/**
	 * 
	 * @param pageReader A function that provides a new page of episodes
	 * @returns true if a new page is pushed, false if a page is already being read and nothing will be done
	 */
	async pushPage(pageReader: (pageOffset: number, pageSize: number) => Promise<ControllerEpisode[]>): Promise<boolean> {
		// avoid concurrent page reads
		if(!this.isReadingPage) {
			this.isReadingPage = true;
		
			this.episodes.push(...await pageReader(this.nextPageOffset, this.nextPageSize));

			this.nextPageOffset += this.nextPageSize;
			this.nextPageSize = this.PAGE_SIZE;
			this.isReadingPage = false;
			return true;
		}

		return false;
	};
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
	
	private pagedEpisodes: PagedEpisodes;
	listType: string = 'big_list';	

	private episodesLoaded = false; 
	private optionsLoaded = false;

	constructor($scope: any, messageService: any, storageServiceUI: any, socialService: any, podcastDataService: PodcastDataServiceClass, podcastEngine: IPodcastEngine) {
		this.$scope = $scope;
		this.messageService = messageService;
		this.storageServiceUI = storageServiceUI;
		this.socialService = socialService;
		this.podcastDataService = podcastDataService;
		this.podcastEngine = podcastEngine;

		this.pagedEpisodes = new PagedEpisodes();

		storageServiceUI.loadSyncUIOptions((uiOptions: any) => {
			this.listType = uiOptions.llt;
			this.optionsLoaded = true;
		});

		this.readNextEpisodesPage();
	}

	async readNextEpisodesPage() {
		let pagePushed: boolean = await this.pagedEpisodes.pushPage(async (pageOffset, pageSize) => {
			const pageEpisodes = await this.podcastEngine.getLastEpisodes(pageOffset, pageSize);
			
			return pageEpisodes.map((episode) => {
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
			});
		});

		if(pagePushed) {
			this.episodesLoaded = true;
			this.$scope.$apply();
		}
	}

	getEpisodes() {
		return this.pagedEpisodes.getEpisodes();
	}

	myPagingFunction() {
		this.readNextEpisodesPage();
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

function EpisodeController($scope: any, $routeParams: any, messageService: any, storageServiceUI: any, podcastDataService: PodcastDataServiceClass, socialService: any, podcastEngine: IPodcastEngine) {
	return new EpisodeControllerClass($scope, $routeParams, messageService, storageServiceUI, podcastDataService, socialService, podcastEngine);
}

class EpisodeControllerClass {
	private $scope: any;
	private messageService: any;
	private storageServiceUI: any;
	private socialService: any;
	private podcastDataService: PodcastDataServiceClass;
	private podcastEngine: IPodcastEngine;

	private localPodcastId: LocalPodcastId;
	private pagedEpisodes: PagedEpisodes;

	listType: string = 'big_list';
	sorting: string = 'by_pubdate_descending';
	podcastTitle: string = '';
	podcastImage: string = '';

	constructor($scope: any, $routeParams: any, messageService: any, storageServiceUI: any, podcastDataService: PodcastDataServiceClass, socialService: any, podcastEngine: IPodcastEngine) {
		this.$scope = $scope;
		this.messageService = messageService;
		this.storageServiceUI = storageServiceUI;
		this.socialService = socialService;
		this.podcastDataService = podcastDataService;
		this.podcastEngine = podcastEngine;

		this.localPodcastId = parseInt($routeParams.localPodcastId);
		this.pagedEpisodes = new PagedEpisodes();

		storageServiceUI.loadSyncUIOptions((uiOptions: any) => {
			$scope.listType = uiOptions.elt;
			$scope.sorting = uiOptions.es;
		});

		this.readPodcast();
		this.readNextEpisodesPage();
	}

	async readPodcast() {
		const podcast = await this.podcastEngine.getPodcast(this.localPodcastId);

		this.podcastTitle = podcast.title;
		this.podcastImage = podcast.imageUrl;

		this.$scope.$apply();
	}

	async readNextEpisodesPage() {
		let pagePushed: boolean = await this.pagedEpisodes.pushPage(async (pageOffset, pageSize) => {
			const pageEpisodes = await this.podcastEngine.getPodcastEpisodes(this.localPodcastId, pageOffset, pageSize, this.isReverseOrder());
			
			return pageEpisodes.map((episode) => {
				const controllerEpisode: ControllerEpisode = {
					...episode, 
					isInPlaylist: false,
					pubDate: formatDate(episode.pubDate),
					pubDateUnformatted: episode.pubDate,
					url: episode.enclosureUrl,
				};
	
				return controllerEpisode; 
			});
		});

		if(pagePushed) {
			this.$scope.$apply();
		}
	}

	getEpisodes() {
		return this.pagedEpisodes.getEpisodes();
	}

	myPagingFunction() {
		this.readNextEpisodesPage();
	};

	listTypeChanged() {
		this.storageServiceUI.loadSyncUIOptions((uiOptions: any) => {
			uiOptions.elt = this.listType;

			return true;
		});
	}

	sortingChanged() {
		this.storageServiceUI.loadSyncUIOptions((uiOptions: any) => {
			uiOptions.es = this.sorting;

			return true;
		});
	}

	isReverseOrder() {
		return this.sorting === 'by_pubdate_descending';
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