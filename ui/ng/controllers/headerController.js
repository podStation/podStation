myApp.controller('headerController', ['$scope', '$location', function($scope, $location) {
	$scope.entry = "";

	$scope.addPodcast = function() {
		var podcastURL = $scope.entry;

		chrome.runtime.getBackgroundPage(function(bgPage) {
			bgPage.podcastManager.addPodcast(podcastURL);
		});

		$scope.entry = "";
	};

	$scope.searchPodcast = function() {
		$location.path('/Search/' + $scope.entry);
	};
}]);
