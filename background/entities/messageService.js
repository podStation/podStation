var messageService = new ChromeExtensionMessageService(true);

angular.module('podstationBackgroundApp').factory('messageService', function() {
	return messageService;
});