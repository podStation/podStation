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

		this.getOptions = function(sendResponse) {
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

		var that = this;

		chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
			if(!message.to || message.to != 'optionsManager') {
				return;
			}

			switch(message.type) {
				case 'getOptions':
					that.getOptions(sendResponse);
					return true;
				case 'saveOptions':
					saveOptions(message.options);
					break;
			}
		});
	}
})();

var optionsManager = new OptionsManager();
