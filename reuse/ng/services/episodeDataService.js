
// the global instance is for services not yet converted into angular
var episodeDataService;

(function() {
	'use strict';

	angular
		.module('podstationInternalReuse')
		.factory('episodeDataService', ['podcastManagerService', _episodeDataService]);

	function _episodeDataService() {
		var service = {
			buildEpisodeId: buildEpisodeId,
			buildEpisodeStorageId: buildEpisodeStorageId,
			episodeMatchesId: episodeMatchesId
		};

		episodeDataService = service;

		return service;

		function determinePodcastUrl(episode, podcast) {
			return episode.podcastUrl || (typeof podcast === 'string' ? podcast : podcast.url);
		}

		function buildEpisodeId(episode, podcast) {
			return {
				values: {
					podcastUrl: determinePodcastUrl(episode, podcast),
					guid: episode.guid,
					title: episode.title,
					url: episode.url
				}
			}
		}

		function buildEpisodeStorageId(episodeOrId) {
			var episode;
			
			if(episodeOrId.value) {
				episode = episodeOrId.value;
			}
			else {
				episode = episodeOrId;
			}

			var result = null;
			
			['guid','title','url'].every(function(item) {
				if(episode[item]) {
					result = {
						idType: item,
						idValue: episode[item]
					}
					return false;
				}

				return true;
			})

			return result;
		}

		/**
		 * Checks if a given episode and podcast matches and episodeId
		 */
		function episodeMatchesId(episode, podcast, id) {
			var podcastUrl = determinePodcastUrl(episode, podcast);

			// if no podcast url can be determined, ignore it
			if(podcastUrl && podcastUrl !== id.values.podcastUrl)
				return false;

			if(episode.guid && episode.guid === id.values.guid)
				return true;

			if(episode.title && episode.title === id.values.title)
				return true;

			if(episode.url && episode.url === id.values.url)
				return true;

			return false;
		}
	}
})();