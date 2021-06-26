import $ from 'jquery';

function syncGetFeedContent(feedFileName) {
	var request = new XMLHttpRequest();

	request.open('GET', '/base/spec/background/feeds/' + feedFileName, false);
	request.send(null);

	return request;
}

function ajaxGetFeedFromFile(feedFileName) {
	return function(settings) {
		const request = syncGetFeedContent(feedFileName);

		typeof settings.success === 'function' && (request.response);

		let jqXHR = new XMLHttpRequest();
		jqXHR.status = 200;

		var deferred = $.Deferred().resolve(request.response, null, jqXHR);
		return deferred.promise();
	}
}

function ajaxGetFeed(settings) {
	const feedFileName = {
		'https://feed-with-guid.podstation.com': 'feed-with-guid.xml',
		'https://feed-without-guid.podstation.com': 'feed-without-guid.xml',
		'https://feed-with-escaped-chars.podstation.com?a=1&b=1': 'feed-with-escaped-chars.xml'
	}[settings.url];
	
	const request = syncGetFeedContent(feedFileName);

	typeof settings.success === 'function' && settings.success(request.response);

	let jqXHR = new XMLHttpRequest();
	jqXHR.status = 200;

	var deferred = $.Deferred().resolve(request.response, null, jqXHR);
	return deferred.promise();
}

export {
	syncGetFeedContent, 
	ajaxGetFeedFromFile, 
	ajaxGetFeed
};