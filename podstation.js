updateEpisodeList = function(podcast) {
	var episodeListElement = $('#episodeList');

	var listHTML = '';

	podcast.episodes.forEach(function(episode) {
		listHTML += renderEpisode(episode);
	});

	episodeListElement.html(listHTML);
}

showEpisodes = function(url) {
	var bgPage = chrome.extension.getBackgroundPage();
	var podcast = bgPage.podcastManager.getPodcast(url);

	$('#contentBoxIn').html(
		'<div id="episodes" class="mainContentBox">' +
			'<h1>Episodes from ' + podcast.title + '</h1>' +
			'<div id="episodeList">' +
			'</div>' +
		'</div>'
	);

	updateEpisodeList(podcast);
}

showPodcasts = function() {
	$('#contentBoxIn').html(
		'<div id="podcasts" class="mainContentBox">' +
			'<h1>Podcasts</h1>' +
			'<div id="podcastList">' +
			'</div>' +
		'</div>'
	);

	updatePodcastList();

	$('.linkToEpisodes').click(function(eventObject) {
		showEpisodes(eventObject.currentTarget.id);
	})
}

$(document).ready(function() {
	showPodcasts();
});
