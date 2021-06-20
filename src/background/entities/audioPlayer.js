'use strict';

/**
 * 
 * @typedef {Object} EpisodePlayerInfo
 * @property {EpisodeId} episodeId
 * @property {Object} audioTags
 * @property {Object} mediaSessionMetadata
 */

/**
 * @typedef {Object} EpisodePlayedSegment
 * @property {EpisodeId} episodeId
 * @property {number} startPosition
 * @property {number} endPosition
 */

function audioBuilderService() {
	const service = {
		buildAudio: buildAudio
	};

	return service;

	/**
	 * @param {string} audioUrl 
	 * @returns {HTMLAudioElement}
	 */
	function buildAudio(audioUrl) {
		return new Audio(audioUrl);
	};
}

class PlayedSegmentAnnouncer {
	constructor(episodeId, messageService) {
		this._startPosition = 0;
		this._episodeId = episodeId;
		this._messageService = messageService;
	}

	/**
	 * 
	 * @param {number} currentPosition Current position in seconds
	 * @param {number} newStartPosition New start position in seconds, to be set after announcement, optional
	 */
	announce(currentPosition, newStartPosition) {
		if(currentPosition !== this._startPosition) {
			this._messageService.for('audioPlayer').sendMessage('segmentPlayed', {
				episodeId: this._episodeId,
				startPosition: this._startPosition,
				endPosition: currentPosition
			});
		}

		this._startPosition = typeof newStartPosition !== 'undefined' ? newStartPosition : currentPosition;
	}
}

