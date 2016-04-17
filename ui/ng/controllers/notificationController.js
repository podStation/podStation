myApp.controller('notificationController', ['$scope', 'messageService', function($scope, messageService, episodePlayer) {
	$scope.notifications = [];

	function getNotifications() {
		messageService.for('notificationManager').sendMessage('getNotifications', {}, function(response) {
			$scope.$apply(function() {
				var notifications = response;

				$scope.notifications = [];

				for(key in notifications) {
					if(notifications[key]) {
						var notification = notifications[key];
						notification.id = key;
						notification.dismiss = function() {							
							messageService.for('notificationManager').sendMessage('removeNotification', {
								notificationId: this.id
							});
							
							// just to trigger a ui reaction wihtout
							// waiting for the notificationChanged message
							$scope.notifications.splice(
								$scope.notifications.indexOf(this), 1
							);
						}

						$scope.notifications.push(notification);
					}
				}
			});
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
