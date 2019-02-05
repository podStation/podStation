'use strict';

(function() {

	angular.module('podstationBackgroundApp').constant('versionNews', {
		'1.18.2': {url: 'https://github.com/podStation'}
	});

	angular.module('podstationBackgroundApp')
	  .service('notificationManager', ['versionNews', 'messageService', 'browser', 'storageService', 'optionsManagerService', notificationManager]);

	function notificationManager(versionNews, messageService, browserService, storageService, optionsManagerService) {
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
				delete notifications[notificationId];
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
			.onMessage('setCurrentVersionAsViewed', () => {
				storageService.loadFromStorage('nm', (stored) => {
					stored.l = browserService.app.getDetails().version;
					return stored;
				}, 'sync', () => {return {};});
			})
			.onMessage('removeNotification', function(messageContent) {
				that.removeNotification(messageContent.notificationId);
			})
			.onMessage('removeAllNotifications', function() {
				that.removeNotification();
			})
			.onMessage('dontShowAnymore', (messageContent) => {
				if(!notifications[messageContent.notificationId])
					return;
				
				switch(notifications[messageContent.notificationId].type) {
					case 'VersionNews':
						optionsManagerService.setShowVersionNews(false);
						break;
				}

				that.removeNotification(messageContent.notificationId);
			});
		});

		// last viewed update news version
		storageService.loadFromStorage('nm', null, 'sync', () => {return {};}).then((notificationManagerStorage) => {
			optionsManagerService.getOptions((options) => {
				if(options.s) {
					const version = browserService.app.getDetails().version;

					if(version !== notificationManagerStorage.l && versionNews[version]) {
						that.addNotification({
							type: 'VersionNews',
							important: true,
							version: version,
							url: versionNews[version].url
						});
					}
				}
			});
		});
	}
})();