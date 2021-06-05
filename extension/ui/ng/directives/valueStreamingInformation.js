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
			valueStreamingInformationController.invoice = "";

			valueStreamingInformationController.generateInvoice = generateInvoice;
			valueStreamingInformationController.clearInvoice = clearInvoice;

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

			function generateInvoice() {
				const invoiceAmountUserInput = prompt("How many sats?", "10000");

				if(invoiceAmountUserInput === null) {
					return;
				}

				const invoiceAmount = parseInt(invoiceAmountUserInput);

				if(isNaN(invoiceAmount) || invoiceAmount <= 0) {
					alert("Invalid amount, enter a positive number of sats greater than zero")
					return;
				}

				messageService.for('lightningService').sendMessage('generateInvoice', convertFrom_SatsTo_mSats(invoiceAmount), (response) => {
					$scope.$apply(() => {
						valueStreamingInformationController.invoice = response.invoice;
					});
				});
			}

			function clearInvoice() {
				valueStreamingInformationController.invoice = null;
			}

			function convertFrom_SatsTo_mSats(amountInSats) {
				return amountInSats * 1000;
			}
		}
	}
})();