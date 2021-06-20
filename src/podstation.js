import $ from 'jquery';

$(document).ready(function() {
	$('#updateAll').click(function(event) {
		event.preventDefault();

		chrome.runtime.getBackgroundPage(function(bgPage) {
			analyticsService.trackEvent('feed', 'user_update_all');
			bgPage.podcastManager.updatePodcast('');
		});
	});
});
