
/*
Problems:
- determinePodcastUrl relies on the podcast property `url`, while podcastId relies on `feedUrl`, this is an inconsistency
- episodeId uses the episode property `link` while episodeMatchesId uses `url`, this was probably not intended
*/

/**
 * A non-persistent identifier for a podcast
 */
type PodcastId = {
	values: {
		/**
		 * Feed url of a podcast
		 */
		url: string
	}
}

type PodcastForIdDetermination = {
	feedUrl: string;
}

/**
 * A non-persistent identifier for an episode
 * guid, title and link are optional, but at least one of them
 * should have a value.
 */
 type EpisodeId = {
	values: {
		/**
		 * Feed url of a podcast
		 */
		podcastUrl: string,
		guid?: string,
		title?: string,
		link?: string,
		url?: string,
	}
}

type EpisodeForIdDetermination = {
	podcastUrl?: string,
	guid?: string,
	link?: string,
	title?: string,
	url?: string,
}

 function determinePodcastUrl(episode: EpisodeForIdDetermination, podcast: any): string {
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

function PodcastDataService() {
	return new PodcastDataServiceClass();
}

// This does not have to be a class a all, the functions could exist individually.
// It was created as an angular service before we introduced webpack and the usage of modules.
// I cannot remember exactly why it was an angular service, maybe to avoid adding too many global
// functions (again, before we used modules).
// I'll keep it as a class for now to keep it backwards compatible, but this could be
// refactored.
class PodcastDataServiceClass {
	/**
	 * Returns and non-persistent identifier for a podcast
	 */
	podcastId(podcast: PodcastForIdDetermination): PodcastId {
		return {
			values: {
				url: podcast.feedUrl
			}
		}
	}

	/**
	 * Returns an in-memory identifier for a podcast episode
	 * @param {Podcast} podcast optional if episode contains `podcastUrl`
	 */
	episodeId(episode: EpisodeForIdDetermination, podcast?: any) : EpisodeId {
		const _episodeId: EpisodeId = {
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
	episodeMatchesId(episode: EpisodeForIdDetermination, podcast: any, episodeId: EpisodeId): boolean {
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
	episodeIdEqualsId(episodeId1: EpisodeId, episodeId2: EpisodeId): boolean {
		if(episodeId1 === episodeId2)
			return true;

		if(!(episodeId1 && episodeId2))
			return false;

		/**
		 * TODO: possible bug here, if episodeId2 contains more properties than episodeId1, this check would not lead to a false result
		 */
		let key: keyof EpisodeId["values"];
		for(key in episodeId1.values) {
			if(episodeId1.values[key] !== episodeId2.values[key]){
				return false;
			}
		}

		return true;
	}
}

export default PodcastDataService;
export { PodcastDataServiceClass };