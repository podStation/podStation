updateEpisodeList = function(podcast) {
	var episodeListElement = $('#episodeList');

	var listHTML = '';

	podcast.episodes.forEach(function(episode) {
		listHTML += renderEpisode(episode);
	});

	episodeListElement.html(listHTML);
}

showEpisodes = function(urlOrPodcast) {
	var bgPage = chrome.extension.getBackgroundPage();
	var podcast;

	if(typeof urlOrPodcast === "string") {
		podcast = bgPage.podcastManager.getPodcast(urlOrPodcast);
	}
	else {
		podcast = urlOrPodcast;
	}

	$('#contentBoxIn').html(
		'<div id="episodes" class="mainContentBox">' +
			'<table><tbody><tr>' +
			'<td><img height="50" src="' + podcast.image + '"></img></td>' +
			'<td><h1 class="sectionTitle episodesSectionTitle">Episodes from ' + podcast.title + '</h1></td>' +
			'</tr></tbody></table>' +
			'<div id="episodeList">' +
			'</div>' +
		'</div>'
	);

	updateEpisodeList(podcast);
}

showPodcasts = function() {
	$('#contentBoxIn').html(
		'<div id="podcasts" class="mainContentBox">' +
			'<h1 class="sectionTitle">Podcasts</h1>' +
			'<div id="podcastList">' +
			'</div>' +
		'</div>'
	);

	updatePodcastList();
}

function processHash() {
	if(window.location.hash === '#Podcasts') {
		showPodcasts();
	}
	else if(window.location.hash.indexOf('#Episodes/') === 0) {
		var hash = window.location.hash;
		var podcastIndex = hash.substring('#Episodes/'.length, hash.length);

		var bgPage = chrome.extension.getBackgroundPage();
		var podcast = bgPage.podcastManager.podcastList[podcastIndex];

		showEpisodes(podcast);
	}
	else {
		showPodcasts();
	}
}

$(document).ready(function() {
	$('#updateAll').click(function(event) {
		event.preventDefault();

		var bgPage = chrome.extension.getBackgroundPage();

		bgPage.podcastManager.updatePodcast('', updatePodcastList);
		updatePodcastList();
	});

	processHash();
});

$(window).on('hashchange', function() {
	processHash();
});
