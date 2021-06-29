function playlistService($log, $q, $injector, messageService, podcastDataService, playlistStorageService, browserService) {
	var playlist = {};

	playlist.visible = false;

	playlist.add = add;
	playlist.remove = remove;
	playlist.set = set;
	playlist.get = get;

	messageService.for('playlist')
		.onMessage('add', function(message) {
		playlist.add(message.episodeId);
	}).onMessage('remove', function(message) {
		playlist.remove(message.episodeId);
	}).onMessage('set', function(message) {
		playlist.set(message.entries);
	}).onMessage('get', function(message, sendResponse) {
		playlist.get().then(function(episodeIds) {
			sendResponse({
				visible: playlist.visible,
				entries: episodeIds
			});
		});
		return true;
	}).onMessage('toggleVisibility', function() {
		playlist.visible = !playlist.visible;
		messageService.for('playlist').sendMessage('changed');
	});

	$log.debug('playlist handler created');

	return playlist;

	/**
	 * Adds an episode to the bottom of the playlist
	 * @param {EpisodeId} episodeId 
	 */
	function add(episodeId) {
		playlistStorageService.add(episodeId).then(function() {
			// force visible when something is added
			playlist.visible = true;
			messageService.for('playlist').sendMessage('changed');
		})
	}

	/**
	 * Deletes the episode represented by episodeId from the playlist
	 * @param {EpisodeId} episodeId 
	 */
	function remove(episodeId) {
		playlistStorageService.remove(episodeId).then(function() {
			messageService.for('playlist').sendMessage('changed');
		});
	}

	/**
	 * Sets the whole playlist based on a list of episodes represented by
	 * their respective episode ids
	 * @param {EpisodeId[]} episodeIds 
	 */
	function set(episodeIds) {
		return playlistStorageService.set(episodeIds).then(function() {
			messageService.for('playlist').sendMessage('changed');
		});
	}

	/** 
	 * Gets the entire playlist
	 * @return {Promise<EpisodeId[]>}
	 */
	function get() {
		return playlistStorageService.get().then(function(episodeSelectors) {
			// Delay the dependency with the podcastManager
			return $injector.get('podcastManager').getEpisodeIds(episodeSelectors);
		});
	}
}

export default playlistService;