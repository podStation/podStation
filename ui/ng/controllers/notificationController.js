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

						$scope.notifications.push(notification);
					}
				}
			});
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
