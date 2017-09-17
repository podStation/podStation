
(function() {
	'use strict';

	angular
		.module('podstationInternalReuse')
		.factory('messageService', _messageService);
		
	function _messageService() {
		var messageService;
		
		messageService = new ChromeExtensionMessageService(false);
		
		return messageService;
	}
})();