import Dexie from "dexie";
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
export type LocalStorageEpisode = {
	id?: LocalEpisodeId;
	podcastId: LocalPodcastId;
	podcast?: LocalStoragePodcast;
	title?: string;
	description?: string;
	guid?: string;
	pubDate: Date;
	link?: string;
	enclosureUrl?: string;
	enclosureLength?: number;
	enclosureType?: string;
	duration?: number;
}

export interface IStorageEngine {
	addPodcast(podcast: LocalStoragePodcast): Promise<number>;
	getPodcast(localPodcastId: LocalPodcastId): Promise<LocalStoragePodcast>;
	getAllPodcasts(): Promise<LocalStoragePodcast[]>;
	getAllPodcastEpisodes(localPodcastId: LocalPodcastId): Promise<LocalStorageEpisode[]>;
	getPodcastEpisodes(localPodcastId: LocalPodcastId, offset: number, limit: number, reverse: boolean): Promise<LocalStorageEpisode[]>;
	updatePodcastAndEpisodes(podcast: LocalStoragePodcast, episodes: LocalStorageEpisode[]): Promise<void>;
	deletePodcast(localPodcastId: LocalPodcastId): void;
	getLastEpisodes(offset: number, limit: number): Promise<LocalStorageEpisode[]>;
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

	getPodcastEpisodes(localPodcastId: LocalPodcastId, offset: number, limit: number, reverse: boolean): Promise<LocalStorageEpisode[]> {
		// important note, this query will not bring entries without a pubDate, so it
		// needs to be ensured that this field is set on the record 
		return this.db.episodes.where('[podcastId+pubDate]').between(
			[localPodcastId, Dexie.minKey],
			[localPodcastId, Dexie.maxKey]
		).reverse().offset(offset).limit(limit).toArray();
	}

	deletePodcast(localPodcastId: number): void {
		this.db.transaction('rw', this.db.podcasts, this.db.episodes, () => {
			this.db.podcasts.delete(localPodcastId);
			this.db.episodes.where('podcastId').equals(localPodcastId).delete();
		});
	}

	async getLastEpisodes(offset: number, limit: number): Promise<LocalStorageEpisode[]> {
		const episodes: LocalStorageEpisode[] = await this.db.episodes.orderBy('pubDate').reverse().offset(offset).limit(limit).toArray();

		const uniquePodcastIds = episodes.map((episode) => episode.podcastId)
			// filter unique podcastIds
			.filter((podcastId, index, self) => self.indexOf(podcastId) === index);

		const podcasts: LocalStoragePodcast[] = await this.db.podcasts.where('id').anyOf(uniquePodcastIds).toArray();

		return StorageEngine.enrichEpisodesWithPodcast(episodes, podcasts);
	}

	private static enrichEpisodesWithPodcast(episodes: LocalStorageEpisode[], podcasts: LocalStoragePodcast[]): LocalStorageEpisode[] {
		return episodes.map((episode) => {
			// I'm not treating exceptions here because the data constraints ensure that a single entry
			// will exist here
			const podcast = podcasts.filter((podcast) => podcast.id === episode.podcastId)[0];

			return {
				...episode,
				podcast: podcast
			}
		})
	}
}