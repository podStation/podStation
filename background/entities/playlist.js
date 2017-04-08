angular.module('podstationBackgroundApp').factory('playlist', ['messageService', '$log', 'browser', function(messageService, $log, browserService) {
	var playlist = {};

	playlist.visible = false;

	playlist.add = add;
	playlist.remove = remove;
	playlist.set = set;
	playlist.get = get;

	messageService.for('playlist')
	  .onMessage('add', function(message) {
		playlist.add(message.podcastUrl, message.episodeGuid);
	}).onMessage('remove', function(message) {
		playlist.remove(message.podcastUrl, message.episodeGuid);
	}).onMessage('set', function(message) {
		playlist.set(message);
	}).onMessage('get', function(message, sendResponse) {
		playlist.get(function(playlistData) {
			sendResponse(playlistData);
		});
		return true;
	}).onMessage('toggleVisibility', function() {
		playlist.visible = !playlist.visible;
		messageService.for('playlist').sendMessage('changed');
	});

	$log.debug('playlist handler created');

	return playlist;

	function add(podcastUrl, episodeGuid) {
		window.podcastManager.getPodcastIds([podcastUrl], function(podcastIds) {
			if(!podcastIds.length)
				return;
			
			loadPlaylistFromSync('default', function(syncPlaylist) {
				if(syncPlaylist.e.find(function(entry) {
					return entry.p === podcastIds[0].id &&
					       entry.e === episodeGuid;
				})) {
					return false;
				}
				
				syncPlaylist.e.push({
					p: podcastIds[0].id,
					e: episodeGuid
				});

				// force visible when something is added
				playlist.visible = true;

				messageService.for('playlist').sendMessage('changed');
				
				return true;
			});
		});
	}

	function remove(podcastUrl, episodeGuid) {
		window.podcastManager.getPodcastIds([podcastUrl], function(podcastIds) {
			if(!podcastIds.length)
				return;
			
			loadPlaylistFromSync('default', function(syncPlaylist) {
				syncPlaylist.e = syncPlaylist.e.filter(function(entry) {
					return !(entry.p === podcastIds[0].id && entry.e === episodeGuid);
				});

				messageService.for('playlist').sendMessage('changed');
				
				return true;
			});
		});
	}

	function set(playlistData) {	
		window.podcastManager.getPodcastIds([], function(podcastIds) {
			loadPlaylistFromSync('default', function(syncPlaylist) {
				
				syncPlaylist.e = playlistData.entries.map(function(entry) {
					podcastUrlAndId = podcastIds.find(function(item) { return item.url === entry.podcastUrl });
					
					return {
						p: podcastUrlAndId.id,
						e: entry.episodeGuid
					};
				});

				// we have to wait until it is saved
				setTimeout(function() {
					messageService.for('playlist').sendMessage('changed');
				}, 1);

				return true;
			});
		});
	}

	function get(callback) {
		loadPlaylistFromSync('default', function(syncPlaylist) {
			window.podcastManager.getPodcastIds([], function(podcastIds) {
				var playlistData = {};

				playlistData.visible = playlist.visible;

				playlistData.entries = syncPlaylist.e.map(function(syncEntry) {
					podcastUrlAndId = podcastIds.find(function(item) { return item.id === syncEntry.p });
					
					// undefined podcastUrlAndId can mean the podcast was removed
					return podcastUrlAndId ? {
						podcastUrl: podcastUrlAndId.url,
						episodeGuid: syncEntry.e
					} : {};
				}).filter(function(entry) {
					return entry.podcastUrl !== undefined;
				});

				callback(playlistData);
			});
		});
	}

	function loadPlaylistFromSync(playlistId, loaded) {
		var playlistStorageObjectName = 'pl_' + playlistId;
		
		browserService.storage.sync.get(playlistStorageObjectName, function(storageObject) {
			var syncPlaylist;

			if(typeof storageObject[playlistStorageObjectName] === "undefined") {
				syncPlaylist = {
					e: [] // list of playlist entries
				};
			}
			else {
				syncPlaylist = storageObject[playlistStorageObjectName];
			}

			if( loaded(syncPlaylist) ) {
				var newStorageObject = {};
				newStorageObject[playlistStorageObjectName] = syncPlaylist;
				browserService.storage.sync.set(newStorageObject);
			}
		});
	}
}]);