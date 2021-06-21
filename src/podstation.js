import $ from 'jquery';
import podStationApp from './ui/ng/podstationApp';

import './podstation.css';
import 'font-awesome/css/font-awesome.css';

$(document).ready(function() {
	$('#updateAll').click(function(event) {
		event.preventDefault();

		chrome.runtime.getBackgroundPage(function(bgPage) {
			analyticsService.trackEvent('feed', 'user_update_all');
			bgPage.podcastManager.updatePodcast('');
		});
	});
});
