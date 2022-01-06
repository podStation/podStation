import { IPodcastTableRecord, PodcastDatabase } from "./database";

export interface IStorageEngine {
	addPodcast(podcast: IPodcastTableRecord): Promise<number>;
}

export class StorageEngine implements IStorageEngine {
	private db: PodcastDatabase;
	
	constructor() {
		this.db = new PodcastDatabase('podStationPodcastDB');
	}
	
	addPodcast(podcast: IPodcastTableRecord) : Promise<number> {
		return this.db.podcasts.put(podcast);
	}
}