import Dexie from 'dexie';

export class PodcastDatabase extends Dexie {
	podcasts!: Dexie.Table<IPodcastTableRecord, number>;
	episodes!: Dexie.Table<IEpisodeTableRecord, number>;
	
	constructor(databaseName: string) {
		super(databaseName);

		this.version(1).stores({
			podcasts: '++id, &feedUrl, title',
			episodes: '++id, podcastId, title, guid'
		});
	}
}

export interface IPodcastTableRecord {
	id?: number;
	feedUrl: string;
	title?: string;
	imageUrl?: string;
	description?: string; 
	numberOfEpisodes?: number;
	
}

export interface IEpisodeTableRecord {
	id?: number;
	podcastId: number;
	title?: string;
	description?: string;
	guid?: string;
}