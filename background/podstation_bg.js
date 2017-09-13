window.openPodStation = function(hash) {
	chrome.tabs.query({url: 'chrome-extension://*/podstation.html'}, function(tabs) {
		if(tabs.length) {
			chrome.tabs.update(tabs[0].id, {active: true});
			chrome.windows.update(tabs[0].windowId, {focused: true});

			if(hash) {
				chrome.tabs.update(tabs[0].id, {url: '/podstation.html' + '#' + hash });
			}
		}
		else {
			window.open('/podstation.html' + ( hash ? '#' + hash : ''));
		}
	});
}

chrome.browserAction.onClicked.addListener(function(tab) {
	window.openPodStation();
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	if(request.action === 'feedFound') {
		chrome.browserAction.setBadgeText({
			text: '!?',
			tabId: sender.tab.id
		});

		chrome.browserAction.setTitle({
			title: 'podStation - a feed was found! click to add...',
			tabId: sender.tab.id
		});

		chrome.browserAction.setPopup({
			popup: 'popup.html',
			tabId: sender.tab.id
		})
	}
});

window.podcastManager = new PodcastManager();

function setupAutoUpdate(options, updateNow) {
	chrome.alarms.clear('updatePodcasts');

	if(!options.autoUpdate) {
		return;
	}

	chrome.alarms.create('updatePodcasts', {
		periodInMinutes: parseInt(options.autoUpdateEvery)
	});

	chrome.alarms.onAlarm.addListener(function (alarm) {
		if(alarm.name !== 'updatePodcasts') {
			return;
		}

		window.podcastManager.updatePodcast();
	});

	if(updateNow) {
		window.podcastManager.updatePodcast();
	}
}

messageService.for('optionsManager').onMessage('optionsChanged', function(options) {
	setupAutoUpdate(options, false);
});

chrome.commands.onCommand.addListener(function(command) {
	switch(command) {
		case 'play_pause':
			messageService.for('audioPlayer').sendMessage('togglePlayPause');
			break;
	}
});

optionsManager.getOptions(function(options) {
	setupAutoUpdate(options, true);
});

if(chrome.i18n.getUILanguage() === 'pt-BR') {
	chrome.runtime.setUninstallURL('https://goo.gl/forms/fjOsh46l7IyZ1XIg1');
}
else {
	chrome.runtime.setUninstallURL('https://goo.gl/forms/80WF29XcdmLnSuAY2');
}

angular.module('podstationBackgroundApp').run(['$window', 'playlist', 'browser', function($window, playlist, browser) {
	// this is only to ensure the services are created as soon as possible

	browser.runtime.onInstalled.addListener(function(details) {
		var appDetails = browser.app.getDetails();

		if(details.reason === 'update') {
			switch(appDetails.version) {
				case '1.14.7':
					$window.open('https://podstation.blogspot.de/2017/09/v1147-important-update-on-collection-of.html')
					break;
			}
		}

		console.log(details);
	});
}]);
