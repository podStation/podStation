type SyncStoragePodcast = {
	feedUrl: string,
	id: number,
}

export interface ISyncStorageEngine {
	addPodcasts(feedUrls: string[]): Promise<number[]>;
	getPodcasts(): Promise<SyncStoragePodcast[]>
}

type InternalSyncStoragePodcast = {
	/**
	 * Podcast feed url
	 */
	url: string
	/**
	 * Podcast id
	 */
	i: number
}

type InternalSyncStorage = {
	syncPodcastList?: InternalSyncStoragePodcast[];
}

export class SyncStorageEngine {
	/**
	 * An object that provides the Chrome extension APIs.
	 * Hopefully one day, all brought into Browser Extensions API
	 * https://browserext.github.io/browserext/#overview
	 */
	browser: any;

	constructor(browser: any) {
		this.browser = browser;
	}

	addPodcasts(feedUrls: string[]): Promise<number[]> {
		const promise = new Promise<number[]>((resolve, reject) => {
			this.browser.storage.sync.get('syncPodcastList', (result: InternalSyncStorage) => {
				const syncPodcastList: InternalSyncStoragePodcast[] = result.syncPodcastList || [];
				const podcastIds: number[] = [];
				let listUpdated = false;

				feedUrls.forEach((feedUrl, index) => {
					if(syncPodcastList.find((item) => item.url === feedUrl)) {
						// feed is already in sync storage
						podcastIds[index] = 0;
					}
					else {
						syncPodcastList.sort((a, b) => a.i - b.i);
	
						const nextFreeId = SyncStorageEngine.calculateNextAvailableId(syncPodcastList)
	
						syncPodcastList.push({
							url: feedUrl,
							i: nextFreeId
						});

						podcastIds[index] = nextFreeId;
						listUpdated = true;
					}
	
					if(listUpdated) {
						this.browser.storage.sync.set({
							'syncPodcastList': syncPodcastList
						}, () => resolve(podcastIds))
					}
					else {
						resolve(podcastIds);
					}
				});
			});
		})

		return promise;
	}

	/**
	 * 
	 * @param syncPodcastListItem must be sorted by i ascending
	 */
	private static calculateNextAvailableId(syncPodcastListItem: InternalSyncStoragePodcast[]) {
		let nextId = 1;

		for(let i = 0; i < (syncPodcastListItem.length); i++) {
			nextId = syncPodcastListItem[i].i + 1;
			
			if(i + 1 >= syncPodcastListItem.length || nextId !== syncPodcastListItem[i + 1].i)
				break;
		}

		return nextId;
	}

	getPodcasts(): Promise<SyncStoragePodcast[]> {
		const promise = new Promise<SyncStoragePodcast[]>((resolve, reject) => {
			this.browser.storage.sync.get('syncPodcastList', (result: InternalSyncStorage) => {
				const syncPodcastList: InternalSyncStoragePodcast[] = result.syncPodcastList || [];
				resolve(syncPodcastList.map((item) => ({
					feedUrl: item.url,
					id: item.i
				})))
			})
		})

		return promise;
	}
}