function updatePodcastList() {
	var podcastListElement = $('#podcastList');

	chrome.storage.sync.get('podcastList', function(storageObject) {
		podcastList = storageObject.podcastList;

		if(typeof podcastList === 'undefined' || podcastList.lenght === 0) {
			podcastListElement.html('You have no podcasts in your list');
		}
		else {
			var listHtml;

			listHtml = '<ul>';
			podcastList.forEach(function (podcast) {
				listHtml += '<li>' + podcast.title + '</li>';
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
	$('#addRSS').click( function() {
		addRSS($('#entryBox').val());
	});

	$('#removeAllRSS').click( function() {
		removeAllRSS();
	});

	chrome.storage.onChanged.addListener(storageChanged)

	updatePodcastList();
});
