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

				loaded(syncPodcastList);
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

					chrome.storage.sync.set({'syncPodcastList': syncPodcastList});

					var podcast = new Podcast(podcastForSync.url);

					that.podcastList.push(podcast);

					podcast.load(afterLoad);
				});
			}
		}

		this.deleteAllPodcasts = function () {
			chrome.storage.sync.set({'syncPodcastList': []});
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
