var OptionsManager;

(function(){
	var instance;

	OptionsManager = function() {
		if(instance) {
			return instance;
		}

		instance = this;

		function optionsChanged(options) {
			chrome.runtime.sendMessage({
				from: 'optionsManager',
				type: 'optionsChanged',
				options: options,
			});
		}

		function getOptions(sendResponse) {
			chrome.storage.sync.get('syncOptions', function(storageObject) {
				var syncOptions;

				if(typeof storageObject.syncOptions === "undefined") {
					syncOptions = {
						autoUpdate: true,
						autoUpdateEvery: 60
					};
				}
				else {
					syncOptions = storageObject.syncOptions;
				}

				sendResponse(syncOptions);
			});
		}

		function saveOptions(options) {
			chrome.storage.sync.set({'syncOptions': options});
			optionsChanged(options);
		}

		chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
			if(!message.to || message.to != 'optionsManager') {
				return;
			}

			switch(message.type) {
				case 'getOptions':
					getOptions(sendResponse);
					return true;
				case 'saveOptions':
					saveOptions(message.options);
					break;
			}
		});
	}
})();

var optionsManager = new OptionsManager();
