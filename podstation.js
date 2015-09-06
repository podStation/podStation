updateEpisodeListWithPodcast = function(podcast) {
	var episodeListElement = $('#episodeList');

	var listHTML = '';

	podcast.episodes.forEach(function(episode) {
		listHTML += renderEpisode(episode);
	});

	episodeListElement.html(listHTML);
}

showEpisodes = function(urlOrPodcast) {
	chrome.runtime.getBackgroundPage(function(bgPage) {
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

		updateEpisodeListWithPodcast(podcast);
	});
}

updateEpisodeListWithContainers = function(episodeContainers) {
	var episodeListElement = $('#episodeList');

	var listHTML = '';

	episodeContainers.forEach(function(episodeContainer) {
		listHTML += renderEpisode(episodeContainer.episode, episodeContainer.podcast);
	});

	episodeListElement.html(listHTML);
}

showLastEpisodes = function(numberOfEpisodes) {
	chrome.runtime.getBackgroundPage(function(bgPage) {
		$('#contentBoxIn').html(
			'<div id="episodes" class="mainContentBox">' +
				'<h1 class="sectionTitle episodesSectionTitle">Last Episodes</h1>' +
				'<div id="episodeList">' +
				'</div>' +
			'</div>'
		);

		updateEpisodeListWithContainers(bgPage.podcastManager.getAllEpisodes().slice(0,numberOfEpisodes));
	});
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

function showAbout() {
	$('#contentBoxIn').html(
		'<div id="about" class="mainContentBox">' +
			'<h1 class="sectionTitle">About</h1>' +
			'<div id="aboutContent">' +
			'</div>' +
		'</div>'
	);

	$.get('ui/about.html').done(function(data) {
		$('#aboutContent').html(data);
	});
}

function processHash() {
	var hash = window.location.hash;

	if(hash.indexOf('#LastEpisodes/') === 0) {
		var numberOfEpisodes = hash.substring('#LastEpisodes/'.length, hash.length);

		showLastEpisodes(numberOfEpisodes);
	}
	else if(hash === '#Podcasts') {
		showPodcasts();
	}
	else if(hash.indexOf('#Episodes/') === 0) {
		var podcastIndex = hash.substring('#Episodes/'.length, hash.length);

		chrome.runtime.getBackgroundPage(function(bgPage) {
			var podcast = bgPage.podcastManager.podcastList[podcastIndex];

			showEpisodes(podcast);
		});
	}
	else if(hash === '#About') {
		showAbout();
	}
	else {
		showLastEpisodes(20);
	}
}

$(document).ready(function() {
	$('#updateAll').click(function(event) {
		event.preventDefault();

		chrome.runtime.getBackgroundPage(function(bgPage) {
			bgPage.podcastManager.updatePodcast('', updatePodcastList);
			updatePodcastList();
		});
	});

	processHash();
});

$(window).on('hashchange', function() {
	processHash();
});
