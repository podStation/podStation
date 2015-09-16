$(document).ready(function() {
	chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {

		var tab = tabs[0];

		chrome.tabs.sendMessage(tab.id, {action: 'getFeeds'}, function(response) {

			if(response.length) {
				var html = '';

				response.forEach(function(item) {
					html += '<p>' + item.title + ' - ' + item.feed + '</p>';
				});

				$('#feedsInPage').html(html);
			}
		});
	});

});
