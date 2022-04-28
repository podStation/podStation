type SendResponseCallback = (response: any) => void;
type OnMessageCallback = (messageContent: any, sendResponseCallback: SendResponseCallback) => boolean;

interface IMessageRelayer {
	sendMessage(messageName: string, messageContent: any, sendResponseCallback: any): void;
	onMessage(messageName: string, callback: any): IMessageRelayer;
}

class ChromeExtensionMessageService {

	private runningInBackground: boolean;
	private messageRelayers: Record<string, MessageRelayer> = {};
	private browserService: any;

	constructor(isBackgroundPage: boolean, browserService: any) {
		this.runningInBackground = isBackgroundPage;
		this.browserService = browserService;
		this.registerMessageListener();
	}

	/**
	 * 
	 * @param {string} relayerName 
	 * @returns {MessageRelayer}
	 */
	for(relayerName: string): IMessageRelayer {
		if(!this.messageRelayers[relayerName]) {
			this.messageRelayers[relayerName] = new MessageRelayer(relayerName, this.runningInBackground, this.browserService);
		}
		
		return this.messageRelayers[relayerName];
	}

	reset() {
		this.messageRelayers = {};
	}

	private registerMessageListener() {
		this.browserService.runtime.onMessage.addListener((message: any, sender: any, sendResponse: SendResponseCallback) => {
			if(this.runningInBackground && message.fromBackground) {
				// already taken care of internally
				return;
			}

			if(message.relayerName) {
				const relayer = this.messageRelayers[message.relayerName];

				if(relayer) {
					let responseTakenCareOf = false;
		
					return relayer.dispatchToListeners(message.name, message.content, sendResponse, responseTakenCareOf);
				}
				else {
					// This is ok, it happens when the background is broadcasting a message that is not listened
					// yet on the foreground 
					console.warn(`Could not find relayer with name '${message.relayerName}'`);
				}
				
			}
		});
	}
}

class MessageRelayer implements IMessageRelayer {
	private name: string;
	private listeners: Record<string, OnMessageCallback[]> = {};
	private browserService: any;
	private runningInBackground: boolean;

	constructor(name: string, runningInBackground: boolean, browserService: any) {
		this.name = name;
		this.runningInBackground = runningInBackground;
		this.browserService = browserService;
		// this.registerMessageListener();
	}

	onMessage(messageName: string, callback: OnMessageCallback): IMessageRelayer {
		if(!this.listeners[messageName]) {
			this.listeners[messageName] = [];
		}
		else if(this.listeners[messageName].indexOf(callback) >= 0) {
			return;
		}

		this.listeners[messageName].push(callback);
		return this;
	}

	dispatchToListeners(messageName: string, messageContent: any, sendResponseCallback: SendResponseCallback, responseTakenCareOf: boolean) {
		if(!this.listeners[messageName]) {
			return false;
		}
		
		let willAnswer: boolean;

		this.listeners[messageName].forEach((callback) => {
			willAnswer = callback(messageContent, (response: any) => {
				if(!responseTakenCareOf && sendResponseCallback) {
					responseTakenCareOf = true;
					sendResponseCallback(response);
				}
			}) ? true : willAnswer;
		});

		return willAnswer;
	}

	sendMessage(messageName: string, messageContent: any, sendResponseCallback: SendResponseCallback) {
		let responseTakenCareOf = false;

		// send the message to other receivers than the background
		this.browserService.runtime.sendMessage({
			fromBackground: this.runningInBackground,
			relayerName: this.name,
			name: messageName,
			content: messageContent,
		}, (response: any) => {
			// check if it was already answered by a background listener
			if(!responseTakenCareOf && sendResponseCallback) {
				responseTakenCareOf = true;
				sendResponseCallback(response);
			}
		});

		if(this.runningInBackground) {
			// messages sent from foreground are always treated on the runtime listener
			this.dispatchToListeners(messageName, messageContent, sendResponseCallback, responseTakenCareOf);
		}
	}
}

export default ChromeExtensionMessageService;