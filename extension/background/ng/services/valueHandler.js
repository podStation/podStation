(function(){
	angular
		.module('podstationBackgroundApp')
		.factory('valueHandlerService', ['$injector', '$interval', 'messageService', 'analyticsService', 'lightningService', valueHandlerService]);

	function valueHandlerService($injector, $interval, messageService, _analyticsService, lightningService) {

		const PODSTATION_LIGHTNING_NODE_ID = '';
		const unsettledValues = [];
		var lightningOptions = {};

		messageService.for('audioPlayer').onMessage('segmentPlayed', (playedSegment) => handlePlayedSegment(playedSegment));
		messageService.for('lightningService').onMessage('optionsChanged', (options) => {lightningOptions = options});

		lightningService.getOptions().then((options) => {lightningOptions = options});

		$interval(settleValues, 60000);

		return {};

		/**
		 * 
		 * @param {EpisodePlayedSegment} playedSegment 
		 */
		function handlePlayedSegment(playedSegment) {
			console.debug('valueHandlerService - handling played segment', playedSegment);

			const podcastAndEpisode = getPodcastAndEpisode(playedSegment.episodeId);

			const valueConfiguration = getLightningEpisodeValue(podcastAndEpisode);

			if(!valueConfiguration)
				return;

			const msatsPerSecond = lightningOptions.value / 3600.0;
			const segmentValue = msatsPerSecond * (playedSegment.endPosition - playedSegment.startPosition);
			
			const proratedValues = prorateSegmentValue(segmentValue, valueConfiguration);
			console.debug('valueHandlerService - prorated values for segment', proratedValues);

			cumulateAddressValues(proratedValues);
		}

		function getLightningEpisodeValue(podcastAndEpisode) {
			const podcast = podcastAndEpisode.podcast;

			return podcast.values && podcast.values.find((value) => value.type === 'lightning');
		}

		function prorateSegmentValue(segmentValue, valueConfiguration) {
			const splitSum = valueConfiguration.recipients.reduce((accumulator, recipient) => accumulator + recipient.split, 0);
			const appRate = 0.0; // for the future...
			const normalizerMultiple = (1 - appRate) / splitSum;
			const proratedSegmentValues = valueConfiguration.recipients.map((recipient) => {
				return {
					address: recipient.address,
					value: segmentValue * recipient.split * normalizerMultiple
				}
			});

			if(appRate) {
				proratedSegmentValues.push({
					address: PODSTATION_LIGHTNING_NODE_ID,
					value: segmentValue * appRate
				});
			}

			return proratedSegmentValues;
		}

		function cumulateAddressValues(valuePerAddresses) {
			valuePerAddresses.forEach(valuePerAddress => {
				var unsettledValueForAddress = unsettledValues.find((unsettledValue) => unsettledValue.address === valuePerAddress.address);
				
				if(unsettledValueForAddress) {
					unsettledValueForAddress.value += valuePerAddress.value;
				}
				else {
					unsettledValues.push(valuePerAddress);
				}	
			});

			console.debug('valueHandlerService - cumulated values', valuePerAddresses);
		}

		function getPodcastAndEpisode(episodeId) {
			return $injector.get('podcastManager').getPodcastAndEpisode(episodeId);
		}

		function settleValues() {
			const valuesToSettle = unsettledValues.splice(0, unsettledValues.length);

			valuesToSettle.forEach((valueToSettle) => {
				const maxFeeInMsats = valueToSettle.value * lightningOptions.maxFeePercent / 100;
				lightningService.sendPaymentWithKeySend(valueToSettle.address, valueToSettle.value, maxFeeInMsats).then(
				(response) => {
					if(response.status === 200 && response.data.result.status === 'SUCCEEDED') {
						console.info('sendpayment successful', valueToSettle);
					}
					else {
						console.error('sendpayment failed', valueToSettle, response);
						cumulateAddressValues([valueToSettle]);
					}
				},
				(error) => {
					console.error('sendpayment failed', valueToSettle, error);
					cumulateAddressValues([valueToSettle]);
				}
				);
			});
		}
	}
})();