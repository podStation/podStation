var feedsInPageTemplate;

jQuery.ajax({
	url: chrome.extension.getURL('templates/feedsInPage.mustache'),
	dataType: "text",
	success: function(result) {
		feedsInPageTemplate = result;
	},
	async: false
});

function renderFeedsInPage(feedsInPage) {
	console.log(feedsInPage);
	var renderedHTML = Mustache.render(feedsInPageTemplate, {feedsInPage: feedsInPage});

	return renderedHTML;
}
