import { IPodcastTableRecord } from "./database";
import { PodcastUpdater } from "./podcastUpdater";
import { IStorageEngine, LocalPodcastId, LocalStoragePodcast, StorageEngine } from "./storageEngine";

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
	getAllPodcasts(): Promise<LocalStoragePodcast[]>
	deletePodcast(localPodcastId: LocalPodcastId): void;
	updatePodcast(localPodcastId: LocalPodcastId): void;
}

class PodcastEngine implements IPodcastEngine {
	private storageEngine: IStorageEngine;
	
	constructor(storageEngine: IStorageEngine) {
		this.storageEngine = storageEngine;
	}
	
	async addPodcast(podcast: PodcastToBeAdded): Promise<void> {
		let localPodcastId = await this.storageEngine.addPodcast({
			title: podcast.title,
			feedUrl: podcast.feedUrl.toString(),
			description: podcast.description,
			state: 'added'
		});

		this.updatePodcast(localPodcastId);
	}

	getAllPodcasts(): Promise<IPodcastTableRecord[]> {
		return this.storageEngine.getAllPodcasts();
	}

	deletePodcast(localPodcastId: LocalPodcastId) {
		return this.storageEngine.deletePodcast(localPodcastId);
	}

	updatePodcast(localPodcastId: LocalPodcastId) {
		let podcastUpdater = new PodcastUpdater(this.storageEngine);

		podcastUpdater.update(localPodcastId);
	}
}

export class PodcastEngineHolder {
	private static podcastEngine: IPodcastEngine;
	
	static getPodcastEngine(): IPodcastEngine {
		if(!PodcastEngineHolder.podcastEngine) {
			let localStorageEngine = new StorageEngine();

			PodcastEngineHolder.podcastEngine = new PodcastEngine(localStorageEngine);
		}

		return PodcastEngineHolder.podcastEngine;
	}
}

export default IPodcastEngine;