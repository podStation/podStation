import { IEpisodeTableRecord, IPodcastTableRecord, PodcastDatabase } from "./database";
import { PodcastId } from "./ng/services/podcastDataService";

export type LocalPodcastId = number;

export interface IStorageEngine {
	addPodcast(podcast: IPodcastTableRecord): Promise<number>;
	getPodcast(localPodcastId: PodcastId): Promise<IPodcastTableRecord>;
	getAllEpisodes(localPodcastId: PodcastId): Promise<IEpisodeTableRecord[]>;
	updatePodcastAndEpisodes(podcast: IPodcastTableRecord, episodes: IEpisodeTableRecord[]): Promise<void>;
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

	async updatePodcastAndEpisodes(podcast: IPodcastTableRecord, episodes: IEpisodeTableRecord[]): Promise<void> {

		await this.db.transaction('rw', this.db.podcasts, this.db.episodes, () => {
			this.db.podcasts.put(podcast);
			this.db.episodes.bulkPut(episodes);
		});
		
		return;
	}

	getAllEpisodes(localPodcastId: PodcastId): Promise<IEpisodeTableRecord[]> {
		return this.db.episodes.where({podcastId: localPodcastId}).toArray();
	}
}