var feedList = [];

function absolutePath(href) {
	var link = document.createElement("a");
	link.href = href;
	return (link.protocol + "//" + link.host + link.pathname +link.search + link.hash);
}

$(document).ready(function() {
	$("link[rel='alternate']").each(function(){
		var link = $(this);

		if(link.attr('type') !== 'application/rss+xml') {
			return true;
		}

		chrome.runtime.sendMessage({
			action: 'feedFound',
		});

		if(link.attr('href')) {
			feedList.push({
				title: link.attr('title') ? link.attr('title') : document.title,
				feed: absolutePath(link.attr('href'))
			});
		}
	});
});

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
	if(message.action = 'getFeeds') {
		sendResponse(feedList);
	}
});
