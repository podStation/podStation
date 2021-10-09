function valueHandlerService($injector, $interval, $q, messageService, _analyticsService, lightningService, podcastIndexOrgService) {

	const PODSTATION_LIGHTNING_NODE_ID = '033868c219bdb51a33560d854d500fe7d3898a1ad9e05dd89d0007e11313588500';
	const LNPAY_WALLET_ID_CUSTOM_RECORD_KEY = 696969;
	const PODSTATION_LNPAY_WALLET_ID = '77616c5f574d68334d6d794e76556f414e';

	const unsettledValues = [];
	const settledValues = [];
	var lightningOptions = {};
	
	/**
	 * cached podcast value
	 */
	const podcastsValueCache = {};

	// Notifications from other services
	messageService.for('audioPlayer').onMessage('segmentPlayed', (playedSegment) => handlePlayedSegment(playedSegment));
	messageService.for('lightningService').onMessage('optionsChanged', (options) => {lightningOptions = options});

	// Message API from this services
	messageService.for('valueHandlerService').onMessage('getValueSummary', (messageContent, sendResponse) => {
		sendResponse(calculateValueSummary());
		return true;
	});

	messageService.for('valueHandlerService').onMessage('canBoostValue', (episodeId, sendResponse) => {
		determineCanBoostValue(episodeId).then((canBoostValue) => {
			sendResponse(canBoostValue)
		});
		return true;
	});

	
	messageService.for('valueHandlerService').onMessage('boost', (message, sendResponse) => {
		boost(message.episodeId);
	});

	lightningService.getOptions().then((options) => {lightningOptions = options});

	$interval(settleValues, 60000);

	return {};

	/**
	 * 
	 * @param {EpisodePlayedSegment} playedSegment 
	 */
	function handlePlayedSegment(playedSegment) {
		console.debug('valueHandlerService - handling played segment', playedSegment);

		if(!lightningService.isActive())
			return;

		const msatsPerSecond = lightningOptions.value / 3600.0;
		const segmentValue = msatsPerSecond * (playedSegment.endPosition - playedSegment.startPosition);

		handleValueForEpisode(segmentValue, playedSegment.episodeId);
	}

	/**
	 * 
	 * @param {EpisodeId} episodeId
	 */
	function boost(episodeId) {
		if(!lightningService.canBoost())
			return;

		handleValueForEpisode(lightningOptions.valueBoost, episodeId);
	}

	/**
	 * 
	 * @param {number} value
	 * @param {EpisodeId} episodeId
	 */
	function handleValueForEpisode(value, episodeId) {
		const podcastAndEpisode = getPodcastAndEpisode(episodeId);

		getLightningValueForPodcastOrEpisode(podcastAndEpisode).then((valueConfiguration) => {
			if(valueConfiguration) {
				const proratedValues = prorateSegmentValue(value, valueConfiguration, podcastAndEpisode.podcast.url);

				cumulateAddressValuesToUnsettledValues(proratedValues);

				sendValueChangedMessage();
			}
		});
	}

	/**
	 * 
	 * @param {EpisodeId} episodeId
	 */
	function determineCanBoostValue(episodeId) {
		if(!lightningService.canBoost()) {
			return Promise.resolve(false);
		}

		const podcastAndEpisode = getPodcastAndEpisode(episodeId);

		return getLightningValueForPodcastOrEpisode(podcastAndEpisode).then((valueConfiguration) => Promise.resolve(valueConfiguration !== null));
	}

	function getLightningValueForPodcastOrEpisode(podcastAndEpisode) {
		const deferred = $q.defer();

		const podcast = podcastAndEpisode.podcast;
		const episode = podcastAndEpisode.episode;
		
		let value = findLightningValue(episode) || findLightningValue(podcast);

		if(value) {
			deferred.resolve(value)
		}
		else if(typeof podcastsValueCache[podcast.url] !== 'undefined'){
			deferred.resolve(podcastsValueCache[podcast.url]);
		}
		else {
			podcastIndexOrgService.getPodcastValue(podcast.url).then((response) => {
				if(response.status === 200 && response.data.value.model.type === 'lightning') {
					const valueFromPodcastIndexOrg = processValueFromPodcastIndexOrg(response.data.value);

					podcastsValueCache[podcast.url] = valueFromPodcastIndexOrg;
					deferred.resolve(valueFromPodcastIndexOrg);
				}
				else {
					podcastsValueCache[podcast.url] = null;
					deferred.resolve();
				}
			}).catch(() => {
				// the api returns 400 when it does not find a value
				podcastsValueCache[podcast.url] = null;
				deferred.resolve();
			});
		}

		return deferred.promise; 
	}

	function findLightningValue(episodeOrPodcast) {
		return episodeOrPodcast.values && episodeOrPodcast.values.find((value) => value.type === 'lightning');
	}

	/**
	 * Convert a value block returned from podcastindex.org API into the
	 * value block storage format. 
	 */
	function processValueFromPodcastIndexOrg(value) {
		return {
			type: value.model.type,
			method: value.model.method,
			suggested: value.model.suggested,
			recipients: value.destinations.map((destination) => {
				const recipient = {
					name: destination.name,
					type: destination.type,
					address: destination.address,
					split: parseInt(destination.split)
				}

				if(destination.customKey) {
					recipient.customKey = destination.customKey;
					recipient.customValue = destination.customValue;
				}

				return recipient;
			})
		};
	}

	function prorateSegmentValue(segmentValue, valueConfiguration, feedUrl) {
		const splitSum = valueConfiguration.recipients.reduce((accumulator, recipient) => accumulator + recipient.split, 0);
		const appRate = 0.01;
		const normalizerMultiple = (1 - appRate) / splitSum;
		
		// TODO: Do a consistency check 
		const proratedSegmentValues = valueConfiguration.recipients.map((recipient) => {
			const proratedSegmentValue = {
				address: recipient.address,
				value: segmentValue * recipient.split * normalizerMultiple,
				feedUrl: feedUrl
			};

			if(recipient.customKey && recipient.customValue) {
				proratedSegmentValue.customRecordKey = parseInt(recipient.customKey);
				proratedSegmentValue.customRecordValue = recipient.customValue;
			}

			return proratedSegmentValue;
		});

		if(appRate) {
			proratedSegmentValues.push({
				address: PODSTATION_LIGHTNING_NODE_ID,
				customRecordKey: LNPAY_WALLET_ID_CUSTOM_RECORD_KEY,
				customRecordValue: PODSTATION_LNPAY_WALLET_ID,
				value: segmentValue * appRate
			});
		}

		return proratedSegmentValues;
	}

	function cumulateAddressValuesToUnsettledValues(valuePerAddresses) {
		console.debug('valueHandlerService - values to cumulate', JSON.stringify(valuePerAddresses, null, 2))

		cumulateAddressValues(valuePerAddresses, unsettledValues);

		console.debug('valueHandlerService - cumulated values', JSON.stringify(unsettledValues, null, 2));
	}

	function cumulateAddressValuesToSettledValues(valuePerAddresses) {
		cumulateAddressValues(valuePerAddresses, settledValues);
	}

	function cumulateAddressValues(valuePerAddresses, cumulateTarget) {
		valuePerAddresses.forEach(valuePerAddress => {
			var unsettledValueForAddress = cumulateTarget.find((unsettledValue) => isSameRecipient(unsettledValue, valuePerAddress));

			if(unsettledValueForAddress) {
				unsettledValueForAddress.value += valuePerAddress.value;
			}
			else {
				cumulateTarget.push(valuePerAddress);
			}
		});
	}

	function getPodcastAndEpisode(episodeId) {
		return $injector.get('podcastManager').getPodcastAndEpisode(episodeId);
	}

	function settleValues() {
		const valuesToSettle = unsettledValues.splice(0, unsettledValues.length);

		console.debug('valueHandlerService - will try to settle values', JSON.stringify(valuesToSettle, null, 2));

		valuesToSettle.forEach((valueToSettle) => {
			lightningService.sendPaymentWithKeySend(valueToSettle.address, valueToSettle.value, valueToSettle.customRecordKey, valueToSettle.customRecordValue, buildPodcastPaymentMetadata(valueToSettle))
			.then(() => {
				cumulateAddressValuesToSettledValues([valueToSettle]);
				sendValuePaidMessage();
			})
			.catch((error) => {
				cumulateAddressValuesToUnsettledValues([valueToSettle]);
			})
			.then(() => {
				sendValueChangedMessage();
			});
		});
	}

	function buildPodcastPaymentMetadata(value) {
		if(value.feedUrl) {
			return {
				url: value.feedUrl
			}
		}
		
		return null;
	}

	function isSameRecipient(valuePerAddress1, valuePerAddress2) {
		return valuePerAddress1.address === valuePerAddress2.address &&
				valuePerAddress1.customRecordKey === valuePerAddress2.customRecordKey &&
				valuePerAddress1.customRecordValue === valuePerAddress2.customRecordValue;
	}

	function sendValueChangedMessage() {
		messageService.for('valueHandlerService').sendMessage('valueChanged', calculateValueSummary());
	}

	function sendValuePaidMessage() {
		messageService.for('valueHandlerService').sendMessage('valuePaid');
	}
	
	function calculateValueSummary() {
		return {
			isActive: lightningService.isActive(),
			unsettledValue: calculateTotalUnsettledValue(),
			settledValue: calculateTotalSettledValue()
		};
	}

	function calculateTotalUnsettledValue() {
		return calculateTotalValue(unsettledValues);
	}

	function calculateTotalSettledValue() {
		return calculateTotalValue(settledValues);
	}

	function calculateTotalValue(cumulatedValuesPerAddress) {
		return cumulatedValuesPerAddress.reduce((previousValue, currentValue) => previousValue + currentValue.value, 0);
	} 
}

export default valueHandlerService;