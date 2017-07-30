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

		function loadPlayerOptions(storage, loaded) {
			storage.get('playerOptions', function(storageObject) {
				var playerOptions;

				if(typeof storageObject.playerOptions === "undefined") {
					playerOptions = {};
				}
				else {
					playerOptions = storageObject.playerOptions;
				}

				if( loaded(playerOptions) ) {
					storage.set({'playerOptions': playerOptions});
				}
			});
		}

		function loadLocalPlayerOptions(loaded) {
			loadPlayerOptions(chrome.storage.local, loaded);
		}

		function loadSyncPlayerOptions(loaded) {
			loadPlayerOptions(chrome.storage.sync, function(playerOptions) {
				// handling of default values
				
				if(!playerOptions.order)
					playerOptions.order = 'from_podcast';
				
				if(typeof playerOptions.removeWhenFinished === 'undefined')
					playerOptions.removeWhenFinished = true;

				return loaded(playerOptions);
			});
		};

		function getPodcastAndEpisode(podcastUrl, episodeGuid) {
			var podcast = window.podcastManager.getPodcast(podcastUrl);

			var episode = podcast.episodes.find(function(episode) {
				return episode.guid === episodeGuid;
			});

			return {
				podcast: podcast,
				episode: episode
			};
		}

		function imageUrl() {
			if(episodeInfo && episodeInfo.audioTags && episodeInfo.audioTags.imageDataUrl) {
				return episodeInfo.audioTags.imageDataUrl;
			}
			else if(episodeInfo) {
				var podcastAndEpisode = getPodcastAndEpisode(episodeInfo.podcastUrl, episodeInfo.episodeGuid);

				return podcastAndEpisode.podcast ? podcastAndEpisode.podcast.image : 'images/rss-alt-8x.png';
			}

			return undefined;
		}

		function showBrowserNotification(options) {
			switch(options.event) {
				case 'playing':
					chrome.notifications.clear('paused');
					break;
				case 'paused':
					chrome.notifications.clear('playing');
					break;
			}

			var podcastAndEpisode = getPodcastAndEpisode(episodeInfo.podcastUrl, episodeInfo.episodeGuid);

			chrome.notifications.create(options.event, {
				type: 'progress',
				iconUrl: imageUrl(),
				title: chrome.i18n.getMessage(options.event),
				message: podcastAndEpisode.episode.title,
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
			var podcastAndEpisode;
			
			podcastAndEpisode = episodeInfo ? getPodcastAndEpisode(episodeInfo.podcastUrl, episodeInfo.episodeGuid) : {};

			return {
				audio: {
					url: audioPlayer ? audioPlayer.src : '',
					imageUrl: imageUrl(),
					currentTime: audioPlayer ? audioPlayer.currentTime : 0,
					duration: audioPlayer ? audioPlayer.duration : 0,
					playbackRate: audioPlayer ? audioPlayer.playbackRate : 1.0,
					volume: audioPlayer ? audioPlayer.volume : 0 
				},
				episode: {
					podcastUrl: episodeInfo ? episodeInfo.podcastUrl : undefined,
					episodeGuid: episodeInfo ? episodeInfo.episodeGuid : undefined
				}
			}
		}

		function setEpisodeInProgress(episodeInfo, currentTime) { 
			messageService.for('podcastManager').sendMessage('setEpisodeInProgress', {
				url: episodeInfo.podcastUrl,
				episodeId: episodeInfo.episodeGuid,
				currentTime: currentTime
			});
		}

		function setCurrentTimeFromEpisode() {
			if(!episodeInfo) {
				return;
			}

			messageService.for('podcastManager').sendMessage('getEpisodeProgress', {
				url: episodeInfo.podcastUrl,
				episodeId: episodeInfo.episodeGuid,
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
				setEpisodeInProgress(episodeInfo, audioPlayer.currentTime);
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

		function play(playData) {
			if(playData && playData.episode &&
				(!audioPlayer || 
				 ( playData.episode.podcastUrl  !== episodeInfo.podcastUrl ||
				   playData.episode.episodeGuid !== episodeInfo.episodeGuid
				 )
				)
			) {
				if(audioPlayer) {
					audioPlayer.pause( );

					if(audioPlayer.currentTime	!= audioPlayer.duration) {
						setEpisodeInProgress(episodeInfo, audioPlayer.currentTime);
					}
				}

				var podcastAndEpisode = getPodcastAndEpisode(playData.episode.podcastUrl, playData.episode.episodeGuid);

				audioPlayer = new Audio(podcastAndEpisode.episode.enclosure.url);
				
				episodeInfo = playData.episode;

				loadLocalPlayerOptions(function(playerOptions) {
					audioPlayer.volume = playerOptions.volume ? playerOptions.volume : 1.0;
					messageService.for('audioPlayer').sendMessage('changed', { episodePlayerInfo: buildAudioInfo() });
				});

				audioPlayer.onended = function() {
					setEpisodeInProgress(episodeInfo, 0);
					pauseTimeOut();

					chrome.browserAction.setBadgeText({
						text: ''
					});

					loadSyncPlayerOptions(function(options) {
						if(options.removeWhenFinished) {
							messageService.for('playlist').sendMessage('remove', {
								podcastUrl: episodeInfo.podcastUrl,
								episodeGuid: episodeInfo.episodeGuid
							});
						}

						if(options.continuous)
							playNextOrPrevious(true);

					});
				};

				setCurrentTimeFromEpisode();

				getAudioTags(function(tags) {
					episodeInfo.audioTags = tags;
				});

				messageService.for('audioPlayer').sendMessage('changed', { episodePlayerInfo: buildAudioInfo() });
			}

			audioPlayer.play();

			if(playData && playData.showNotification) {
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

		function playNextOrPrevious(isNext) {
			if(!episodeInfo)
				return;

			loadSyncPlayerOptions(function(playerOptions) {
				window.podcastManager.getNextOrPreviousEpisode(isNext, playerOptions.order, {
					podcastUrl: episodeInfo.podcastUrl,	
					episodeGuid: episodeInfo.episodeGuid
				}, function(nextEpisode) {
					play({
						episode: {
							podcastUrl: nextEpisode.podcastUrl,
							episodeGuid: nextEpisode.episodeGuid
						}
					});
				});

				return false;
			});
		}

		function pause(options) {
			pauseTimeOut();
			audioPlayer.pause();

			if(options && options.showNotification) {
				showBrowserNotification({event: 'paused'});
			}

			setEpisodeInProgress(episodeInfo, audioPlayer.currentTime);
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

			if(audioPlayer.ended)
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
			setEpisodeInProgress(episodeInfo, 0);
			
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

				setEpisodeInProgress(episodeInfo, audioPlayer.currentTime);

				messageService.for('audioPlayer').sendMessage('changed', { episodePlayerInfo: buildAudioInfo() });
			}
		}).onMessage('forward', function() {
			if(audioPlayer) {
				const targetTime = audioPlayer.currentTime + 15;
				audioPlayer.currentTime = Math.min(audioPlayer.duration, targetTime);
				messageService.for('audioPlayer').sendMessage('changed', { episodePlayerInfo: buildAudioInfo() });
			}
		}).onMessage('backward', function() {
			if(audioPlayer) {
				const targetTime = audioPlayer.currentTime - 15;
				audioPlayer.currentTime = Math.max(0, targetTime);
				messageService.for('audioPlayer').sendMessage('changed', { episodePlayerInfo: buildAudioInfo() });
			}
		}).onMessage('playNext', function() {
			playNextOrPrevious(true);
		}).onMessage('playPrevious', function() {
			playNextOrPrevious(false);
		}).onMessage('setVolume', function(message) {
			if(audioPlayer) {
				audioPlayer.volume = message.value;

				loadLocalPlayerOptions(function(playerOptions) {
					playerOptions.volume = message.value;
					return true;
				});
			}
		}).onMessage('getAudioInfo', function(messageContent, sendResponse) {
			sendResponse(buildAudioInfo());
			return true;
		}).onMessage('getOptions', function(messageContent, sendResponse) {
			loadSyncPlayerOptions(function(options) {
				sendResponse(options);
			});
			return true;
		}).onMessage('setOptions', function(messageContent) {
			loadSyncPlayerOptions(function(options) {
				if(messageContent.order)
					options.order = messageContent.order;

				if(messageContent.continuous !== undefined)
					options.continuous = messageContent.continuous;

				if(messageContent.removeWhenFinished !== undefined)
					options.removeWhenFinished = messageContent.removeWhenFinished;

				messageService.for('audioPlayer').sendMessage('optionsChanged', options);

				return true;
			});
		});

		messageService.for('podcastManager').onMessage('podcastSyncInfoChanged', function() {
			setCurrentTimeFromEpisode();
		});
	}
})();

var audioPlayerManager = new AudioPlayerManager();