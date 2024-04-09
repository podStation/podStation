import { Observable, Subscription } from 'dexie';
import PodcastDataService from '../../../reuse/ng/services/podcastDataService';
import IPodcastEngine from '../../../reuse/podcast-engine/podcastEngine';
import { LocalPodcastId, LocalStorageEpisode } from '../../../reuse/podcast-engine/storageEngine';
import {formatDate} from '../../common';
import { ControllerEpisode } from '../common/controllerEpisode';

declare var chrome: any;

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
				lastTimePlayedFormatted: episode.lastTimePlayed && formatDate(episode.lastTimePlayed),
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

	storageServiceUI: any;
	private podcastEngine: IPodcastEngine;

	private pagedEpisodes: PagedEpisodesSubscriber;

	listType = 'big_list';
	orderByField = 'lastTimePlayed';
	episodes: ControllerEpisode[] = [];

	private episodesLoaded = false;
	private optionsLoaded = false;

	constructor($scope: any, storageServiceUI: any, podcastEngine: IPodcastEngine) {
		this.$scope = $scope;
		this.storageServiceUI = storageServiceUI;
		this.podcastEngine = podcastEngine;

		storageServiceUI.loadSyncUIOptions((uiOptions: any) => {
			$scope.listType = uiOptions.ilt;
			this.optionsLoaded = true;
		});
	
		this.pagedEpisodes = new PagedEpisodesSubscriber((offset, limit) => this.podcastEngine.getEpisodesInProgressObservable(offset, limit), () => {
			// replacing the entire array (this.episodes = this.pagedEpisodes.getEpisodes()) causes and issue on AngularJS
			this.episodes.length = 0;
			this.episodes.push(...this.pagedEpisodes.getEpisodes());
			this.episodesLoaded = true;
			this.$scope.$apply();
		});
	}

	myPagingFunction = function() {
		this.pagedEpisodes.subscribeToNextPage();
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