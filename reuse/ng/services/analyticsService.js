
// the global instance is for services not yet converted into angular
var analyticsService;

(function() {
	'use strict';

	angular.module('podstationInternalReuse', []);

	angular
		.module('podstationInternalReuse')
		.factory('analyticsService', [_analyticsService]);

	function _analyticsService() {
		var service = {
			trackPageView: trackPageView,
			trackEvent: trackEvent
		};

		analyticsService = service;

		return service;

		function trackPageView(page) {
			ga('send', 'pageview', {
				page: page
			});
		}

		function trackEvent(category, action, label, value) {
			ga('send', 'event', {
				eventCategory: category,
				eventAction: action,
				eventLabel: label,
				eventValue: value
			});
		}
	}
})();