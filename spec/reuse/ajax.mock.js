/**
 * 
 * @param {$httpBackend}  
 * @param {string} url 
 * @param {string} feedFileName 
 */
/*function mockUrlWithFeedFile($httpBackend, url, feedFileName) {
	$httpBackend.whenGET(url).respond(function(method, url, data) {
		var request = new XMLHttpRequest();

		request.open('GET', '/base/spec/background/feeds/' + feedFileName, false);
		request.send(null);

		return [request.status, request.response, {}];
	});
}*/

function syncGetFeedContent(feedFileName) {
	var request = new XMLHttpRequest();

	request.open('GET', '/base/spec/background/feeds/' + feedFileName, false);
	request.send(null);

	return request;
}

function ajaxGetFeedFromFile(feedFileName) {
	return function(settings) {
		const request = syncGetFeedContent(feedFileName);

		settings.success(request.response);

		var deferred = $.Deferred().resolve(request.response);
		return deferred.promise();
	}
}

function ajaxGetFeed(settings) {
	const feedFileName = {
		'https://feed-with-guid.podstation.com': 'feed-with-guid.xml',
		'https://feed-without-guid.podstation.com': 'feed-without-guid.xml'
	}[settings.url];
	
	const request = syncGetFeedContent(feedFileName);

	settings.success(request.response);

	var deferred = $.Deferred().resolve(request.response);
	return deferred.promise();
}