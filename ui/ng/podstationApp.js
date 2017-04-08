var myApp = angular.module('podstationApp', ['ngRoute', 'ngSanitize', 'infinite-scroll', 'dndLists']);

myApp.config(['$routeProvider', '$compileProvider', function ($routeProvider, $compileProvider) {
	var whiteList = /^\s*(https?|ftp|mailto|chrome-extension|data):/;
	$compileProvider.aHrefSanitizationWhitelist(whiteList);
	$compileProvider.imgSrcSanitizationWhitelist(whiteList);

	$routeProvider.when('/Podcasts', {
		templateUrl: '/ui/ng/partials/podcasts.html',
		controller: 'podcastsController'
	}).when('/LastEpisodes', {
		templateUrl: '/ui/ng/partials/lastEpisodes.html',
		controller: 'lastEpisodesController'
	}).when('/Episodes/:podcastIndex', {
		templateUrl: '/ui/ng/partials/episodes.html',
		controller: 'episodesController'
	}).when('/InProgress', {
		templateUrl: '/ui/ng/partials/episodesInProgress.html',
		controller: 'episodesInProgressController'
	}).when('/Search/:searchTerms', {
		templateUrl: '/ui/ng/partials/search.html',
		controller: 'searchController'
	}).when('/About', {
		templateUrl: '/ui/ng/partials/about.html',
		controller: 'aboutController'
	}).when('/Options', {
		templateUrl: '/ui/ng/partials/options.html',
		controller: 'optionsController'
	}).otherwise({
		redirectTo: '/LastEpisodes/20'
	});
}]);

myApp.filter('chrome_i18n', function() {
	return function(input) {
		if(typeof input === 'object') {
			return chrome.i18n.getMessage(input.message, input.arguments);
		}
		else if (typeof input === 'string') {
			return chrome.i18n.getMessage(input);
		}
	};
});