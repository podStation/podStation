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
			chrome.runtime.sendMessage({
				from: 'notificationManager',
				type: 'notificationChanged',
				notification: notifications[notificationId]
			});
		}

		chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
			if(!message.to || message.to != 'notificationManager') {
				return;
			}

			switch(message.type) {
				case 'getNotifications':
					sendResponse(notifications);
					return true;
				case 'removeNotification':
					instance.removeNotification(message.notificationId);
					break;
				case 'removeAllNotifications':
					instance.removeNotification();
					break;
			}
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
