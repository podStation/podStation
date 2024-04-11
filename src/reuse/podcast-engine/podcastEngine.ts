import { Observable, liveQuery } from "dexie";
import { IPodcastTableRecord } from "./database";
import { IPodcastUpdater, PodcastUpdater } from "./podcastUpdater";
import { IStorageEngine, LocalEpisodeId, LocalPodcastId, LocalStorageEpisode, LocalStoragePlaylist, LocalStoragePodcast, StorageEngine } from "./storageEngine";

/**
 * A podcast to be added, to the engine, identified by its feed URL.
 * The other fields are supposed to come from search engines, and, 
 * in general, serve as temporary values until the feed is parsed. 
 */
type PodcastToBeAdded = {
	feedUrl: URL;
	title?: string;
	description?: string;
	imageUrl?: URL;
	podcastIndexOrgId?: string;
	itunesId?: string;
}

export interface IPodcastEngine {
	addPodcast(podcast: PodcastToBeAdded): Promise<void>;
	getPodcast(localPodcastId: LocalPodcastId): Promise<LocalStoragePodcast>;
	getObservableForAllPodcasts(): Observable<LocalStoragePodcast[]>
	deletePodcast(localPodcastId: LocalPodcastId): void;
	updatePodcast(localPodcastId: LocalPodcastId): void;
	/**
	 * Get all episodes of a podcast, sorted by pubDate
	 */
	getPodcastEpisodes(localPodcastId: LocalPodcastId, offset: number, limit: number, reverse: boolean): Promise<LocalStorageEpisode[]>;
	getPodcastEpisodesObservable(localPodcastId: LocalPodcastId, offset: number, limit: number, reverse: boolean): Observable<LocalStorageEpisode[]>;
	getLastEpisodes(offset: number, limit: number): Promise<LocalStorageEpisode[]>;
	getLastEpisodesObservable(offset: number, limit: number): Observable<LocalStorageEpisode[]>;
	getEpisodesInProgress(offset: number, limit: number): Promise<LocalStorageEpisode[]>;
	getEpisodesInProgressObservable(offset: number, limit: number): Observable<LocalStorageEpisode[]>;
	getEpisode(localEpisodeId: LocalEpisodeId): Promise<LocalStorageEpisode>;
	getNextOrPreviousEpisode(localEpisodeId: number, order: string, isNext: boolean): Promise<LocalStorageEpisode>
	
	/**
	 * 
	 * @param localEpisodeId 
	 * @param progress progress of the episode in seconds
	 */
	setEpisodeProgress(localEpisodeId: LocalEpisodeId, progress: number, lastTimePlayed: Date): Promise<void>;
	
	addEpisodeToDefaultPlaylist(localEpisodeId: LocalEpisodeId): Promise<void>;
	removeEpisodeFromDefaultPlaylist(localEpisodeId: LocalEpisodeId): Promise<void>;
	getDefaultPlaylistObservable(): Observable<LocalStoragePlaylist[]>
	reorderPlaylistEpisodes(playlistId: number, episodeIds: number[]): Promise<void>;
}

class PodcastEngine implements IPodcastEngine {
	private storageEngine: IStorageEngine;
	private podcastUpdater: IPodcastUpdater;
	
	constructor(storageEngine: IStorageEngine, podcastUpdater: IPodcastUpdater) {
		this.storageEngine = storageEngine;
		this.podcastUpdater = podcastUpdater;
	}
	
	async addPodcast(podcast: PodcastToBeAdded): Promise<void> {
		let localPodcastId = await this.storageEngine.addPodcast({
			id: undefined, // autoincremented
			title: podcast.title,
			feedUrl: podcast.feedUrl.toString(),
			imageUrl: podcast.imageUrl.toString(),
			description: podcast.description,
			state: 'added'
		});

		this.updatePodcast(localPodcastId);
	}

