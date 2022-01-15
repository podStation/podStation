import { IEpisodeTableRecord, IPodcastTableRecord, PodcastDatabase } from "./database";

export type LocalPodcastId = number;

export interface IStorageEngine {
	addPodcast(podcast: IPodcastTableRecord): Promise<number>;
	getPodcast(localPodcastId: LocalPodcastId): Promise<IPodcastTableRecord>;
	getAllPodcasts(): Promise<IPodcastTableRecord[]>;
	getAllEpisodes(localPodcastId: LocalPodcastId): Promise<IEpisodeTableRecord[]>;
	updatePodcastAndEpisodes(podcast: IPodcastTableRecord, episodes: IEpisodeTableRecord[]): Promise<void>;
	deletePodcast(localPodcastId: LocalPodcastId): void;
}

export class StorageEngine implements IStorageEngine {
	private db: PodcastDatabase;
	
	constructor() {
		this.db = new PodcastDatabase('podStationPodcastDB');
	}
	
	addPodcast(podcast: IPodcastTableRecord) : Promise<number> {
		return this.db.podcasts.put(podcast);
	}

	getPodcast(localPodcastId: LocalPodcastId): Promise<IPodcastTableRecord> {
		return this.db.podcasts.get(localPodcastId);
	}

	getAllPodcasts(): Promise<IPodcastTableRecord[]> {
		return this.db.podcasts.toArray();
	}

	async updatePodcastAndEpisodes(podcast: IPodcastTableRecord, episodes: IEpisodeTableRecord[]): Promise<void> {

		await this.db.transaction('rw', this.db.podcasts, this.db.episodes, () => {
			this.db.podcasts.put(podcast);
			this.db.episodes.bulkPut(episodes);
		});
		
		return;
	}

	getAllEpisodes(localPodcastId: LocalPodcastId): Promise<IEpisodeTableRecord[]> {
		return this.db.episodes.where({podcastId: localPodcastId}).toArray();
	}

	deletePodcast(localPodcastId: number): void {
		this.db.transaction('rw', this.db.podcasts, this.db.episodes, () => {
			this.db.podcasts.delete(localPodcastId);
			this.db.episodes.where('podcastId').equals(localPodcastId).delete();
		});
	}
}