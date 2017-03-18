angular.module('podstationBackgroundApp').factory('playlist', ['messageService', '$log', 'browser', function(messageService, $log, browserService) {
	var playlist = {};

	playlist.visible = false;

	playlist.add = add;
	playlist.remove = remove;
	playlist.get = get;

	messageService.for('playlist')
	  .onMessage('add', function(message) {
		playlist.add(message.podcastUrl, message.episodeGuid);
	}).onMessage('remove', function(message) {
		playlist.remove(message.podcastUrl, message.episodeGuid);
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

	function get(callback) {
		loadPlaylistFromSync('default', function(syncPlaylist) {
			window.podcastManager.getPodcastIds([], function(podcastIds) {
				var playlistData = {};

				playlistData.visible = playlist.visible;

				playlistData.entries = syncPlaylist.e.map(function(syncEntry) {
					podcastUrlAndId = podcastIds.find(function(item) { return item.id === syncEntry.p });
					
					return {
						podcastUrl: podcastUrlAndId.url,
						episodeGuid: syncEntry.e
					};
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