var myApp = angular.module('podstationApp', ['podstationInternalReuse', 'podStationReusables', 'ngRoute', 'ngSanitize', 'infinite-scroll', 'dndLists']);

myApp.config(['$routeProvider', '$compileProvider', function ($routeProvider, $compileProvider, $rootScope) {
	var whiteList = /^\s*(https?|ftp|mailto|chrome-extension|data):/;
	$compileProvider.aHrefSanitizationWhitelist(whiteList);
	$compileProvider.imgSrcSanitizationWhitelist(whiteList);

	$routeProvider.when('/Welcome', {
		templateUrl: '/ui/ng/partials/welcome.html',
		// controller: 'podcastsController'
	}).when('/Podcasts', {
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
		redirectTo: '/LastEpisodes'
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

// Shade your extension's page using Screen Shader. Code snippet courtesy of Marc Guiselin 2015
function updSS(){
	chrome.runtime.sendMessage("fmlboobidmkelggdainpknloccojpppi", {}, function(response) {
		if(response){
			setTimeout(updSS, 1000);
			var s = document.getElementById("ssHTML");
			if(s)
				s.parentElement.removeChild(s);
			document.body.firstElementChild.insertAdjacentHTML('beforebegin', response.ssHTML);
		}
	});
}

angular.module('podstationApp').run(['$route', '$rootScope', 'messageService', 'analyticsService', 
function($route, $rootScope, messageService, analyticsService) {
	messageService.for('optionsManager').sendMessage('getOptions', {}, function(options) {
		if(options.integrateWithScreenShader) {
			updSS();	
		}

		if(options.analytics) {
			(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
			(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
			m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
			})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

			ga('create', 'UA-67249070-2', 'auto');
			// https://stackoverflow.com/questions/16135000/how-do-you-integrate-universal-analytics-in-to-chrome-extensions/17770829#17770829
			ga('set', 'checkProtocolTask', function(){});

			analyticsService.trackPageView($route.current.$$route.originalPath);

			$rootScope.$on('$routeChangeSuccess', function(e, current, previous) {
				analyticsService.trackPageView(current.$$route.originalPath);
			});
		}
	});
}]);

