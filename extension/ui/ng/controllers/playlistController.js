(function() {
	angular.module('podstationApp').controller('playlistController', ['$scope', 'messageService', 'episodePlayer', 'podcastDataService', PlaylistController]);

	function PlaylistController($scope, messageService, episodePlayer, podcastDataService) {
		var playlist = this;

		playlist.play = play;
		playlist.remove = remove;
		playlist.dragEnded = dragEnded;

		playlist.isVisible = isVisible;
		
		initialize();

		updateList();

		messageService.for('playlist').onMessage('changed', function() {
			updateList();
		});

		// I'm not using episodePlayer.changed at the moment because it 
		// has a single listener, if I do there will be a conflict with 
		// the existing listener.
		messageService.for('audioPlayer').onMessage('changed', function() {
			updateList();
		});

		function initialize() {
			playlist.entries = [];
			playlist.visible = false;
		}

		function updateList() {
			messageService.for('playlist').sendMessage('get', {}, function(response) {
				chrome.runtime.getBackgroundPage(function(bgPage) {
					var playlistEntries = response.entries;

					var episodeContainers = bgPage.podcastManager.getAllEpisodes(function(podcast, episode) {
						return playlistEntries.find(function(entry) {
							return podcastDataService.episodeMatchesId(episode, podcast, entry);
						}) !== undefined;
					});

					var unsortedEntries = episodeContainers.map(function(episodeContainer) {
						return {
							title: episodeContainer.episode.title,
							image: episodeContainer.podcast.image,
							duration: episodeContainer.episode.duration,
							episodeId: podcastDataService.episodeId(episodeContainer.episode, episodeContainer.podcast)
						}; 
					});

					$scope.$apply(function() {
						playlist.visible = response.visible;
					
						// sort entries according to playlistEntries
						playlist.entries = [];

						playlistEntries.forEach(function(entry) {
							var entryForView = unsortedEntries.find(function(unsortedEntry) {
								return podcastDataService.episodeIdEqualsId(entry, unsortedEntry.episodeId);
							});

							// episode was removed from the feed ...
							if(entryForView) {
								playlist.entries.push(entryForView);
							}
						});
					});

					episodePlayer.getAudioInfo(function(audioInfo) {
						if(audioInfo.episodeId) {
							$scope.$apply(function() {
								playlist.entries.forEach(function(entry) {
									entry.isPlaying = podcastDataService.episodeIdEqualsId(entry.episodeId, audioInfo.episodeId);
								});
							});
						}
					});
				});
			});
		}

		function play(playlistEntry) {
			episodePlayer.play(playlistEntry.episodeId);
		}

		function remove(playlistEntry) {
			messageService.for('playlist').sendMessage('remove', {episodeId: playlistEntry.episodeId });
		}

		function dragEnded() {
			// playlist.entries should sufice for the moment
			messageService.for('playlist').sendMessage('set', { 
				entries: playlist.entries.map(function(entry) {
					return entry.episodeId;
				})
			 });
		}

		function isVisible() {
			return playlist.visible;
		}
	}
})();