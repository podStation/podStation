(function(){
	angular
		.module('podstationBackgroundApp')
		.factory('lightningService', ['$http', '$window', '$q', 'messageService', 'storageService', lightningService]);

	function lightningService($http, $window, $q, messageService, storageService) {
		/**
		 * cached options
		 */
		var options;

		messageService.for('lightningService').onMessage('getOptions', (message, sendResponse) => {
			getOptions().then((options) => sendResponse(options))
			return true;
		});

		messageService.for('lightningService').onMessage('saveOptions', (message) => {
			saveOptions(message);
		});

		getOptions().then((storedOption) => {options = storedOption});

		return {
			sendPaymentWithKeySend: sendPaymentWithKeySend,
			getOptions: getOptions
		};

		/**
		 * Send a Payment using lightning with keysend
		 * @param {String} nodeId Node Id (pubkey) in Hex format
		 * @param {number} amount amount in millisatoshis
		 * @param {number} feeLimit fee limit in millisatoshis
		 */
		function sendPaymentWithKeySend(nodeId, amount, feeLimit) {
			if(options.testMode) {
				console.info('Test mode - sendPaymentWithKeySend', nodeId, amount, feeLimit);
				return Promise.resolve({
					status: 200,
					data: {
						result: {
							status: 'SUCCEEDED'
						}
					}
				});
			}
			else {
				return buildPreimageAndPaymentHash().then((preimageAndPaymentHash) => {
					const body = {
						dest: hexToBase64(nodeId),
						amt_msat: Math.floor(amount),
						timeout_seconds: 60,
						payment_hash: preimageAndPaymentHash.paymentHash,
						fee_limit_msat: Math.floor(feeLimit),
						dest_custom_records: {
							// KeySend custom record
							'5482373484': preimageAndPaymentHash.preimage
						},
						no_inflight_updates: true
					}
	
					return $http.post(options.restBaseUrl + '/v2/router/send', body, {
						headers: {
							'Grpc-Metadata-macaroon': options.macaroon
						}
					});
				});
			}
		}

		function buildPreimageAndPaymentHash() {
			const randomValues = new ArrayBuffer(32);
			const randomValuesUint8 = new Uint8Array(randomValues);
			$window.crypto.getRandomValues(randomValuesUint8);

			const preimage = bufToBase64(randomValues);

			return $q((resolve) => {
				$window.crypto.subtle.digest('SHA-256', randomValues).then((hashedArrayBuffer) => {
					const paymentHash = bufToBase64(hashedArrayBuffer);

					resolve({
						preimage: preimage,
						paymentHash: paymentHash
					})
				});
			});
		}

		function hexToBase64(hexstring) {
			// https://stackoverflow.com/questions/23190056/hex-to-base64-converter-for-javascript
			return btoa(hexstring.match(/\w{2}/g).map(function(a) {
				return String.fromCharCode(parseInt(a, 16));
			}).join(""));
		}

		function bufToBase64(buffer) {
			// https://stackoverflow.com/questions/9267899/arraybuffer-to-base64-encoded-string
			var binary = '';
			var bytes = new Uint8Array( buffer );
			var len = bytes.byteLength;
			
			for (var i = 0; i < len; i++) {
				binary += String.fromCharCode( bytes[ i ] );
			}

			return $window.btoa( binary );
		}

		function getOptions() {
			return storageService.load('lightningOptions', null, 'local', () => {
				return {
					// Default is 50 sats per minute, value is msats/hour
					value: 60 * 50000,
					maxFeePercent: 1,
					testMode: false
				};
			});
		}

		function saveOptions(optionsToSave) {
			options = optionsToSave;
			storageService.save('lightningOptions', 'local', options).then(() => {
				messageService.for('lightningService').sendMessage('optionsChanged', options);
			});
		}
	}
})();