import angular from 'angular';

var instance;

function ChromeExtensionMessageService(isBackgroundPage) {
	if(instance) {
		return instance;
	}

	instance = this;

	var runningInBackground = isBackgroundPage;
	var messageRelayers = {};

	function MessageRelayer(name) {
		this.name = name;
		this.listeners = {};

		var that = this;

		this.onMessage = function(messageName, callback) {
			if(!this.listeners[messageName]) {
				this.listeners[messageName] = [];
			}
			else if(this.listeners[messageName].indexOf(callback) >= 0) {
				return;
			}

			this.listeners[messageName].push(callback);
			return this;
		}

		function dispatchToListeners(messageName, messageContent, sendResponseCallback, responseTakenCareOf) {
			if(!that.listeners[messageName]) {
				return false;
			}
			
			var willAnswer;

			that.listeners[messageName].forEach(function(callback) {
				willAnswer = callback(messageContent, function(response) {
					if(!responseTakenCareOf && sendResponseCallback) {
						responseTakenCareOf = true;
						sendResponseCallback(response);
					}
				}) ? true : willAnswer;
			});

			return willAnswer;
		}

		this.sendMessage = function(messageName, messageContent, sendResponseCallback) {
			var responseTakenCareOf = false;

			// send the message to other receivers than the background
			getBrowserService().runtime.sendMessage({
				fromBackground: runningInBackground,
				relayerName: this.name,
				name: messageName,
				content: messageContent,
			}, function(response) {
				// check if it was already answered by a background listener
				if(!responseTakenCareOf && sendResponseCallback) {
					responseTakenCareOf = true;
					sendResponseCallback(response);
				}
			});

			if(runningInBackground) {
				// messages sent from foreground are always treated on the runtime listener
				dispatchToListeners(messageName, messageContent, sendResponseCallback, responseTakenCareOf);
			}
		}

		getBrowserService().runtime.onMessage.addListener(function(message, sender, sendResponse) {
			if(runningInBackground && message.fromBackground) {
				// already taken care of internally
				return;
			}
			
			if(message.relayerName != that.name) {
				// not for me
				return;
			}

			var responseTakenCareOf = false;

			return dispatchToListeners(message.name, message.content, sendResponse, responseTakenCareOf);
		});

		function getBrowserService() {
			return angular.element(document.body).injector() ? angular.element(document.body).injector().get('browser') : chrome;
		}
	};

	/**
	 * 
	 * @param {string} relayerName 
	 * @returns {MessageRelayer}
	 */
	this.for = function(relayerName) {
		if(!messageRelayers[relayerName]) {
			messageRelayers[relayerName] = new MessageRelayer(relayerName);
		}
		
		return messageRelayers[relayerName];
	}

	this.reset = function() {
		messageRelayers = {};
	}
}

export default ChromeExtensionMessageService;