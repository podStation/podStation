
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

	/*var renderedHTML = Mustache.render(podcastTemplate, {
		id: podcast.id,
		url: podcast.url,
		title: podcast.title,
		description: podcast.description,
		image: podcast.image
	});*/

	var renderedHTML = Mustache.render(podcastTemplate, podcast);

	return renderedHTML;
}
