import $ from 'jquery';
import ChromeExtensionMessageService from '../../../reuse/messageServiceDefinition';

/**
 * 
 * @param {*} $scope 
 * @param {*} $document 
 * @param {*} $location 
 * @param {ChromeExtensionMessageService} messageService 
 * @param {*} analyticsService 
 */
function MenuController($scope, $document, $location, messageService, analyticsService) {
	$scope.importOpml = function() {
		$('#opmlUploader').trigger('click');
	};

	$scope.togglePlaylistVisibility = togglePlaylistVisibility;
	$scope.exportOpml = exportOpml;

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

	function exportOpml() {
		messageService.for('podcastManager').sendMessage('getOpml', null, response => {
			download(response);
		});
	}

	function download(text) {

		var element = $document[0].createElement('a');
		element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
		element.setAttribute('download', 'podStation.opml');

		element.style.display = 'none';
		$document[0].body.appendChild(element);
		element.click();
		$document[0].body.removeChild(element);
	}
}

export default MenuController;