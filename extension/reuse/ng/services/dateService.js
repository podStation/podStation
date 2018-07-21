

(function() {
	'use strict';

	angular
		.module('podstationInternalReuse')
		.factory('dateService', [dateService]);

	function dateService() {
		var service = {
			now: now
		};

		return service;

		/**
		 * @return {Date}
		 */
		function now() {
			return new Date();
		}
	}
})();