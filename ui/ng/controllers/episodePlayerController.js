'use strict';

myApp.controller('episodePlayerController', ['$scope', '$document', '$window', 'podcastManagerService', 'episodePlayer', 'messageService', 'socialService',
  function($scope, $document, $window, podcastManagerService, episodePlayer, messageService, socialService) {

	var durationInSeconds;
	
	/**
	 * @type {EpisodeId}
	 */
	var episodeId;

	function reset() {
		$scope.time = '';
		$scope.timePercent = 0;
		$scope.duration = '';
		durationInSeconds = 0;
		$scope.mediaTitle = '';
		$scope.mediaLink = '';
		$scope.imageUrl = '';
		$scope.visible = false;
		$scope.playing = false;
		$scope.loading = false;
		$scope.error = false;
		$scope.timeMouseOver = '';
		$scope.playbackRate = 1.0;
		$scope.volume = {};
		$scope.volume.value = 100;

		$scope.showOptions = false;
		// The data binding will not work properly if the components
		// are direclty placed in $scope	
		$scope.options = {
			order: 'from_podcast',
			continuous: false,
			removeWhenFinished: false
		};

		readOptions();
	}

	$scope.forward = forward;
	$scope.backward = backward;

	function readOptions() {
		episodePlayer.getOptions(setScopeOptions);
	}

	function setScopeOptions(options) {
		$scope.$apply(function() {
			$scope.options.order = options.order;
			$scope.options.continuous = options.continuous;
			$scope.options.removeWhenFinished = options.removeWhenFinished;
		});
	}

	function formatSeconds(seconds) {
		var date = new Date(null);
		date.setSeconds(seconds);

		// this will work fine as long as less than 24hs, which is reasonable
		return date.toISOString().substr(11, 8);
	}

	function playbackRateStepUp() {
		return $scope.playbackRate >= 1.0 ? 0.25 : 0.05;
	}

	function playbackRateStepDown() {
		return -($scope.playbackRate > 1.0 ? 0.25 : 0.05);
	}

	function formatPlaybackRate (playbackRate) {
		// we need the +0.001 because for some reason 0.95 - 0.5 = 0.8999999...
		return parseInt((playbackRate)*100.0 + 0.001)/100.0;
	}

	$scope.nextPlaybackRateUp = function() {
		return formatPlaybackRate($scope.playbackRate + playbackRateStepUp());
	};

	$scope.nextPlaybackRateDown = function() {
		return formatPlaybackRate($scope.playbackRate + playbackRateStepDown());
	};

	$scope.currentPlaybackRate = function() {
		return formatPlaybackRate($scope.playbackRate);
	}

	$scope.play = function() {
		episodePlayer.play();
	};

	$scope.refresh = function() {
		episodePlayer.refresh();
	};

	$scope.pause = function() {
		episodePlayer.pause();
	};

	$scope.stop = function() {
		episodePlayer.stop();
	};

	$scope.speedDown = function() {
		episodePlayer.shiftPlaybackRate(playbackRateStepDown());

		// to keep it consistent we do not wait for the update from the player
		$scope.playbackRate += playbackRateStepDown();
	}

	$scope.speedUp = function() {
		episodePlayer.shiftPlaybackRate(playbackRateStepUp());

		// to keep it consistent we do not wait for the update from the player
		$scope.playbackRate += playbackRateStepUp();
	}

	$scope.nextEpisode = function() {
		episodePlayer.playNext();
	}

	$scope.previousEpisode = function() {
		episodePlayer.playPrevious();
	}

	$scope.seek = function(event) {
		episodePlayer.seek(event.offsetX / event.currentTarget.clientWidth);
	}

	$scope.progressMouseOver = function(event) {
		$scope.timeMouseOver = formatSeconds(event.offsetX / event.currentTarget.clientWidth * durationInSeconds);
	}
	
	$scope.progressMouseLeave = function() {
		$scope.timeMouseOver = '';
	}

	$scope.volumeChanged = function() {
		episodePlayer.setVolume($scope.volume.value / 100.0);
	}

	$scope.orderChanged = function() {
		episodePlayer.setOptions({order: $scope.options.order});
	};

	$scope.continuousChanged = function() {
		episodePlayer.setOptions({continuous: $scope.options.continuous});
	};

	$scope.onChangeRemoveWhenFinished = function() {
		episodePlayer.setOptions({removeWhenFinished: $scope.options.removeWhenFinished});
	};

	$scope.toggleShowOptions = function() {
		$scope.showOptions = !$scope.showOptions;
	};

	$scope.tooglePlaylistVisibility = function() {
		messageService.for('playlist').sendMessage('toggleVisibility');
	};

	$scope.tweet = function() {
		socialService.tweet(episodeId);
	};

	$scope.shareWithFacebook = function() {
		socialService.shareWithFacebook(episodeId);
	};

	function getAudioInfoCallback(audioInfo) {
		if(!audioInfo.episodeId)
			return;

		episodeId = audioInfo.episodeId;

		podcastManagerService.getPodcastAndEpisode(audioInfo.episodeId).then(function(result) {
			var podcast = result.podcast;
			var episode = result.episode;

			$scope.mediaTitle = episode.title;
			$scope.mediaLink = episode.link;
			$scope.time = formatSeconds(audioInfo.audio.currentTime);
			$scope.duration = formatSeconds(audioInfo.audio.duration);
			$scope.imageUrl = audioInfo.audio.imageUrl ? audioInfo.audio.imageUrl : '';
			$scope.timePercent = audioInfo.audio.duration ?  ( audioInfo.audio.currentTime / audioInfo.audio.duration ) * 100 : 0;
			$scope.loading = audioInfo.audio.url && !audioInfo.audio.duration && !audioInfo.audio.error;
			$scope.error = audioInfo.audio.error ? true : false;
			$scope.visible = audioInfo.audio.url && audioInfo.audio.url !== '';
			$scope.playbackRate = audioInfo.audio.playbackRate;
			$scope.volume.value = audioInfo.audio.volume * 100;

			if($scope.error) {
				$scope.playing = false;
			}

			durationInSeconds = audioInfo.audio.duration;
		});
	}

	episodePlayer.playing(function(audioInfo) {
		$scope.playing = true;
		getAudioInfoCallback(audioInfo)
	});

	episodePlayer.paused(function() {
		$scope.$apply(function(){
			$scope.playing = false;
		});
	});

	episodePlayer.stopped(function() {
		$scope.$apply(function(){
			reset();
		});
	});

	episodePlayer.changed(function(audioInfo) {
		getAudioInfoCallback(audioInfo);
	});

	episodePlayer.optionsChanged(function(options) {
		setScopeOptions(options);
	});

	$document[0].body.onkeyup = function(e) {
		if(e.key === ' ' && $scope.visible && e.target.localName !== 'input') {
			analyticsService.trackEvent('audio', 'play_pause_space_key');
			episodePlayer.togglePlayPause();
		}
	}

	// prevent scroll down on space
	$window.onkeydown = function(e) {
		if(e.key == ' ' && $scope.visible && e.target.localName !== 'input') {
			e.preventDefault();
			return false;
		}
	};

	reset();

	episodePlayer.getAudioInfo(getAudioInfoCallback);

	function forward() {
		episodePlayer.forward();
	}

	function backward() {
		episodePlayer.backward();
	}
}]);

myApp.factory('episodePlayer', ['messageService', function(messageService) {
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
