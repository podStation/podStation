angular.module('podstationBackgroundApp', ['podstationInternalReuse']);

// separate module for initialization tasks we don't want to perform when 
// runnign automated tests
angular.module('podstationBackgroundAppRun', ['podstationBackgroundApp', 'podstationInternalReuse']);

angular.module('podstationBackgroundApp').config(['messageServiceProvider', function(messageServiceProvider) {
	messageServiceProvider.setIsBackgroundPage(true);
}]);

angular.module('podstationBackgroundAppRun').run(['$window', 'playlist', 'browser', 'analyticsService', 'audioPlayerService', 'messageService', 'optionsManagerService',
function($window, playlist, browser, analyticsService, audioPlayerService, messageService, optionsManagerService) {
	
	// playlist, analyticsService and audioPlayerService, are here only to ensure the services are created as soon as possible
	
	browser.runtime.onInstalled.addListener(function(details) {
		var appDetails = browser.app.getDetails();

		if(details.reason === 'update') {
			switch(appDetails.version) {
				case '1.14.7':
					$window.open('https://podstation.blogspot.de/2017/09/v1147-important-update-on-collection-of.html')
					break;
			}
		}
	});

	messageService.for('optionsManager').onMessage('optionsChanged', function(options) {
		setupAutoUpdate(options, false);
	});

	//var optionsManager = new OptionsManager();

	optionsManagerService.getOptions(function(options) {
		setupAutoUpdate(options, true);
	
		if(options.analytics) {
			(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
			(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
			m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
			})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');
	
			ga('create', 'UA-67249070-2', 'auto');
			ga('set', 'checkProtocolTask', function(){});
		}
	});

	function setupAutoUpdate(options, updateNow) {
		browser.alarms.clear('updatePodcasts');
	
		if(!options.autoUpdate) {
			return;
		}
	
		browser.alarms.create('updatePodcasts', {
			periodInMinutes: parseInt(options.autoUpdateEvery)
		});
	
		browser.alarms.onAlarm.addListener(function (alarm) {
			if(alarm.name !== 'updatePodcasts') {
				return;
			}
	
			$window.podcastManager.updatePodcast();
		});
	
		if(updateNow) {
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