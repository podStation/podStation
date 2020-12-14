angular.module('podstationBackgroundApp', ['podstationInternalReuse']);

// separate module for initialization tasks we don't want to perform when 
// runnign automated tests
angular.module('podstationBackgroundAppRun', ['podstationBackgroundApp', 'podstationInternalReuse']);

angular.module('podstationBackgroundApp').config(['messageServiceProvider', function(messageServiceProvider) {
	messageServiceProvider.setIsBackgroundPage(true);
}]);

angular.module('podstationBackgroundAppRun').run([
'$window', '$timeout', '$log', 'playlist', 'browser', 'analyticsService', 'audioPlayerService', 'messageService', 'optionsManagerService', 'podcastStorageService', 'podcastManager',
function($window, $timeout, $log, playlist, browser, analyticsService, audioPlayerService, messageService, optionsManagerService, podcastStorageService, podcastManager) {
	// playlist, analyticsService and audioPlayerService, are here only to ensure the services are created as soon as possible
	
	browser.runtime.onInstalled.addListener(function(details) {
		var appDetails = browser.app.getDetails();

		if(details.reason === 'update') {
			switch(appDetails.version) {
				case '1.14.7':
					$window.open('https://podstation.blogspot.de/2017/09/v1147-important-update-on-collection-of.html')
					break;
				case '1.21.0':
					$window.open('https://github.com/podStation/podStation/tree/v1.21.0/docs/release_notes/v1.21.0.md')
					break;
				case '1.32.2':
					$window.open('https://github.com/podStation/podStation/blob/master/docs/blog/2020-12-13-feature-at-risk.md#2020-12-13-feature-at-risk-playing-podcast-on-the-background')
					break;
			}
		}
		else if(details.reason === 'install') {
			podcastStorageService.getStoredPodcasts().then(function(storedPodcasts) {
				if(!storedPodcasts.length) {
					$window.openPodStation('Welcome');
				}
			});
		}
	});

	messageService.for('optionsManager').onMessage('optionsChanged', function(options) {
		setupAutoUpdate(options, false);
	});

	optionsManagerService.getOptions(function(options) {
		// Give the podcastManager some time to warm up (load podcasts 
		// from local storage)
		// TODO: hook this to some event triggered after podcasts are loaded from 
		$timeout(function() {
			setupAutoUpdate(options, true);
		}, 1000);		
	
		if(options.analytics) {
			(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
			(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
			m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
			})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');
	
			ga('create', 'UA-67249070-2', 'auto');
			ga('set', 'checkProtocolTask', function(){});
		}
	});

	chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
		console.info('External message received from: %s', sender.id || sender.url);

		switch(message.type) {
			case 'isInstalled':
				sendResponse({installed: true});
				break;
			case 'subscribeToPodcast':
				analyticsService.trackEvent('feed', 'add_by_external_message', sender.id || sender.url);
				podcastManager.addPodcast(message.feedUrl);
				break;
		}
	});

	function setupAutoUpdate(options, updateNow) {
		browser.alarms.clear('updatePodcasts');
	
		if(!options.autoUpdate) {
			return;
		}

		$log.info('Setting up auto update');
	
		browser.alarms.create('updatePodcasts', {
			periodInMinutes: parseInt(options.autoUpdateEvery)
		});
	
		browser.alarms.onAlarm.addListener(function (alarm) {
			if(alarm.name !== 'updatePodcasts') {
				return;
			}
			
			$log.info('Periodic podcast update started');
			$window.podcastManager.updatePodcast();
		});
	
		if(updateNow) {
			$log.info('Initial podcast update started');
			$window.podcastManager.updatePodcast();
		}
	}
}]);

function getPodcastStorageService() {
	return getAngularService('podcastStorageService');
}

function getNotificationManagerService() {
	return getAngularService('notificationManager');
}