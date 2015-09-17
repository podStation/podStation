$(document).ready(function() {
	chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {

		var tab = tabs[0];

		chrome.tabs.sendMessage(tab.id, {action: 'getFeeds'}, function(response) {

			if(response.length) {
				var html = '';

				html = renderFeedsInPage(response);

				$('#feedsInPage').html(html);

				$('#open').click(function(event) {
					event.preventDefault();
					chrome.runtime.getBackgroundPage(function(bgPage) {
						bgPage.openPodStation();
					});
				});

				$('.addPodcast').click(function(event) {
					event.preventDefault();

					chrome.runtime.getBackgroundPage(function(bgPage) {
						bgPage.podcastManager.addPodcast(event.currentTarget.id)
						bgPage.openPodStation('Podcasts');
					});
				});
			}
		});
	});
});
