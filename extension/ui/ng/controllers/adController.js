'use strict';

(function() {
	angular.module('podstationApp').controller('adController', [AdController]);

	function AdController() {
		let ad = this;

		ad.showBanner = true;
		ad.dismiss = dismiss;

		return ad;

		function dismiss() {
			ad.showBanner = false;
		}
	}
})();