	async getPodcast(localPodcastId: LocalPodcastId): Promise<LocalStoragePodcast> {
		return this.storageEngine.getPodcast(localPodcastId);
	}

	getObservableForAllPodcasts(): Observable<IPodcastTableRecord[]> {
		return this.storageEngine.getObservableForAllPodcasts();
	}

	deletePodcast(localPodcastId: LocalPodcastId) {
		return this.storageEngine.deletePodcast(localPodcastId);
	}

	updatePodcast(localPodcastId: LocalPodcastId) {
		this.podcastUpdater.update(localPodcastId);
	}

	getPodcastEpisodes(localPodcastId: LocalPodcastId, offset: number, limit: number, reverse: boolean): Promise<LocalStorageEpisode[]> {
		return this.storageEngine.getPodcastEpisodes(localPodcastId, offset, limit, reverse);
	}

	getPodcastEpisodesObservable(localPodcastId: LocalPodcastId, offset: number, limit: number, reverse: boolean): Observable<LocalStorageEpisode[]> {
		return liveQuery(() => this.getPodcastEpisodes(localPodcastId, offset, limit, reverse));
	}

	getLastEpisodes(offset: number, limit: number): Promise<LocalStorageEpisode[]> {
		return this.storageEngine.getLastEpisodes(offset, limit);
	}

	getLastEpisodesObservable(offset: number, limit: number): Observable<LocalStorageEpisode[]> {
		return liveQuery(() => this.getLastEpisodes(offset, limit));
	}

	getEpisodesInProgress(offset: number, limit: number): Promise<LocalStorageEpisode[]> {
		return this.storageEngine.getEpisodesInProgress(offset, limit);
	}

	getEpisodesInProgressObservable(offset: number, limit: number): Observable<LocalStorageEpisode[]> {
		return liveQuery(() => this.storageEngine.getEpisodesInProgress(offset, limit));
	}

	getEpisode(localEpisodeId: number): Promise<LocalStorageEpisode> {
		return this.storageEngine.getEpisode(localEpisodeId);
	}

	getNextOrPreviousEpisode(localEpisodeId: number, order: string, isNext: boolean): Promise<LocalStorageEpisode> {
		return this.storageEngine.getNextOrPreviousEpisode(localEpisodeId, order, isNext);
	}

	async setEpisodeProgress(localEpisodeId: LocalEpisodeId, progress: number, lastTimePlayed: Date): Promise<void> {
		await this.storageEngine.setEpisodeProgress(localEpisodeId, progress, lastTimePlayed);

		// TODO: Update sync storage, react to sync storage change
	}

	addEpisodeToDefaultPlaylist(localEpisodeId: LocalEpisodeId): Promise<void> {
		return this.storageEngine.addEpisodeToDefaultPlaylist(localEpisodeId);
	}

	removeEpisodeFromDefaultPlaylist(localEpisodeId: LocalEpisodeId): Promise<void> {
		return this.storageEngine.removeEpisodeFromDefaultPlaylist(localEpisodeId);
	}

	getDefaultPlaylistObservable(): Observable<LocalStoragePlaylist[]> {
		return this.storageEngine.getDefaultPlaylistObservable();
	}

	reorderPlaylistEpisodes(playlistId: number, episodeIds: number[]): Promise<void> {
		return this.storageEngine.reorderPlaylistEpisodes(playlistId, episodeIds);
	}
}

export class PodcastEngineHolder {
	private static podcastEngine: IPodcastEngine;
	
	static getPodcastEngine(): IPodcastEngine {
		if(!PodcastEngineHolder.podcastEngine) {
			let localStorageEngine = new StorageEngine();
			let podcastUpdater = new PodcastUpdater(localStorageEngine);

			PodcastEngineHolder.podcastEngine = new PodcastEngine(localStorageEngine, podcastUpdater);
		}

		return PodcastEngineHolder.podcastEngine;
	}
}

export default IPodcastEngine;