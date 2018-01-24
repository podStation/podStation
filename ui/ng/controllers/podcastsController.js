myApp.controller('podcastsController', ['$scope', 'messageService', 'storageService', 'socialService', function($scope, messageService, storageService, socialService) {
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

	$scope.updatePodcastList = function() {
		var that = this;

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
							this.email = storedPodcast.email;
							this.socialHandles = storedPodcast.socialHandles ? storedPodcast.socialHandles.map(function(socialHandle) {
								return {
									text: socialService.getTextForHandle(socialHandle),
									faIcon: socialService.getIconForHandle(socialHandle),
									url: socialService.getUrlForHandle(socialHandle),
								}
							}) : undefined;

							this.monetizations = storedPodcast.monetizations ? storedPodcast.monetizations.map(function(monetization) {
								return {
									text: socialService.getTextForHandle(monetization),
									faIcon: socialService.getIconForHandle(monetization),
									url: socialService.getUrlForHandle(monetization),
								}
							}) : undefined;
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
	};

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

	storageService.loadSyncUIOptions(function(uiOptions) {
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
		storageService.loadSyncUIOptions(function(uiOptions) {
			uiOptions.plt = $scope.listType;

			return true;
		});
	}

	function sortingChanged() {
		storageService.loadSyncUIOptions(function(uiOptions) {
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
}]);