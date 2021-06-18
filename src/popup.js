import $ from 'jquery';
import angular from 'angular';
import podStationInternalReuse from './reuse/ng/reuse';

import './popup.css';
import './podstation.css';
import 'font-awesome/css/font-awesome.css';

$(document).ready(function() {
	$('#open').click(function(event) {
		event.preventDefault();
		chrome.runtime.getBackgroundPage(function(bgPage) {
			bgPage.openPodStation();
		});
	});
});

const myApp = angular.module('podstationPopupApp', [podStationInternalReuse.name]);

myApp.controller('feedsInPageController', ['$scope', 'analyticsService', function($scope, analyticsService) {
	$scope.feedsInPage = [];

	chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
		var tab = tabs[0];

		chrome.tabs.sendMessage(tab.id, {action: 'getFeeds'}, function(response) {
			chrome.runtime.getBackgroundPage(function(bgPage) {
				$scope.$apply(function() {
					$scope.feedsInPage = response;

					$scope.feedsInPage.forEach(function(item) {
						item.added = bgPage.podcastManager.getPodcast(item.url) !== undefined;

						item.addPodcast = function() {
							var that = this;

							// better get the background page again in this case,
							// as it may have been unloaded
							chrome.runtime.getBackgroundPage(function(bgPage) {
								analyticsService.trackEvent('feed', 'add_by_feeds_in_page');

								bgPage.podcastManager.addPodcast(that.url);
								bgPage.openPodStation('Podcasts');
							});
						}
					});
				});
			});
		});
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

angular.module('podstationPopupApp').run(['messageService', 'analyticsService', function(messageService, analyticsService) {
	messageService.for('optionsManager').sendMessage('getOptions', {}, function(options) {
		if(options.analytics) {
			(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
			(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
			m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
			})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

			ga('create', 'UA-67249070-2', 'auto');
			// https://stackoverflow.com/questions/16135000/how-do-you-integrate-universal-analytics-in-to-chrome-extensions/17770829#17770829
			ga('set', 'checkProtocolTask', function(){});

			analyticsService.trackPageView('/feedsInPage');
		}
	});
}]);