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

		function removePodcastInfoFromSync(id) {
			var key = 'P' + id;
			chrome.storage.sync.remove(key);
		}

		chrome.storage.onChanged.addListener(function(changes, areaName) {
			if(areaName === "sync") {
				for(key in changes) {
					if(key.charAt(0) === 'P') {
						messageService.for('podcastManager').sendMessage('podcastSyncInfoChanged');
					}
				}
			}
		});

		var notificationIdLoading = 0;

		function triggerNotifications() {
			var loadingEpisodes = 0;

			instance.podcastList.forEach(function(podcast) {
				if(podcast.isUpdating()) {
					loadingEpisodes++;
				}
			});

			if(loadingEpisodes) {
				notificationIdLoading = notificationManager.updateNotification(notificationIdLoading, {
					icon: 'fa-refresh fa-spin',
					text: chrome.i18n.getMessage('updating_podcasts')
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
				if(syncPodcastInfo.e) {
					var episodeInfo = syncPodcastInfo.e.find(function(item) { return item.i === episodeId });

					callback(episodeInfo);
				}

				return false;
			});
		}

		messageService.for('podcast').onMessage('changed', function() {
			triggerNotifications();
		});

		messageService.for('podcastManager')
		  .onMessage('addPodcasts', function(message) {
			instance.addPodcasts(message.podcasts);
		}).onMessage('setEpisodeInProgress', function(message) {
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
				this.addPodcasts([url]);
			}
		};

		this.addPodcasts = function(urls) {
			if(urls && urls.length) {
				var that = this;
				loadPodcastsFromSync(function(syncPodcastList) {
					var listChanged = false;
					
					urls.forEach(function(url) {
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

						listChanged = true;

						// podcast.load();
					});

					if(listChanged) {
						that.updatePodcast(urls);

						chrome.runtime.sendMessage({
							type: 'podcastListChanged',
						});

						return true;
					}
				});
			}
		};

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
						removePodcastInfoFromSync(item.i);
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
			if(typeof url === "string" && url !== '') {
				var podcast;
				podcast = this.getPodcast(url);

				podcast.update();
			}
			else {
				var podcastIndex;
				var maxConcurrentUpdates = 3;
				var that = this;

				var podcastsToUpdate = Array.isArray(url) ? url : undefined;

				that.podcastList.forEach(function(podcast) {
					if(podcast.isUpdating())
						maxConcurrentUpdates--;	
				});

				if(maxConcurrentUpdates <= 0)
					return;
				
				var podcastUpdate = function() {
					if(podcastIndex >= that.podcastList.length)
						return;

					var jqxhr;

					if(!podcastsToUpdate || podcastsToUpdate.indexOf(that.podcastList[podcastIndex].url) >= 0) {
						jqxhr = that.podcastList[podcastIndex].update();
					}

					if(jqxhr) {
						jqxhr.always(function() {
							podcastIndex++;
							podcastUpdate();
						});
					}
					else {
						// most likely, it is already updating
						// or not selected for update
						setTimeout(function() {
							// we want it to be async because of the loop below
							podcastIndex++;
							podcastUpdate();
						}, 0);
					}
				}

				for(podcastIndex = 0; podcastIndex < maxConcurrentUpdates; podcastIndex++) {
					podcastUpdate();
				}

				// we want it to remain in the last podcastIndex that the look actually processed
				podcastIndex--;
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

		function getEpisodeFromPodcast(currentEpisode, delta, callback) {
			var podcast = instance.getPodcast(currentEpisode.podcastUrl);

			for(var i = 0; i < podcast.episodes.length; i++) {
				if(podcast.episodes[i].guid === currentEpisode.episodeGuid) {
					var indexWithDelta = i + delta;

					if(indexWithDelta >= 0 && indexWithDelta < podcast.episodes.length) {
						callback({
							podcastUrl: currentEpisode.podcastUrl,
							episodeGuid: podcast.episodes[indexWithDelta].guid
						});

						return;
					}
				}
			}
		}

		function getEpisodeFromLastEpisodes(currentEpisode, delta, callback) {
			var allEpisodes = instance.getAllEpisodes();

			for(var i = 0; i < allEpisodes.length; i++) {
				if(allEpisodes[i].podcast.url  === currentEpisode.podcastUrl &&
				   allEpisodes[i].episode.guid === currentEpisode.episodeGuid) {
					var indexWithDelta = i + delta;

					if(indexWithDelta >= 0 && indexWithDelta < allEpisodes.length) {
						callback({
							podcastUrl: allEpisodes[indexWithDelta].podcast.url,
							episodeGuid: allEpisodes[indexWithDelta].episode.guid
						});

						return;
					}
				}
			}
		}

		function getEpisodeFromPlaylist(currentEpisode, delta, callback) {
			messageService.for('playlist').sendMessage('get', {}, function(response) {
				for(var i = 0; i < response.entries.length; i++) {
					if(response.entries[i].podcastUrl  === currentEpisode.podcastUrl &&
					   response.entries[i].episodeGuid === currentEpisode.episodeGuid) {
						
						// The playlist goes backwards, because episodes are ordered by
						// pubdate descending. For the playlist we want the next to go
						// "down" the list, not up.
						var indexWithDelta = i - delta;

						if(indexWithDelta >= 0 && indexWithDelta < response.entries.length) {
							callback({
								podcastUrl:  response.entries[indexWithDelta].podcastUrl,
								episodeGuid: response.entries[indexWithDelta].episodeGuid
							});

							return;
						}
					}
				}

				if(response.entries.length) {
					callback({
						podcastUrl:  response.entries[0].podcastUrl,
						episodeGuid: response.entries[0].episodeGuid
					});
				}
			});
		}

		function getEpisode(order, currentEpisode, delta, callback) {
			switch(order ? order : 'from_last_episodes') {
				case 'from_podcast':
				default:
					getEpisodeFromPodcast(currentEpisode, delta, callback);
					break;
				case 'from_last_episodes':
					getEpisodeFromLastEpisodes(currentEpisode, delta, callback);
					break;
				case 'from_playlist':
					getEpisodeFromPlaylist(currentEpisode, delta, callback);
					break;
			}
		}

		this.getNextOrPreviousEpisode = function(isNext, order, currentEpisode, callback) {
			getEpisode(order, currentEpisode, isNext ? -1 : 1, callback);
		};

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

		this.getAllEpisodes = function(episodesFilter) {
			var allEpisodes = [];

			this.podcastList.forEach(function(podcast, podcastIndex) {
				podcast.episodes.forEach(function(episode) {
					if(episodesFilter && !episodesFilter(podcast, episode))
						return;

					var episodeContainer = {
						podcastIndex: podcastIndex,
						podcast: podcast,
						episode: episode,
						pubDate: new Date(episode.pubDate)
					};

					allEpisodes.push(episodeContainer);
				});
			});

			allEpisodes.sort(function (a, b) { return b.pubDate - a.pubDate; });

			return allEpisodes;
		}

		this.getPodcastIds = function(podcastUrls, callback) {
			loadPodcastsFromSync(function(syncPodcastList) {
				var urlAndIds = syncPodcastList.map(function(syncPodcast) {
					return {
						url: syncPodcast.url,
						id: syncPodcast.i
					};
				});

				if(podcastUrls.length) {
					urlAndIds = urlAndIds.filter(function(urlAndId) { 
						return podcastUrls.indexOf(urlAndId.url) >= 0;
					})
				}

				callback(urlAndIds);
			});
		};

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
