var PodcastManager;

(function(){
	var instance;

	PodcastManager = function() {
		if(instance) {
			return instance;
		}

		this.podcastList = [];

		this.addPodcast = function(url, afterLoad) {
			if(url !== '') {
				var that = this;
				chrome.storage.sync.get('podcastList', function(storageObject) {
					var syncPodcastList;

					if(typeof storageObject.podcastList === "undefined") {
						syncPodcastList = [];
					}
					else {
						syncPodcastList = storageObject.podcastList;
					}

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
						id: syncPodcastList.length + 1,
						url: url
					};

					syncPodcastList.push(podcastForSync);

					chrome.storage.sync.set({'podcastList': syncPodcastList});

					var podcast = new Podcast(podcastForSync.url, podcastForSync.id);

					that.podcastList.push(podcast);

					podcast.load(afterLoad);
				});
			}
		}

		this.deleteAllPodcasts = function () {
			chrome.storage.sync.set({'podcastList': []});
		}

		instance = this;
	}
})();
