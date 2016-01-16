var audioPlayer;
var episodeInfo;
var playingTimeOutID;

function getAudioTags(callback) {
	ID3.loadTags(audioPlayer.src, function() {
		var tags = ID3.getAllTags(audioPlayer.src);

		if( "picture" in tags ) {
			var image = tags.picture;
			var base64String = "";
			for (var i = 0; i < image.data.length; i++) {
					base64String += String.fromCharCode(image.data[i]);
			}

			tags.imageDataUrl = "data:" + image.format + ";base64," + window.btoa(base64String);

			callback(tags);
		}
	}, {
		tags: ["artist", "title", "album", "year", "picture"]
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
	chrome.runtime.sendMessage({
		type: 'episodePlayer.playing',
		episodePlayerInfo: buildAudioInfo()
	});

	// recursive timeout to be called 1/second
	playingTimeOutID = window.setTimeout(playingTimeOut, 1000);
}

function pauseTimeOut() {
	if(playingTimeOutID) {
		window.clearTimeout(playingTimeOutID);
		playingTimeOutID = undefined;
	}
}

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
	if(!message.type) {
		return;
	}

	switch(message.type) {
		case 'episodePlayer.play':
			if(message.episode && message.episode.url &&
			   (!audioPlayer || message.episode.url !== audioPlayer.src)) {

				if(audioPlayer) {
					audioPlayer.pause( );
				}
				audioPlayer = new Audio(message.episode.url);
				episodeInfo = message.episode;

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
			break;
		case 'episodePlayer.pause':
			pauseTimeOut();
			audioPlayer.pause();

			chrome.runtime.sendMessage({
				type: 'episodePlayer.paused',
			});

			chrome.browserAction.setBadgeText({
				text: 'II'
			});
			break;
		case 'episodePlayer.stop':
			pauseTimeOut();
			audioPlayer.pause();
			audioPlayer = undefined;
			episodeInfo = undefined;

			chrome.runtime.sendMessage({
				type: 'episodePlayer.stopped',
			});

			chrome.browserAction.setBadgeText({
				text: ''
			});
			break;
		case 'episodePlayer.seek':
			if(audioPlayer && audioPlayer.duration) {
				audioPlayer.currentTime = message.position * audioPlayer.duration;

				chrome.runtime.sendMessage({
					type: 'episodePlayer.changed',
					episodePlayerInfo: buildAudioInfo()
				});
			}
			break;
		case 'episodePlayer.shiftPlaybackRate':
			if(audioPlayer && audioPlayer.playbackRate + message.delta > 0) {
				audioPlayer.playbackRate += message.delta;
			}
			break;
		case 'episodePlayer.getAudioInfo':
			sendResponse(buildAudioInfo());
			return true;
			break;
	}
});
