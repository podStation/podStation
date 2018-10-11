myApp.controller('notificationController', ['$scope', 'messageService', function($scope, messageService, episodePlayer) {
	$scope.notifications = [];
	
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

			const notificationsAfteSplit = notificationsFromBackground.reduce((previous, current) => {
				(current.important ?
					(previous.important = previous.important || []) :
					(previous.normal = previous.important || [])
				).push(current);
				
				return previous;
			})
			
			// Save existing groups
			$scope.notifications.forEach(function(notification) {
				if(notification.isGroup) {
					notificationGroups[notification.text] = notification;
					notificationGroups[notification.text].notifications = [];
				}
			});
			
			$scope.notifications = [];

			for(key in notificationsAfteSplit.normal) {
				if(notificationsAfteSplit.normal[key]) {
					var notification = notificationsAfteSplit.normal[key];
					notification.id = key;
					notification.dismiss = dismissNotification;
					$scope.notifications.push(notification);
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
}]);
