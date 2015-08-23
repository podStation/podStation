$( document ).ready( function() {
	var bgPage = chrome.extension.getBackgroundPage();

	$('#removeAllRSS').click( function() {
		bgPage.podcastManager.deleteAllPodcasts();
		updatePodcastList();
	});

	updatePodcastList();
});
