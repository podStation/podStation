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

		function loadPodcastInfoFromSync(url, loaded) {
			loadPodcastsFromSync(function(syncPodcastList) {
				var syncPodcast = syncPodcastList.find(function(item) { return item.url === url });

				if(!syncPodcast) {
					return false;
				}
			
				var key = 'P' + syncPodcast.i;

				chrome.storage.sync.get(key, function(storageObject) {
					var syncPodcastInfo;

					if(typeof storageObject[key] === "undefined") {
						syncPodcastInfo = {};
					}
					else {
						syncPodcastInfo = storageObject[key];
					}

					if( loaded(syncPodcastInfo) ) {
						var newStorageObject = {};
						newStorageObject[key] = syncPodcastInfo;
						chrome.storage.sync.set(newStorageObject);
					}
				});
				
				return false;
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

		// to save sync data, we need a criteria to remove episode data
		function storedEpisodeListCleanUp(storedEpisodeList) {
			return storedEpisodeList.filter(function(storedEpisode) {
				return storedEpisode.t > 0;
			});
		}

		function setEpisodeInProgress(url, episodeId, currentTime) {
			loadPodcastInfoFromSync(url, function(syncPodcastInfo) {
				if(!syncPodcastInfo.e) {
					syncPodcastInfo.e = [];
				}

				var episodeInfo = syncPodcastInfo.e.find(function(item) { return item.i === episodeId });

				if(!episodeInfo) {
					var newLenght = syncPodcastInfo.e.push({i: episodeId});
					episodeInfo = syncPodcastInfo.e[newLenght - 1];
				}

				episodeInfo.t = Math.floor(currentTime);
				// the date object does not seem to be properly serialized
				episodeInfo.l = JSON.parse(JSON.stringify(new Date()));

				syncPodcastInfo.e = storedEpisodeListCleanUp(syncPodcastInfo.e);

				return true;
			});
		}

		function getStoredEpisodeInfo(url, episodeId, callback) {
			loadPodcastInfoFromSync(url, function(syncPodcastInfo) {
				var episodeInfo = syncPodcastInfo.e.find(function(item) { return item.i === episodeId });

				callback(episodeInfo);

				return false;
			});
		}

		messageService.for('podcast').onMessage('changed', function() {
			triggerNotifications();
		});

		messageService.for('podcastManager')
		  .onMessage('setEpisodeInProgress', function(message) {
			setEpisodeInProgress(message.url, message.episodeId, message.currentTime);
		}).onMessage('getEpisodeProgress', function(message, sendResponse) {
			getStoredEpisodeInfo(message.url, message.episodeId, function(storedEpisodeInfo) {
				sendResponse(storedEpisodeInfo ? storedEpisodeInfo.t : -1);
			});
			return true;
		}).onMessage('getSyncPodcastInfo', function(message, sendResponse) {
			loadPodcastInfoFromSync(message.url, function(syncPodcastInfo) {

				if(!syncPodcastInfo.e) {
					syncPodcastInfo.e = [];
				}

				sendResponse(syncPodcastInfo);

				return false;
			});
			return true;
		});

		function findNextFreeId(syncPodcastList) {
			var idList = [];

			idList = syncPodcastList.map(function(item) { return item.i });

			if(!idList.length) {
				return 1;
			}

			idList.sort(function(a, b){return a-b});

			if(idList[0] > 1) {
				return 1;
			}

			for(var i = 0; i < (idList.length - 1); i++) {
				if(idList[i] + 1 !== idList[i+1]) {
					// gap found, reuse id
					return idList[i] + 1;
				}
			}

			return idList[idList.length-1] + 1;
		}

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
						url: url,
						i: findNextFreeId(syncPodcastList)
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

		function assignIdsInSyncStorage() {
			loadPodcastsFromSync(function(syncPodcastList) {
				if(syncPodcastList.length > 0 && syncPodcastList[0].i) {
					// ids were already assigned
					return false;
				}

				var nextId = 1;

				syncPodcastList.forEach(function(storedPodcast) {
					storedPodcast.i = nextId;
					nextId++;
				});

				return true;
			});
		}

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

		// this should only take effect once, when filling the ids
		// of old stored data
		assignIdsInSyncStorage();

		loadPodcasts();
	}
})();
