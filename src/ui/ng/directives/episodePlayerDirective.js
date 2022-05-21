function episodePlayerDirective($document, $window, analyticsService, podcastManagerService, episodePlayer, messageService, socialService, podcastDataService) {

	return {
		restrict: 'E',
		scope: {},
		controller: ['$scope', episodePlayerController],
		controllerAs: 'episodePlayer',
		bindToController: {
			miniPlayer: '=miniPlayer',
		},
		templateUrl: 'ui/ng/partials/episodePlayer.html'
	};

	function episodePlayerController($scope) {
		var controller = this;

		var durationInSeconds;
		
		/**
		 * @type {EpisodeId}
		 */
		var episodeId;

		controller.$onInit = $onInit;
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
		controller.onChangeReverseOrder = onChangeReverseOrder;
		controller.onChangeRemoveWhenFinished = onChangeRemoveWhenFinished;
		controller.onChangePauseWhenLocked = onChangePauseWhenLocked;
		controller.toggleShowOptions = toggleShowOptions;
		controller.tooglePlaylistVisibility = tooglePlaylistVisibility;
		controller.tweet = tweet;
		controller.shareWithFacebook = shareWithFacebook;
		controller.isVisible = isVisible;
		controller.boost = boost;
		controller.toggleBoostagramSender = toggleBoostagramSender;
		controller.sendBoostagram = sendBoostagram;
		controller.showBoostButton = false;
		controller.showBoostagramSender = false;
		controller.boostagramMessage = '';

		episodePlayer.onPlaying.addListener((audioInfo) => $scope.$apply(() => getAudioInfoCallback(audioInfo)), controller);
		episodePlayer.onPaused.addListener(() => $scope.$apply(() => controller.playing = false), controller);
		episodePlayer.onStopped.addListener(() => $scope.$apply(() => reset()), controller);
		episodePlayer.onChanged.addListener((audioInfo) => $scope.$apply(() => getAudioInfoCallback(audioInfo)), controller);
		episodePlayer.onOptionsChanged.addListener((options) => setScopeOptions(options), controller);

		$scope.$on('$destroy', () => episodePlayer.removeListeners(controller));

		$document[0].body.onkeyup = function(e) {
			if(checkKeyEvent(e)) {
				analyticsService.trackEvent('audio', 'play_pause_space_key');
				episodePlayer.togglePlayPause();
			}
		}

		// prevent scroll down on space
		$window.onkeydown = function(e) {
			if(checkKeyEvent(e)) {
				e.preventDefault();
				return false;
			}
		};

		function checkKeyEvent(e) {
			return e.key == ' ' && 
				controller.visible && 
				e.target.localName !== 'input' &&
				e.target.localName !== 'textarea';
		}

		reset();

		episodePlayer.getAudioInfo(getAudioInfoCallback);

		return controller;

		function $onInit() {
			if(controller.miniPlayer) {
				$window.addEventListener('scroll', function() {
					const mainPlayerBottom = $document[0].getElementById('audioPlayer').getBoundingClientRect().bottom;
					controller.miniPlayerVisible = mainPlayerBottom < 0;
	
					if((!(typeof controller.previousMiniPlayerVisible === 'undefined')) && 
					   controller.miniPlayerVisible !== controller.previousMiniPlayerVisible) {
						$scope.$apply(function() {});
					}
					
					controller.previousMiniPlayerVisible = controller.miniPlayerVisible;
				});
			}
		}

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
			controller.showBoostButton = false;

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
				controller.options.reverseOrder = options.reverseOrder;
				controller.options.removeWhenFinished = options.removeWhenFinished;
				controller.options.pauseWhenLocked = options.pauseWhenLocked;
			});
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
		}

		function nextPlaybackRateDown() {
			return formatPlaybackRate(controller.playbackRate + playbackRateStepDown());
		}

		function currentPlaybackRate() {
			return formatPlaybackRate(controller.playbackRate);
		}

		function play() {
			episodePlayer.play();
		}

		function refresh() {
			episodePlayer.refresh();
		}

		function pause() {
			episodePlayer.pause();
		}

		function stop() {
			episodePlayer.stop();
		}

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
			controller.timeMouseOver = event.offsetX / event.currentTarget.clientWidth * durationInSeconds;
		}
		
		function progressMouseLeave() {
			controller.timeMouseOver = '';
		}

		function volumeChanged() {
			episodePlayer.setVolume(controller.volume.value / 100.0);
		}

		function orderChanged() {
			episodePlayer.setOptions({order: controller.options.order});
		}

		function continuousChanged() {
			episodePlayer.setOptions({continuous: controller.options.continuous});
		}

		function onChangeReverseOrder() {
			episodePlayer.setOptions({reverseOrder: controller.options.reverseOrder});
		}

		function onChangeRemoveWhenFinished() {
			episodePlayer.setOptions({removeWhenFinished: controller.options.removeWhenFinished});
		}

		function onChangePauseWhenLocked() {
			episodePlayer.setOptions({pauseWhenLocked: controller.options.pauseWhenLocked});
		}

		function toggleShowOptions() {
			controller.showOptions = !controller.showOptions;
		}

		function tooglePlaylistVisibility() {
			messageService.for('playlist').sendMessage('toggleVisibility');
		}

		function tweet() {
			socialService.tweet(episodeId);
		}

		function shareWithFacebook() {
			socialService.shareWithFacebook(episodeId);
		}

		function isVisible() {
			return controller.visible && (controller.miniPlayer ? controller.miniPlayerVisible : true)
		}

		function boost() {
			messageService.for('valueHandlerService').sendMessage('boost', {
				episodeId: episodeId,
				currentTime: controller.time
			});
		}

		function toggleBoostagramSender() {
			controller.showBoostagramSender = !controller.showBoostagramSender;
		}

		function sendBoostagram() {
			messageService.for('valueHandlerService').sendMessage('boost', {
				episodeId: episodeId,
				message: controller.boostagramMessage,
				currentTime: controller.time
			});

			controller.boostagramMessage = '';
		}

		function getAudioInfoCallback(audioInfo) {
			if(!audioInfo.episodeId)
				return;

			const oldEpisodeId = episodeId;

			episodeId = audioInfo.episodeId;
			
			if(!podcastDataService.episodeIdEqualsId(episodeId, oldEpisodeId)) {
				determineIfShouldShowBoostButton();
			}

			controller.playing = !audioInfo.audio.paused;

			podcastManagerService.getPodcastAndEpisode(audioInfo.episodeId).then(function(result) {
				var episode = result.episode;

				controller.mediaTitle = episode.title;
				controller.mediaLink = episode.link;
				controller.time = audioInfo.audio.currentTime;
				controller.duration = audioInfo.audio.duration;
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

		function determineIfShouldShowBoostButton() {
			messageService.for('valueHandlerService').sendMessage('canBoostValue', episodeId, (canBoostValue) => {
				$scope.$apply(() => controller.showBoostButton = canBoostValue);
			})
		}
	}
}

export default episodePlayerDirective;