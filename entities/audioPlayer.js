var audioPlayer;
var episodeInfo;
var playingTimeOutID;

function getAudioTags(callback) {
	new jsmediatags.Reader(audioPlayer.src)
	.setTagsToRead(["PIC", "APIC"])
	.read({
		onSuccess: function(tag) {
			var tags = tag.tags;

			if( "picture" in tags ) {
				var image = tags.picture;
				var base64String = "";
				for (var i = 0; i < image.data.length; i++) {
						base64String += String.fromCharCode(image.data[i]);
				}

				tags.imageDataUrl = "data:" + image.format + ";base64," + window.btoa(base64String);

				callback(tags);
			}
		}
	});
}

function buildAudioInfo() {
	return {
		audio: {
			url: audioPlayer ? audioPlayer.src : '',
			imageUrl: episodeInfo && episodeInfo.audioTags ? episodeInfo.audioTags.imageDataUrl : '',
			currentTime: audioPlayer ? audioPlayer.currentTime : 0,
			duration: audioPlayer ? audioPlayer.duration : 0,
			playbackRate: audioPlayer ? audioPlayer.playbackRate : 1.0
		},
		episode: {
			title: episodeInfo ? episodeInfo.title : ''
		}
	}
}

function playingTimeOut() {
	messageService.for('audioPlayer').sendMessage('playing', { episodePlayerInfo: buildAudioInfo() });

	// recursive timeout to be called 1/second
	playingTimeOutID = window.setTimeout(playingTimeOut, 1000);
}

function pauseTimeOut() {
	if(playingTimeOutID) {
		window.clearTimeout(playingTimeOutID);
		playingTimeOutID = undefined;
	}
}

messageService.for('audioPlayer')
  .onMessage('play', function(messageContent) {
	if(messageContent.episode && messageContent.episode.url &&
		(!audioPlayer || messageContent.episode.url !== audioPlayer.src)) {

		if(audioPlayer) {
			audioPlayer.pause( );
		}
		audioPlayer = new Audio(messageContent.episode.url);
		episodeInfo = messageContent.episode;

		getAudioTags(function(tags) {
			episodeInfo.audioTags = tags;
		});
	}

	audioPlayer.play();

	// if we don't eliminate the timeout first we may have two timeouts
	// running in parallel (play while already playing)
	pauseTimeOut();
	playingTimeOut();

	chrome.browserAction.setBadgeText({
		text: 'I>'
	});
}).onMessage('pause', function() {
	pauseTimeOut();
	audioPlayer.pause();

	messageService.for('audioPlayer').sendMessage('paused');

	chrome.browserAction.setBadgeText({
		text: 'II'
	});
}).onMessage('stop', function() {
	pauseTimeOut();
	audioPlayer.pause();
	audioPlayer = undefined;
	episodeInfo = undefined;

	messageService.for('audioPlayer').sendMessage('stopped');

	chrome.browserAction.setBadgeText({
		text: ''
	});
	
}).onMessage('shiftPlaybackRate', function(messageContent) {
	if(audioPlayer && audioPlayer.playbackRate + messageContent.delta > 0) {
		audioPlayer.playbackRate += messageContent.delta;
	}
}).onMessage('seek', function(messageContent) {
	if(audioPlayer && audioPlayer.duration) {
		audioPlayer.currentTime = messageContent.position * audioPlayer.duration;

		messageService.for('audioPlayer').sendMessage('changed', { episodePlayerInfo: buildAudioInfo() });
	}
}).onMessage('getAudioInfo', function(messageContent, sendResponse) {
	sendResponse(buildAudioInfo());
	return true;
});