myApp.controller('menuController', ['$scope', '$document', '$location', 'messageService', 'analyticsService', function($scope, $document, $location, messageService, analyticsService) {
	$scope.importOpml = function() {
		$('#opmlUploader').trigger('click');
	};

	$scope.togglePlaylistVisibility = togglePlaylistVisibility;

	// ng-change is not supported for input type='file'
	$document[0].getElementById('opmlUploader').addEventListener('change', fileNameChanged);

	function fileNameChanged(event) {
		var file = event.currentTarget.files[0];

		// clear so that selecting the same file twice will call it again.
		// not really necessary in real world use cases.
		$document[0].getElementById('opmlUploader').value = '';

		var reader = new FileReader;

		reader.onload = function(e) {
			var jqParsed = $(e.currentTarget.result);
			var podcasts = [];

			var rssFeeds = jqParsed.find('outline[type="rss"]');
			
			rssFeeds.each(function(index, value) {
				var feedURL = $(value).attr('xmlUrl');

				if(feedURL) {
					podcasts.push(feedURL);
				}
			});

			if(podcasts.length) {
				$location.path('/Podcasts');
				analyticsService.trackEvent('feed', 'add_by_opml_file', undefined, podcasts.length);
				messageService.for('podcastManager').sendMessage('addPodcasts', { podcasts: podcasts});
			}
		};

		reader.readAsText(file);
	};

	function togglePlaylistVisibility() {
		messageService.for('playlist').sendMessage('toggleVisibility');
	}
}]);