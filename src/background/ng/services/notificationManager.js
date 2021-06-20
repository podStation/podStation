'use strict';

const versionNews = {
	'1.19.1': {url: 'https://podstation.blogspot.com/2019/02/version-news-v1190.html'},
	'1.20.0': {url: 'https://podstation.blogspot.com/2019/03/version-news-v1200-persistent-playback.html'},
	'1.22.0': {url: 'https://github.com/podStation/podStation/tree/v1.22.0/docs/release_notes/v1.22.0.md'},
	'1.22.1': {url: 'https://github.com/podStation/podStation/tree/v1.22.1/docs/release_notes/v1.22.1.md'},
	'1.24.0': {url: 'https://github.com/podStation/podStation/tree/v1.24.0/docs/release_notes/v1.24.0.md'},
	'1.25.0': {url: 'https://github.com/podStation/podStation/tree/v1.25.0/docs/release_notes/v1.25.0.md'},
	'1.26.0': {url: 'https://github.com/podStation/podStation/tree/v1.26.0/docs/release_notes/v1.26.0.md'},
	'1.27.0': {url: 'https://github.com/podStation/podStation/tree/v1.27.0/docs/release_notes/v1.27.0.md'},
	'1.28.0': {url: 'https://github.com/podStation/podStation/tree/v1.28.0/docs/release_notes/v1.28.0.md'},
	'1.29.0': {url: 'https://github.com/podStation/podStation/tree/v1.29.0/docs/release_notes/v1.29.0.md'},
	'1.31.0': {url: 'https://github.com/podStation/podStation/tree/v1.31.0/docs/release_notes/v1.31.0.md'},
	'1.34.0': {url: 'https://github.com/podStation/podStation/tree/v1.34.0/docs/release_notes/v1.34.0.md'},
	'1.34.2': {url: 'https://github.com/podStation/podStation/tree/v1.34.2/docs/release_notes/v1.34.2.md'},
	'1.35.0': {url: 'https://github.com/podStation/podStation/tree/v1.35.0/docs/release_notes/v1.35.0.md'},
	'1.36.0': {url: 'https://github.com/podStation/podStation/tree/v1.36.0/docs/release_notes/v1.36.0.md'},
	'1.40.0': {url: 'https://github.com/podStation/podStation/blob/v1.40.0/CHANGELOG.md'},
	'1.40.1': {url: 'https://github.com/podStation/podStation/blob/v1.40.1/CHANGELOG.md'},
	'1.41.0': {url: 'https://github.com/podStation/podStation/blob/v1.41.0/CHANGELOG.md'},
	'1.42.0': {url: 'https://github.com/podStation/podStation/blob/v1.42.0/CHANGELOG.md'},
	'1.43.0': {url: 'https://github.com/podStation/podStation/blob/v1.43.0/CHANGELOG.md'},
	'1.44.0': {url: 'https://github.com/podStation/podStation/blob/v1.44.0/CHANGELOG.md'}
};

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

export { versionNews };
export default notificationManager;