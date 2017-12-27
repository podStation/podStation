(function() {
	'use strict';

	angular
		.module('podstationApp')
		.factory('socialService', ['$window','podcastManagerService', socialService]);

	function socialService($window, podcastManagerService) {
		var service = {
			tweet: tweet,
			shareWithFacebook: shareWithFacebook
		};

		function tweet(episodeId) {
			podcastManagerService.getPodcastAndEpisode(episodeId).then(function(result) {
				// https://dev.twitter.com/web/intents
				var tweetUrl;

				tweetUrl = 'https://twitter.com/intent/tweet?' + $.param({
					text: result.episode.title,
					url: result.episode.link ? result.episode.link : result.episode.url, 
					hashtags: 'podcast,podstation', 
					via: 'podstation_app'
				});

				$window.open(tweetUrl, '_blank', 'width=550,height=420');
			});
		}

		function shareWithFacebook(episodeId) {
			podcastManagerService.getPodcastAndEpisode(episodeId).then(function(result) {
				// https://developers.facebook.com/docs/sharing/reference/share-dialog#advancedtopics

				var shareUrl;

				shareUrl = 'https://www.facebook.com/dialog/share?' + $.param({
					app_id: '405324126571182',
					quote: result.episode.title,
					href: result.episode.link ? result.episode.link : result.episode.url, 
					hashtag: '#podstation',
				});

				$window.open(shareUrl, '_blank', 'width=550,height=420');
			});
		}

		return service;
	}

})();