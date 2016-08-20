$(document).ready(function() {
	$('#open').click(function(event) {
		event.preventDefault();
		chrome.runtime.getBackgroundPage(function(bgPage) {
			bgPage.openPodStation();
		});
	});
});

var myApp = angular.module('podstationPopupApp', []);

myApp.controller('feedsInPageController', ['$scope', function($scope) {
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