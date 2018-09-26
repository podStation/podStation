'use strict';

describe('audioPlayerService', function() {

	beforeEach(module('podstationBackgroundApp'));

	beforeEach(module(function($provide) {
		$provide.factory('browser', browserStorageMockFn);

		// Dummies
		// $provide.service('messageService', messageServiceMockFn);
		$provide.factory('analyticsService', analyticsServiceMockFn);
		$provide.factory('audioBuilderService', function() {
			var service = {
				buildAudio: buildAudio,
				tick: tick,
				audio: {
					play: function() {},
					pause: function() {},
					currentTime: 0
				},
				_end: _end
			};

			return service;

			function tick(interval) {
				this.audio.currentTime += interval;
			};
			
			function buildAudio(audioUrl) {
				this.audio.src = audioUrl;
				this.audio.currentTime = 0;
				return this.audio;
			}

			function _end() {
				this.audio.onended();
			}
		});
	}));

	var $rootScope;

	var browserService;
	var podcastManager;
	var messageService;
	var podcastDataService;
	var podcastStorageService;
	var audioBuilderService;
	var playlistService;

	var audioPlayerService;
	
	var ajaxSpy;

	beforeEach(inject(function($injector) {
		fixAngularInjector($injector);

		ajaxSpy = spyOn($, 'ajax').and.callFake(ajaxGetFeed);

		messageService = $injector.get('messageService');
		messageService.reset();

		podcastManager = $injector.get('podcastManager');
		podcastManager.reset();

		$rootScope = $injector.get('$rootScope');
		browserService = $injector.get('browser');
		podcastDataService = $injector.get('podcastDataService');
		podcastStorageService = $injector.get('podcastStorageService');
		playlistService = $injector.get('playlist');
		
		audioBuilderService = $injector.get('audioBuilderService');

		// Ensure startup and message listening
		$injector.get('audioPlayerService');
	}));

	describe('play', function() {
		it("should play a podcast with guid", function() {
			spyOn(audioBuilderService.audio, 'play');

			podcastManager.addPodcast(FEEDS.WITH_GUID.URL);

			$rootScope.$apply();

			var episodeId = podcastDataService.episodeId(FEEDS.WITH_GUID.EP2);

			messageService.for('audioPlayer').sendMessage('play', {episodeId : episodeId});

			$rootScope.$apply();

			expect(audioBuilderService.audio.play).toHaveBeenCalled();
			expect(audioBuilderService.audio.src).toBe(FEEDS.WITH_GUID.EP2.enclosure.url);
		});

		it("should play a podcast WITHOUT guid", function() {
			spyOn(audioBuilderService.audio, 'play');

			podcastManager.addPodcast(FEEDS.WITHOUT_GUID.URL);

			$rootScope.$apply();

			var episodeId = podcastDataService.episodeId(FEEDS.WITHOUT_GUID.EP2);

			messageService.for('audioPlayer').sendMessage('play', {episodeId : episodeId});

			$rootScope.$apply();

			expect(audioBuilderService.audio.play).toHaveBeenCalled();
			expect(audioBuilderService.audio.src).toBe(FEEDS.WITHOUT_GUID.EP2.enclosure.url);
		});

		it("should play another podcast", function() {
			spyOn(audioBuilderService.audio, 'play');

			podcastManager.addPodcast(FEEDS.WITH_GUID.URL);

			$rootScope.$apply();

			messageService.for('audioPlayer').sendMessage('play', {
				episodeId: podcastDataService.episodeId(FEEDS.WITH_GUID.EP2)
			});

			messageService.for('audioPlayer').sendMessage('play', {
				episodeId: podcastDataService.episodeId(FEEDS.WITH_GUID.EP1)
			});

			$rootScope.$apply();

			expect(audioBuilderService.audio.play).toHaveBeenCalled();
			expect(audioBuilderService.audio.src).toBe(FEEDS.WITH_GUID.EP1.enclosure.url);
		});

		it("should start playing where it paused the last time", function() {
			spyOn(audioBuilderService.audio, 'play');

			podcastManager.addPodcast(FEEDS.WITH_GUID.URL);

			$rootScope.$apply();

			var episodeId = podcastDataService.episodeId(FEEDS.WITH_GUID.EP2);

			podcastStorageService.storeEpisodeUserData(episodeId, {
				currentTime: 10000
			});

			messageService.for('audioPlayer').sendMessage('play', {episodeId : episodeId});

			$rootScope.$apply();

			expect(audioBuilderService.audio.currentTime).toBe(10000);
		});
	});

	describe('refresh', function() {
		it('should call play again', function() {
			spyOn(audioBuilderService.audio, 'play');

			podcastManager.addPodcast(FEEDS.WITH_GUID.URL);

			$rootScope.$apply();

			var episodeId = podcastDataService.episodeId(FEEDS.WITH_GUID.EP2);

			messageService.for('audioPlayer').sendMessage('play', {episodeId: episodeId});

			$rootScope.$apply();

			messageService.for('audioPlayer').sendMessage('refresh');

			$rootScope.$apply();

			expect(audioBuilderService.audio.play).toHaveBeenCalledTimes(2);
			expect(audioBuilderService.audio.src).toBe(FEEDS.WITH_GUID.EP2.enclosure.url);
		});
	});

	describe('playing', function() {
		var $interval;
		var episodeId;
		var tickAudioPromise;

		beforeEach(inject(function($injector) {
			$interval = $injector.get('$interval');
			podcastStorageService = $injector.get('podcastStorageService');
		}));

		beforeEach(function() {
			podcastManager.addPodcast(FEEDS.WITHOUT_GUID.URL);

			$rootScope.$apply();

			episodeId = podcastDataService.episodeId(FEEDS.WITHOUT_GUID.EP2)

			messageService.for('audioPlayer').sendMessage('play', {episodeId: episodeId});

			$rootScope.$apply();

			// Tick audio with 1 second every second, to simulated that the audio
			// is playing
			tickAudioPromise = $interval(function() {
				audioBuilderService.tick(1000);
			}, 1000);
		});

		afterEach(function() {
			$interval.cancel(tickAudioPromise);
		});
		
		it('should broadcast playing message every second', function() {
			var messageCount = 0;
			
			messageService.for('audioPlayer').onMessage('playing', function() {
				messageCount++;
			});

			$interval.flush(10000);

			expect(messageCount).toBe(10);
		});

		it('should stop broadcasting after a pause message', function() {
			var messageCount = 0;
			
			messageService.for('audioPlayer').onMessage('playing', function() {
				messageCount++;
			});

			$interval.flush(10000);

			messageService.for('audioPlayer').sendMessage('pause');

			$interval.flush(10000);

			expect(messageCount).toBe(10);
		});

		it('should save playing time every 10 seconds', function() {
			var currentTime;

			$interval.flush(25000);

			podcastStorageService.getEpisodeUserData(episodeId).then(function(episodeUserData) {
				currentTime = episodeUserData.currentTime;
			});

			$rootScope.$apply();

			$interval.cancel(tickAudioPromise);

			expect(currentTime).toBe(20000);
		});
	});

	describe('next and previous', function() {
		describe('from playlist', function() {
			beforeEach(function() {
				messageService.for('audioPlayer').sendMessage('setOptions', {order: 'from_playlist'});
			});

			it('should play next', function() {
				podcastManager.addPodcast(FEEDS.WITH_GUID.URL);

				$rootScope.$apply();

				playlistService.add(podcastDataService.episodeId(FEEDS.WITH_GUID.EP2));
				playlistService.add(podcastDataService.episodeId(FEEDS.WITH_GUID.EP3));

				messageService.for('audioPlayer').sendMessage('play', {episodeId : podcastDataService.episodeId(FEEDS.WITH_GUID.EP2)});

				$rootScope.$apply();

				messageService.for('audioPlayer').sendMessage('playNext');

				$rootScope.$apply();

				expect(audioBuilderService.audio.src).toBe(FEEDS.WITH_GUID.EP3.enclosure.url);
			});
		});

		describe('from podcast', function() {
			beforeEach(function() {
				messageService.for('audioPlayer').sendMessage('setOptions', {order: 'from_podcast'});
			});

			it('should play next', function() {
				podcastManager.addPodcast(FEEDS.WITH_GUID.URL);

				$rootScope.$apply();

				messageService.for('audioPlayer').sendMessage('play', {episodeId : podcastDataService.episodeId(FEEDS.WITH_GUID.EP2)});

				$rootScope.$apply();

				messageService.for('audioPlayer').sendMessage('playNext');

				$rootScope.$apply();

				expect(audioBuilderService.audio.src).toBe(FEEDS.WITH_GUID.EP3.enclosure.url);
			});
		});

		describe('from last episodes', function() {
			beforeEach(function() {
				messageService.for('audioPlayer').sendMessage('setOptions', {order: 'from_last_episodes'});
			});

			it('should play next', function() {
				podcastManager.addPodcast(FEEDS.WITH_GUID.URL);
				podcastManager.addPodcast(FEEDS.WITHOUT_GUID.URL);

				$rootScope.$apply();

				messageService.for('audioPlayer').sendMessage('play', {episodeId : podcastDataService.episodeId(FEEDS.WITH_GUID.EP2)});

				$rootScope.$apply();

				messageService.for('audioPlayer').sendMessage('playNext');

				$rootScope.$apply();

				expect(audioBuilderService.audio.src).toBe(FEEDS.WITHOUT_GUID.EP3.enclosure.url);
			});
		});

		describe('continuous play', function() {
			beforeEach(function() {
				messageService.for('audioPlayer').sendMessage('setOptions', {
					continuous: true,
					order: 'from_last_episodes'
				});
			});

			it('should play next track when ended', function() {
				podcastManager.addPodcast(FEEDS.WITH_GUID.URL);
				podcastManager.addPodcast(FEEDS.WITHOUT_GUID.URL);

				$rootScope.$apply();

				messageService.for('audioPlayer').sendMessage('play', {episodeId : podcastDataService.episodeId(FEEDS.WITH_GUID.EP2)});

				$rootScope.$apply();

				audioBuilderService._end();

				$rootScope.$apply();

				expect(audioBuilderService.audio.src).toBe(FEEDS.WITHOUT_GUID.EP3.enclosure.url);
			});
		});
	});

	describe('command listener', function() {
		it('should toggle play pause on play_pause command', function() {
			spyOn(audioBuilderService.audio, 'pause');
			spyOn(browserService.notifications, 'clear');
			spyOn(browserService.notifications, 'create');

			podcastManager.addPodcast(FEEDS.WITH_GUID.URL);

			$rootScope.$apply();

			messageService.for('audioPlayer').sendMessage('play', {episodeId : podcastDataService.episodeId(FEEDS.WITH_GUID.EP2)});

			$rootScope.$apply();

			browserService.commands.onCommand._trigger('play_pause');

			expect(audioBuilderService.audio.pause).toHaveBeenCalled();

			expect(browserService.notifications.clear).toHaveBeenCalledWith('playing');

			expect(browserService.notifications.create).toHaveBeenCalledWith(
				'paused', {
					type: 'progress',
					iconUrl: FEEDS.WITH_GUID.IMAGE,
					title: 'paused',
					message: FEEDS.WITH_GUID.EP2.title,
					progress: 0
				}
			);
		});
	});

	// describe('state listener', function() {
	// 	it('should pause on lock when user opts so', function() {
	// 		spyOn(audioBuilderService.audio, 'pause');
	// 		spyOn(browserService.notifications, 'clear');
	// 		spyOn(browserService.notifications, 'create');

	// 		messageService.for('audioPlayer').sendMessage('setOptions', {pauseOnLock: true});

	// 		podcastManager.addPodcast(FEEDS.WITH_GUID.URL);

	// 		$rootScope.$apply();

	// 		messageService.for('audioPlayer').sendMessage('play', {episodeId : podcastDataService.episodeId(FEEDS.WITH_GUID.EP2)});

	// 		$rootScope.$apply();

	// 		browserService.idle.onStateChanged._trigger('locked');

	// 		expect(audioBuilderService.audio.pause).toHaveBeenCalled();

	// 		expect(browserService.notifications.clear).toHaveBeenCalledWith('playing');

	// 		expect(browserService.notifications.create).toHaveBeenCalledWith(
	// 			'paused', {
	// 				type: 'progress',
	// 				iconUrl: FEEDS.WITH_GUID.IMAGE,
	// 				title: 'paused',
	// 				message: FEEDS.WITH_GUID.EP2.title,
	// 				progress: 0
	// 			}
	// 		);
	// 	});
	// });
	
	describe('options storage', () => {
		it('should split between sync and local', () => {
			const optionsToSet = {
				order: 'from_playlist',
				continuous: true,
				removeWhenFinished: true,
				pauseOnLock: true
			};

			var optionsChangedPayload;
			var optionsGotten;

			messageService.for('audioPlayer').onMessage('optionsChanged', (options) => {optionsChangedPayload = options});
			messageService.for('audioPlayer').sendMessage('setOptions', optionsToSet);
			messageService.for('audioPlayer').sendMessage('getOptions', null, (options) => {optionsGotten = options});

			$rootScope.$apply();

			expect(optionsChangedPayload).toEqual(optionsToSet);
			expect(optionsGotten).toEqual(optionsToSet);

			expect(browserService.storage.sync._getFullStorage()['playerOptions']).toEqual({
				order: 'from_playlist',
				continuous: true,
				removeWhenFinished: true
			});

			expect(browserService.storage.local._getFullStorage()['playerOptions']).toEqual({
				pauseOnLock: true
			});
		});
	});
});