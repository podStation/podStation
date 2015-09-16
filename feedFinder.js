var feedList = [];
$(document).ready(function() {
	$("link[rel='alternate']").each(function(){
		var link = $(this);

		//todo: check if is type application/*xml (could be atom or rss)
		// if(link.attr('type').match())

		chrome.runtime.sendMessage({
			action: 'feedFound',
		});

		if(link.attr('href')) {
			feedList.push({
				title: link.attr('title') ? link.attr('title') : document.title,
				feed: link.attr('href')
			});
		}
	});
});

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
	if(message.action = 'getFeeds') {
		sendResponse(feedList);
	}
});
