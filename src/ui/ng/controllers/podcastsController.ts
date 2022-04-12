import { formatDate } from "../../common";
import { IPodcastEngine } from '../../../reuse/podcast-engine/podcastEngine';
import { LocalPodcastId, LocalStoragePodcastState } from "../../../reuse/podcast-engine/storageEngine";

declare var chrome: any;

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

	async updatePodcastList() {
		let podcasts = await this.podcastEngine.getAllPodcasts();
		
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

		/*
		chrome.runtime.getBackgroundPage(function(bgPage) {
			that.podcasts = [];

			$scope.$apply(function() {
				bgPage.podcastManager.podcastList.forEach(function(podcast, index) {
					var podcastForController;

					podcastForController = {
						fromStoredPodcast: function(storedPodcast) {
							this.index = index;
							this.link =  storedPodcast.link;
							this.title =  storedPodcast.title ? storedPodcast.title : storedPodcast.url;
							this.image = storedPodcast.image;
							this.url =  storedPodcast.url;
							this.description =  storedPodcast.description;
							this.episodesNumber =  storedPodcast.episodes.length;
							this.pubDateUnformatted = new Date(storedPodcast.pubDate);
							this.pubDate = storedPodcast.pubDate ? formatDate(this.pubDateUnformatted) : undefined;
							this.statusClass = getStatusClass(storedPodcast.status);
							
							// >>> social namespace
							this.email = storedPodcast.email;
							this.socialHandles = storedPodcast.socialHandles ? storedPodcast.socialHandles.map(socialService.socialHandleMapping) : undefined;

							this.crowdfundings = storedPodcast.crowdfundings ? storedPodcast.crowdfundings.map(function(crowdfunding) {
								return {
									text: socialService.getTextForHandle(crowdfunding),
									faIcon: socialService.getIconForHandle(crowdfunding),
									url: socialService.getUrlForHandle(crowdfunding),
								}
							}) : undefined;

							this.participants = storedPodcast.participants ? storedPodcast.participants.filter(function(participant) {
								return participant.permanent;
							}).map(socialService.participantMapping) : undefined;

							// <<< social namespace
						},
						update: function() {
							var that1 = this;

							// As the bgPage is an event page, it is better not to thrust
							// in the contet of the bgPage variable at this moment.
							chrome.runtime.getBackgroundPage(function(bgPage) {
								analyticsService.trackEvent('feed', 'user_update_one');
								bgPage.podcastManager.updatePodcast(that1.url);
							});
						},
						delete: function(storedPodcast) {
							var that1 = this;

							// As the bgPage is an event page, it is better not to thrust
							// in the contet of the bgPage variable at this moment.
							chrome.runtime.getBackgroundPage(function(bgPage) {
								bgPage.podcastManager.deletePodcast(that1.url);
							});
						}
					};

					podcastForController.fromStoredPodcast(podcast);

					that.podcasts.push(podcastForController);
				});

				podcastsLoaded = true;
			});
		});
		*/
	}

	deletePodcast(podcast: Podcast) {
		chrome.runtime.getBackgroundPage(function(bgPage: any) {
			bgPage.podcastManager.deletePodcast(podcast.feedUrl);
		});

		this.podcastEngine.deletePodcast(podcast.localPodcastId);
	}

	updatePodcastFromFeed(podcast: Podcast) {
		chrome.runtime.getBackgroundPage(function(bgPage: any) {
			this.analyticsService.trackEvent('feed', 'user_update_one');
			bgPage.podcastManager.updatePodcast(podcast.localPodcastId);
		});

		this.podcastEngine.updatePodcast(podcast.localPodcastId);
	}

	/*updatePodcast(storedPodcast) {
		this.podcasts.forEach(function(podcast) {
			if(podcast.url === storedPodcast.url) {
				podcast.fromStoredPodcast(storedPodcast);
				return false;
			}
		});
	}*/

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
		this.updatePodcastList();

		this.storageServiceUI.loadSyncUIOptions((uiOptions: any) => {
			this.listType = uiOptions.plt;
			this.sorting = uiOptions.ps;
			this.optionsLoaded = true;
			this.$scope.$apply();
		});

		chrome.runtime.onMessage.addListener((message: any) => {
			this.$scope.$apply(() => {
				if(!message.type){
					return;
				}

				if(message.type === 'podcastListChanged') {
					this.updatePodcastList();
				}
			});
		});
		
		/*this.messageService.for('podcast').onMessage('changed', (messageContent: any) => {
			this.updatePodcast(messageContent.podcast);
		});*/
	}
}

export default PodcastsController;