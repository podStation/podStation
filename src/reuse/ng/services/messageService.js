import ChromeExtensionMessageService from '../../messageServiceDefinition';

'use strict';

function messageServiceProvider() {
	var isBackgroundPage = false;

	this.setIsBackgroundPage = setIsBackgroundPage;
	this.$get = ['browser', messageServiceFactory];

	return;

	function setIsBackgroundPage(value) {
		isBackgroundPage = value;
	}

	function messageServiceFactory(browserService) {
		return new ChromeExtensionMessageService(isBackgroundPage, browserService);
	}
}

export default messageServiceProvider;