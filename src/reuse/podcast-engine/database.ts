import Dexie from 'dexie';

export class PodcastDatabase extends Dexie {
	podcasts!: Dexie.Table<IPodcastTableRecord, number>;
	episodes!: Dexie.Table<IEpisodeTableRecord, number>;
	playlists!: Dexie.Table<IPlaylistTableRecord, number>;
	
	constructor(databaseName: string) {
		super(databaseName);

		this.version(1).stores({
			podcasts: '++id, &feedUrl',
			// [podcastId+pubDate] is useful for getting all episodes of a podcast
			// ordered by pubDate
			episodes: '++id, [podcastId+pubDate], pubDate',
			playlists: '++id, isDefault'
		});
	}
}

/**
 * A DB record that represents a podcasts
 *
 * As podcasts come from feeds, and RSS is the leading format,
 * we will keep the fields as much as possible in line with the
 * elements of the RSS 2.0 channel tag.
 * Reference: https://www.rssboard.org/rss-specification#requiredChannelElements
 */
export interface IPodcastTableRecord {
	id: number;
	feedUrl: string;
	state: PodcastTableRecordState;

	// >>> Feed data
	title?: string;
	imageUrl?: string;
	description?: string; 
	pubDate?: Date;

	/**
	 * Number of episodes in a podcast
	 * 
	 * It is redundant information with the number of records
	 * in the episodes table, but stored here to facilitate the
	 * access to this information
	 */
	numberOfEpisodes?: number;

	/**
	 * Publication date of the most recent episode, it should be
	 * the same as pubDate, but feeds cannot be trusted, this data
	 * is more reliable then pubDate
	 */
	pubDateMostRecentEpisode?: Date;
	// <<< Feed data
}

type PodcastTableRecordState = 'added' | 'ready';

/**
 * A DB record that represents a podcast episode
 * 
 * As episodes come from feeds, and RSS is the leading format,
 * we will keep the fields as much as possible in line with the
 * elements of the RSS 2.0 item tag.
 * Reference: https://www.rssboard.org/rss-specification#hrelementsOfLtitemgt
 */
export interface IEpisodeTableRecord {
	id: number;
	podcastId: number;

	// >>> Feed Data
	title?: string;
	description?: string;
	guid?: string;
	pubDate: Date;
	link?: string;
	enclosureUrl?: string;
	enclosureLength?: number;
	enclosureType?: string;
	duration?: number;
	// <<< Feed Data

	// >>> User Data
	isInDefaultPlaylist: boolean;
	progress?: number;
	// <<< User Data
}

type PlaylistEpisode = {
	episodeId?: number;
	imageUrl?: string;
	title?: string;
	duration?: number;
}

/**
 * A DB record that represents a playlist
 * 
 * A playlist is just a list of ordered episodes.
 * In principle we only have a single playlist, but
 * it should be possible to add multiple playlists in the future if
 * required.
 */
export interface IPlaylistTableRecord {
	id?: number;
	/**
	 * IndexedDB cannot index boolean type, so 1 is true, 0 is false
	 */
	isDefault: number;
	episodes: PlaylistEpisode[];
}