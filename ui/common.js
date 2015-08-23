function updatePodcastList() {
	var podcastListElement = $('#podcastList');

	var bgPage = chrome.extension.getBackgroundPage();

	var listHTML = '';

	bgPage.podcastManager.podcastList.forEach(function(podcast) {
		listHTML += renderPodcast(podcast);
	});

	podcastListElement.html(listHTML);

	$('.removePodcast').click(function(eventObject) {
		var pocastEntryId = 'podcast_' + eventObject.target.id;
		bgPage.podcastManager.deletePodcast(eventObject.target.id);
		$('.podcastEntry').each(function() {
			if( $( this )[0].id === pocastEntryId) {
				$( this ).hide();
			}
		});
	})

	$('.updatePodcast').click(function(eventObject) {
		var pocastEntryId = 'podcast_' + eventObject.target.id;
		bgPage.podcastManager.updatePodcast(eventObject.target.id, function() {
			updatePodcastList();
		});
		updatePodcastList();
	})
}

$( document ).ready( function() {
	var bgPage = chrome.extension.getBackgroundPage();

	$('#addRSS').click( function() {
		var entryBox = $('#entryBox');
		bgPage.podcastManager.addPodcast(entryBox.val(), updatePodcastList);
		updatePodcastList();
		entryBox.val('');
	});
});
