'use strict';

(function(){
	angular
		.module('podstationBackgroundApp')
		.service('optionsManagerService', ['browser', 'messageService', OptionsManager]);

	function OptionsManager(browserService, messageService) {
		var service = {
			getOptions: getOptions,
			setShowVersionNews: setShowVersionNews
		};

		messageService.for('optionsManager')
		  .onMessage('saveOptions', function(messageContent) {
			saveOptions(messageContent);
		}).onMessage('getOptions',  function(messageContent, sendResponse) {
			service.getOptions(sendResponse);
			return true;
		});

		return service;

		function getOptions(sendResponse) {
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

		function setShowVersionNews(showVersionNews) {
			getOptions((options) => {
				options.s = showVersionNews;
				saveOptions(options);
			});
		}

		function optionsChanged(options) {
			messageService.for('optionsManager').sendMessage('optionsChanged', options);
		}
	}
})();

