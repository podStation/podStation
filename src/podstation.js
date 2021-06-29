import $ from 'jquery';
import podStationApp from './ui/ng/podstationApp';

import './podstation.css';
import 'font-awesome/css/font-awesome.css';
import AnalyticsService from './reuse/ng/services/analyticsService';

$(document).ready(function() {
	$('#updateAll').click(function(event) {
		event.preventDefault();

		chrome.runtime.getBackgroundPage(function(bgPage) {
			let analyticsService = new AnalyticsService();
			analyticsService.trackEvent('feed', 'user_update_all');
			bgPage.podcastManager.updatePodcast('');
		});
	});
});
