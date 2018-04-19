'use strict';

(function(){
	angular
		.module('podstationBackgroundApp')
		.service('optionsManagerService', ['messageService', OptionsManager]);

	function OptionsManager(messageService) {
		function optionsChanged(options) {
			messageService.for('optionsManager').sendMessage('optionsChanged', options);
		}

		this.getOptions = function(sendResponse) {
			chrome.storage.sync.get('syncOptions', function(storageObject) {
				var syncOptions;

				if(typeof storageObject.syncOptions === "undefined") {
					syncOptions = {
						autoUpdate: true,
						autoUpdateEvery: 60,
						integrateWithScreenShader: true,
						analytics: true
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
				}

				sendResponse(syncOptions);
			});
		}

		function saveOptions(options) {
			chrome.storage.sync.set({'syncOptions': options});
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

