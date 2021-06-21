
function AnalyticsService() {
	var service = {
		trackPageView: trackPageView,
		trackEvent: trackEvent
	};

	return service;

	function _ga() {
		if(typeof ga === 'function') {
			ga.apply(null, arguments);
		}
	}

	function trackPageView(page) {
		_ga('send', 'pageview', {
			page: page
		});
	}

	/**
	 * Tracks an event
	 * @param {String} category feed or audio
	 * @param {*} action any action label
	 * @param {*} label 
	 * @param {*} value 
	 */
	function trackEvent(category, action, label, value) {
		_ga('send', 'event', {
			eventCategory: category,
			eventAction: action,
			eventLabel: label,
			eventValue: value
		});
	}
}

export default AnalyticsService;