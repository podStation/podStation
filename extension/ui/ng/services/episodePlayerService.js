'use strict';

(function() {
angular.module('podstationApp').factory('episodePlayer', ['messageService', function(messageService) {
	var episodePlayer = {
		play: play
	};

	episodePlayer.refresh = function() {
		messageService.for('audioPlayer').sendMessage('refresh');
	};

	/**
	 * @param {EpisodeId} episodeId 
	 */
	function play(episodeId) {
		messageService.for('audioPlayer').sendMessage('play', {
			episodeId: episodeId
		});
	};

	episodePlayer.playNext = function() {
		messageService.for('audioPlayer').sendMessage('playNext');
	};

	episodePlayer.playPrevious = function() {
		messageService.for('audioPlayer').sendMessage('playPrevious');
	};

	episodePlayer.pause = function() {
		messageService.for('audioPlayer').sendMessage('pause');
	};

	episodePlayer.togglePlayPause = function () {
		messageService.for('audioPlayer').sendMessage('togglePlayPause');
	};

	episodePlayer.stop = function() {
		messageService.for('audioPlayer').sendMessage('stop');
	};

	episodePlayer.seek = function(position) {
		messageService.for('audioPlayer').sendMessage('seek', {
			position: position
		});
	};

	episodePlayer.forward = function() {
		messageService.for('audioPlayer').sendMessage('forward');
	};

	episodePlayer.backward = function() {
		messageService.for('audioPlayer').sendMessage('backward');
	};

	episodePlayer.shiftPlaybackRate = function(delta) {
		messageService.for('audioPlayer').sendMessage('shiftPlaybackRate', {
			delta: delta
		});
	};

	episodePlayer.setVolume = function(value) {
		messageService.for('audioPlayer').sendMessage('setVolume', {
			value: value
		});
	};

	episodePlayer.getAudioInfo = function(callback) {
		messageService.for('audioPlayer').sendMessage('getAudioInfo', {}, function(response) {
			callback(response);
		});
	};

	episodePlayer.setOptions = function(options) {
		messageService.for('audioPlayer').sendMessage('setOptions', options);
	};

	episodePlayer.getOptions = function(callback) {
		messageService.for('audioPlayer').sendMessage('getOptions', {}, function(response) {
			callback(response);
		});
	};

	episodePlayer.playing = function(playingCallback) {
		episodePlayer.playingCallback = playingCallback;
	};

	episodePlayer.paused = function(pausedCallback) {
		episodePlayer.pausedCallback = pausedCallback;
	};

	episodePlayer.stopped = function(stoppedCallback) {
		episodePlayer.stoppedCallback = stoppedCallback;
	};

	episodePlayer.changed = function(changedCallback) {
		episodePlayer.changedCallback = changedCallback;
	};

	episodePlayer.optionsChanged = function(optionsChangedCallback) {
		episodePlayer.optionsChangedCallback = optionsChangedCallback;
	};

	messageService.for('audioPlayer')
	  .onMessage('playing', function(messageContent) {
		if(episodePlayer.playingCallback) {
			episodePlayer.playingCallback(messageContent.episodePlayerInfo)
		}
	}).onMessage('paused', function() {
		if(episodePlayer.pausedCallback) {
			episodePlayer.pausedCallback()
		}
	}).onMessage('stopped', function() {
		if(episodePlayer.stoppedCallback) {
			episodePlayer.stoppedCallback()
		}
	}).onMessage('changed', function(message) {
		if(episodePlayer.changedCallback) {
			episodePlayer.changedCallback(message.episodePlayerInfo)
		}
	}).onMessage('optionsChanged', function(message) {
		if(episodePlayer.optionsChangedCallback) {
			episodePlayer.optionsChangedCallback(message)
		}
	});

	return episodePlayer;
}]);
})();