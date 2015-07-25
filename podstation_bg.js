chrome.browserAction.onClicked.addListener(function(tab) {
	chrome.tabs.query({url: 'chrome-extension://*/podstation.html'}, function(tabs) {
		if(tabs.length) {
			chrome.tabs.update(tabs[0].id, {active: true});
			chrome.windows.update(tabs[0].windowId, {focused: true});
		}
		else {
			window.open('/podstation.html');
		}
	});
});

window.podcastManager = new PodcastManager();
