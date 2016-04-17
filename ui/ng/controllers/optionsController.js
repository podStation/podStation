myApp.controller('optionsController', ['$scope', 'messageService', function($scope, messageService) {
	$scope.loaded = false;
	$scope.options = {};
	$scope.options.autoUpdate = true;
	$scope.options.autoUpdateEvery = 60;

	$scope.save = function() {
		/*chrome.runtime.sendMessage({
			to: 'optionsManager',
			type: 'saveOptions',
			options: $scope.options
		});*/
		
		messageService.for('optionsManager').sendMessage('saveOptions', $scope.options);
	};

	function readOptions() {
		/*chrome.runtime.sendMessage({
			to: 'optionsManager',
			type: 'getOptions',
		}, function(options) {
			$scope.$apply(function() {
				$scope.options = options;
			});
		});*/
		
		messageService.for('optionsManager').sendMessage('getOptions', {}, function(options) {
			$scope.$apply(function() {
				$scope.options = options;
			});
		});
	}

	readOptions();
}]);
