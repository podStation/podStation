import $ from 'jquery';

function HeaderController($scope, $location, analyticsService, storageServiceUI) {
	$scope.entry = "";

	$scope.editBoxKeyPress = function(event) {
		if(event.which === 13) {
			$scope.searchPodcast();
		}
	};

	$scope.addPodcast = function() {
		var podcastURL = $scope.entry;

		chrome.runtime.getBackgroundPage(function(bgPage) {
			analyticsService.trackEvent('feed', 'add_by_feed_url');
			bgPage.podcastManager.addPodcast(podcastURL);
		});

		$scope.entry = "";

		$location.path('/Podcasts');
	};

	$scope.searchPodcast = function() {
		$location.path('/Search/' + $scope.entry);
	};

	$scope.toggleColorScheme = function() {
		
		storageServiceUI.loadSyncUIOptions(function(uiOptions){
			
			if( uiOptions.cs === 'dark'){
				if($('body').hasClass('dark-scheme')){
					
					$('body').removeClass('dark-scheme');
					uiOptions.cs = 'light';

				}
			}else if(uiOptions.cs === 'light') {
				
				$('body').addClass('dark-scheme');
				uiOptions.cs = 'dark';
			
			}
			return true;
		});

		return true;
	};
}

export default HeaderController;