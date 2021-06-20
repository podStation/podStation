import PodcastManager from './entities/podcastManager';
import podStationBackgroundAppModule, { podStationBackgroundAppRunModule } from './ng/backgroundApp';

window.openPodStation = function(hash) {
	const APP_PATH = '/podstation.html';

	const views = chrome.extension.getViews({type:"tab"});
	
	if(views.length) {
		const firstView = views[0];

		if(hash) {
			firstView.location.pathname = APP_PATH
			firstView.location.hash = hash;
		}
		
		firstView.chrome.windows.getCurrent({}, (currentWindow) => {
			chrome.windows.update(currentWindow.id, {focused: true});
		});

		firstView.chrome.tabs.getCurrent((currentTab) => {
			chrome.tabs.update(currentTab.id, {active: true});
		});
	}
	else {
		window.open(APP_PATH + ( hash ? '#' + hash : ''));
	}
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

if(chrome.i18n.getUILanguage() === 'pt-BR') {
	chrome.runtime.setUninstallURL('https://goo.gl/forms/fjOsh46l7IyZ1XIg1');
}
else {
	chrome.runtime.setUninstallURL('https://goo.gl/forms/80WF29XcdmLnSuAY2');
}

angular.bootstrap(document, [podStationBackgroundAppModule.name, podStationBackgroundAppRunModule.name]);
