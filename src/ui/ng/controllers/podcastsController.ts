import { formatDate } from "../../common";
import { IPodcastEngine } from '../../../reuse/podcast-engine/podcastEngine';
import { LocalPodcastId, LocalStoragePodcast, LocalStoragePodcastState } from "../../../reuse/podcast-engine/storageEngine";

type Podcast = {
	index: number,
	localPodcastId: LocalPodcastId,
	title: string,
	description: string,
	episodesNumber: number,
	feedUrl: string,
	image: string,
	pubDate: Date,
	formattedPubDate: string,
	statusClass: string,
}

/**
 * Angular controller for the list of subscribed podcasts
 * 
 */
class PodcastsController {
	private $scope: any;
	private messageService: any;
	private storageServiceUI: any;
	private socialService: any;
	private analyticsService: any;
	private podcastEngine: IPodcastEngine;
	
	listType: string;
	sorting: string;
	podcasts: Podcast[];
	podcastsLoaded: boolean;
	optionsLoaded: boolean;

	constructor($scope: any, messageService: any, storageServiceUI: any, socialService: any, analyticsService: any, podcastEngine: IPodcastEngine) {
		this.$scope = $scope;
		this.messageService = messageService;
		this.storageServiceUI = storageServiceUI;
		this.socialService = socialService;
		this.analyticsService = analyticsService;
		this.podcastEngine = podcastEngine;

		this.listType = 'big_list';
		this.sorting = 'by_subscription_descending';
		this.podcasts = [];

		this.podcastsLoaded = false;
		this.optionsLoaded = false;

		this.initialize();
	}

	static getStatusClass(state: LocalStoragePodcastState): string {
		switch(state) {
			case 'ready':
				return 'fa-check';
			default:
				return 'fa-question';
		}
	}

	async observeAllPodcasts() {
		const allPodcastsObservable = this.podcastEngine.getObservableForAllPodcasts();

		allPodcastsObservable.subscribe((allPodcasts) => this.updatePodcasts(allPodcasts));
	}

	updatePodcasts(podcasts: LocalStoragePodcast[]) {
		this.podcasts = podcasts.map((podcast, index) => ({
			index: index,
			localPodcastId: podcast.id,
			title: podcast.title,
			description: podcast.description,
			episodesNumber: podcast.numberOfEpisodes,
			feedUrl: podcast.feedUrl,
			image: podcast.imageUrl,
			pubDate: podcast.pubDate,
			formattedPubDate: podcast.pubDate ? formatDate(podcast.pubDate) : undefined,
			statusClass: PodcastsController.getStatusClass(podcast.state) 
		}))

		this.podcastsLoaded = true;

		this.$scope.$apply();
	}

	deletePodcast(podcast: Podcast) {
		this.podcastEngine.deletePodcast(podcast.localPodcastId);
	}

	updatePodcastFromFeed(podcast: Podcast) {
		this.podcastEngine.updatePodcast(podcast.localPodcastId);
	}

	listTypeChanged() {
		this.storageServiceUI.loadSyncUIOptions((uiOptions: any) => {
			uiOptions.plt = this.listType;

			return true;
		});
	}

	sortingChanged() {
		this.storageServiceUI.loadSyncUIOptions((uiOptions: any) => {
			uiOptions.ps = this.sorting;

			return true;
		});
	}

	orderBy() {
		switch(this.sorting) {
			default:
				return 'index';
			case 'by_subscription_ascending':
			case 'by_subscription_descending':
				return 'index';
			case 'by_alpha_ascending':
			case 'by_alpha_descending':
				return 'title';
			case 'by_pubdate_ascending':
			case 'by_pubdate_descending':
				return 'pubDate';
		}
	}

	isReverseOrder() {
		switch(this.sorting) {
			default:
				return false;
			case 'by_alpha_descending':
			case 'by_pubdate_descending':
			case 'by_subscription_ascending':
				return true;
			case 'by_pubdate_ascending':
			case 'by_alpha_ascending':
			case 'by_subscription_descending':
				return false;
		}
	}

	ready() {
		return this.podcastsLoaded && this.optionsLoaded;
	}

	initialize() {
		this.observeAllPodcasts();

		this.storageServiceUI.loadSyncUIOptions((uiOptions: any) => {
			this.listType = uiOptions.plt;
			this.sorting = uiOptions.ps;
			this.optionsLoaded = true;
			this.$scope.$apply();
		});
	}
}

export default PodcastsController;