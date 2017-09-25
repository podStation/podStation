myApp.controller('podcastsController', ['$scope', 'messageService', 'storageService', function($scope, messageService, storageService) {
	$scope.listType = 'big_list';
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
							this.pubDate =  storedPodcast.pubDate ? formatDate(new Date(storedPodcast.pubDate)) : undefined;
							this.statusClass =  getStatusClass(storedPodcast.status);
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
	$scope.ready = ready;

	$scope.updatePodcastList();

	storageService.loadSyncUIOptions(function(uiOptions) {
		$scope.listType = uiOptions.plt;
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

	function ready() {
		return podcastsLoaded && optionsLoaded;
	}
}]);