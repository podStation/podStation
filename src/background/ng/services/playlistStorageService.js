/**
 * 
 * @param {browser} browserService 
 */
function playlistStorageService(browserService, storageService, podcastStorageService) {
	var service = {
		add: add,
		remove: remove,
		set: set,
		get: get
	};

	return service;

	/**
	 * Adds one episode to the playlist
	 * @param {EpisodeId} episodeId 
	 */
	function add(episodeId) {
		return podcastStorageService.getPodcastStorageKey(episodeId).then(function(podcastStorageKey) {
			return loadPlaylistFromSync('default', function(syncPlaylist) {
				if(syncPlaylist.e.find(function(entry) {
					return podcastStorageKey === entry.p && (new EpisodeSelector(entry.t, entry.e)).matchesId(episodeId);
				})) {
					return false;
				}

				const episodeSelector = EpisodeSelector.fromId(episodeId);
				const newEntry = {
					p: podcastStorageKey,
					e: episodeSelector.value,
					t: episodeSelector.type
				}

				if(newEntry.t === EpisodeSelector.ABBREVIATED_GUID) {
					delete newEntry.t;
				}
				
				syncPlaylist.e.push(newEntry);

				return syncPlaylist;
			});
		});
	}

	/**
	 * Removes one episode of the playlist
	 */
	function remove(episodeId) {
		return podcastStorageService.getPodcastStorageKey(episodeId).then(function(podcastStorageKey) {
			return loadPlaylistFromSync('default', function(syncPlaylist) {
				syncPlaylist.e = syncPlaylist.e.filter(function(entry) {
					return !(podcastStorageKey === entry.p && (new EpisodeSelector(entry.t, entry.e)).matchesId(episodeId));
				});

				return syncPlaylist;
			});
		});
	}

	/**
	 * 
	 * @param {EpisodeId[]} episodeIds 
	 * @returns {Promise}
	 */
	function set(episodeIds) {
		return podcastStorageService.getEpisodeSelectors(episodeIds).then(function(episodeSelectors) {
			return loadPlaylistFromSync('default', function(syncPlaylist) {
				syncPlaylist.e = episodeSelectors.map(function(episodeSelector) {
					return {
						p: episodeSelector.podcastKey,
						e: episodeSelector.value,
						t: episodeSelector.type !== EpisodeSelector.ABBREVIATED_GUID ? episodeSelector.type : undefined
					}
				});

				return syncPlaylist;
			});
		});
	}

	/** 
	 * @returns {Promise<EpisodeSelector[]>}
	*/
	function get() {
		return loadPlaylistFromSync('default').then(function(syncPlaylist) {
			return podcastStorageService.getUrlsFromKeys(syncPlaylist.e.map(function(entry) {return entry.p})).then(function(urls) {
				return syncPlaylist.e.map(function(entry, index) {
					return new EpisodeSelector(entry.t, entry.e, urls[index]);
				}).filter(function(episodeSelector) {
					// If it does not have podcastUrl, it may be a leftover of
					// a deleted podcast, thus we omit it.
					return episodeSelector.podcastUrl;
				});
			});
		});
	}

	/**
	 * Load playlist data from sync storage
	 * @param {string} playlistId - Playlist Id
	 * @param {loadedCallback} loaded
	 * @returns {Promise}
	 */
	function loadPlaylistFromSync(playlistId, loaded) {
		var playlistStorageObjectName = 'pl_' + playlistId;

		return storageService.loadFromStorage(playlistStorageObjectName, loaded, 'sync', function() {return {e: []}});
	}

	/**
	 * Called with the storage content of the playlist
	 * @callback loadedCallback
	 * @param {Object} content
	 * @returns {Object} Return an object if you want to save it to storage
	 */
}

export default playlistStorageService;