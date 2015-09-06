function formatDate(date) {
	var formattedDate = '';

	formattedDate = date.getDate() + '/' + ( date.getMonth() + 1 ) + '/' + date.getFullYear();
	return formattedDate;
}

function updatePodcastList() {
	var podcastListElement = $('#podcastList');

	chrome.runtime.getBackgroundPage(function(bgPage) {
		var listHTML = '';

		bgPage.podcastManager.podcastList.forEach(function(podcast, index) {
			listHTML += renderPodcast(podcast, index);
		});

		podcastListElement.html(listHTML);

		$('.removePodcast').click(function(eventObject) {
			eventObject.preventDefault();
			var pocastEntryId = 'podcast_' + eventObject.currentTarget.id;
			bgPage.podcastManager.deletePodcast(eventObject.currentTarget.id);
			$('.podcastEntry').each(function() {
				if( $( this )[0].id === pocastEntryId) {
					$( this ).hide();
				}
			});
		})

		$('.updatePodcast').click(function(eventObject) {
			eventObject.preventDefault();
			var pocastEntryId = 'podcast_' + eventObject.currentTarget.id;
			bgPage.podcastManager.updatePodcast(eventObject.currentTarget.id, function() {
				updatePodcastList();
			});
			updatePodcastList();
		})
	});
}

$( document ).ready( function() {
	chrome.runtime.getBackgroundPage(function(bgPage) {
		$('#addRSS').click( function() {
			var entryBox = $('#entryBox');
			bgPage.podcastManager.addPodcast(entryBox.val(), updatePodcastList);
			updatePodcastList();
			entryBox.val('');
		});
	});
});
