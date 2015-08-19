function updatePodcastList() {
	var podcastListElement = $('#podcastList');

	var bgPage = chrome.extension.getBackgroundPage();

	var listHTML = '';

	bgPage.podcastManager.podcastList.forEach(function(podcast) {
		listHTML += renderPodcast(podcast);
	});

	podcastListElement.html(listHTML);
}

function storageChanged(changes, areaName) {
	if(areaName === 'sync')
	{
		updatePodcastList();
	}
}

$( document ).ready( function() {
	var bgPage = chrome.extension.getBackgroundPage();

	$('#addRSS').click( function() {
		// addRSS($('#entryBox').val());
		bgPage.podcastManager.addPodcast($('#entryBox').val(), updatePodcastList);
	});

	$('#removeAllRSS').click( function() {
		// removeAllRSS();
		bgPage.podcastManager.deleteAllPodcasts();
	});

	// chrome.storage.onChanged.addListener(storageChanged)

	updatePodcastList();
});
