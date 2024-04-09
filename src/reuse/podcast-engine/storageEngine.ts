import Dexie, { liveQuery, Observable } from "dexie";
import { IEpisodeTableRecord, IPodcastTableRecord, PodcastDatabase } from "./database";

export type LocalPodcastId = number;
export type LocalEpisodeId = number;
export type LocalPlaylistId = number;

/**
 * A podcast as represented in local storage.
 * A list of episodes is not available at the podcast, because 
 * episodes can be too many, so they have to be accessed in a paginated way.
 */
export type LocalStoragePodcast = {
	id: LocalPodcastId;
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
	id: LocalEpisodeId;
	podcastId: LocalPodcastId;
	podcast?: LocalStoragePodcast;
	
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
	lastTimePlayed?: Date;
	// <<< User Data
}

export type LocalStoragePlaylistEpisode = {
	episodeId?: LocalEpisodeId;
	imageUrl?: string;
	title?: string;
	duration?: number;
}

export type LocalStoragePlaylist = {
	id?: LocalPlaylistId;
	episodes: LocalStoragePlaylistEpisode[];
	isDefault: number;
}

export interface IStorageEngine {
	addPodcast(podcast: LocalStoragePodcast): Promise<number>;
	getPodcast(localPodcastId: LocalPodcastId): Promise<LocalStoragePodcast>;
	getObservableForAllPodcasts(): Observable<LocalStoragePodcast[]>;
	getAllPodcastEpisodes(localPodcastId: LocalPodcastId): Promise<LocalStorageEpisode[]>;
	getPodcastEpisodes(localPodcastId: LocalPodcastId, offset: number, limit: number, reverse: boolean): Promise<LocalStorageEpisode[]>;
	updatePodcastAndEpisodes(podcast: LocalStoragePodcast, episodes: LocalStorageEpisode[]): Promise<void>;
	deletePodcast(localPodcastId: LocalPodcastId): void;
	getLastEpisodes(offset: number, limit: number): Promise<LocalStorageEpisode[]>;
	getEpisodesInProgress(offset: number, limit: number): Promise<LocalStorageEpisode[]>;
	getEpisode(localEpisodeId: LocalEpisodeId): Promise<LocalStorageEpisode>;
	getNextOrPreviousEpisode(localEpisodeId: number, order: string, isNext: boolean): Promise<LocalStorageEpisode>

	setEpisodeProgress(localEpisodeId: number, progress: number, lastTimePlayed: Date): Promise<void>;
	
	// >>> Playlist storage
	addEpisodeToDefaultPlaylist(localEpisodeId: LocalEpisodeId): Promise<void>;
	removeEpisodeFromDefaultPlaylist(localEpisodeId: LocalEpisodeId): Promise<void>;
	// getDefaultPlaylist(): Promise<LocalStoragePlaylist | null>;
	getDefaultPlaylistObservable(): Observable<LocalStoragePlaylist[]>;
	reorderPlaylistEpisodes(playlistId: number, episodeIds: number[]): Promise<void>;
	// <<< Playlist storage
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

	getObservableForAllPodcasts(): Observable<LocalStoragePodcast[]> {
		return liveQuery(() => this.db.podcasts.toArray());
	}

	async updatePodcastAndEpisodes(podcast: LocalStoragePodcast, episodes: LocalStorageEpisode[]): Promise<void> {

		await this.db.transaction('rw', this.db.podcasts, this.db.episodes, () => {
			this.db.podcasts.put(podcast);
			this.db.episodes.bulkPut(episodes);
		});
		
		return;
	}

	getAllPodcastEpisodes(localPodcastId: LocalPodcastId): Promise<LocalStorageEpisode[]> {
		return this.db.episodes.where({podcastId: localPodcastId}).toArray();
	}

