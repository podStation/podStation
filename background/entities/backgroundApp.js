angular.module('podstationBackgroundApp', ['podstationInternalReuse']);

angular.module('podstationBackgroundApp').factory('browser', function() {
	return chrome;
});

angular.module('podstationBackgroundApp').run(['$window', 'playlist', 'browser', 'analyticsService', 
function($window, playlist, browser, analyticsService) {
	
	// playlist and analyticsService are here only to ensure the services are created as soon as possible
	browser.runtime.onInstalled.addListener(function(details) {
		var appDetails = browser.app.getDetails();

		if(details.reason === 'update') {
			switch(appDetails.version) {
				case '1.14.7':
					$window.open('https://podstation.blogspot.de/2017/09/v1147-important-update-on-collection-of.html')
					break;
			}
		}
	});
}]);