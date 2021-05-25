(function() {
	angular.module('podstationApp').directive('psValueStreamingInformation', ['messageService', ValueStreamingInformationDirective]);

	function ValueStreamingInformationDirective(messageService) {
		return {
			restrict: 'E',
			controller: ['$scope', ValueStreamingInformation],
			controllerAs: 'valueStreamingInformation',
			bindToController: true,
			templateUrl: 'ui/ng/partials/valueStreamingInformantion.html'
		};

		function ValueStreamingInformation($scope) {
			var valueStreamingInformationController = this;

			valueStreamingInformationController.isV4vConfigured = false;
			valueStreamingInformationController.unsettledValue = 0;
			valueStreamingInformationController.balance = 0;

			messageService.for('valueHandlerService').sendMessage('getValueSummary', null, (valueSummary) => handleValueSummary(valueSummary));
			messageService.for('valueHandlerService').onMessage('valueChanged', (valueSummary) => handleValueSummary(valueSummary));
			messageService.for('valueHandlerService').onMessage('valuePaid', () => updateBalance());

			updateBalance();

			return valueStreamingInformationController;

			function handleValueSummary(valueSummary) {
				valueStreamingInformationController.isV4vConfigured = valueSummary.isActive;
				valueStreamingInformationController.unsettledValue = Math.round(valueSummary.unsettledValue/1000);
				valueStreamingInformationController.settledValue = Math.round(valueSummary.settledValue/1000);
			}

			function updateBalance() {
				messageService.for('lightningService').sendMessage('getBalance', null, (response) => {
					if(response.result) {
						$scope.$apply(() => {
							valueStreamingInformationController.balance = response.result.balanceInSats;
						});
					}
				});
			}
		}
	}
})();