'use strict';

describe('podcastManager',  function() {

	const NOTIFICATION1 = {
		icon: 'fa-check',
		groupName: 'New episodes',
		text: ' new episode(s) for '
	}

	beforeEach(module('podstationBackgroundApp'));

	beforeEach(module(function($provide) {
		$provide.factory('browser', browserStorageMockFn);
	}));

	var $rootScope;
	var messageService;

	var notificationManagerService;

	beforeEach(inject(function($injector) {
		fixAngularInjector($injector);
		
		$rootScope = $injector.get('$rootScope');
		
		messageService = $injector.get('messageService');
		messageService.reset();

		notificationManagerService = $injector.get('notificationManager');

		// messageService.for('notificationManager').sendMessage
	}))

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