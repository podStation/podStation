myApp.controller('notificationController', ['$scope',  function($scope, episodePlayer) {
	$scope.notifications = [];

	function getNotifications() {
		chrome.runtime.sendMessage({
			to: 'notificationManager',
			type: 'getNotifications',
		}, function(response) {
			$scope.$apply(function() {
				var notifications = response;

				$scope.notifications = [];

				for(key in notifications) {
					if(notifications[key]) {
						var notification = notifications[key];
						notification.id = key;
						notification.dismiss = function() {
							chrome.runtime.sendMessage({
								to: 'notificationManager',
								type: 'removeNotification',
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
		chrome.runtime.sendMessage({
			to: 'notificationManager',
			type: 'removeAllNotifications',
			notificationId: this.id
		});
	}

	chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
		if(message.from !== "notificationManager") {
			return;
		}

		switch (message.type) {
			case 'notificationChanged':
				getNotifications();
				break;
		}
	});

	getNotifications();
}]);
