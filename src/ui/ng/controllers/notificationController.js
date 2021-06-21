function NotificationController($scope, messageService, episodePlayer) {
	$scope.notifications = [];
	$scope.importantNotifications = [];

	$scope.dontShowAnymore = dontShowAnymore;
	
	function dismissNotification() {
		messageService.for('notificationManager').sendMessage('removeNotification', {
			notificationId: this.id
		});
				
		// just to trigger a ui reaction wihtout
		// waiting for the notificationChanged message
		var indexOf = $scope.notifications.indexOf(this);
		
		if(indexOf >= 0) {
			$scope.notifications.splice(indexOf, 1);
		}
	}

	function processNotificationsFromBackground(notificationsFromBackground) {
		$scope.$apply(function() {
			var notificationGroups = {};

			const notificationsAfterSplit = {}; 
			
			for(let key in notificationsFromBackground) {
				const notification = notificationsFromBackground[key];

				(notification.important ?
					(notificationsAfterSplit.important = notificationsAfterSplit.important || {}) :
					(notificationsAfterSplit.normal    = notificationsAfterSplit.normal    || {})
				)[key] = notification;
			}
			
			// Save existing groups
			$scope.notifications.forEach(function(notification) {
				if(notification.isGroup) {
					notificationGroups[notification.text] = notification;
					notificationGroups[notification.text].notifications = [];
				}
			});
			
			$scope.notifications = [];
			$scope.importantNotifications = [];

			for(let key in notificationsAfterSplit.normal) {
				if(notificationsAfterSplit.normal[key]) {
					var notification = notificationsAfterSplit.normal[key];
					notification.id = key;
					notification.dismiss = dismissNotification;
					$scope.notifications.push(notification);
				}
			}

			for(let key in notificationsAfterSplit.important) {
				if(notificationsAfterSplit.important[key]) {
					var notification = notificationsAfterSplit.important[key];
					notification.id = key;
					notification.dismiss = dismissNotification;
					$scope.importantNotifications.push(notification);
				}
			}
			
			// build the notification groups
			$scope.notifications.forEach(function(notification) {
				if(notification.groupName) {
					if(!notificationGroups[notification.groupName]) {
						notificationGroups[notification.groupName] = {
							id: notification.id,
							isGroup: true,
							collapsed: true,
							text: notification.groupName,
							notifications: [],
							toggleCollapsed: function() {this.collapsed = !this.collapsed;}
						}
					}
					
					notificationGroups[notification.groupName].notifications.push(notification);
				}
			});
			
			// replace notifcations by groups if > 3
			for(key in notificationGroups) {
				if(notificationGroups[key].notifications.length > 3) {
					var indexOfFirst = -1;
					
					notificationGroups[key].notifications.forEach(function(notification) {
						var indexOf;
						
						indexOf = $scope.notifications.indexOf(notification);
						
						if(indexOfFirst < 0) {
							indexOfFirst = indexOf;
						} 
						
						$scope.notifications.splice(indexOf, 1);
					});
					
					$scope.notifications.splice(indexOfFirst, 0, notificationGroups[key]);
				}
			}
		});
	}

	function getNotifications() {
		messageService.for('notificationManager').sendMessage('getNotifications', {}, function(response) {
			processNotificationsFromBackground(response);
		});
	}

	$scope.dismissAll = function() {
		messageService.for('notificationManager').sendMessage('removeAllNotifications');
	}	

	messageService.for('notificationManager').onMessage('notificationChanged', function() {
		getNotifications();
	});

	getNotifications();

	messageService.for('notificationManager').sendMessage('setCurrentVersionAsViewed');

	return;

	function dontShowAnymore(notificationId) {
		messageService.for('notificationManager').sendMessage('dontShowAnymore', {notificationId: notificationId});
	}
}

export default NotificationController;
