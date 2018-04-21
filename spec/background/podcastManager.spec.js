'use strict';

describe('podcastManager',  function() {

	beforeEach(module('podstationBackgroundApp'));

	beforeEach(module(function($provide) {
		$provide.factory('browser', browserStorageMockFn);

		// Dummies
		$provide.factory('analyticsService', analyticsServiceMockFn);
		// $provide.service('messageService', messageServiceMockFn);
	}));

	var playlistService;
	var browserService;
	var podcastManager;
	var podcastDataService;
	var dateService;
	var $rootScope;
	var $httpBackend;
	var ajaxSpy;

	beforeEach(inject(function($injector) {
		fixAngularInjector($injector);
		
		ajaxSpy = spyOn($, 'ajax').and.callFake(ajaxGetFeed);

		$rootScope = $injector.get('$rootScope');
		browserService = $injector.get('browser');
		podcastDataService = $injector.get('podcastDataService');
		dateService = $injector.get('dateService');
		podcastManager = $injector.get('podcastManager');
		podcastManager.reset();
	}))

	describe('addPodcast', function() {
		it('should store the added podcast', function() {
			podcastManager.addPodcast('https://feed-with-guid.podstation.com');

			$rootScope.$apply();

			expect(browserService.storage.sync._getFullStorage()).toEqual({
				'syncPodcastList': [{
					url: 'https://feed-with-guid.podstation.com',
					i: 1
				}]
			});

			expect(browserService.storage.local._getFullStorage()).toEqual(JSON.parse(syncGetFeedContent('feed-with-guid.json').response));
		});
	});

	describe('setEpisodeProgress', function() {
		it('should store information for an episode with guid', function() {
			var now = new Date();
			spyOn(dateService, 'now').and.returnValue(now);

			podcastManager.addPodcast('https://feed-with-guid.podstation.com');

			const episodeId = podcastDataService.episodeId({
				podcastUrl: 'https://feed-with-guid.podstation.com',
				guid: 'http://feed1.podstation.com/?p=2'
			});

			podcastManager.setEpisodeProgress(episodeId, 120);

			$rootScope.$apply();

			expect(browserService.storage.sync._getFullStorage()['P1']).toEqual({
				'e': [{
					'i': 'http://feed1.podstation.com/?p=2',
					't': 120,
					'l': JSON.parse(JSON.stringify(now))
				}]
			});
		});

		it('should clean up when setting it to zero', function() {
			var now = new Date();
			spyOn(dateService, 'now').and.returnValue(now);

			podcastManager.addPodcast(FEEDS.WITH_GUID.URL);

			const episodeId1 = podcastDataService.episodeId(FEEDS.WITH_GUID.EP1);
			const episodeId2 = podcastDataService.episodeId(FEEDS.WITH_GUID.EP2);

			podcastManager.setEpisodeProgress(episodeId1, 60);
			podcastManager.setEpisodeProgress(episodeId2, 120);

			$rootScope.$apply();

			podcastManager.setEpisodeProgress(episodeId1, 0);

			$rootScope.$apply();

			expect(browserService.storage.sync._getFullStorage()['P1']).toEqual({
				'e': [{
					'i': 'http://feed1.podstation.com/?p=2',
					't': 120,
					'l': JSON.parse(JSON.stringify(now))
				}]
			});
		});

		it('should store information for an episode without guid, but with title', function() {
			var now = new Date();
			spyOn(dateService, 'now').and.returnValue(now);

			podcastManager.addPodcast('https://feed-without-guid.podstation.com');

			const episodeId = podcastDataService.episodeId({
				podcastUrl: 'https://feed-without-guid.podstation.com',
				title: 'Title 2'
			});

			podcastManager.setEpisodeProgress(episodeId, 120);

			$rootScope.$apply();

			expect(browserService.storage.sync._getFullStorage()['P1']).toEqual({
				'e': [{
					'i': 'Title 2',
					's': 't',
					't': 120,
					'l': JSON.parse(JSON.stringify(now))
				}]
			});
		});
	});

	describe('deletePodcast', function() {
		it('should delete from storage and manager', function() {
			podcastManager.addPodcast(FEEDS.WITH_GUID.URL);
			podcastManager.addPodcast(FEEDS.WITHOUT_GUID.URL);
	
			$rootScope.$apply();

			const episodeId = podcastDataService.episodeId(FEEDS.WITHOUT_GUID.EP2);

			podcastManager.setEpisodeProgress(episodeId, 120);

			$rootScope.$apply();

			podcastManager.deletePodcast(FEEDS.WITHOUT_GUID.URL);

			$rootScope.$apply();
	
			expect(browserService.storage.sync._getFullStorage()).toEqual({
				'syncPodcastList': [{
					url: FEEDS.WITH_GUID.URL,
					i: 1
				}]
			});

			expect(browserService.storage.local._getFullStorage()).toEqual(JSON.parse(syncGetFeedContent('feed-with-guid.json').response));

			expect(podcastManager.podcastList.length).toEqual(1);
		});
	});

	describe('getEpisodesInProgress', function() {
		var messageService;

		beforeEach(inject(function($injector){
			messageService = $injector.get('messageService');
		}));

		it('should respond with all episodes in progress when one podcast have one ep in progress', function() {
			var now = new Date();
			spyOn(dateService, 'now').and.returnValue(now);

			podcastManager.addPodcast(FEEDS.WITH_GUID.URL);
			podcastManager.addPodcast(FEEDS.WITHOUT_GUID.URL);

			const episodeId1 = podcastDataService.episodeId(FEEDS.WITH_GUID.EP2);
			const episodeId2 = podcastDataService.episodeId(FEEDS.WITHOUT_GUID.EP2);

			podcastManager.setEpisodeProgress(episodeId1, 60);

			$rootScope.$apply();

			var episodesInProgress;
			
			podcastManager.getEpisodesInProgress().then(function(result) {
				episodesInProgress = result;
			});

			$rootScope.$apply();
			
			// I'm not sure yet on the contract I want to fullfil besides the
			// currentTime
			expect(episodesInProgress.map(function(item) { return item.episodeUserData.currentTime })).toEqual([
				60
			]);
		});

		it('should respond with all episodes in progress when all podcasts have one ep in progress', function() {
			var now = new Date();
			spyOn(dateService, 'now').and.returnValue(now);

			podcastManager.addPodcast(FEEDS.WITH_GUID.URL);
			podcastManager.addPodcast(FEEDS.WITHOUT_GUID.URL);

			const episodeId1 = podcastDataService.episodeId(FEEDS.WITH_GUID.EP2);
			const episodeId2 = podcastDataService.episodeId(FEEDS.WITHOUT_GUID.EP2);

			podcastManager.setEpisodeProgress(episodeId1, 60);
			podcastManager.setEpisodeProgress(episodeId2, 120);

			$rootScope.$apply();

			var episodesInProgress;
			
			podcastManager.getEpisodesInProgress().then(function(result) {
				episodesInProgress = result;
			});

			$rootScope.$apply();
			
			// I don't care about the order, so I'm sorting
			// before checking the result
			episodesInProgress.sort(function(a, b) {
				return a.episodeUserData.currentTime - b.episodeUserData.currentTime;
			});

			// I'm not sure yet on the contract I want to fullfil besides the
			// currentTime
			expect(episodesInProgress.map(function(item) { return item.episodeUserData.currentTime })).toEqual([
				60,
				120
			]);
		});

		it('should ignore episodes that do not exist anymore', function() {
			var now = new Date();

			spyOn(dateService, 'now').and.returnValue(now);

			ajaxSpy.and.callFake(ajaxGetFeedFromFile(FEEDS.WITH_GUID.FILE));
			
			podcastManager.addPodcast(FEEDS.WITH_GUID.URL);

			const episodeId1 = podcastDataService.episodeId(FEEDS.WITH_GUID.EP1);
			const episodeId2 = podcastDataService.episodeId(FEEDS.WITH_GUID.EP2);

			podcastManager.setEpisodeProgress(episodeId1, 60);
			podcastManager.setEpisodeProgress(episodeId2, 120);

			$rootScope.$apply();

			ajaxSpy.and.callFake(ajaxGetFeedFromFile(FEEDS.WITH_GUID.FILE_WITHOUT_1ST_EP));

			podcastManager.updatePodcast();

			var episodesInProgress;
			
			podcastManager.getEpisodesInProgress().then(function(result) {
				episodesInProgress = result;
			});

			$rootScope.$apply();
			
			// I don't care about the order, so I'm sorting
			// before checking the result
			episodesInProgress.sort(function(a, b) {
				return a.episodeUserData.currentTime - b.episodeUserData.currentTime;
			});

			// I'm not sure yet on the contract I want to fullfil besides the
			// currentTime
			expect(episodesInProgress.map(function(item) { return item.episodeUserData.currentTime })).toEqual([
				120
			]);
		});
	});
});