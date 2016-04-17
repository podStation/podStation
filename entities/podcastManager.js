var PodcastManager;

(function(){
	var instance;

	PodcastManager = function() {
		if(instance) {
			return instance;
		}

		this.podcastList = [];

		function loadPodcastsFromSync(loaded) {
			chrome.storage.sync.get('syncPodcastList', function(storageObject) {
				var syncPodcastList;

				if(typeof storageObject.syncPodcastList === "undefined") {
					syncPodcastList = [];
				}
				else {
					syncPodcastList = storageObject.syncPodcastList;
				}

				if( loaded(syncPodcastList) ) {
					chrome.storage.sync.set({'syncPodcastList': syncPodcastList});
				}
			});
		};

		var notificationIdLoading = 0;

		function triggerNotifications() {
			var loadingEpisodes = 0;

			instance.podcastList.forEach(function(podcast) {
				if(podcast.status === 'updating') {
					loadingEpisodes++;
				}
			});

			if(loadingEpisodes) {
				notificationIdLoading = notificationManager.updateNotification(notificationIdLoading, {
					icon: 'fa-refresh fa-spin',
					text: 'Updating ' + loadingEpisodes + ' podcast(s)...'
				});
			}
			else {
				if(notificationIdLoading) {
					notificationManager.removeNotification(notificationIdLoading);
					notificationIdLoading = 0;
				}
			}
		}

		messageService.for('podcast').onMessage('changed', function() {
			triggerNotifications();
		});

		this.addPodcast = function(url) {
			if(url !== '') {
				var that = this;
				loadPodcastsFromSync(function(syncPodcastList) {
					var podcastExistInStorage = false;
					syncPodcastList.forEach(function(podcast) {
						if(podcast.url && podcast.url === url) {
							podcastExistInStorage = true;
						}
					});

					if(podcastExistInStorage) {
						return;
					}

					var podcastForSync = {
						url: url
					};

					syncPodcastList.unshift(podcastForSync);

					var podcast = new Podcast(podcastForSync.url);

					that.podcastList.unshift(podcast);

					podcast.load();

					chrome.runtime.sendMessage({
						type: 'podcastListChanged',
					});

					return true;
				});
			}
		}

		this.deletePodcast = function(url) {
			var that = this;
			this.podcastList.forEach(function(item) {
				if( item.url === url) {
					item.deleteFromStorage();
					that.podcastList.splice(that.podcastList.indexOf(item), 1);
					return false;
				}
			});

			loadPodcastsFromSync(function(syncPodcastList) {
				syncPodcastList.forEach(function(item) {
					if( item.url === url) {
						syncPodcastList.splice(syncPodcastList.indexOf(item), 1);
						return false;
					}
				});

				return true;
			});

			chrome.runtime.sendMessage({
				type: 'podcastListChanged',
			});
		}

		this.updatePodcast = function(url) {
			if(url && url !== '') {
				var podcast;
				podcast = this.getPodcast(url);

				podcast.update();
			}
			else {
				this.podcastList.forEach(function(podcast) {
					podcast.update();
				});
			}
		}

		this.getPodcast = function(urlOrIndex) {
			var podcast;

			if(typeof urlOrIndex === "string") {
				this.podcastList.forEach(function(item) {
					if( item.url === urlOrIndex) {
						podcast = item;
						return undefined;
					}
				});
			}
			else {
				podcast = this.podcastList[urlOrIndex];
			}

			return podcast;
		}

		this.deleteAllPodcasts = function () {
			chrome.storage.sync.set({'syncPodcastList': []});
			this.podcastList.forEach(function(item) {
				item.deleteFromStorage();
			});
			this.podcastList = [];

			chrome.runtime.sendMessage({
				type: 'podcastListChanged',
			});
		}

		this.getAllEpisodes = function() {
			var allEpisodes = [];

			this.podcastList.forEach(function(podcast, podcastIndex) {
				podcast.episodes.forEach(function(episode) {
					var episodeContainer = {
						podcastIndex: podcastIndex,
						podcast: podcast,
						episode: episode,
						pubDate: episode.pubDate // to facilitate reuse of sorting function
					};

					allEpisodes.push(episodeContainer);
				})
			});

			allEpisodes.sort(byPubDateDescending);

			return allEpisodes;
		}

		instance = this;

		loadPodcasts = function() {
			loadPodcastsFromSync(function(syncPodcastList) {
				syncPodcastList.forEach(function(storedPodcast) {
					var podcast = new Podcast(storedPodcast.url);

					instance.podcastList.push(podcast);

					podcast.load();
				});

				chrome.runtime.sendMessage({
					type: 'podcastListChanged',
				});
			});
		};

		loadPodcasts();


	}
})();
