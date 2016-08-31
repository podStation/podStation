myApp.controller('episodePlayerController', ['$scope', 'episodePlayer',  function($scope, episodePlayer) {

	var durationInSeconds;

	function reset() {
		$scope.time = '';
		$scope.timePercent = 0;
		$scope.duration = '';
		durationInSeconds = 0;
		$scope.mediaTitle = '';
		$scope.imageUrl = '';
		$scope.visible = false;
		$scope.playing = false;
		$scope.loading = false;
		$scope.timeMouseOver = '';
		$scope.playbackRate = 1.0;
	}

	function formatSeconds(seconds) {
		var date = new Date(null);
		date.setSeconds(seconds);

		// this will work fine as long as less than 24hs, which is reasonable
		return date.toISOString().substr(11, 8);
	}

	playbackRateStepUp = function() {
		return $scope.playbackRate >= 1.0 ? 0.5 : 0.05;
	}

	playbackRateStepDown = function() {
		return -($scope.playbackRate > 1.0 ? 0.5 : 0.05);
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

	$scope.play = function() {
		episodePlayer.play();
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

	$scope.seek = function(event) {
		episodePlayer.seek(event.offsetX / event.currentTarget.clientWidth);
	}

	$scope.progressMouseOver = function(event) {
		$scope.timeMouseOver = formatSeconds(event.offsetX / event.currentTarget.clientWidth * durationInSeconds);
	}
	
	$scope.progressMouseLeave = function() {
		$scope.timeMouseOver = '';
	}

	function getAudioInfoCallback(audioInfo) {
		$scope.$apply(function(){
			$scope.mediaTitle = audioInfo.episode.title;
			$scope.time = formatSeconds(audioInfo.audio.currentTime);
			$scope.duration = formatSeconds(audioInfo.audio.duration);
			$scope.imageUrl = audioInfo.audio.imageUrl ? audioInfo.audio.imageUrl : '';
			$scope.timePercent = audioInfo.audio.duration ?  ( audioInfo.audio.currentTime / audioInfo.audio.duration ) * 100 : 0;
			$scope.loading = audioInfo.audio.url && !audioInfo.audio.duration;
			$scope.visible = audioInfo.audio.url && audioInfo.audio.url !== '';
			$scope.playbackRate = audioInfo.audio.playbackRate;

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

	reset();

	episodePlayer.getAudioInfo(getAudioInfoCallback);
}]);

myApp.factory('episodePlayer', ['messageService', function(messageService) {
	var episodePlayer = {};

	episodePlayer.play = function(episode) {
		messageService.for('audioPlayer').sendMessage('play', {
			episode: episode
		});
	};

	episodePlayer.pause = function() {
		messageService.for('audioPlayer').sendMessage('pause');
	};

	episodePlayer.stop = function() {
		messageService.for('audioPlayer').sendMessage('stop');
	};

	episodePlayer.seek = function(position) {
		messageService.for('audioPlayer').sendMessage('seek', {
			position: position
		});
	};

	episodePlayer.shiftPlaybackRate = function(delta) {
		messageService.for('audioPlayer').sendMessage('shiftPlaybackRate', {
			delta: delta
		});
	};

	episodePlayer.getAudioInfo = function(callback) {
		messageService.for('audioPlayer').sendMessage('getAudioInfo', {}, function(response) {
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
	}).onMessage('changed', function() {
		if(episodePlayer.changedCallback) {
			episodePlayer.changedCallback(message.episodePlayerInfo)
		}
	});

	return episodePlayer;
}]);
