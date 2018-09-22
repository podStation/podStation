'use strict';

(function() {

	angular.module('podstationBackgroundApp')
	  .service('notificationManager', ['messageService', 'browser', 'storageService', notificationManager]);

	function notificationManager(messageService, browserService, storageService) {
		var nextNotificationId = 1;
		var notifications = {};

		function notificationChanged(notificationId) {
			messageService.for('notificationManager').sendMessage('notificationChanged', notifications[notificationId]);
		}

		this.addNotification = function(notification) {
			notifications[nextNotificationId] = notification;

			notificationChanged(nextNotificationId);
			return nextNotificationId++;
		}

		this.updateNotification = function(notificationId, notification) {
			if(notificationId) {
				notifications[notificationId] = notification;
				notificationChanged(notificationId);
				return notificationId;
			}
			else {
				return this.addNotification(notification);
			}
		}

		this.removeNotification = function(notificationId) {
			if(notificationId) {
				notifications[notificationId] = undefined;
				notificationChanged(notificationId);
			}
			else {
				notifications = [];
				notificationChanged();
			}
		}

		const that = this;

		// do it async as it need to be executed after
		// angular bootstrap
		angular.element(document).ready(function() {	
			messageService.for('notificationManager')
			.onMessage('getNotifications', function(messageContent, sendResponse) {
				sendResponse(notifications);
				return true;
			})
			.onMessage('removeNotification', function(messageContent) {
				that.removeNotification(messageContent.notificationId);
			})
			.onMessage('removeAllNotifications', function() {
				that.removeNotification();
			});
		});

		// last viewd update news version
		storageService.loadFromStorage('lvn', null, 'sync').then((lastViewedUpdateNewsVersion) => {
			const updateNews = {
				'1.18.2':'https://github.com/podStation'
			};

			const version = browserService.app.getDetails().version;

			if(version !== lastViewedUpdateNewsVersion && updateNews[version]) {
				console.log('should show news');
			}
		});
	}
})();