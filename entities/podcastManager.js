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

		this.addPodcast = function(url, afterLoad) {
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

					syncPodcastList.push(podcastForSync);

					var podcast = new Podcast(podcastForSync.url);

					that.podcastList.push(podcast);

					podcast.load(afterLoad);

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
			})
		}

		this.updatePodcast = function(url, callback) {
			if(url !== '') {
				var podcast;
				podcast = this.getPodcast(url);

				podcast.update(callback);
			}
			else {
				this.podcastList.forEach(function(podcast) {
					podcast.update(callback);
				});
			}
		}

		this.getPodcast = function(url) {
			var podcast;

			this.podcastList.forEach(function(item) {
				if( item.url === url) {
					podcast = item;
					return false;
				}
			});

			return podcast;
		}

		this.deleteAllPodcasts = function () {
			chrome.storage.sync.set({'syncPodcastList': []});
			this.podcastList.forEach(function(item) {
				item.deleteFromStorage();
			});
			this.podcastList = [];
		}

		this.getAllEpisodes = function() {
			var allEpisodes = [];

			this.podcastList.forEach(function(podcast) {
				podcast.episodes.forEach(function(episode) {
					var episodeContainer = {
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
			});
		};

		loadPodcasts();


	}
})();
