import { formatDate } from "../../common";
import { IPodcastEngine } from '../../../reuse/podcast-engine/podcastEngine';

/**
 * 
 * @param {*} $scope 
 * @param {*} messageService 
 * @param {*} storageServiceUI 
 * @param {*} socialService 
 * @param {*} analyticsService 
 * @param {IPodcastEngine} podcastEngine 
 * @returns 
 */
function PodcastsController($scope, messageService, storageServiceUI, socialService, analyticsService, podcastEngine) {
	$scope.listType = 'big_list';
	$scope.sorting = 'by_subscription_descending';
	$scope.podcasts = [];

	var podcastsLoaded = false;
	var optionsLoaded = false;

	function getStatusClass(status) {
		if(status === 'updating') {
			return 'fa-refresh fa-spin';
		}
		else if(status === 'loaded') {
			return 'fa-check';
		}
		else if(status === 'failed') {
			return 'fa-close';
		}
		else {
			return 'fa-question'
		}
	}

	$scope.updatePodcastList = async function() {
		let podcasts = await podcastEngine.getAllPodcasts();
		
		$scope.podcasts = podcasts.map((podcast, index) => ({
			index: index,
			localPodcastId: podcast.id,
			title: podcast.title,
			description: podcast.description,
			episodesNumber: podcast.numberOfEpisodes,
			feedUrl: podcast.feedUrl,
			image: podcast.imageUrl
		}))

		podcastsLoaded = true;

		$scope.$apply();

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
	};

	$scope.deletePodcast = (podcast) => {
		chrome.runtime.getBackgroundPage(function(bgPage) {
			bgPage.podcastManager.deletePodcast(podcast.feedUrl);
		});

		podcastEngine.deletePodcast(podcast.localPodcastId);
	}

	$scope.updatePodcastFromFeed = (podcast) => {
		chrome.runtime.getBackgroundPage(function(bgPage) {
			analyticsService.trackEvent('feed', 'user_update_one');
			bgPage.podcastManager.updatePodcast(podcast.localPodcastId);
		});

		podcastEngine.updatePodcast(podcast.localPodcastId);
	}

	$scope.updatePodcast = function(storedPodcast) {
		this.podcasts.forEach(function(podcast) {
			if(podcast.url === storedPodcast.url) {
				podcast.fromStoredPodcast(storedPodcast);
				return false;
			}
		});
	}

	$scope.listTypeChanged = listTypeChanged;
	$scope.sortingChanged = sortingChanged;
	$scope.orderBy = orderBy;
	$scope.isReverseOrder = isReverseOrder;
	$scope.ready = ready;

	$scope.updatePodcastList();

	storageServiceUI.loadSyncUIOptions(function(uiOptions) {
		$scope.listType = uiOptions.plt;
		$scope.sorting = uiOptions.ps;
		optionsLoaded = true;
	});

	chrome.runtime.onMessage.addListener(function(message) {
		$scope.$apply(function() {
			if(!message.type){
				return;
			}

			if(message.type === 'podcastListChanged') {
				$scope.updatePodcastList();
			}
		});
	});
	
	messageService.for('podcast').onMessage('changed', function(messageContent) {
		$scope.updatePodcast(messageContent.podcast);
	});

	return;

	function listTypeChanged() {
		storageServiceUI.loadSyncUIOptions(function(uiOptions) {
			uiOptions.plt = $scope.listType;

			return true;
		});
	}

	function sortingChanged() {
		storageServiceUI.loadSyncUIOptions(function(uiOptions) {
			uiOptions.ps = $scope.sorting;

			return true;
		});
	}

	function orderBy() {
		switch($scope.sorting) {
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
				return 'pubDateUnformatted';
		}
	}

	function isReverseOrder() {
		switch($scope.sorting) {
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

	function ready() {
		return podcastsLoaded && optionsLoaded;
	}
}

export default PodcastsController;