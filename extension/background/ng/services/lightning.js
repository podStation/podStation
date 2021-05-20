'use strict';

(function(){
	angular
		.module('podstationBackgroundApp')
		.factory('lightningService', ['$http', '$window', '$q', 'messageService', 'storageService', 'analyticsService', lightningService]);

	function lightningService($http, $window, $q, messageService, storageService, _analyticsService) {
		/**
		 * cached options
		 */
		let options;
		let lightningClient; 

		onMessage('getOptions', (message, sendResponse) => {
			getOptions().then((options) => sendResponse(options))
			return true;
		});

		onMessage('saveOptions', (message) => {
			saveOptions(message);
		});

		onMessage('getBalance', (message, sendResponse) => {
			getBalance()
			.then((result) => {sendResponse({result: result})})
			.catch((error) => {
				sendResponse({
					// error is an instance of Error and it does not serialize well as JSON, JSON.stringify(error) results in '{}'
					error: {
						message: error.message
					}
				});
			});
			return true;
		});

		getOptions().then((storedOption) => {
			options = storedOption
			lightningClient = buildClient();
		});

		return {
			isActive: isActive,
			sendPaymentWithKeySend: sendPaymentWithKeySend,
			getOptions: getOptions,
			getBalance: getBalance
		};

		/**
		 * @returns {boolean}
		 */
		function isActive() {
			return options.type !== 'none';
		}
		
		/**
		 * Get channels balance
		 */
		function getBalance() {
			return lightningClient.getBalance();
		}

		/**
		 * Send a Payment using lightning with keysend
		 * @param {String} nodeId Node Id (pubkey) in Hex format
		 * @param {number} amount amount in millisatoshis
		 * @param {number} feeLimit fee limit in millisatoshis
		 */
		function sendPaymentWithKeySend(nodeId, amount, customRecordKey, customRecordValue, podcastPaymentMetadata) {
			return lightningClient.sendPaymentWithKeySend(nodeId, amount, customRecordKey, customRecordValue, podcastPaymentMetadata);
		}

		function onMessage(message, callback) {
			messageService.for('lightningService').onMessage(message, callback);
		}

		function getOptions() {
			return storageService.load('lightningOptions', null, 'local', () => {
				return {
					// Default is 50 sats per minute, value is msats/hour
					value: 60 * 50000,
					maxFeePercent: 1,
					type: 'none'
				};
			}).then((storedOptions) => {
				if(!storedOptions.type) {
					return convertLegacyOptionsFormat(storedOptions);
				}

				return storedOptions;
			});

			function convertLegacyOptionsFormat(legacyOptionsFormat) {
				let optionsCopy = {...legacyOptionsFormat};

				if(optionsCopy.testMode) {
					optionsCopy.type = 'test_mode';
				}
				else if(optionsCopy.restBaseUrl && optionsCopy.macaroon) {
					optionsCopy.type = 'lnd_rest';
				}

				delete optionsCopy.testMode;

				return optionsCopy;
			}
		}

		function saveOptions(optionsToSave) {
			options = optionsToSave;
			lightningClient = buildClient();
			storageService.save('lightningOptions', 'local', options).then(() => {
				messageService.for('lightningService').sendMessage('optionsChanged', options);
			});
		}

		function buildClient() {
			switch(options.type) {
				case 'test_mode':
					return new TestModeClient(_analyticsService);
				case 'lnd_rest':
					return new LNDClient(_analyticsService, $http, $window, options.restBaseUrl, options.macaroon, options.maxFeePercent);
				case 'lnpayco':
					return new LNPayClient(_analyticsService, $http, options.lnpaycoApiKey, options.lnpaycoWalletAccessKey);
			}
		}
	}

	/**
	 * Podcast Payment Metadata Custom Record Key
	 * 
	 * Defined at https://github.com/satoshisstream/satoshis.stream/blob/main/TLV_registry.md#field-7629169
	 */
	const PODCAST_PAYMENT_METADATA_CUSTOM_RECORD_KEY = 7629169;

	class TestModeClient {
		constructor(_analyticsService) {
			this._analyticsService = _analyticsService;
		}

		sendPaymentWithKeySend(nodeId, amount, customRecordKey, customRecordValue, podcastPaymentMetadata) {
			console.info('Test mode - sendPaymentWithKeySend', nodeId, amount, customRecordKey, customRecordValue, podcastPaymentMetadata);
			this._analyticsService.trackEvent('lightning', 'send_payment_test_mode', null, amount);
			return Promise.resolve(); 
		}
	}

	class LNDClient {
		constructor(_analyticsService, $http, $window, restBaseUrl, macaroon, maxFeeInPercent) {
			this._analyticsService = _analyticsService;
			this.$window = $window;
			this.$http = $http;
			this.restBaseUrl = restBaseUrl;
			this.macaroon = macaroon;
			this.maxFeeInPercent = maxFeeInPercent;
		}

		sendPaymentWithKeySend(nodeId, amount, customRecordKey, customRecordValue, podcastPaymentMetadata) {
			const that = this;
			const feeLimit = this.calculateMaxFeeIn_mSats(amount);
			return this.buildPreimageAndPaymentHash().then((preimageAndPaymentHash) => {
				const additionalCustomRecords = {};

				if(customRecordKey) {
					additionalCustomRecords[customRecordKey] = this.hexToBase64(customRecordValue);
				}

				if(podcastPaymentMetadata) {
					additionalCustomRecords[PODCAST_PAYMENT_METADATA_CUSTOM_RECORD_KEY] = btoa(JSON.stringify(podcastPaymentMetadata))
				}

				const body = {
					dest: that.hexToBase64(nodeId),
					amt_msat: Math.round(amount),
					timeout_seconds: 60,
					payment_hash: preimageAndPaymentHash.paymentHash,
					fee_limit_msat: feeLimit,
					dest_custom_records: {
						// KeySend custom record
						'5482373484': preimageAndPaymentHash.preimage,
						...additionalCustomRecords
					},
					no_inflight_updates: true
				}

				return that.$http.post(that.restBaseUrl + '/v2/router/send', body, {
					headers: {
						'Grpc-Metadata-macaroon': that.macaroon
					}
				}).catch((error) => {
					console.error('LND: sendpayment failed', amount, feeLimit, error);
					that._analyticsService.trackEvent('lightning', 'lnd_send_payment_failed', 'connection_to_daemon_error', amount);
					throw new Error('LND: send payment failed');
				}).then((response) => {
					if(response.status === 200 && response.data.result.status === 'SUCCEEDED') {
						console.info('LND: sendpayment successful', amount);
						that._analyticsService.trackEvent('lightning', 'lnd_send_payment_succeeded', null, amount);
					}
					else {
						console.error('LND: sendpayment failed', amount, feeLimit, response);
						that._analyticsService.trackEvent('lightning', 'lnd_send_payment_failed', response.data.result.status, amount);
						throw new Error('LND: send payment failed');
					}
				});
			});
		}

		getBalance() {
			return this.$http.get(this.restBaseUrl + '/v1/balance/channels', {
				headers: {
					'Grpc-Metadata-macaroon': this.macaroon
				}
			})
			.catch((error) => {
				console.error('LND: Error getting wallet balance', error);
				throw new Error(error.data? error.data.message : 'Error getting wallet balance');
			})
			.then((response) => {
				return {
					balanceInSats: response.data.balance
				}
			});
		}

		calculateMaxFeeIn_mSats(amount) {
			return Math.round(amount * this.maxFeeInPercent / 100);
		}

		buildPreimageAndPaymentHash() {
			const randomValues = new ArrayBuffer(32);
			const randomValuesUint8 = new Uint8Array(randomValues);
			this.$window.crypto.getRandomValues(randomValuesUint8);

			const preimage = this.bufToBase64(randomValues);

			return this.$window.crypto.subtle.digest('SHA-256', randomValues)
			  .then((hashedArrayBuffer) => ({
				preimage: preimage,
				paymentHash: this.bufToBase64(hashedArrayBuffer)
			}));
		}

		hexToBase64(hexstring) {
			// https://stackoverflow.com/questions/23190056/hex-to-base64-converter-for-javascript
			return this.$window.btoa(hexToString(hexstring));
		}

		bufToBase64(buffer) {
			// https://stackoverflow.com/questions/9267899/arraybuffer-to-base64-encoded-string
			var binary = '';
			var bytes = new Uint8Array( buffer );
			var len = bytes.byteLength;
			
			for (var i = 0; i < len; i++) {
				binary += String.fromCharCode( bytes[ i ] );
			}

			return this.$window.btoa( binary );
		}
	}

	class LNPayClient {
		constructor(_analyticsService, $http, apiKey, walletAccessKey) {
			this._analyticsService = _analyticsService;
			this._$http = $http;
			this._apiKey = apiKey;
			this._walletAccessKey = walletAccessKey;
			this._paymentQueue = [];
			this._isSendingPayment = false;
		}

		/**
		 * LNPay KeySend payment API does not support concurrent payments from the
		 * same wallet, thus this method queues payments for processing and processes
		 * them sequentially.
		 * @param {String} nodeId 
		 * @param {number} amount 
		 */
		sendPaymentWithKeySend(nodeId, amount, customRecordKey, customRecordValue, podcastPaymentMetadata) {
			return new Promise((resolve, reject) => {
				console.debug('LNPay: queueing payment for sending', nodeId, amount);

				this._paymentQueue.push({
					nodeId: nodeId,
					amount: amount,
					customRecordKey: customRecordKey, 
					customRecordValue: customRecordValue,
					podcastPaymentMetadata: podcastPaymentMetadata,
					resolve: resolve,
					reject: reject
				});

				if(!this._isSendingPayment) {
					this._sendNextPayment();
				}
			});
		}

		_sendNextPayment() {
			if(this._paymentQueue.length) {
				const nextPayment = this._paymentQueue.splice(0, 1)[0];

				console.debug('LNPay: picked queued payment for sending', nextPayment.nodeId, nextPayment.amount);
				
				this._isSendingPayment = true;

				this._sendPaymentWithKeySend(nextPayment.nodeId, nextPayment.amount, nextPayment.customRecordKey, nextPayment.customRecordValue, nextPayment.podcastPaymentMetadata)
				.then((result) => nextPayment.resolve(result))
				.catch((error) => nextPayment.reject(error))
				.finally(() => {
					this._isSendingPayment = false;
					this._sendNextPayment();
				})
			}
		}

		_sendPaymentWithKeySend(nodeId, amount, customRecordKey, customRecordValue, podcastPaymentMetadata) {
			if(amount < 1000) {
				// TODO: Sort out how to handle the rounding, LNPay does not handle millisatoshis
				console.debug('LNPay: skipping payment, amount is too small', amount);
				return Promise.reject();
			}

			let body = {
				dest_pubkey: nodeId,
				num_satoshis: LNPayClient.convertFrom_mSatsToSats(amount)
			}

			if(customRecordKey) {
				body.custom_records = {};
				body.custom_records[customRecordKey] = hexToString(customRecordValue);
			}

			if(podcastPaymentMetadata) {
				body.custom_records = body.custom_records || {};
				body.custom_records[PODCAST_PAYMENT_METADATA_CUSTOM_RECORD_KEY] = JSON.stringify(podcastPaymentMetadata);
			}

			return this._$http.post(`https://lnpay.co/v1/wallet/${this._walletAccessKey}/keysend`, body, {
				headers: {
					'X-Api-Key': this._apiKey
				}
			}).catch((error) => {
				console.error('LNPay: Error sending payment with KeySend', nodeId, amount, error);
				this._analyticsService.trackEvent('lightning', 'lnpay_send_payment_failed', null, amount);
				throw new Error(error.data ? `LNPay: Error sending payment with KeySend, error message: ${error.data.message}`: 'LNPay: Error sending payment with KeySend');
			}).then(() => {
				console.info('LNPay: Payment successful', amount);
				this._analyticsService.trackEvent('lightning', 'lnpay_send_payment_succeeded', null, amount);
			});
		};

		getBalance() {
			return this._$http.get(`https://lnpay.co/v1/wallet/${this._walletAccessKey}`, {
				headers: {
					'X-Api-Key': this._apiKey
				}
			})
			.catch((error) => {
				console.error('LNPay: Error getting wallet balance', error);
				throw new Error(error.data? error.data.message : 'Error getting wallet balance');
			})
			.then((response) => {
				return {
					balanceInSats: response.data.balance
				}
			});
		}

		static convertFrom_mSatsToSats(amountIn_mSats) {
			return Math.round(amountIn_mSats / 1000)
		}
	}

	function hexToString(hexstring) {
		// https://stackoverflow.com/questions/23190056/hex-to-base64-converter-for-javascript
		return hexstring.match(/\w{2}/g).map(function(a) {
			return String.fromCharCode(parseInt(a, 16));
		}).join("");
	}
})();