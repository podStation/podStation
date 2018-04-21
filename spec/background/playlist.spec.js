'use strict';

describe('playlist', function() {

	beforeEach(module('podstationBackgroundApp'));

	beforeEach(module(function($provide) {
		$provide.factory('browser', browserStorageMockFn);

		// Dummies
		$provide.service('messageService', messageServiceMockFn);
		$provide.factory('analyticsService', analyticsServiceMockFn);
	}));

	var playlistService;
	var browserService;
	var podcastManager;
	var $rootScope;
	var podcastDataService;
	var ajaxSpy;

	beforeEach(inject(function($injector) {
		fixAngularInjector($injector);

		ajaxSpy = spyOn($, 'ajax').and.callFake(ajaxGetFeed);

		$rootScope = $injector.get('$rootScope');
		browserService = $injector.get('browser');
		podcastDataService = $injector.get('podcastDataService');
		podcastManager = $injector.get('podcastManager');
		playlistService = $injector.get('playlist');
		podcastManager.reset();
	}));

	describe('Add episode to list', function() {
		it("shoud add episode with guid to list", function() {
			podcastManager.addPodcast(FEEDS.WITH_GUID.URL);

			var episodeId = podcastDataService.episodeId(FEEDS.WITH_GUID.EP2);

			playlistService.add(episodeId);

			$rootScope.$apply();

			expect(browserService.storage.sync._getFullStorage().pl_default).toEqual({
				'e': [
					{
						'p': 1, 
						'e': FEEDS.WITH_GUID.EP2.guid,
					}
				]
			});
		});

		it("should add episode without guid to list", function() {
			podcastManager.addPodcast(FEEDS.WITHOUT_GUID.URL);

			var episodeId = podcastDataService.episodeId(FEEDS.WITHOUT_GUID.EP2);

			playlistService.add(episodeId);

			$rootScope.$apply();

			expect(browserService.storage.sync._getFullStorage().pl_default).toEqual({
				'e': [
					{
						'p': 1, 
						'e': FEEDS.WITHOUT_GUID.EP2.title,
						't': 't'
					}
				]
			});
		});

		it("shoud not add the same episode twice to list", function() {
			podcastManager.addPodcast(FEEDS.WITH_GUID.URL);

			var episodeId = podcastDataService.episodeId(FEEDS.WITH_GUID.EP2);

			playlistService.add(episodeId);
			playlistService.add(episodeId);

			$rootScope.$apply();

			expect(browserService.storage.sync._getFullStorage().pl_default).toEqual({
				'e': [
					{
						'p': 1, 
						'e': FEEDS.WITH_GUID.EP2.guid,
					}
				]
			});
		});

		it("Should add episodes from different podcasts with same guid", function() {
			ajaxSpy.and.callFake(ajaxGetFeedFromFile(FEEDS.WITH_GUID.FILE))

			podcastManager.addPodcast('https://feedurl1.com');
			podcastManager.addPodcast('https://feedurl2.com');

			var episodeId = podcastDataService.episodeId({
				podcastUrl: 'https://feedurl1.com',
				guid: FEEDS.WITH_GUID.EP2.guid
			});;

			playlistService.add(episodeId);

			var episodeId = podcastDataService.episodeId({
				podcastUrl: 'https://feedurl2.com',
				guid: FEEDS.WITH_GUID.EP2.guid
			});;

			playlistService.add(episodeId);

			$rootScope.$apply();

			expect(browserService.storage.sync._getFullStorage().pl_default).toEqual({
				'e': [{
					'p': 1, 
					'e': FEEDS.WITH_GUID.EP2.guid,
				},
				{
					'p': 2, 
					'e': FEEDS.WITH_GUID.EP2.guid,
				}]
			});
		});
	});

	describe('Remove episode', function() {
		it('should remove an added episode', function() {
			podcastManager.addPodcast(FEEDS.WITH_GUID.URL);

			playlistService.add(podcastDataService.episodeId(FEEDS.WITH_GUID.EP2));

			playlistService.add(podcastDataService.episodeId(FEEDS.WITH_GUID.EP3));

			playlistService.remove(podcastDataService.episodeId(FEEDS.WITH_GUID.EP2));

			$rootScope.$apply();

			expect(browserService.storage.sync._getFullStorage().pl_default).toEqual({
				'e': [{
					'p': 1, 
					'e': FEEDS.WITH_GUID.EP3.guid,
				}]
			});
		});
	});

	describe('Set episodes', function() {
		it('should set episodes', function() {
			podcastManager.addPodcast(FEEDS.WITH_GUID.URL);
			podcastManager.addPodcast(FEEDS.WITHOUT_GUID.URL);

			playlistService.set([
				podcastDataService.episodeId(FEEDS.WITH_GUID.EP2), 
				podcastDataService.episodeId(FEEDS.WITHOUT_GUID.EP2)
			]);

			$rootScope.$apply();

			expect(browserService.storage.sync._getFullStorage().pl_default).toEqual({
				'e': [{
					'p': 1, 
					'e': FEEDS.WITH_GUID.EP2.guid,
				}, {
					'p': 2, 
					'e': FEEDS.WITH_GUID.EP2.title,
					't': 't'
				}]
			});
		});
	});

	describe('Get episodes', function() {
		it('should get episodes', function() {
			podcastManager.addPodcast(FEEDS.WITH_GUID.URL);
			podcastManager.addPodcast(FEEDS.WITHOUT_GUID.URL);

			var episodeIds = [
				podcastDataService.episodeId(FEEDS.WITH_GUID.EP2), 
				podcastDataService.episodeId(FEEDS.WITHOUT_GUID.EP2)
			];

			playlistService.set(episodeIds);

			$rootScope.$apply();

			var result;
			playlistService.get().then(function(episodeIds) {
				result = episodeIds;
			});

			$rootScope.$apply();

			expect(result).toEqual(episodeIds);
		});

		it('should not return episodes from deleted podcasts', function() {
			podcastManager.addPodcast(FEEDS.WITH_GUID.URL);
			podcastManager.addPodcast(FEEDS.WITHOUT_GUID.URL);

			var episodeIds = [
				podcastDataService.episodeId(FEEDS.WITH_GUID.EP2), 
				podcastDataService.episodeId(FEEDS.WITHOUT_GUID.EP2)
			];

			playlistService.set(episodeIds);

			$rootScope.$apply();

			podcastManager.deletePodcast(FEEDS.WITHOUT_GUID.URL);

			$rootScope.$apply();

			var result;
			playlistService.get().then(function(episodeIds) {
				result = episodeIds;
			});

			$rootScope.$apply();

			expect(result).toEqual([episodeIds[0]]);
		});

		it('should not return episodes removed from the feed', function() {
			ajaxSpy.and.callFake(ajaxGetFeedFromFile('feed-with-guid.xml'));
			podcastManager.addPodcast(FEEDS.WITH_GUID.URL);

			const episodeIds = [
				podcastDataService.episodeId(FEEDS.WITH_GUID.EP1), 
				podcastDataService.episodeId(FEEDS.WITH_GUID.EP2)
			];

			playlistService.set(episodeIds);

			$rootScope.$apply();

			ajaxSpy.and.callFake(ajaxGetFeedFromFile('feed-with-guid-without-1st-episode.xml'));
			podcastManager.updatePodcast(FEEDS.WITH_GUID.URL);

			$rootScope.$apply();

			var result;
			playlistService.get().then(function(episodeIds) {
				result = episodeIds;
			});

			$rootScope.$apply();

			expect(result).toEqual([episodeIds[1]]);
		});
	});
});