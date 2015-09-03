var episodeTemplate;

jQuery.ajax({
	url: chrome.extension.getURL('templates/episode.mustache'),
	dataType: "text",
	success: function(result) {
		episodeTemplate = result;
	},
	async: false
});

function renderEpisode(episode) {
	var episodeHTML;
	var episodeForTemplate;

	episodeForTemplate = {
		link: episode.link,
		title: episode.title ? episode.title : episode.url,
		url: episode.enclosure.url,
		description: episode.description,
		pubDate: formatDate(new Date(episode.pubDate))
	};

	var renderedHTML = Mustache.render(episodeTemplate, episodeForTemplate);

	return renderedHTML;
}