function audioPlayerService($injector, $window, $interval, $q, browserService, messageService, storageService, audioBuilderService, podcastDataService, podcastStorageService, _analyticsService) {
	/**
	 * @type {HTMLAudioElement}
	 */ 
	var audioPlayer;
	
	/** 
	 * @type {EpisodePlayerInfo}
	 */
	var episodeInfo;
	
	/**
	 * @type {Promise}
	 */
	var playingTimeOutID;
	var timeOutCounter = 0;

	/**
	 * @type {PlayedSegmentAnnouncer}
	 */
	var playedSegmentAnnouncer;

	const SYNC_OPTIONS = {
		'order':true,
		'continuous':true,
		'reverseOrder':true,
		'removeWhenFinished':true
	};

	function splitOptions(options) {
		const result = {
			local: {},
			sync: {}
		}

		for(var key in options) {
			result[SYNC_OPTIONS[key]?'sync':'local'][key] = options[key];
		}
		
		return result;
	}

	/**
	 * 
	 * @param {Array<Object>} allOptions 
	 */
	function mergeOptions(allOptions) {
		const result = {};

		allOptions.forEach((option) => {
			for(var key in option) {result[key] = option[key]}
		});

		return result;
	}

	function loadLocalPlayerOptions(loaded) {
		// loadPlayerOptions(browserService.storage.local, loaded);
		return storageService.loadFromStorage('playerOptions', loaded, 'local', () => {return {};});
	}

	function loadSyncPlayerOptions(loaded) {
		return storageService.loadFromStorage('playerOptions', (playerOptions) => {
			// handling of default values
			
			if(!playerOptions.order)
				playerOptions.order = 'from_podcast';
			
			if(typeof playerOptions.removeWhenFinished === 'undefined')
				playerOptions.removeWhenFinished = true;

			return loaded && loaded(playerOptions);
		}, 'sync', () => {return {};});
	};

	function loadSyncPlayerProperties(loaded) {
		return storageService.loadFromStorage('plp', (properties) => {
			// playback rate
			if(typeof properties.pbr === 'undefined') {
				properties.pbr = 1.0;
			}

			const modifiedProperties = loaded && loaded(properties);

			if(modifiedProperties) {
				// Clean up

				if(modifiedProperties.pbr === 1.0) {
					delete modifiedProperties.pbr;
				}
			}

			return modifiedProperties;
		}, 'sync', () => {return {};});
	};

	function getPodcastAndEpisode(episodeId) {
		return $injector.get('podcastManager').getPodcastAndEpisode(episodeId);
	}

	/**
	 * @returns {string}
	 */
	function imageUrl() {
		if(episodeInfo && episodeInfo.audioTags && episodeInfo.audioTags.imageDataUrl) {
			return episodeInfo.audioTags.imageDataUrl;
		}
		else if(episodeInfo) {
			var podcastAndEpisode = getPodcastAndEpisode(episodeInfo.episodeId);

			return podcastAndEpisode.podcast ? podcastAndEpisode.podcast.image : 'images/rss-alt-8x.png';
		}

		return undefined;
	}

	function showBrowserNotification(options) {
		switch(options.event) {
			case 'playing':
				browserService.notifications.clear('paused');
				break;
			case 'paused':
				browserService.notifications.clear('playing');
				break;
		}

		var podcastAndEpisode = getPodcastAndEpisode(episodeInfo.episodeId);

		browserService.notifications.create(options.event, {
			type: 'progress',
			iconUrl: imageUrl(),
			title: browserService.i18n.getMessage(options.event),
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
		
		podcastAndEpisode = episodeInfo ? getPodcastAndEpisode(episodeInfo.episodeId) : {};

		return {
			audio: {
				url: audioPlayer ? audioPlayer.src : '',
				imageUrl: imageUrl(),
				currentTime: audioPlayer ? audioPlayer.currentTime : 0,
				duration: audioPlayer ? audioPlayer.duration : 0,
				playbackRate: audioPlayer ? audioPlayer.playbackRate : 1.0,
				volume: audioPlayer ? audioPlayer.volume : 0,
				error: audioPlayer ? audioPlayer.error : 0,
				paused: audioPlayer.paused
			},
			episodeId: episodeInfo ? episodeInfo.episodeId : null
		}
	}

	function setEpisodeInProgress(episodeInfo, currentTime) {
		podcastStorageService.storeEpisodeUserData(episodeInfo.episodeId, {
			currentTime: currentTime
		});
	}

	function setCurrentTimeFromEpisode() {
		if(!episodeInfo) {
			return;
		}

		podcastStorageService.getEpisodeUserData(episodeInfo.episodeId).then(function(episodeUserData) {
			if(episodeUserData.currentTime >= 0 && Math.abs(episodeUserData.currentTime - audioPlayer.currentTime) > 20) {
				announcePlayedSegment(episodeUserData.currentTime);
				audioPlayer.currentTime = episodeUserData.currentTime;
			}
		});
	}

	function playingTimeOut() {
		messageService.for('audioPlayer').sendMessage('playing', { episodePlayerInfo: buildAudioInfo() });
		
		playingTimeOutID = $interval(function() {
			messageService.for('audioPlayer').sendMessage('playing', { episodePlayerInfo: buildAudioInfo() });

			timeOutCounter++;

			if(timeOutCounter === 10) {
				timeOutCounter = 0;
				setEpisodeInProgress(episodeInfo, audioPlayer.currentTime);
				announcePlayedSegment();
			}
		}, 1000);
	}

	function pauseTimeOut() {
		if(playingTimeOutID) {
			$interval.cancel(playingTimeOutID);
			playingTimeOutID = undefined;
			timeOutCounter = 0;
		}
	}

	function refresh() {
		// it will be cleared at the stop, so we need to 
		// save it here
		var playData = {
			episodeId: episodeInfo.episodeId
		}

		stop(true);
		play(playData);
	}

	function play(playData) {
		if(playData && playData.episodeId &&
			(!audioPlayer || !podcastDataService.episodeIdEqualsId(playData.episodeId, episodeInfo.episodeId ))
		) {
			if(audioPlayer) {
				audioPlayer.pause( );

				if(audioPlayer.currentTime	!= audioPlayer.duration) {
					setEpisodeInProgress(episodeInfo, audioPlayer.currentTime);
				}

				announcePlayedSegment();
			}

			var podcastAndEpisode = getPodcastAndEpisode(playData.episodeId);

			_analyticsService.trackEvent('audio', 'play_podcast_url', stripAuthFromURI(playData.episodeId.values.podcastUrl));
			audioPlayer = audioBuilderService.buildAudio(podcastAndEpisode.episode.enclosure.url);

			episodeInfo = { 
				episodeId: playData.episodeId,
				mediaSessionMetadata: {
					artist: podcastAndEpisode.podcast.title,
					title: podcastAndEpisode.episode.title
				}
			};

			loadLocalPlayerOptions(function(playerOptions) {
				audioPlayer.volume = playerOptions.volume ? playerOptions.volume : 1.0;
				messageService.for('audioPlayer').sendMessage('changed', { episodePlayerInfo: buildAudioInfo() });
			});

			loadSyncPlayerProperties((playerOptions) => {
				audioPlayer.playbackRate = playerOptions.pbr;
				messageService.for('audioPlayer').sendMessage('changed', { episodePlayerInfo: buildAudioInfo() });
			});

			audioPlayer.onended = onAudioEnded;
			audioPlayer.onerror = onAudioError;

			setCurrentTimeFromEpisode();

			getAudioTags(function(tags) {
				episodeInfo.audioTags = tags;

				setMediaSessionMetadata(episodeInfo.mediaSessionMetadata, buildAudioInfo().audio.imageUrl);
			});

			messageService.for('audioPlayer').sendMessage('changed', { episodePlayerInfo: buildAudioInfo() });

			addButtons();
			setMediaSessionMetadata(episodeInfo.mediaSessionMetadata, buildAudioInfo().audio.imageUrl);

			playedSegmentAnnouncer = new PlayedSegmentAnnouncer(playData.episodeId, messageService);
		}

		if(audioPlayer.error) {
			audioPlayer.load();
			setCurrentTimeFromEpisode();
		}

		_analyticsService.trackEvent('audio', 'play');
		audioPlayer.play();

		if(playData && playData.showNotification) {
			showBrowserNotification({event: 'playing'});
		}

		// if we don't eliminate the timeout first we may have two timeouts
		// running in parallel (play while already playing)
		pauseTimeOut();
		playingTimeOut();

		browserService.browserAction.setBadgeText({
			text: '\u25B6' // play symbol
		});

		return;

		function onAudioEnded() {
			const currentEpisodeInfo = episodeInfo;

			_analyticsService.trackEvent('audio', 'ended');
			announcePlayedSegment();
			stop();

			loadSyncPlayerOptions(function(options) {
				if(options.removeWhenFinished) {
					messageService.for('playlist').sendMessage('remove', {
						episodeId: currentEpisodeInfo.episodeId
					});
				}

				if(options.continuous)
					playNextOrPrevious(true, currentEpisodeInfo);
			});
		};

		function onAudioError() {
			_analyticsService.trackEvent('audio', 'error');
			messageService.for('audioPlayer').sendMessage('changed', { episodePlayerInfo: buildAudioInfo() });
		}
	}

	function playNextOrPrevious(isNext, argEpisodeInfo) {

		if(isNext) {
			_analyticsService.trackEvent('audio', 'play_next');
		}
		else {
			_analyticsService.trackEvent('audio', 'play_prev');
		}

		const refEpisodeInfo = argEpisodeInfo ? argEpisodeInfo : episodeInfo;

		if(!refEpisodeInfo)
			return;

		loadSyncPlayerOptions(function(playerOptions) {
			const calculatedIsNext = playerOptions.reverseOrder ? !isNext : isNext;
			$injector.get('podcastManager').getNextOrPreviousEpisode(calculatedIsNext, playerOptions.order, refEpisodeInfo.episodeId, function(nextEpisodeId) {
				play({episodeId: nextEpisodeId});
			});

			return false;
		});
	}

	function pause(options) {
		_analyticsService.trackEvent('audio', 'pause');
		pauseTimeOut();
		audioPlayer.pause();
		announcePlayedSegment();

		if(options && options.showNotification) {
			showBrowserNotification({event: 'paused'});
		}

		setEpisodeInProgress(episodeInfo, audioPlayer.currentTime);
		messageService.for('audioPlayer').sendMessage('paused');

		browserService.browserAction.setBadgeText({
			text: '\u2759\u2759' // pause symbol
		});
	}

	function stop(keepProgress) {
		_analyticsService.trackEvent('audio', 'stop');

		pauseTimeOut();
		audioPlayer.pause();
		announcePlayedSegment();

		if(!keepProgress) {
			setEpisodeInProgress(episodeInfo, 0);
		}

		audioPlayer.src = '';
		audioPlayer = undefined;
		episodeInfo = undefined;

		messageService.for('audioPlayer').sendMessage('stopped');

		browserService.browserAction.setBadgeText({
			text: ''
		});

		removeButtons();
	}

	function togglePlayPause() {
		if(!audioPlayer)
			return;

		if(audioPlayer.ended)
			return;

		if(audioPlayer.paused || audioPlayer.error) {
			play({ showNotification: true });
		}
		else {
			pause({ showNotification: true });
		}
	}

	function seekForward() {
		if(audioPlayer) {
			_analyticsService.trackEvent('audio', 'forward');

			var targetTime = audioPlayer.currentTime + 15;
			targetTime = Math.min(audioPlayer.duration, targetTime);
			announcePlayedSegment(targetTime);
			audioPlayer.currentTime = targetTime;
			messageService.for('audioPlayer').sendMessage('changed', { episodePlayerInfo: buildAudioInfo() });
		}
	}

	function seekBackward() {
		if(audioPlayer) {
			_analyticsService.trackEvent('audio', 'backward');
			var targetTime = audioPlayer.currentTime - 15;
			targetTime = Math.max(0, targetTime);
			announcePlayedSegment(targetTime);
			audioPlayer.currentTime = targetTime;
			messageService.for('audioPlayer').sendMessage('changed', { episodePlayerInfo: buildAudioInfo() });
		}
	}

	messageService.for('audioPlayer')
	.onMessage('play', function(messageContent) {
		play(messageContent);
	}).onMessage('refresh', function() {
		refresh();
	}).onMessage('pause', function() {
		pause();
	}).onMessage('togglePlayPause', function() {
		togglePlayPause();
	}).onMessage('stop', function() {
		stop();
	}).onMessage('shiftPlaybackRate', function(messageContent) {
		if(audioPlayer && audioPlayer.playbackRate + messageContent.delta > 0) {
			audioPlayer.playbackRate += messageContent.delta;
			loadSyncPlayerProperties((properties) => {
				properties.pbr = audioPlayer.playbackRate;
				return properties;
			})
			_analyticsService.trackEvent('audio', 'change_playback_rate', undefined, Math.round(100*audioPlayer.playbackRate));
		}
	}).onMessage('seek', function(messageContent) {
		if(audioPlayer && audioPlayer.duration) {
			_analyticsService.trackEvent('audio', 'seek');

			const targetTime = messageContent.position * audioPlayer.duration
			announcePlayedSegment(targetTime);
			audioPlayer.currentTime = targetTime;

			setEpisodeInProgress(episodeInfo, audioPlayer.currentTime);

			messageService.for('audioPlayer').sendMessage('changed', { episodePlayerInfo: buildAudioInfo() });
		}
	}).onMessage('forward', function() {
		seekForward();
	}).onMessage('backward', function() {
		seekBackward();
	}).onMessage('playNext', function() {
		playNextOrPrevious(true);
	}).onMessage('playPrevious', function() {
		playNextOrPrevious(false);
	}).onMessage('setVolume', function(message) {
		if(audioPlayer) {
			_analyticsService.trackEvent('audio', 'change_volume');

			audioPlayer.volume = message.value;

			loadLocalPlayerOptions(function(playerOptions) {
				playerOptions.volume = message.value;
				return playerOptions;
			});
		}
	}).onMessage('getAudioInfo', function(messageContent, sendResponse) {
		sendResponse(buildAudioInfo());
		return true;
	}).onMessage('getOptions', function(messageContent, sendResponse) {
		$q.all([loadSyncPlayerOptions(), loadLocalPlayerOptions()]).then((allOptions) => {
			sendResponse(mergeOptions(allOptions));
		});
		return true;
	}).onMessage('setOptions', function(messageContent) {
		const result = splitOptions(messageContent);

		$q.all([
			loadSyncPlayerOptions(function(options) {
				if(result.sync.order)
					options.order = result.sync.order;

				if(result.sync.continuous !== undefined)
					options.continuous = result.sync.continuous;

				if(result.sync.removeWhenFinished !== undefined)
					options.removeWhenFinished = result.sync.removeWhenFinished;

				if(result.sync.reverseOrder !== undefined)
					options.reverseOrder = result.sync.reverseOrder;

				return options;
			}),
			loadLocalPlayerOptions(function(options) {
				if(result.local.pauseWhenLocked !== undefined)
					options.pauseWhenLocked = result.local.pauseWhenLocked;

				return options;
			})
		]).then((allOptions) => {
			messageService.for('audioPlayer').sendMessage('optionsChanged', mergeOptions(allOptions));
		});
	});

	messageService.for('podcastManager').onMessage('podcastSyncInfoChanged', function() {
		setCurrentTimeFromEpisode();
	});

	if('mediaSession' in $window.navigator) {
		navigator.mediaSession.setActionHandler('seekbackward', () => seekBackward());
		navigator.mediaSession.setActionHandler('seekforward', () => seekForward());
		navigator.mediaSession.setActionHandler('previoustrack', () => playNextOrPrevious(false));
		navigator.mediaSession.setActionHandler('nexttrack', () => playNextOrPrevious(true));
	}

	browserService.contextMenus.onClicked.addListener(function(info) {
		if(info.menuItemId === 'browser_action_play_pause') {
			_analyticsService.trackEvent('audio', 'play_pause_browser_action_button');
			togglePlayPause();
		}
	});

	browserService.commands.onCommand.addListener(function(command) {
		switch(command) {
			case 'play_pause':
				_analyticsService.trackEvent('audio', 'play_pause_hotkey');
				togglePlayPause();
				break;
			case 'seek_forward':
				_analyticsService.trackEvent('audio', 'seek_forward_command');
				seekForward();
				break;
			case 'seek_backward':
				_analyticsService.trackEvent('audio', 'seek_backward_command');
				seekBackward();
				break;
			case 'next_episode':
				_analyticsService.trackEvent('audio', 'next_episode_command');
				playNextOrPrevious(true);
				break;
			case 'previous_episode':
				_analyticsService.trackEvent('audio', 'previous_episode_command');
				playNextOrPrevious(false);
				break;
		}
	});

	browserService.idle.onStateChanged.addListener((newState) => {
		newState === 'locked' && loadLocalPlayerOptions().then((options) => {
			options.pauseWhenLocked && pause();
		});
	});

	return {};

	function addButtons() {
		browserService.contextMenus.create({
			id: 'browser_action_play_pause',
			title: browserService.i18n.getMessage('play_pause'),
			contexts: ['browser_action'],
		});
	}

	function removeButtons() {
		browserService.contextMenus.remove('browser_action_play_pause');
	}

	function setMediaSessionMetadata(metadata, artworkUrl) {
		const episodeInfo = buildAudioInfo();

		if('mediaSession' in $window.navigator) {
			$window.navigator.mediaSession.metadata = new MediaMetadata({
				title: metadata.title,
				artist: metadata.artist,
				artwork: [
					{ src: artworkUrl, sizes: '512x512'},
					]
			});
		}
	}

	function stripAuthFromURI(uri) {
		var parser = document.createElement('a');
		parser.href = uri;

		return parser.protocol + '//' + parser.host + parser.pathname + parser.search + parser.hash;
	}

	function announcePlayedSegment(newStartPosition) {
		playedSegmentAnnouncer.announce(audioPlayer.currentTime, newStartPosition);
	}
}

export { audioBuilderService };
export default audioPlayerService;