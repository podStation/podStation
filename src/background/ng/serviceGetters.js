import { getAngularService } from '../../reuse/ng/reuse';

function getPodcastStorageService() {
	return getAngularService('podcastStorageService');
}

function getNotificationManagerService() {
	return getAngularService('notificationManager');
}

export { getPodcastStorageService, getNotificationManagerService };