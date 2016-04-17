var NotificationManager;

(function(){
	var instance;

	NotificationManager = function() {
		if(instance) {
			return instance;
		}

		instance = this;

		var nextNotificationId = 1;
		var notifications = {};

		function notificationChanged(notificationId) {
			messageService.for('notificationManager').sendMessage('notificationChanged', notifications[notificationId]);
		}

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
	}
})();

var notificationManager = new NotificationManager();
