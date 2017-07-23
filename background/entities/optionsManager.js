var OptionsManager;

(function(){
	var instance;

	OptionsManager = function() {
		if(instance) {
			return instance;
		}

		instance = this;

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
						integrateWithScreenShader: true
					};
				}
				else {
					syncOptions = storageObject.syncOptions;

					if(typeof syncOptions.integrateWithScreenShader === 'undefined') {
						syncOptions.integrateWithScreenShader = true;
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

var optionsManager = new OptionsManager();
