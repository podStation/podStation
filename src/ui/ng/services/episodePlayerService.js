import PodStationEvent from "../../../reuse/event";
import ChromeExtensionMessageService from "../../../reuse/messageServiceDefinition";

/**
 * 
 * @param {ChromeExtensionMessageService} messageService 
 * @returns 
 */
function episodePlayerService(messageService) {
	var episodePlayer = {
		play: play
	};

	episodePlayer.removeListeners = removeListeners;

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

	episodePlayer.onPlaying = new PodStationEvent();
	episodePlayer.onPaused = new PodStationEvent();
	episodePlayer.onStopped = new PodStationEvent();
	episodePlayer.onChanged = new PodStationEvent();
	episodePlayer.onOptionsChanged = new PodStationEvent();

	messageService.for('audioPlayer')
	  .onMessage('playing', (message)        => episodePlayer.onPlaying.notify(message.episodePlayerInfo))
	  .onMessage('paused',  ()               => episodePlayer.onPaused.notify())
	  .onMessage('stopped', ()               => episodePlayer.onStopped.notify())
	  .onMessage('changed', (message)        => episodePlayer.onChanged.notify(message.episodePlayerInfo))
	  .onMessage('optionsChanged', (message) => episodePlayer.onOptionsChanged.notify(message));

	return episodePlayer;

	function removeListeners(group) {
		episodePlayer.onPlaying.removeListeners(group);
		episodePlayer.onPaused.removeListeners(group);
		episodePlayer.onStopped.removeListeners(group);
		episodePlayer.onChanged.removeListeners(group);
		episodePlayer.onOptionsChanged.removeListeners(group);
	}
}

export default episodePlayerService;