import ChromeExtensionMessageService from "../../../reuse/messageServiceDefinition";

/**
 * 
 * @param {ChromeExtensionMessageService} messageService 
 * @returns 
 */
function ValueStreamingInformationDirective(messageService) {
	return {
		restrict: 'E',
		controller: ['$scope', ValueStreamingInformationController],
		controllerAs: 'valueStreamingInformation',
		bindToController: true,
		templateUrl: 'ui/ng/partials/valueStreamingInformantion.html'
	};

	function ValueStreamingInformationController($scope) {
		var valueStreamingInformationController = this;

		valueStreamingInformationController.isV4vConfigured = false;
		valueStreamingInformationController.unsettledValue = 0;
		valueStreamingInformationController.balance = 0;
		valueStreamingInformationController.invoice = "";

		valueStreamingInformationController.generateInvoice = generateInvoice;
		valueStreamingInformationController.clearInvoice = clearInvoice;

		messageService.for('valueHandlerService').sendMessage('getValueSummary', null, (valueSummary) => {
			updateControllerFromValueSummary(valueSummary);

			if(valueSummary.isV4vConfigured) {
				updateBalance();
			}
		});
		
		messageService.for('valueHandlerService').onMessage('valueChanged', (valueSummary) => updateControllerFromValueSummary(valueSummary));
		messageService.for('valueHandlerService').onMessage('valuePaid', () => updateBalance());

		return valueStreamingInformationController;

		function updateControllerFromValueSummary(valueSummary) {
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
				const ERROR_MESSAGE = 'Error generating invoice';

				if(response.invoice) {
					$scope.$apply(() => {
						valueStreamingInformationController.invoice = response.invoice;
					});
				}
				else {
					alert(typeof response.error === 'string' ? `${ERROR_MESSAGE}: ${response.error}`: ERROR_MESSAGE);
				}
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

export default ValueStreamingInformationDirective;