angular.module('podstationInternalReuse', []);

(function() {
	angular.module('podstationInternalReuse').factory('browser', browserService);

	/**
	 * A simple angular wrapper for the extension APIs
	 * It is aimed at future suportability for other browsers and also
	 * dependency injection.
	 * @returns {browser}
	 */
	function browserService() {
		return chrome;
	}
})()

// >>> For services not yes converted to angular

function getAngularService(serviceName) {
	const injector = angular.element(document.body).injector(); 

	if(!injector) {
		throw Error('could not get service "' + serviceName + '", inke ');
	}

	return injector.get(serviceName);
}

function getMessageService() {
	return getAngularService('messageService');
}

function getAnalyticsService() {
	return getAngularService('analyticsService');
}

function getPodcastDataService() {
	return getAngularService('podcastDataService');
}

function getBrowserService() {
	return getAngularService('browser');
}

// <<<

/**
 * The browser instane an in web extensions
 * (at the moment, actually chrome instance as in chrome
 * extensions api)
 * @typedef {Object} browser
 */