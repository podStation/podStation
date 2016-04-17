myApp.factory('messageService', function() {
	var messageService;
	
	messageService = new ChromeExtensionMessageService(false);
	
	return messageService;
});