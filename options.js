function updatePodcastList() {
	var podcastListElement = $('#podcastList');

	chrome.storage.sync.get('podcastList', function(storageObject) {
		syncPodcastList = storageObject.podcastList;

		if(typeof syncPodcastList === 'undefined' || syncPodcastList.lenght === 0) {
			podcastListElement.html('You have no podcasts in your list');
		}
		else {
			var listHtml;

			listHtml = '<ul>';
			syncPodcastList.forEach(function (podcast) {
				listHtml += '<li>' + (podcast.title ? podcast.title : podcast.url) + '</li>';
			});
			listHtml += '</ul>';

			podcastListElement.html(listHtml);
		}
	});
}

function storageChanged(changes, areaName) {
	if(areaName === 'sync')
	{
		console.log(changes);
		updatePodcastList();
	}
}

$( document ).ready( function() {
	var bgPage = chrome.extension.getBackgroundPage();

	$('#addRSS').click( function() {
		// addRSS($('#entryBox').val());
		bgPage.podcastManager.addPodcast($('#entryBox').val());
	});

	$('#removeAllRSS').click( function() {
		// removeAllRSS();
		bgPage.podcastManager.deleteAllPodcasts();
	});

	chrome.storage.onChanged.addListener(storageChanged)

	updatePodcastList();
});
