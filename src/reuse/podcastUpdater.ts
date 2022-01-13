import parsePodcastFeed from "../background/utils/parsePodcastFeed";
import { IEpisodeTableRecord, IPodcastTableRecord } from "./database";
import { IStorageEngine, LocalPodcastId } from "./storageEngine";

interface IPodcastUpdater {
	update(localPodcastId: number): Promise<void>
}

export class PodcastUpdater {
	private storageEngine: IStorageEngine;

	constructor(storageEngine: IStorageEngine) {
		this.storageEngine = storageEngine; 
	}

	async update(localPodcastId: LocalPodcastId): Promise<void> {
		let podcast = await this.storageEngine.getPodcast(localPodcastId);

		let response = await this.fetchFeed(podcast.feedUrl);

		let parsedFeed = parsePodcastFeed(response) as any;

		let podcastTableRecord: IPodcastTableRecord = {
			...podcast,
			title: parsedFeed.podcast.title,
			description: parsedFeed.podcast.description,
			numberOfEpisodes: parsedFeed.episodes.length
		};

		let episodeTableRecords = await this.storageEngine.getAllEpisodes(localPodcastId);

		let updatedEpisodeTableRecords = PodcastUpdater.updateEpisodes(episodeTableRecords, parsedFeed.episodes, localPodcastId);

		return this.storageEngine.updatePodcastAndEpisodes(podcastTableRecord, updatedEpisodeTableRecords);
	}

	private async fetchFeed(feedUrl: string): Promise<string> {
		return (await fetch(feedUrl, {
			headers: {
				'Accepts': 'application/rss+xml, application/xml, text/xml'
			}
		})).text();
	}

	private static mapFeedEpisodeToTableRecord(feedEpisode: any, localPodcastId: LocalPodcastId): IEpisodeTableRecord {
		const episodeTableRecord: IEpisodeTableRecord = {
			podcastId: localPodcastId,
			title: feedEpisode.title,
			description: feedEpisode.description,
			guid: feedEpisode.guid
		}

		return episodeTableRecord;
	}

	private static updateEpisodes(currentEpisodes: IEpisodeTableRecord[], feedEpisodes: Object[], localPodcastId: LocalPodcastId): IEpisodeTableRecord[] {
		const feedEpisodesAsTableRecords = feedEpisodes.map((feedEpisode => PodcastUpdater.mapFeedEpisodeToTableRecord(feedEpisode, localPodcastId)));

		const updatedEpisodes: IEpisodeTableRecord[] = [];

		for(const feedEpisodeAsTableRecord of feedEpisodesAsTableRecords) {
			const correspondingCurrentEpisode = PodcastUpdater.findCorrespondingEpisode(feedEpisodeAsTableRecord, currentEpisodes);
			
			if(correspondingCurrentEpisode) {
				// TODO: Better merge strategy, this will break as soon as we have
				// nested objects or arrays
				updatedEpisodes.push({
					...correspondingCurrentEpisode,
					...feedEpisodeAsTableRecord
				});
			}
			else {
				updatedEpisodes.push(feedEpisodeAsTableRecord);
			}
		}

		return updatedEpisodes;
	}

	private static findCorrespondingEpisode(episodeToFind: IEpisodeTableRecord, episodes: IEpisodeTableRecord[]) : IEpisodeTableRecord | null {
		return episodes.find((episode) =>
			(episodeToFind.guid  && episode.guid  === episodeToFind.guid) ||
			(episodeToFind.title && episode.title === episodeToFind.title)
		);
	}
}
