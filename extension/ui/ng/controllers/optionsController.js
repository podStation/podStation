myApp.controller('optionsController', ['$scope', 'messageService', function($scope, messageService) {
	$scope.loaded = false;
	$scope.options = {};
	$scope.options.autoUpdate = true;
	$scope.options.autoUpdateEvery = 60;
	$scope.options.integrateWithScreenShader = true;
	$scope.options.analytics = true;
	$scope.options.s = true;

	$scope.lightningOptions = {};


	$scope.save = function() {
		messageService.for('optionsManager').sendMessage('saveOptions', $scope.options);
		messageService.for('lightningService').sendMessage('saveOptions', $scope.lightningOptions);
	};

	function readOptions() {
		messageService.for('optionsManager').sendMessage('getOptions', {}, function(options) {
			$scope.$apply(function() {
				$scope.options = options;
			});
		});

		messageService.for('lightningService').sendMessage('getOptions', {}, (lightningOptions) => {
			$scope.$apply(() => $scope.lightningOptions = lightningOptions);
		});
	}

	readOptions();
}]);
