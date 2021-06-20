/**
 * @param {browser} browserService 
 */
function podcastStorageService($q, messageService, storageService, browserService, dateService) {
	const service = {
		getPodcastStorageKey: getPodcastStorageKey,
		storePodcastsByFeedUrls: storePodcastsByFeedUrls,
		deletePodcastsByFeedUrl: deletePodcastsByFeedUrl,
		getStoredPodcasts: getStoredPodcasts,
		storeEpisodeUserData: storeEpisodeUserData,
		getEpisodeUserData: getEpisodeUserData,
		getAllEpisodesUserData: getAllEpisodesUserData,
		getEpisodeSelectors: getEpisodeSelectors,
		getUrlsFromKeys: getUrlsFromKeys
	};

	// Broadcast changes in a single podcast storage
	browserService.storage.onChanged.addListener(function(changes, areaName) {
		if(areaName === 'sync') {
			for(var key in changes) {
				if(key.charAt(0) === 'P') {
					messageService.for('podcastManager').sendMessage('podcastSyncInfoChanged');
				}
			}
		}
	});

	assignIdsInSyncStorage();

	return service;

	/** 
	 * @param {Array.<string>} feedUrls
	 * @return {Promise}
	*/
	function storePodcastsByFeedUrls(feedUrls) {
		var deferred = $q.defer();

		if(feedUrls && feedUrls.length) {

			var addedFeedUrls = [];
			
			loadPodcastsFromSync(function(syncPodcastList) {
				feedUrls.forEach(function(url) {
					var podcastExistInStorage = false;
					
					if(syncPodcastList.find(function(podcast) {return podcast.url === url})) {
						return;
					}

					var podcastForSync = {
						url: url,
						i: findNextFreeId(syncPodcastList)
					};

					syncPodcastList.unshift(podcastForSync);

					addedFeedUrls.push(url);
				});

				if(addedFeedUrls.length) {
					return syncPodcastList;
				}
			}).then(function() {
				deferred.resolve(addedFeedUrls);
			});
		}

		return deferred.promise;
	}

	/**
	 * 
	 * @param {string} feedUrl 
	 */
	function deletePodcastsByFeedUrl(feedUrl) {
		return loadPodcastsFromSync(function(syncPodcastList) {
			syncPodcastList.forEach(function(item) {
				if(item.url === feedUrl) {
					removePodcastInfoFromSync(item.i);
					syncPodcastList.splice(syncPodcastList.indexOf(item), 1);
					return false;
				}
			});

			return syncPodcastList;
		});
	}

	function getStoredPodcasts() {
		return loadPodcastsFromSync();
	}

	/**
	 * 
	 * @param {PodcastSyncStorageKey} podcastSyncStorageKey
	 * @returns {Promise<PodcastSyncUserDataStorage>}
	 */
	function getPodcastUserData(podcastSyncStorageKey) {
		return loadPodcastInfoFromSync(podcastSyncStorageKey);
	}

	/**
	 * @param {EpisodeUserDataStorageItem} episodeUserDataStorageItem
	 * @returns {EpisodeUserData}
	 */
	function episodeUserDataFromStorage(episodeUserDataStorageItem) {
		return {
			currentTime: episodeUserDataStorageItem.t,
			lastTimePlayed: new Date(episodeUserDataStorageItem.l)
		}
	}

	/**
	 * Gets episode(s) info that are stored 
	 * @param {EpisodeId} episodeId
	 * @returns {Promise<EpisodeUserData>}
	 */
	function getEpisodeUserData(episodeId) {
		return loadPodcastInfoFromSync(episodeId.values.podcastUrl).then(function(podcastSyncInfo) {
			var syncEpisodeInfo = findEpisodeUserData(episodeId, podcastSyncInfo);

			if(syncEpisodeInfo) {
				return episodeUserDataFromStorage(syncEpisodeInfo);
			}
			
			return {};
		});
	}

	/**
	 * @returns {Promise<{episodeSelector: EpisodeSelector, episodeUserData: EpisodeUserData}>}
	 */
	function getAllEpisodesUserData() {
		return loadPodcastsFromSync().then(function(result) {
			const promises = result.map(function(podcastSyncStorageItem) {
				return loadPodcastInfoFromSync(podcastSyncStorageItem.i).then(function(podcastSyncUserDataStorage) {
					return podcastSyncUserDataStorage.e ? podcastSyncUserDataStorage.e.map(function (item) {
						return {
							episodeSelector: new EpisodeSelector(item.s, item.i, podcastSyncStorageItem.url),
							episodeUserData: episodeUserDataFromStorage(item)
						};
					}) : [];
				}); 
			});

			return $q.all(promises).then(function(results) {
				return results.reduce(function(accumulator, currentValue) {
					return accumulator.concat(currentValue);
				});
			});
		});
	}

	/**
	 * @param {EpisodeId} episodeId
	 * @param {EpisodeUserData} episodeUserData
	 */
	function storeEpisodeUserData(episodeId, episodeUserData) {
		return loadPodcastInfoFromSync(episodeId.values.podcastUrl, function(syncPodcastInfo) {
			if(!syncPodcastInfo.e) {
				syncPodcastInfo.e = [];
			}

			var episodeInfo = findEpisodeUserData(episodeId, syncPodcastInfo);

			if(!episodeInfo) {
				const episodeSelector = EpisodeSelector.fromId(episodeId);
				const newEntry = {i: episodeSelector.value, s: episodeSelector.type};
				
				if(newEntry.s === 'g') {
					delete newEntry.s;
				}
				
				var newLenght = syncPodcastInfo.e.push(newEntry);
				
				episodeInfo = syncPodcastInfo.e[newLenght - 1];
			}

			if(typeof episodeUserData.currentTime !== 'undefined') {
				episodeInfo.t = Math.floor(episodeUserData.currentTime);
				// the date object does not seem to be properly serialized
				episodeInfo.l = JSON.parse(JSON.stringify(dateService.now()));
			}

			syncPodcastInfo.e = storedEpisodeListCleanUp(syncPodcastInfo.e);

			return syncPodcastInfo;
		});
	}

	/**
	 *  to save sync data, we need a criteria to remove episode data
	 */
	function storedEpisodeListCleanUp(storedEpisodeList) {
		return storedEpisodeList.filter(function(storedEpisode) {
			return storedEpisode.t > 0;
		});
	}

	/**
	 * 
	 * @param {EpisodeId} episodeId 
	 * @returns {Promise<PodcastStorageKey>}
	 */
	function getPodcastStorageKey(episodeId) {
		const deferred = $q.defer();
		
		getPodcastStorageKeys([episodeId.values.podcastUrl], function(result) {
			deferred.resolve(result[0].key);
		});

		return deferred.promise;
	}
	
	/**
	 * Get podcast storage keys for a list of podcast urls
	 * @param {string|Array} podcastUrls 
	 * @param {function} callback callback to be called with the result
	 */
	function getPodcastStorageKeys(podcastUrls, callback) {
		loadPodcastsFromSync(function(syncPodcastList) {
			var urlAndIds = syncPodcastList.map(function(syncPodcast) {
				return {
					url: syncPodcast.url,
					key: syncPodcast.i
				};
			});

			if(podcastUrls.length) {
				urlAndIds = urlAndIds.filter(function(urlAndId) { 
					return podcastUrls.indexOf(urlAndId.url) >= 0;
				})
			}

			callback(urlAndIds);
		});
	}

	/**
	 * @param {EpisodeId[]} episodeIds 
	 * @returns {Promise<EpisodeSelector[]>}
	 */
	function getEpisodeSelectors(episodeIds) {
		return loadPodcastsFromSync().then(function(syncPodcasts) {
			const podcastKeys = {};

			syncPodcasts.forEach(function (syncPodcast) {
				podcastKeys[syncPodcast.url] = syncPodcast.i;
			});

			return episodeIds.map(function(episodeId) {
				const episodeSelector = EpisodeSelector.fromId(episodeId, podcastKeys[episodeId.values.podcastUrl]);
				return episodeSelector;
			});
		});
	}

	/**
	 * 
	 * @param {PodcastSyncStorageKey[]} keys 
	 * @returns {Promise<string[]>}
	 */
	function getUrlsFromKeys(keys) {
		return loadPodcastsFromSync().then(function(syncPodcasts) {
			const podcastUrls = {};

			syncPodcasts.forEach(function (syncPodcast) {
				podcastUrls[syncPodcast.i] = syncPodcast.url;
			});

			return keys.map(function(key) { return podcastUrls[key]});
		});
	}

	/**
	 * 
	 * @param {EpisodeId} episodeId 
	 * @param {*} podcastSyncInfo 
	 * @returns {Promise<EpisodeUserData>}
	 */
	function findEpisodeUserData(episodeId, podcastSyncInfo) {
		return podcastSyncInfo.e && podcastSyncInfo.e.find(function(item) { 
			return new EpisodeSelector(item.s, item.i).matchesId(episodeId);
		});
	}

	/**
	 * Find next available storage key for a podcast
	 * @param {Array} syncPodcastList existing podcast storage list
	 * @returns {PodcastSyncStorageKey} Next available storage key
	 */
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

	/**
	 * Loads podcasts list from sync storage
	 * @param {LoadPodcastsFromSyncCallback} loaded
	 * @returns {Promise<PodcastSyncStorageItem[]>}
	 */
	function loadPodcastsFromSync(loaded) {
		return storageService.loadFromStorage('syncPodcastList', loaded, 'sync', function() {return []});
	};

	/**
	 * Loads a single podcast info from sync storage
	 * @param {(PodcastId|PodcastSyncStorageKey)} url 
	 * @param {LoadPodcastInfoFromSyncCallback} loaded 
	 * @returns {Promise<PodcastSyncUserDataStorage>}
	 */
	function loadPodcastInfoFromSync(url, loaded) {
		if(typeof url === 'string') {
			return loadPodcastsFromSync().then(function(syncPodcastList) {
				var syncPodcast = syncPodcastList.find(function(item) { return item.url === url });

				if(!syncPodcast) {
					return false;
				}
			
				var key = 'P' + syncPodcast.i;
				
				return storageService.loadFromStorage(key, loaded, 'sync', function() {return {}});
			});
		}
		else {
			var key = 'P' + url;
			return storageService.loadFromStorage(key, loaded, 'sync', function() {return {}});
		}
	};

	/**
	 * 
	 * @param {PodcastSyncStorageKey} key 
	 */
	function removePodcastInfoFromSync(key) {
		var fullKey = 'P' + key;
		browserService.storage.sync.remove(fullKey);
	}

	/** 
	 * Assigns initial ids in existing podcast list storage.
	 * Only relevant to update the old list of podcasts in storage
	 * and kept here for historical reasons, it is not expected
	 * to be effected at current time.
	 */
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

			return syncPodcastList;
		});
	}

	/**
	 * @callback LoadPodcastsFromSyncCallback
	 * @param {Array} result List of podcasts from sync storage
	 * @returns {Array} if not false, list of podcasts to store in sync storage
	 */
}

/**
 * @typedef {Number} PodcastSyncStorageKey
 */

/**
 * @typedef {Object} PodcastSyncStorageItem
 * @property {PodcastSyncStorageKey} i
 * @property {String} url
 */

/**
 * @typedef {Object} PodcastSyncUserDataStorage
 * @property {EpisodeUserDataStorageItem[]} e
 */

 /**
  * @typedef {Object} EpisodeUserDataStorageItem
  * @property {String} s Selector type
  * @property {String} i Selector value
  * @property {Number} t Current time
  * @property {String} l Last time played
  */

 /**
 * Information that refers to an episode, but belongs to the user
 * @typedef {Object} EpisodeUserData
 * @property {number} currentTime
 * @property {Date} lastTimePlayed
 */

 export default podcastStorageService;