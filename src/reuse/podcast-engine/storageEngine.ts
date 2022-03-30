import { IEpisodeTableRecord, IPodcastTableRecord, PodcastDatabase } from "./database";

export type LocalPodcastId = number;
export type LocalEpisodeId = number;

/**
 * A podcast as represented in local storage.
 * A list of episodes is not available at the podcast, because 
 * episodes can be too many, so they have to be accessed in a paginated way.
 */
export type LocalStoragePodcast = {
	id?: LocalPodcastId;
	feedUrl: string;
	imageUrl?: string;
	title?: string;
	description?: string; 
	numberOfEpisodes?: number;
	pubDate?: Date;
	state: LocalStoragePodcastState;
}

export type LocalStoragePodcastState = 'added' | 'ready';

/**
 * An episode as represented in local storage.
 */
type LocalStorageEpisode = {
	id?: LocalEpisodeId;
	podcastId: LocalPodcastId;
	title?: string;
	description?: string;
	guid?: string;
}

export interface IStorageEngine {
	addPodcast(podcast: LocalStoragePodcast): Promise<number>;
	getPodcast(localPodcastId: LocalPodcastId): Promise<LocalStoragePodcast>;
	getAllPodcasts(): Promise<LocalStoragePodcast[]>;
	getAllPodcastEpisodes(localPodcastId: LocalPodcastId): Promise<LocalStorageEpisode[]>;
	updatePodcastAndEpisodes(podcast: LocalStoragePodcast, episodes: LocalStorageEpisode[]): Promise<void>;
	deletePodcast(localPodcastId: LocalPodcastId): void;
}

export class StorageEngine implements IStorageEngine {
	private db: PodcastDatabase;
	
	constructor() {
		this.db = new PodcastDatabase('podStationPodcastDB');
	}
	
	addPodcast(podcast: LocalStoragePodcast) : Promise<number> {
		return this.db.podcasts.put(podcast);
	}

	getPodcast(localPodcastId: LocalPodcastId): Promise<LocalStoragePodcast> {
		return this.db.podcasts.get(localPodcastId);
	}

	getAllPodcasts(): Promise<LocalStoragePodcast[]> {
		return this.db.podcasts.toArray();
	}

	async updatePodcastAndEpisodes(podcast: LocalStoragePodcast, episodes: LocalStorageEpisode[]): Promise<void> {

		await this.db.transaction('rw', this.db.podcasts, this.db.episodes, () => {
			this.db.podcasts.put(podcast);
			this.db.episodes.bulkPut(episodes);
		});
		
		return;
	}

	getAllPodcastEpisodes(localPodcastId: LocalPodcastId): Promise<IEpisodeTableRecord[]> {
		return this.db.episodes.where({podcastId: localPodcastId}).toArray();
	}

	deletePodcast(localPodcastId: number): void {
		this.db.transaction('rw', this.db.podcasts, this.db.episodes, () => {
			this.db.podcasts.delete(localPodcastId);
			this.db.episodes.where('podcastId').equals(localPodcastId).delete();
		});
	}
}