	getPodcastEpisodes(localPodcastId: LocalPodcastId, offset: number, limit: number, reverse: boolean): Promise<LocalStorageEpisode[]> {
		// important note, this query will not bring entries without a pubDate, so it
		// needs to be ensured that this field is set on the record 
		let collection = this.db.episodes.where('[podcastId+pubDate]').between(
			[localPodcastId, Dexie.minKey],
			[localPodcastId, Dexie.maxKey]
		);

		if(reverse) {
			collection = collection.reverse();
		}
		
		return collection.offset(offset).limit(limit).toArray();
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

	async getEpisodesInProgress(offset: number, limit: number): Promise<LocalStorageEpisode[]> {
		const episodes: LocalStorageEpisode[] = await this.db.episodes.where('[lastTimePlayed+progress]').between(
			[Dexie.minKey, 1],
			[Dexie.maxKey, Dexie.maxKey]
		)
		.offset(offset).limit(limit).reverse()
		.toArray();

		const uniquePodcastIds = episodes.map((episode) => episode.podcastId)
			// filter unique podcastIds
			.filter((podcastId, index, self) => self.indexOf(podcastId) === index);

		const podcasts: LocalStoragePodcast[] = await this.db.podcasts.where('id').anyOf(uniquePodcastIds).toArray();

		return StorageEngine.enrichEpisodesWithPodcast(episodes, podcasts);
	}

	async getEpisode(localEpisodeId: LocalEpisodeId): Promise<LocalStorageEpisode> {
		const episode: LocalStorageEpisode = await this.db.episodes.get(localEpisodeId);
		const podcast: LocalStoragePodcast = await this.db.podcasts.get(episode.podcastId);

		return {
			...episode,
			podcast: podcast
		}
	}

	async getNextOrPreviousEpisode(localEpisodeId: number, order: string, isNext: boolean): Promise<LocalStorageEpisode> {
		switch(order ? order : 'from_last_episodes') {
			case 'from_podcast':
			default:
				return this.getNextOrPreviousEpisodeFromPodcast(localEpisodeId, isNext);
			case 'from_last_episodes':
				return this.getEpisodeFromLastEpisodes(localEpisodeId, isNext);
			case 'from_playlist':
				return this.getEpisodeFromDefaultPlaylist(localEpisodeId, isNext);
		}
	}

	private async getNextOrPreviousEpisodeFromPodcast(localEpisodeId: number, isNext: boolean): Promise<LocalStorageEpisode> {
		const episode = await this.db.episodes.get(localEpisodeId);
		const pubDateRange = StorageEngine.getPubdateRange(episode.pubDate, isNext);

		let collection = this.db.episodes.where('[podcastId+pubDate]').between(
			[episode.podcastId, pubDateRange.lower],
			[episode.podcastId, pubDateRange.upper]
		);

		if(!isNext) {
			collection = collection.reverse();
		}

		// this code will not work well if there are multiple episodes with the same pubDate, but I think this is unusual
		// I'll fix if reported.
		collection = collection
		  .filter(item => item.id != localEpisodeId)
		  .limit(1)

		const nextOrPreviousEpisode = await collection.toArray();

		return nextOrPreviousEpisode.length ? nextOrPreviousEpisode[0] : null;
	}

	private async getEpisodeFromLastEpisodes(localEpisodeId: number, isNext: boolean): Promise<LocalStorageEpisode>  {
		const episode = await this.db.episodes.get(localEpisodeId);
		const pubDateRange = StorageEngine.getPubdateRange(episode.pubDate, isNext);
		
		let collection = this.db.episodes.where('pubDate').between(pubDateRange.lower, pubDateRange.upper);

		if(!isNext) {
			collection = collection.reverse();
		}

		// this code will not work well if there are multiple episodes with the same pubDate, but I think this is unusual
		// I'll fix if reported.
		collection = collection
		  .filter(item => item.id != localEpisodeId)
		  .limit(1)

		const nextOrPreviousEpisode = await collection.toArray();

		return nextOrPreviousEpisode.length ? nextOrPreviousEpisode[0] : null;
	}

	private async getEpisodeFromDefaultPlaylist(localEpisodeId: number, isNext: boolean): Promise<LocalStorageEpisode> {
		const playlist = await this.getDefaultPlaylist();

		let index = playlist.episodes.findIndex((episode) => episode.episodeId === localEpisodeId);
		
		if(index < 0)
			return null;

		index += isNext ? 1 : -1;

		if(index >= 0 && index < playlist.episodes.length) {
			const nextOrPreviousEpisodeId = playlist.episodes[index].episodeId;

			return this.getEpisode(nextOrPreviousEpisodeId);
		}

		return null;
	}

	private static getPubdateRange(currentEpisodePubDate: Date, isNext: boolean) {
		return {
			lower: isNext ? currentEpisodePubDate : Dexie.minKey,
			upper: isNext ? Dexie.maxKey : currentEpisodePubDate
		} 
	}

	async setEpisodeProgress(localEpisodeId: number, progress: number, lastTimePlayed: Date): Promise<void> {
		await this.db.episodes.update(localEpisodeId, {progress: progress, lastTimePlayed: lastTimePlayed});
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

	async addEpisodeToDefaultPlaylist(localEpisodeId: LocalEpisodeId): Promise<void> {
		this.db.transaction('rw', this.db.episodes, this.db.podcasts, this.db.playlists, async () => {
			let playlist = await this.getDefaultPlaylist();

			if(!playlist) {
				playlist = {
					episodes: [],
					isDefault: 1
				}
			}

			const foundEpisode = playlist.episodes.find((episode) => episode.episodeId === localEpisodeId);

			// check to avoid duplicate items on the playlist
			if(!foundEpisode) {
				const episode = await this.db.episodes.get(localEpisodeId);
				const podcast = await this.db.podcasts.get(episode.podcastId);

				playlist.episodes.push({
					episodeId: episode.id,
					imageUrl: podcast.imageUrl,
					title: episode.title,
					duration: episode.duration
				});

				this.db.playlists.put(playlist);
				this.db.episodes.update(localEpisodeId, { isInDefaultPlaylist: true });
			}
		});

	}

	async removeEpisodeFromDefaultPlaylist(localEpisodeId: LocalEpisodeId): Promise<void> {
		this.db.transaction('rw', this.db.episodes, this.db.playlists, async () => {
			const defaultPlaylist = await this.getDefaultPlaylist();

			if(defaultPlaylist) {
				// We could stop at first find, but just in case we let double entries slip, we use a filter
				defaultPlaylist.episodes = defaultPlaylist.episodes.filter((episode) => episode.episodeId !== localEpisodeId);

				await this.db.playlists.put(defaultPlaylist);
				await this.db.episodes.update(localEpisodeId, { isInDefaultPlaylist: false });
			}
		});
	}

	private queryDefaultPlaylist() {
		return this.db.playlists.where({isDefault: 1}).toArray();
	}

	private async getDefaultPlaylist(): Promise<LocalStoragePlaylist | null> {
		let playlists;

		try {
			playlists = await this.queryDefaultPlaylist();
		}
		catch(e) {
			console.log(e);
		}

		return playlists?.length ? playlists[0] : null;
	}

	getDefaultPlaylistObservable(): Observable<LocalStoragePlaylist[]> {
		return liveQuery(() => this.queryDefaultPlaylist());
	}

	async reorderPlaylistEpisodes(playlistId: number, episodeIds: number[]): Promise<void> {
		const playlist = await this.db.playlists.get(playlistId);

		let resortedEpisodes = episodeIds.map((episodeId) => playlist.episodes.find((episode) => episode.episodeId === episodeId)).filter((episode) => episode !== null);

		playlist.episodes = resortedEpisodes;
		await this.db.playlists.put(playlist);
	}
}