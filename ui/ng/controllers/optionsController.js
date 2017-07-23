myApp.controller('optionsController', ['$scope', 'messageService', function($scope, messageService) {
	$scope.loaded = false;
	$scope.options = {};
	$scope.options.autoUpdate = true;
	$scope.options.autoUpdateEvery = 60;
	$scope.options.integrateWithScreenShader = true;

	$scope.save = function() {
		messageService.for('optionsManager').sendMessage('saveOptions', $scope.options);
	};

	function readOptions() {
		messageService.for('optionsManager').sendMessage('getOptions', {}, function(options) {
			$scope.$apply(function() {
				$scope.options = options;
			});
		});
	}

	readOptions();
}]);
