'use strict';

(function() {

	angular.module('podstationBackgroundApp')
	  .service('notificationManager', ['messageService', notificationManager]);

	function notificationManager(messageService) {

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

		// do it async as it need to be executed after
		// angular bootstrap
		angular.element(document).ready(function() {	
			messageService.for('notificationManager')
			.onMessage('getNotifications', function(messageContent, sendResponse) {
				sendResponse(notifications);
				return true;
			})
			.onMessage('removeNotification', function(messageContent) {
				instance.removeNotification(messageContent.notificationId);
			})
			.onMessage('removeAllNotifications', function() {
				instance.removeNotification();
			});
		});
	}
})();