
var podcastTemplate;

jQuery.ajax({
	url: chrome.extension.getURL('templates/podcast.mustache'),
	dataType: "text",
	success: function(result) {
		podcastTemplate = result;
	},
	async: false
});

function renderPodcast(podcast) {
	var podcastHTML;
	var podcastForTemplate;

	podcastForTemplate = {
		link: podcast.link,
		title: podcast.title ? podcast.title : podcast.url,
		image: podcast.image,
		url: podcast.url,
		description: podcast.description,
		episodesNumber: podcast.episodes.length
	};

	var renderedHTML = Mustache.render(podcastTemplate, podcastForTemplate);

	return renderedHTML;
}
