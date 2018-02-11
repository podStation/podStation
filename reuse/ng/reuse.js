angular.module('podstationInternalReuse', []);

(function() {
	angular.module('podstationInternalReuse').factory('browser', browserService);

	/**
	 * A simple angular wrapper for the extension APIs
	 * It is aimed at future suportability for other browsers and also
	 * dependency injection.
	 */
	function browserService() {
		return chrome;
	}
})()