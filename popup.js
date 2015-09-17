$(document).ready(function() {
	chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {

		var tab = tabs[0];

		chrome.tabs.sendMessage(tab.id, {action: 'getFeeds'}, function(response) {
			if(response.length) {
				chrome.runtime.getBackgroundPage(function(bgPage) {
					var html = '';

					response.forEach(function(item) {
						item.added = bgPage.podcastManager.getPodcast(item.feed) !== undefined;
					});

					html = renderFeedsInPage(response);

					$('#feedsInPage').html(html);

					$('#open').click(function(event) {
						event.preventDefault();
						bgPage.openPodStation();
						;
					});

					$('.addPodcast').click(function(event) {
						event.preventDefault();
						bgPage.podcastManager.addPodcast(event.currentTarget.id)
						bgPage.openPodStation('Podcasts');
					});
				});
			}
		});
	});
});
