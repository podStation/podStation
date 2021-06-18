import angular from 'angular';
import analyticsService from './services/analyticsService';
import dateService from './services/dateService';
import messageServiceProvider from './services/messageService';
import podcastDataService from './services/podcastDataService';
import podcastIndexOrgService from './services/podcastIndexOrgService';
import podcastManagerService from './services/podcastManagerService';
import storageService from './services/storageService';

const module = angular.module('podStationInternalReuse', []);

module
  .provider('messageService', messageServiceProvider)
  .factory('browser', browserService)
  .factory('analyticsService', analyticsService)
  .factory('dateService', dateService)
  .factory('podcastDataService', podcastDataService)
  .factory('podcastIndexOrgService', ['$http', '$window', podcastIndexOrgService])
  .factory('podcastManagerService', ['$q', podcastManagerService])
  .factory('storageService', ['$q', 'browser', storageService]);

/**
 * A simple angular wrapper for the extension APIs
 * It is aimed at future suportability for other browsers and also
 * dependency injection.
 * @returns {browser}
 */
function browserService() {
	return chrome;
}

// >>> For services not yes converted to angular

function getAngularService(serviceName) {
	const injector = angular.element(document.body).injector(); 

	if(!injector) {
		throw Error('could not get service "' + serviceName + '", inke ');
	}

	return injector.get(serviceName);
}

function getMessageService() {
	return getAngularService('messageService');
}

function getAnalyticsService() {
	return getAngularService('analyticsService');
}

function getPodcastDataService() {
	return getAngularService('podcastDataService');
}

function getBrowserService() {
	return getAngularService('browser');
}

// <<<

/**
 * The browser instance an in web extensions
 * (at the moment, actually chrome instance as in chrome
 * extensions api)
 * @typedef {Object} browser
 */

export default module;