/**
 * A non-persistent identifier for a podcast
 * @typedef {Object} PodcastId
 */

/**
 * A non-persistent identifier for an episode
 * @typedef {Object} EpisodeId
 */

(function() {
	'use strict';

	angular
		.module('podstationInternalReuse')
		.factory('podcastDataService', [podcastDataService]);

	function podcastDataService() {
		var service = {
			podcastId: podcastId,
			episodeId: episodeId,
			episodeMatchesId: episodeMatchesId,
			episodeIdEqualsId: episodeIdEqualsId
		};

		return service;

		/**
		 * Returns and non-persistent identifier for a podcast
		 * @param {Podcast} podcast 
		 * @return {PodcastId}
		 */
		function podcastId(podcast) {
			return {
				values: {
					url: podcast.feedUrl
				}
			}
		}

		/**
		 * Returns an in-memory identifier for a podcast episode
		 * @param {Episode} episode
		 * @param {Podcast} podcast optional if episode contains `podcastUrl`
		 * @return {EpisodeId}
		 */
		function episodeId(episode, podcast) {
			const _episodeId = {
				values: {
					podcastUrl: determinePodcastUrl(episode, podcast),
				}
			};

			episode.guid && (_episodeId.values.guid = episode.guid);
			episode.title && (_episodeId.values.title = episode.title);
			episode.link && (_episodeId.values.link = episode.link);

			return _episodeId;
		}

		/**
		 * Checks if a given episode and podcast matches an episodeId
		 * @param {EpisodeId} episodeId
		 */
		function episodeMatchesId(episode, podcast, episodeId) {
			var podcastUrl = determinePodcastUrl(episode, podcast);

			// if no podcast url can be determined, ignore it
			if(podcastUrl && podcastUrl !== episodeId.values.podcastUrl)
				return false;

			if(episodeId.values.guid) {
				if(episode.guid && episode.guid === episodeId.values.guid) {
					return true;
				}
				else {
					return false;
				}
			}

			if(episode.title && episode.title === episodeId.values.title)
				return true;

			if(episode.url && episode.url === episodeId.values.url)
				return true;

			return false;
		}

		/**
		 * 
		 * @param {EpisodeId} episodeId1 
		 * @param {EpisodeId} episodeId2 
		 * @returns {Boolean}
		 */
		function episodeIdEqualsId(episodeId1, episodeId2) {
			for(var key in episodeId1.values) {
				if(episodeId1.values[key] !== episodeId2.values[key]){
					return false;
				}
			}

			return true;
		}

		function determinePodcastUrl(episode, podcast) {
			var url;
			if(episode.podcastUrl) {
				url = episode.podcastUrl;
			}
			else if (typeof podcast === 'string') {
				url = podcast;
			}
			else if (podcast) {
				url = podcast.url;
			}

			if(!url) {
				throw Error('could not determine podcastUrl for podcastId');
			}

			return url;
		}
	}
})();