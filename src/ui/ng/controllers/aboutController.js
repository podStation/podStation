function AboutController($scope) {
	$scope.bytesInLocalStorage = 0;
	$scope.bytesInSynchStorage = 0;
	
	chrome.storage.local.getBytesInUse(function(bytesInStorage) {
		$scope.$apply(function() {
			$scope.bytesInLocalStorage = bytesInStorage;
		});
	});
	
	chrome.storage.sync.getBytesInUse(function(bytesInStorage) {
		$scope.$apply(function() {
			$scope.bytesInSynchStorage = bytesInStorage;
		});
	});
}

export default AboutController; 