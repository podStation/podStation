var myApp = angular.module('podstationApp', ['podstationInternalReuse', 'ngRoute', 'ngSanitize', 'infinite-scroll', 'dndLists', 'monospaced.qrcode']);

myApp.config(['$routeProvider', '$compileProvider', function ($routeProvider, $compileProvider, $rootScope) {
	var whiteList = /^\s*(https?|ftp|mailto|chrome-extension|data):/;
	$compileProvider.aHrefSanitizationWhitelist(whiteList);
	$compileProvider.imgSrcSanitizationWhitelist(whiteList);

	$routeProvider.when('/Welcome', {
		templateUrl: '/ui/ng/partials/welcome.html',
		controller: 'welcomeController',
		controllerAs: 'welcome'
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
		var messageId;
		var messageArguments = null;
		
		if(typeof input === 'object') {
			messageId = input.message;
			messageArguments = input.arguments;
		}
		else if (typeof input === 'string') {
			messageId = input;
		}
		
		const message = chrome.i18n.getMessage(messageId, messageArguments);
		return message ? message : messageId;
	};
});

myApp.filter('format_seconds', function() {
	return formatSeconds;
	
	/**
	 * seconds to hh:mm:ss
	 * @param {number} seconds
	 * @return {String}
	 */
	function formatSeconds(seconds) {
		var date = new Date(null);
		date.setSeconds(seconds);

		// this will work fine as long as less than 24hs, which is reasonable
		return date.toISOString().substr(11, 8);
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

angular.module('podstationApp').run(['$route', '$rootScope', 'messageService', 'analyticsService', 'storageServiceUI',
function($route, $rootScope, messageService, analyticsService, storageServiceUI) {
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

		storageServiceUI.loadSyncUIOptions((uiOptions) => {
			if(uiOptions.cs === 'dark') {
				$('body').addClass('dark-scheme');
			}
		});
	});
}]);

