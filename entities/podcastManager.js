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
			this.podcastList.forEach(function(item) {
				if( item.url === url) {
					item.update(callback);
					return false;
				}
			});
		}

		this.deleteAllPodcasts = function () {
			chrome.storage.sync.set({'syncPodcastList': []});
			this.podcastList.forEach(function(item) {
				item.deleteFromStorage();
			});
			this.podcastList = [];
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
