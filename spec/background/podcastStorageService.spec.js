'use strict';

describe('podcastStorageService',  function() {

	beforeEach(module('podstationBackgroundApp'));

	beforeEach(module(function($provide) {
		$provide.factory('browser', browserStorageMockFn);
	}));

	var podcastStorageService;
	var browserService;
	var $rootScope;

	beforeEach(inject(function($injector) {
		fixAngularInjector($injector);
		
		$rootScope = $injector.get('$rootScope');
		podcastStorageService = $injector.get('podcastStorageService');
		browserService = $injector.get('browser');
	}))

	describe('Podcast list storage', function() {
		it("should store one url", function() {
			var storedResult;
	
			podcastStorageService.storePodcastsByFeedUrls(['https://feedurl1.com']).then(function(result) {storedResult = result});
	
			$rootScope.$apply();
	
			expect(storedResult).toEqual(['https://feedurl1.com']);
	
			expect(browserService.storage.sync._getFullStorage()).toEqual({
				'syncPodcastList': [{
					url: 'https://feedurl1.com',
					i: 1
				}]
			});
		});
	
		it("should store two consecutive urls", function() {
			var resultToTest;
			var storedResult1;
			var storedResult2;
			
			podcastStorageService.storePodcastsByFeedUrls(['https://feedurl1.com']).then(function(result) {storedResult1 = result});;
			
			$rootScope.$apply();
	
			podcastStorageService.storePodcastsByFeedUrls(['https://feedurl2.com']).then(function(result) {storedResult2 = result});;
	
			$rootScope.$apply();
	
			expect(storedResult1).toEqual(['https://feedurl1.com']);
			expect(storedResult2).toEqual(['https://feedurl2.com']);
	
			expect(browserService.storage.sync._getFullStorage()).toEqual({
				'syncPodcastList': [{
					url: 'https://feedurl2.com',
					i: 2
				}, {
					url: 'https://feedurl1.com',
					i: 1
				}]
			});
		});
	
		it("should store two urls at the same time", function() {
			var storedResult;
	
			podcastStorageService.storePodcastsByFeedUrls(['https://feedurl1.com', 'https://feedurl2.com']).then(function(result) {storedResult = result});
	
			$rootScope.$apply();
	
			expect(storedResult).toEqual(['https://feedurl1.com', 'https://feedurl2.com']);
	
			expect(browserService.storage.sync._getFullStorage()).toEqual({
				'syncPodcastList': [{
					url: 'https://feedurl2.com',
					i: 2
				}, {
					url: 'https://feedurl1.com',
					i: 1
				}]
			});
		});
	
		it("should fill the gap in podcast id", function() {
			var storedResult;
	
			browserService.storage.sync._setFullStorage({
				'syncPodcastList': [{
					url: 'https://feedurl3.com',
					i: 3
				}, {
					url: 'https://feedurl1.com',
					i: 1
				}]
			});
	
			podcastStorageService.storePodcastsByFeedUrls(['https://feedurl2.com']).then(function(result) {storedResult = result});
	
			$rootScope.$apply();
	
			expect(storedResult).toEqual(['https://feedurl2.com']);
	
			expect(browserService.storage.sync._getFullStorage()).toEqual({
				'syncPodcastList': [{
					url: 'https://feedurl2.com',
					i: 2
				},	{
					url: 'https://feedurl3.com',
					i: 3
				}, {
					url: 'https://feedurl1.com',
					i: 1
				}]
			});
		});
	
		it("should store only new urls", function() {
			var storedResult;
	
			browserService.storage.sync._setFullStorage({
				'syncPodcastList': [{
					url: 'https://feedurl2.com',
					i: 2
				}, {
					url: 'https://feedurl1.com',
					i: 1
				}]
			});
	
			podcastStorageService.storePodcastsByFeedUrls(['https://feedurl2.com', 'https://feedurl3.com']).then(function(result) {storedResult = result});
	
			$rootScope.$apply();
	
			expect(storedResult).toEqual(['https://feedurl3.com']);
	
			expect(browserService.storage.sync._getFullStorage()).toEqual({
				'syncPodcastList': [{
					url: 'https://feedurl3.com',
					i: 3
				}, {
					url: 'https://feedurl2.com',
					i: 2
				}, {
					url: 'https://feedurl1.com',
					i: 1
				}]
			});
		});
	
		it("should retrieve stored urls", function() {
			var storedPodcasts;
			
			podcastStorageService.storePodcastsByFeedUrls(['https://feedurl1.com', 'https://feedurl2.com']);
	
			$rootScope.$apply();
	
			podcastStorageService.getStoredPodcasts().then(function(podcasts) {
				storedPodcasts = podcasts;
			});
	
			$rootScope.$apply();
	
			expect(storedPodcasts).toEqual([{
				url: 'https://feedurl2.com',
				i: 2
			}, {
				url: 'https://feedurl1.com',
				i: 1
			}]);
		});
	});

	describe('getEpisodeUserData', function() {
		var podcastDataService;
		
		beforeEach(inject(function($injector) {
			podcastDataService = $injector.get('podcastDataService');
		}));

		it("should get single episode info from sync", function() {
			browserService.storage.sync._setFullStorage({
				'syncPodcastList': [{
					url: 'https://feedurl2.com',
					i: 2
				}, {
					url: 'https://feedurl1.com',
					i: 1
				}],
				'P1': {
					'e': [{
						'i': 'E1-1',
						't': 15,
						'l': '2018-01-30T13:47:00.000Z'
					},
					{
						'i': 'E1-2',
						't': 30,
						'l': '2018-01-30T13:48:00.000Z'
					}]
				},
				'P2': {
					'e': [{
						'i': 'E2-1',
						't': 45,
						'l': '2018-01-30T13:49:00.000Z'
					},
					{
						'i': 'E2-2',
						't': 60,
						'l': '2018-01-30T13:50:00.000Z'
					}]
				}
			});

			var episodeId = podcastDataService.episodeId({
				podcastUrl: 'https://feedurl2.com',
				guid: 'E2-1'
			});

			var episodeUserData;
			
			podcastStorageService.getEpisodeUserData(episodeId).then(function(result) {
				episodeUserData = result;
			});

			$rootScope.$apply();

			expect(episodeUserData).toEqual({
				currentTime: 45,
				lastTimePlayed: new Date('2018-01-30T13:49:00.000Z')
			});
		});
	});
});