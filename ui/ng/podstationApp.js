var myApp = angular.module('podstationApp', ['ngRoute', 'ngSanitize', 'infinite-scroll']);

myApp.config(['$routeProvider', '$compileProvider', function ($routeProvider, $compileProvider) {
	var whiteList = /^\s*(https?|ftp|mailto|chrome-extension|data):/;
	$compileProvider.aHrefSanitizationWhitelist(whiteList);
	$compileProvider.imgSrcSanitizationWhitelist(whiteList);

	$routeProvider.when('/Podcasts', {
		templateUrl: '/ui/ng/partials/podcasts.html',
		controller: 'podcastsController'
	}).when('/LastEpisodes/:numberEpisodes', {
		templateUrl: '/ui/ng/partials/lastEpisodes.html',
		controller: 'lastEpisodesController'
	}).when('/Episodes/:podcastIndex', {
		templateUrl: '/ui/ng/partials/episodes.html',
		controller: 'episodesController'
	}).when('/Search/:searchTerms', {
		templateUrl: '/ui/ng/partials/search.html',
		controller: 'searchController'
	}).when('/About', {
		templateUrl: '/ui/ng/partials/about.html',
		controller: 'episodesController'
	}).otherwise({
		redirectTo: '/LastEpisodes/20'
	});
}]);
