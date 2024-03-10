import { Observable, Subscription } from 'dexie';
import PodcastDataService from '../../../reuse/ng/services/podcastDataService';
import IPodcastEngine from '../../../reuse/podcast-engine/podcastEngine';
import { LocalPodcastId, LocalStorageEpisode } from '../../../reuse/podcast-engine/storageEngine';
import {formatDate} from '../../common';
import { ControllerEpisode } from '../common/controllerEpisode';

declare var chrome: any;

// TODO: Remove this code later
function updateIsInPlaylist($scope: any, messageService: any, podcastDataService: PodcastDataService, episodes?: ControllerEpisode[]) {
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

type EpidodesObervableGetter = (offset: number, limit: number) => Observable<LocalStorageEpisode[]>;
type EpisodeListChangedCallback = () => void;

class PagedEpisodesSubscriber {
	private pageNumber: number = 0;
	private readonly PAGE_SIZE = 50;
	private pages: ControllerEpisode[][] = [];
	private pagesSubscriptions: Subscription[] = [];
	private episodesObservableGetter: EpidodesObervableGetter;
	private episodeListChangedCallback: EpisodeListChangedCallback;

	constructor(episodesObservableGetter: EpidodesObervableGetter, episodeListChangedCallback: EpisodeListChangedCallback) {
		this.episodesObservableGetter = episodesObservableGetter;
		this.episodeListChangedCallback = episodeListChangedCallback;

		this.subscribeToCurrentPage();
	}

	private subscribeToCurrentPage() {
		const currentPage = this.pageNumber;
		this.pages[currentPage] = [];

		const observable = this.episodesObservableGetter(this.pageNumber * this.PAGE_SIZE, this.PAGE_SIZE);
		const subscription = observable.subscribe((episodes) => {
			this.pages[currentPage] = episodes.map((episode) => ({
				...episode, 
				pubDate: formatDate(episode.pubDate),
				pubDateUnformatted: episode.pubDate,
				image: episode.podcast?.imageUrl,
				podcastTitle: episode.podcast?.title,
				url: episode.enclosureUrl,
			}));

			this.episodeListChangedCallback();
		});

		this.pagesSubscriptions[currentPage] = subscription;
	}

	subscribeToNextPage() {
		this.pageNumber++;
		this.subscribeToCurrentPage();
	}

	unsubscribe() {
		this.pagesSubscriptions.forEach(subscription => subscription.unsubscribe());
	}

	getEpisodes(): ControllerEpisode[] {
		return this.pages.flat(1);
	}
}

class LastEpisodesController {
	private $scope: any;
	private messageService: any;
	private storageServiceUI: any;
	private socialService: any;
	private podcastDataService: PodcastDataService;
	private podcastEngine: IPodcastEngine;
	
	private pagedEpisodes: PagedEpisodesSubscriber;
	listType: string = 'big_list';	

	private episodesLoaded = false; 
	private optionsLoaded = false;
	episodes: ControllerEpisode[] = [];

	constructor($scope: any, messageService: any, storageServiceUI: any, socialService: any, podcastDataService: PodcastDataService, podcastEngine: IPodcastEngine) {
		this.$scope = $scope;
		this.messageService = messageService;
		this.storageServiceUI = storageServiceUI;
		this.socialService = socialService;
		this.podcastDataService = podcastDataService;
		this.podcastEngine = podcastEngine;

		this.pagedEpisodes = new PagedEpisodesSubscriber((offset, limit) => this.podcastEngine.getLastEpisodesObservable(offset, limit), () => {
			// replacing the entire array (this.episodes = this.pagedEpisodes.getEpisodes()) causes and issue on AngularJS
			this.episodes.length = 0;
			this.episodes.push(...this.pagedEpisodes.getEpisodes());
			this.episodesLoaded = true;
			this.$scope.$apply();
		});

		storageServiceUI.loadSyncUIOptions((uiOptions: any) => {
			this.listType = uiOptions.llt;
			this.optionsLoaded = true;
		});

		$scope.$on('$destroy', () => this.pagedEpisodes.unsubscribe());
	}

	myPagingFunction() {
		this.pagedEpisodes.subscribeToNextPage()
	};

	getEpisodes() {
		return this.episodes;
	}

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

class EpisodeController {
	private $scope: any;
	private messageService: any;
	private storageServiceUI: any;
	private socialService: any;
	private podcastDataService: PodcastDataService;
	private podcastEngine: IPodcastEngine;

	private localPodcastId: LocalPodcastId;
	private pagedEpisodes: PagedEpisodesSubscriber;

	listType: string = 'big_list';
	sorting: string = 'by_pubdate_descending';
	podcastTitle: string = '';
	podcastImage: string = '';
	episodes: ControllerEpisode[] = [];

	constructor($scope: any, $routeParams: any, messageService: any, storageServiceUI: any, podcastDataService: PodcastDataService, socialService: any, podcastEngine: IPodcastEngine) {
		this.$scope = $scope;
		this.messageService = messageService;
		this.storageServiceUI = storageServiceUI;
		this.socialService = socialService;
		this.podcastDataService = podcastDataService;
		this.podcastEngine = podcastEngine;

		this.localPodcastId = parseInt($routeParams.localPodcastId);
		this.createPagedEpisodesSubscriber();

		storageServiceUI.loadSyncUIOptions((uiOptions: any) => {
			$scope.listType = uiOptions.elt;
			$scope.sorting = uiOptions.es;
		});

		this.readPodcast();

		$scope.$on('$destroy', () => this.pagedEpisodes.unsubscribe());
	}

	private createPagedEpisodesSubscriber() {
		this.pagedEpisodes && this.pagedEpisodes.unsubscribe();
		
		this.pagedEpisodes = new PagedEpisodesSubscriber((offset, limit) => this.podcastEngine.getPodcastEpisodesObservable(this.localPodcastId, offset, limit, this.isReverseOrder()), () => {
			// replacing the entire array (this.episodes = this.pagedEpisodes.getEpisodes()) causes and issue on AngularJS
			this.episodes.length = 0;
			this.episodes.push(...this.pagedEpisodes.getEpisodes());
			this.$scope.$apply();
		});
	}

	async readPodcast() {
		const podcast = await this.podcastEngine.getPodcast(this.localPodcastId);

		this.podcastTitle = podcast.title;
		this.podcastImage = podcast.imageUrl;

		this.$scope.$apply();
	}

	getEpisodes() {
		return this.episodes;
	}

	myPagingFunction() {
		this.pagedEpisodes.subscribeToNextPage();
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

		this.createPagedEpisodesSubscriber();
	}

	isReverseOrder() {
		return this.sorting === 'by_pubdate_descending';
	}
}

class EpisodesInProgressController {
	$scope: any;
	messageService: any;
	storageServiceUI: any;
	socialService: any;
	podcastDataService: PodcastDataService;

	listType = 'big_list';
	orderByField = 'lastTimePlayed';
	episodes: ControllerEpisode[] = [];

	private episodesLoaded = false;
	private optionsLoaded = false;

	constructor($scope: any, messageService: any, storageServiceUI: any, podcastDataService: PodcastDataService, socialService: any) {
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
						id: episode.id,
						isInDefaultPlaylist: false,
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