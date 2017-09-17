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
			analyticsService.trackEvent('audio', 'play_pause_hotkey');
			messageService.for('audioPlayer').sendMessage('togglePlayPause');
			break;
	}
});

optionsManager.getOptions(function(options) {
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

if(chrome.i18n.getUILanguage() === 'pt-BR') {
	chrome.runtime.setUninstallURL('https://goo.gl/forms/fjOsh46l7IyZ1XIg1');
}
else {
	chrome.runtime.setUninstallURL('https://goo.gl/forms/80WF29XcdmLnSuAY2');
}

