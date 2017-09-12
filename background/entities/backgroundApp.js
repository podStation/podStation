angular.module('podstationBackgroundApp', ['podstationInternalReuse']);

angular.module('podstationBackgroundApp').factory('browser', function() {
	return chrome;
});

angular.module('podstationBackgroundApp').run(['playlist', 'analyticsService', function(playlist, analyticsService) {
	// this is only to ensure the services are created as soon as possible
}]);