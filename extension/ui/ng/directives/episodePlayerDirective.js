'use strict';

(function() {
angular.module('podstationApp').directive('psEpisodePlayer', ['$document', '$window', 'podcastManagerService', 'episodePlayer', 'messageService', 'socialService', episodePlayerDirective]);

function episodePlayerDirective($document, $window, podcastManagerService, episodePlayer, messageService, socialService) {

	return {
		restrict: 'E',
		scope: {
			miniPlayer: '=miniPlayer',
		},
		controller: ['$scope', episodePlayerController],
		controllerAs: 'episodePlayer',
		bindToController: true,
		templateUrl: 'ui/ng/partials/episodePlayer.html'
	};

	function episodePlayerController($scope) {
		var controller = this;

		var durationInSeconds;
		
		/**
		 * @type {EpisodeId}
		 */
		var episodeId;

		controller.forward = forward;
		controller.backward = backward;
		controller.nextPlaybackRateUp = nextPlaybackRateUp;
		controller.nextPlaybackRateDown = nextPlaybackRateDown;
		controller.currentPlaybackRate = currentPlaybackRate;
		controller.play = play;
		controller.pause = pause;
		controller.stop = stop;
		controller.refresh = refresh;
		controller.refresh = refresh;
		controller.speedDown = speedDown;
		controller.speedUp = speedUp;
		controller.nextEpisode = nextEpisode;
		controller.previousEpisode = previousEpisode;
		controller.seek = seek;
		controller.progressMouseOver = progressMouseOver;
		controller.progressMouseLeave = progressMouseLeave;
		controller.volumeChanged = volumeChanged;
		controller.orderChanged = orderChanged;
		controller.continuousChanged = continuousChanged;
		controller.onChangeRemoveWhenFinished = onChangeRemoveWhenFinished;
		controller.toggleShowOptions = toggleShowOptions;
		controller.tooglePlaylistVisibility = tooglePlaylistVisibility;
		controller.tweet = tweet;
		controller.shareWithFacebook = shareWithFacebook;

		episodePlayer.playing(function(audioInfo) {
			$scope.$apply(function(){
				getAudioInfoCallback(audioInfo);
			});
		});

		episodePlayer.paused(function() {
			$scope.$apply(function(){
				controller.playing = false;
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
			if(e.key === ' ' && controller.visible && e.target.localName !== 'input') {
				analyticsService.trackEvent('audio', 'play_pause_space_key');
				episodePlayer.togglePlayPause();
			}
		}

		// prevent scroll down on space
		$window.onkeydown = function(e) {
			if(e.key == ' ' && controller.visible && e.target.localName !== 'input') {
				e.preventDefault();
				return false;
			}
		};

		reset();

		episodePlayer.getAudioInfo(getAudioInfoCallback);

		return controller;

		function reset() {
			durationInSeconds = 0;

			controller.time = '';
			controller.timePercent = 0;
			controller.duration = '';
			controller.mediaTitle = '';
			controller.mediaLink = '';
			controller.imageUrl = '';
			controller.visible = false;
			controller.playing = false;
			controller.loading = false;
			controller.error = false;
			controller.timeMouseOver = '';
			controller.playbackRate = 1.0;
			controller.volume = {};
			controller.volume.value = 100;

			controller.showOptions = false;
			
			// The data binding will not work properly if the components
			// are direclty placed in controller	
			controller.options = {
				order: 'from_podcast',
				continuous: false,
				removeWhenFinished: false
			};

			readOptions();
		}

		function readOptions() {
			episodePlayer.getOptions(setScopeOptions);
		}

		function setScopeOptions(options) {
			$scope.$apply(function() {
				controller.options.order = options.order;
				controller.options.continuous = options.continuous;
				controller.options.removeWhenFinished = options.removeWhenFinished;
			});
		}

		function formatSeconds(seconds) {
			var date = new Date(null);
			date.setSeconds(seconds);

			// this will work fine as long as less than 24hs, which is reasonable
			return date.toISOString().substr(11, 8);
		}

		function playbackRateStepUp() {
			return controller.playbackRate >= 1.0 ? 0.25 : 0.05;
		}

		function playbackRateStepDown() {
			return -(controller.playbackRate > 1.0 ? 0.25 : 0.05);
		}

		function formatPlaybackRate (playbackRate) {
			// we need the +0.001 because for some reason 0.95 - 0.5 = 0.8999999...
			return parseInt((playbackRate)*100.0 + 0.001)/100.0;
		}

		function nextPlaybackRateUp () {
			return formatPlaybackRate(controller.playbackRate + playbackRateStepUp());
		};

		function nextPlaybackRateDown() {
			return formatPlaybackRate(controller.playbackRate + playbackRateStepDown());
		};

		function currentPlaybackRate() {
			return formatPlaybackRate(controller.playbackRate);
		}

		function play() {
			episodePlayer.play();
		};

		function refresh() {
			episodePlayer.refresh();
		};

		function pause() {
			episodePlayer.pause();
		};

		function stop() {
			episodePlayer.stop();
		};

		function speedDown() {
			episodePlayer.shiftPlaybackRate(playbackRateStepDown());

			// to keep it consistent we do not wait for the update from the player
			controller.playbackRate += playbackRateStepDown();
		}

		function speedUp() {
			episodePlayer.shiftPlaybackRate(playbackRateStepUp());

			// to keep it consistent we do not wait for the update from the player
			controller.playbackRate += playbackRateStepUp();
		}

		function nextEpisode() {
			episodePlayer.playNext();
		}

		function previousEpisode() {
			episodePlayer.playPrevious();
		}

		function seek(event) {
			episodePlayer.seek(event.offsetX / event.currentTarget.clientWidth);
		}

		function progressMouseOver(event) {
			controller.timeMouseOver = formatSeconds(event.offsetX / event.currentTarget.clientWidth * durationInSeconds);
		}
		
		function progressMouseLeave() {
			controller.timeMouseOver = '';
		}

		function volumeChanged() {
			episodePlayer.setVolume(controller.volume.value / 100.0);
		}

		function orderChanged() {
			episodePlayer.setOptions({order: controller.options.order});
		};

		function continuousChanged() {
			episodePlayer.setOptions({continuous: controller.options.continuous});
		};

		function onChangeRemoveWhenFinished() {
			episodePlayer.setOptions({removeWhenFinished: controller.options.removeWhenFinished});
		};

		function toggleShowOptions() {
			controller.showOptions = !controller.showOptions;
		};

		function tooglePlaylistVisibility() {
			messageService.for('playlist').sendMessage('toggleVisibility');
		};

		function tweet() {
			socialService.tweet(episodeId);
		};

		function shareWithFacebook() {
			socialService.shareWithFacebook(episodeId);
		};

		function getAudioInfoCallback(audioInfo) {
			if(!audioInfo.episodeId)
				return;

			episodeId = audioInfo.episodeId;

			controller.playing = !audioInfo.audio.paused;

			podcastManagerService.getPodcastAndEpisode(audioInfo.episodeId).then(function(result) {
				var episode = result.episode;

				controller.mediaTitle = episode.title;
				controller.mediaLink = episode.link;
				controller.time = formatSeconds(audioInfo.audio.currentTime);
				controller.duration = formatSeconds(audioInfo.audio.duration);
				controller.imageUrl = audioInfo.audio.imageUrl ? audioInfo.audio.imageUrl : '';
				controller.timePercent = audioInfo.audio.duration ?  ( audioInfo.audio.currentTime / audioInfo.audio.duration ) * 100 : 0;
				controller.loading = audioInfo.audio.url && !audioInfo.audio.duration && !audioInfo.audio.error;
				controller.error = audioInfo.audio.error ? true : false;
				controller.visible = audioInfo.audio.url && audioInfo.audio.url !== '';
				controller.playbackRate = audioInfo.audio.playbackRate;
				controller.volume.value = audioInfo.audio.volume * 100;

				if(controller.error) {
					controller.playing = false;
				}

				durationInSeconds = audioInfo.audio.duration;
			});
		}

		function forward() {
			episodePlayer.forward();
		}

		function backward() {
			episodePlayer.backward();
		}
	}
}
})();