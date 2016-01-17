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

myApp.factory('episodePlayer', function() {
	var episodePlayer = {};

	episodePlayer.play = function(episode) {
		chrome.runtime.sendMessage({
			type: 'episodePlayer.play',
			episode: episode
		});
	};

	episodePlayer.pause = function() {
		chrome.runtime.sendMessage({
			type: 'episodePlayer.pause'
		});
	};

	episodePlayer.stop = function() {
		chrome.runtime.sendMessage({
			type: 'episodePlayer.stop'
		});
	};

	episodePlayer.seek = function(position) {
		chrome.runtime.sendMessage({
			type: 'episodePlayer.seek',
			position: position
		});
	};

	episodePlayer.shiftPlaybackRate = function(delta) {
		chrome.runtime.sendMessage({
			type: 'episodePlayer.shiftPlaybackRate',
			delta: delta
		});
	};

	episodePlayer.getAudioInfo = function(callback) {
		chrome.runtime.sendMessage({
			type: 'episodePlayer.getAudioInfo',
		}, function(response) {
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

	chrome.runtime.onMessage.addListener(function(message) {
		if(!message.type) {
			return;
		}

		switch(message.type) {
			case 'episodePlayer.playing':
				if(episodePlayer.playingCallback) {
					episodePlayer.playingCallback(message.episodePlayerInfo)
				}
				break;
			case 'episodePlayer.paused':
				if(episodePlayer.pausedCallback) {
					episodePlayer.pausedCallback()
				}
				break;
			case 'episodePlayer.stopped':
				if(episodePlayer.stoppedCallback) {
					episodePlayer.stoppedCallback()
				}
				break;
			case 'episodePlayer.changed':
				if(episodePlayer.changedCallback) {
					episodePlayer.changedCallback(message.episodePlayerInfo)
				}
		}
	});

	return episodePlayer;
})
