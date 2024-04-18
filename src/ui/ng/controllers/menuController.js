import $ from 'jquery';
import ChromeExtensionMessageService from '../../../reuse/messageServiceDefinition';

/**
 * 
 * @param {*} $scope 
 * @param {*} $document 
 * @param {*} $location 
 * @param {ChromeExtensionMessageService} messageService 
 * @param {*} analyticsService 
 * @param {import('../../../reuse/podcast-engine/podcastEngine').IPodcastEngine} podcastEngine
 */
function MenuController($rootScope, $scope, $document, $location, messageService, analyticsService, podcastEngine) {
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

		reader.onload = async function(e) {
			var jqParsed = $(e.currentTarget.result);
			var podcasts = [];

			var rssFeeds = jqParsed.find('outline[type="rss"]');
			
			rssFeeds.each(function(index, value) {
				// TODO: Process other fields to use as temp data
				// e.g.: title
				var feedURL = $(value).attr('xmlUrl');

				if(feedURL) {
					podcasts.push(feedURL);
				}
			});

			if(podcasts.length) {
				$location.path('/Podcasts');
				analyticsService.trackEvent('feed', 'add_by_opml_file', undefined, podcasts.length);
				// messageService.for('podcastManager').sendMessage('addPodcasts', { podcasts: podcasts});
				
				await podcastEngine.addPodcasts(podcasts.map((podcast) => ({feedUrl: podcast})));
				
				// TODO: Move to background
				await podcastEngine.updateAddedPodcasts();
			}
		};

		reader.readAsText(file);
	}

	function togglePlaylistVisibility() {
		$rootScope.$broadcast('playlist.toggleVisibility');
	}

	async function exportOpml() {
		const opml = await podcastEngine.getOpml();

		download(opml);
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