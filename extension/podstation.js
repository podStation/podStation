$(document).ready(function() {
	$('#updateAll').click(function(event) {
		event.preventDefault();

		chrome.runtime.getBackgroundPage(function(bgPage) {
			analyticsService.trackEvent('feed', 'user_update_all');
			bgPage.podcastManager.updatePodcast('');
		});
	});

	// Apply theme during extension load
	chrome.storage.sync.get('ui',function(storageObject){
		
		var uiOptions = storageObject.ui ? storageObject.ui : {};
		
		if( uiOptions !== 'undefined' && uiOptions.cs === 'dark'){
			$('body').addClass('dark-scheme');
		}

	});
});
