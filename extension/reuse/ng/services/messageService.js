
(function() {
	'use strict';

	angular
		.module('podstationInternalReuse')
		.provider('messageService', messageServiceProvider);

	function messageServiceProvider() {
		var isBackgroudPage = false;

		this.setIsBackgroundPage = setIsBackgroundPage;
		this.$get = ['browser', messageServiceFactory];

		return;

		function setIsBackgroundPage(value) {
			isBackgroudPage = value;
		}

		function messageServiceFactory(browserService) {
			return new ChromeExtensionMessageService(isBackgroudPage, browserService);
		}
	}
})();