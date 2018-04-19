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

chrome.commands.onCommand.addListener(function(command) {
	switch(command) {
		case 'play_pause':
			analyticsService.trackEvent('audio', 'play_pause_hotkey');
			messageService.for('audioPlayer').sendMessage('togglePlayPause');
			break;
	}
});

if(chrome.i18n.getUILanguage() === 'pt-BR') {
	chrome.runtime.setUninstallURL('https://goo.gl/forms/fjOsh46l7IyZ1XIg1');
}
else {
	chrome.runtime.setUninstallURL('https://goo.gl/forms/80WF29XcdmLnSuAY2');
}

angular.bootstrap(document, ['podstationBackgroundApp', 'podstationBackgroundAppRun']);
