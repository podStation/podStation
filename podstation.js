$(document).ready(function() {
	$('#updateAll').click(function(event) {
		event.preventDefault();

		chrome.runtime.getBackgroundPage(function(bgPage) {
			bgPage.podcastManager.updatePodcast('');
		});
	});
});
