/**
 * @constructor
 * @param {EpisodeSelectorType} type 
 * @param {string} value 
 * @param {string} podcastUrl 
 * @param {PodcastKey} podcastKey 
 */
function EpisodeSelector(type, value, podcastUrl, podcastKey) {
	this.type = type ? type : 'g';
	this.value = value;
	this.podcastUrl = podcastUrl;
	this.podcastKey = podcastKey;

	this.matchesId = matchesId;

	/**
	 * 
	 * @param {EpisodeId} episodeId 
	 * @returns {Boolean}
	 */
	function matchesId(episodeId) {
		const idAttribute = {
			'g': EpisodeSelector.GUID,
			't': EpisodeSelector.TITLE
		}[this.type];

		return episodeId.values[idAttribute] === this.value;
	}
}

(function() {
	EpisodeSelector.GUID = 'guid';
	EpisodeSelector.TITLE = 'title';

	EpisodeSelector.ABBREVIATED_GUID = 'g';
	EpisodeSelector.ABBREVIATED_TITLE = 't';

	EpisodeSelector.fromId = fromId;

	/**
	 * @param {EpisodeId} episodeId 
	 * @param {PodcastKey} podcastKey
	 * @returns {EpisodeSelector}
	 */
	function fromId(episodeId, podcastKey) {
		const type = ['guid', 'title'].find(function(attribute) {
			return episodeId.values[attribute];
		});

		const abbreviatedType = {
			'guid': EpisodeSelector.ABBREVIATED_GUID,
			'title': EpisodeSelector.ABBREVIATED_TITLE
		}

		return new EpisodeSelector(abbreviatedType[type], episodeId.values[type], episodeId.values.podcastUrl, podcastKey);
	}
})();

