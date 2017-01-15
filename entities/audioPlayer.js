var AudioPlayerManager;

(function(){
	var instance;

	AudioPlayerManager = function() {
		if(instance) {
			return instance;
		}

		instance = this;

		var audioPlayer;
		var episodeInfo;
		var playingTimeOutID;
		var timeOutCounter = 0;

		function showBrowserNotification(options) {
			var title;

			switch(options.event) {
				case 'playing':
					chrome.notifications.clear('paused');
					break;
				case 'paused':
					chrome.notifications.clear('playing');
					break;
			}

			var iconUrl;

			if(episodeInfo && episodeInfo.audioTags && episodeInfo.audioTags.imageDataUrl) {
				iconUrl = episodeInfo.audioTags.imageDataUrl;
			}
			else {
				var podcast = window.podcastManager ? window.podcastManager.getPodcast(episodeInfo.podcastUrl) : undefined;

				iconUrl = podcast ? podcast.image : 'images/rss-alt-8x.png';
			}

			chrome.notifications.create(options.event, {
				type: 'progress',
				iconUrl: iconUrl,
				title: title = chrome.i18n.getMessage(options.event),
				message: episodeInfo ? episodeInfo.title : '',
				progress: Math.round(audioPlayer.duration ? ( audioPlayer.currentTime / audioPlayer.duration ) * 100 : 0)
			});
		}

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

		function setEpisodeInProgress(podcastUrl, episodeId, currentTime) { 
			messageService.for('podcastManager').sendMessage('setEpisodeInProgress', {
				url: podcastUrl,
				episodeId: episodeId,
				currentTime: currentTime
			});
		}

		function setCurrentTimeFromEpisode() {
			messageService.for('podcastManager').sendMessage('getEpisodeProgress', {
				url: episodeInfo.podcastUrl,
				episodeId: episodeInfo.guid,
			}, function(currentTime) {
				if(currentTime >= 0 && Math.abs(currentTime - audioPlayer.currentTime) > 20) {
					audioPlayer.currentTime = currentTime;
				}
			});
		}

		function playingTimeOut() {
			messageService.for('audioPlayer').sendMessage('playing', { episodePlayerInfo: buildAudioInfo() });

			timeOutCounter++;

			if(timeOutCounter === 10) {
				timeOutCounter = 0;
				setEpisodeInProgress(episodeInfo.podcastUrl, episodeInfo.guid, audioPlayer.currentTime);
			}

			// recursive timeout to be called 1/second
			playingTimeOutID = window.setTimeout(playingTimeOut, 1000);
		}

		function pauseTimeOut() {
			if(playingTimeOutID) {
				window.clearTimeout(playingTimeOutID);
				playingTimeOutID = undefined;
				timeOutCounter = 0;
			}
		}

		function play(audioInfo) {
			if(audioInfo && audioInfo.episode && audioInfo.episode.url &&
				(!audioPlayer || audioInfo.episode.url !== audioPlayer.src)) {

				if(audioPlayer) {
					audioPlayer.pause( );

					if(audioPlayer.currentTime	!= audioPlayer.duration) {
						setEpisodeInProgress(episodeInfo.podcastUrl, episodeInfo.guid, audioPlayer.currentTime);
					}
				}

				audioPlayer = new Audio(audioInfo.episode.url);
				episodeInfo = audioInfo.episode;

				audioPlayer.onended = function() {
					setEpisodeInProgress(episodeInfo.podcastUrl, episodeInfo.guid, 0);
					pauseTimeOut();

					chrome.browserAction.setBadgeText({
						text: ''
					});
				};

				setCurrentTimeFromEpisode();

				getAudioTags(function(tags) {
					episodeInfo.audioTags = tags;
				});
			}

			audioPlayer.play();

			if(audioInfo && audioInfo.showNotification) {
				showBrowserNotification({event: 'playing'});
			}

			// if we don't eliminate the timeout first we may have two timeouts
			// running in parallel (play while already playing)
			pauseTimeOut();
			playingTimeOut();

			chrome.browserAction.setBadgeText({
				text: 'I>'
			});
		}

		function pause(options) {
			pauseTimeOut();
			audioPlayer.pause();

			if(options && options.showNotification) {
				showBrowserNotification({event: 'paused'});
			}

			setEpisodeInProgress(episodeInfo.podcastUrl, episodeInfo.guid, audioPlayer.currentTime);
			messageService.for('audioPlayer').sendMessage('paused');

			chrome.browserAction.setBadgeText({
				text: 'II'
			});
		}

		messageService.for('audioPlayer')
		.onMessage('play', function(messageContent) {
			play(messageContent);
		}).onMessage('pause', function() {
			pause();
		}).onMessage('togglePlayPause', function() {
			if(!audioPlayer)
				return;

			if(audioPlayer.paused) {
				play({ showNotification: true });
			}
			else {
				pause({ showNotification: true });
			}
		}).onMessage('stop', function() {
			pauseTimeOut();
			audioPlayer.pause();
			setEpisodeInProgress(episodeInfo.podcastUrl, episodeInfo.guid, 0);
			
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

				setEpisodeInProgress(episodeInfo.podcastUrl, episodeInfo.guid, audioPlayer.currentTime);

				messageService.for('audioPlayer').sendMessage('changed', { episodePlayerInfo: buildAudioInfo() });
			}
		}).onMessage('getAudioInfo', function(messageContent, sendResponse) {
			sendResponse(buildAudioInfo());
			return true;
		});

		messageService.for('podcastManager').onMessage('podcastSyncInfoChanged', function() {
			setCurrentTimeFromEpisode();
		});
	}
})();

var audioPlayerManager = new AudioPlayerManager();