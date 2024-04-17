import $ from 'jquery';
import angular from 'angular';
import ngRouteModuleName from 'angular-route';
import ngSanitizeModuleName from 'angular-sanitize';
import ngInfiniteScrollModuleName from 'ng-infinite-scroll';
import dndListsModuleName from 'angular-drag-and-drop-lists';
import qrcode from 'qrcode-generator';
import qrcode_UTF8 from '/node_modules/qrcode-generator/qrcode_UTF8';
import ngQrcode from 'angular-qrcode';
import podStationInternalReuse from '../../reuse/ng/reuse';

import storageServiceUI from './services/storageServiceUI';
import HeaderController from './controllers/headerController';
import AdController from './controllers/adController';
import MenuController from './controllers/menuController';
import AboutController from './controllers/aboutController';
import { EpisodeController, EpisodesInProgressController, LastEpisodesController } from './controllers/episodesController';
import NotificationController from './controllers/notificationController';
import OptionsController from './controllers/optionsController';
import PlaylistController from './controllers/playlistController';
import PodcastsController from './controllers/podcastsController';
import SearchController from './controllers/searchController';
import WelcomeController from './controllers/welcomeController';
import socialService from './services/socialService';
import searchService from './services/searchService';
import episodePlayerService from './services/episodePlayerService';
import ValueStreamingInformationDirective from './directives/valueStreamingInformation';
import ParticipantListDirective from './directives/participantListDirective';
import episodePlayerDirective from './directives/episodePlayerDirective';
import EpisodeListDirective from './directives/episodeListDirective';

const myApp = angular.module('podstationApp', [podStationInternalReuse.name, ngRouteModuleName, ngSanitizeModuleName, ngInfiniteScrollModuleName, 'dndLists', ngQrcode]);

myApp
  .factory('storageServiceUI', [storageServiceUI])
  .factory('socialService', ['$window','podcastEngine', socialService])
  .factory('searchService', ['$http', 'podcastIndexOrgService', searchService])
  .factory('episodePlayer', ['messageService', episodePlayerService])
  .controller('headerController', ['$scope', '$location', 'analyticsService','storageServiceUI', HeaderController])
  .controller('adController', ['$scope', 'storageService', AdController])
  .controller('menuController', ['$rootScope', '$scope', '$document', '$location', 'messageService', 'analyticsService', 'podcastEngine', MenuController])
  .controller('aboutController', ['$scope', AboutController])
  .controller('lastEpisodesController', ['$scope', 'messageService', 'storageServiceUI', 'socialService', 'podcastDataService', 'podcastEngine', LastEpisodesController])
  .controller('episodesController', ['$scope', '$routeParams', 'messageService', 'storageServiceUI', 'podcastDataService', 'socialService', 'podcastEngine', EpisodeController])
  .controller('episodesInProgressController', ['$scope', 'storageServiceUI', 'podcastEngine', EpisodesInProgressController])
  .controller('notificationController', ['$scope', 'messageService', NotificationController])
  .controller('optionsController', ['$scope', '$window', 'messageService', OptionsController])
  .controller('playlistController', ['$scope', 'messageService', 'episodePlayer', 'podcastDataService', 'podcastEngine', PlaylistController])
  .controller('podcastsController', ['$scope', 'storageServiceUI', 'podcastEngine', PodcastsController])
  .controller('searchController', ['$scope', '$routeParams', '$location', 'searchService', 'analyticsService', 'podcastEngine', SearchController])
  .controller('welcomeController', ['$scope', '$http', 'messageService', 'analyticsService', WelcomeController])
  .directive('psValueStreamingInformation', ['messageService', ValueStreamingInformationDirective])
  .directive('psParticipantList', [ParticipantListDirective])
  .directive('psEpisodePlayer', ['$document', '$window', 'analyticsService', 'podcastManagerService', 'episodePlayer', 'messageService', 'socialService', 'podcastDataService', 'podcastEngine', episodePlayerDirective])
  .directive('psEpisodeList', [EpisodeListDirective]);

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
		controller: 'podcastsController as podcastsController'
	}).when('/LastEpisodes', {
		templateUrl: '/ui/ng/partials/lastEpisodes.html',
		controller: 'lastEpisodesController as lastEpisodesController'
	}).when('/Episodes/:localPodcastId', {
		templateUrl: '/ui/ng/partials/episodes.html',
		controller: 'episodesController',
		controllerAs: 'episodesController'
	}).when('/InProgress', {
		templateUrl: '/ui/ng/partials/episodesInProgress.html',
		controller: 'episodesInProgressController as episodesInProgressController'
	}).when('/Search/:searchTerms', {
		templateUrl: '/ui/ng/partials/search.html',
		controller: 'searchController as searchController'
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
	}
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

myApp.run(['$route', '$rootScope', 'messageService', 'analyticsService', 'storageServiceUI',
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