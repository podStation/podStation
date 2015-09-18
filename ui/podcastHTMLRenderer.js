
var podcastTemplate;

jQuery.ajax({
	url: chrome.extension.getURL('templates/podcast.mustache'),
	dataType: "text",
	success: function(result) {
		podcastTemplate = result;
	},
	async: false
});

getStatusClass = function (status) {
	if(status === 'updating') {
		return 'fa-refresh fa-spin';
	}
	else if(status === 'loaded') {
		return 'fa-check';
	}
	else if(status === 'failed') {
		return 'fa-close';
	}
	else {
		return 'fa-question'
	}
}

function renderPodcast(podcast, index) {
	var podcastHTML;
	var podcastForTemplate;

	podcastForTemplate = {
		index: index,
		link: podcast.link,
		title: podcast.title ? podcast.title : podcast.url,
		image: podcast.image,
		url: podcast.url,
		description: podcast.description,
		episodesNumber: podcast.episodes.length,
		pubDate: podcast.pubDate ? formatDate(new Date(podcast.pubDate)) : undefined,
		statusClass: getStatusClass(podcast.status)
	};

	var renderedHTML = Mustache.render(podcastTemplate, podcastForTemplate);

	return renderedHTML;
}
