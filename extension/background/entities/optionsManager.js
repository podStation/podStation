'use strict';

(function(){
	angular
		.module('podstationBackgroundApp')
		.service('optionsManagerService', ['browser', 'messageService', OptionsManager]);

	function OptionsManager(browserService, messageService) {
		function optionsChanged(options) {
			messageService.for('optionsManager').sendMessage('optionsChanged', options);
		}

		this.getOptions = function(sendResponse) {
			browserService.storage.sync.get('syncOptions', function(storageObject) {
				var syncOptions;

				if(typeof storageObject.syncOptions === "undefined") {
					syncOptions = {
						autoUpdate: true,
						autoUpdateEvery: 60,
						integrateWithScreenShader: true,
						analytics: true,
						s: true // show version news
					};
				}
				else {
					syncOptions = storageObject.syncOptions;

					if(typeof syncOptions.integrateWithScreenShader === 'undefined') {
						syncOptions.integrateWithScreenShader = true;
					}

					if(typeof syncOptions.analytics === 'undefined') {
						syncOptions.analytics = true;
					}

					if(typeof syncOptions.s === 'undefined') {
						syncOptions.s = true;
					}
				}

				sendResponse(syncOptions);
			});
		}

		function saveOptions(options) {
			browserService.storage.sync.set({'syncOptions': options});
			optionsChanged(options);
		}

		var that = this;

		messageService.for('optionsManager')
		  .onMessage('saveOptions', function(messageContent) {
			saveOptions(messageContent);
		}).onMessage('getOptions',  function(messageContent, sendResponse) {
			that.getOptions(sendResponse);
			return true;
		});
	}
})();

