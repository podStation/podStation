(function() {
	angular.module('podstationApp').directive('psValueStreamingInformation', ['$interval', 'messageService', ValueStreamingInformationDirective]);

	function ValueStreamingInformationDirective($interval, messageService) {
		return {
			restrict: 'E',
			controller: ValueStreamingInformation,
			controllerAs: 'valueStreamingInformation',
			bindToController: true,
			templateUrl: 'ui/ng/partials/valueStreamingInformantion.html'
		};

		function ValueStreamingInformation() {
			var valueStreamingInformationController = this;

			valueStreamingInformationController.isV4vConfigured = false;
			valueStreamingInformationController.unsettledValue = 0

			messageService.for('valueHandlerService').sendMessage('getValueSummary', null, (valueSummary) => handleValueSummary(valueSummary));
			messageService.for('valueHandlerService').onMessage('valueChanged', (valueSummary) => handleValueSummary(valueSummary));

			return valueStreamingInformationController;

			function handleValueSummary(valueSummary) {
				valueStreamingInformationController.isV4vConfigured = valueSummary.isActive;
				valueStreamingInformationController.unsettledValue = Math.round(valueSummary.unsettledValue/1000);
				valueStreamingInformationController.settledValue = Math.round(valueSummary.settledValue/1000);
			}
		}
	}
})();