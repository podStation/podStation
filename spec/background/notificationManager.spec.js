'use strict';

describe('notificationManager',  function() {

	const NOTIFICATION1 = {
		icon: 'fa-check',
		groupName: 'New episodes',
		text: ' new episode(s) for '
	}

	beforeEach(module('podstationBackgroundApp'));

	beforeEach(module(function($provide) {
		$provide.factory('browser', browserStorageMockFn);

		$provide.constant('versionNews', {
			'1.18.2': {url: 'https://podstation.com/1.18.2'},
			'1.18.1': {url: 'https://podstation.com/1.18.1'}
		});
	}));

	var $rootScope;
	var messageService;
	var browserService;

	beforeEach(inject(function($injector) {
		fixAngularInjector($injector);
		
		$rootScope = $injector.get('$rootScope');
		
		messageService = $injector.get('messageService');
		messageService.reset();

		browserService = $injector.get('browser');
	}));

	describe('Non service startup tests', () => {

		var notificationManagerService;

		beforeEach(inject(function($injector) {
			notificationManagerService = $injector.get('notificationManager');
		}));

		describe('updateNotification', function() {
			it('should add a notification', function() {
				const id = notificationManagerService.updateNotification(null, NOTIFICATION1);

				var notifications;

				messageService.for('notificationManager').sendMessage('getNotifications', null, function(response) {
					notifications = response;
				});

				$rootScope.$apply();

				expect(notifications[id]).toBeDefined();
			});
		});

		describe('removeNotification', function() {
			it('should remove one notification', function() {
				const id = notificationManagerService.updateNotification(null, NOTIFICATION1);

				var notifications;

				messageService.for('notificationManager').sendMessage('removeNotification', {notificationId: id});

				messageService.for('notificationManager').sendMessage('getNotifications', null, function(response) {
					notifications = response;
				});

				$rootScope.$apply();

				expect(notifications[id]).toBeUndefined();
			});

			it('should remove all notifications', function() {
				const id = notificationManagerService.updateNotification(null, NOTIFICATION1);

				var notifications;

				messageService.for('notificationManager').sendMessage('removeAllNotifications');

				messageService.for('notificationManager').sendMessage('getNotifications', null, function(response) {
					notifications = response;
				});

				$rootScope.$apply();

				expect(notifications[id]).toBeUndefined();
			});
		});
	});

	describe('service startup tests', () => {
		var _$injector;

		beforeEach(inject(function($injector) {
			_$injector = $injector;
		}));

		describe('Version news', () => {
			// this group will need a separate provider because we need some setup before the service is instantiated
			it('should return version news when version not seen yet, and option is on', () => {
				parameterizedTest(true, '1.18.1', '1.18.2', 'https://podstation.com/1.18.2');
			});

			it('should NOT return version news when version already seen, and option is on', () => {
				parameterizedTest(true, '1.18.2', '1.18.2', null);
			});

			function parameterizedTest(showNews, lastViewedVersionNews, currentVersion, url) {
				messageService.for('optionsManager').sendMessage('saveOptions', {s: showNews});

				browserService.storage.sync.set({
					'nm': {
						'l': lastViewedVersionNews
					}
				});

				browserService.app._details.version = currentVersion;

				// notificationManager instantiation has to be deferred until here, as the setup
				// above has to take place before the instantiation
				_$injector.get('notificationManager');

				var notifications;

				messageService.for('notificationManager').sendMessage('getNotifications', null, function(response) {
					notifications = response;
				});

				$rootScope.$apply();

				expect(notifications).toEqual(url ? {
					1: {
						type: 'VersionNews',
						important: true,
						version: currentVersion,
						url: url
					}
				} : {});
			}
		});
	})	
});