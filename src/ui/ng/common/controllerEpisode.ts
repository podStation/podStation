import { LocalEpisodeId, LocalPodcastId } from "../../../reuse/podcast-engine/storageEngine";

export type ControllerEpisode = {
	id: LocalEpisodeId;
	link?: string;
	title?: string;
	image?: string;
	podcastIndex?: number;
	podcastTitle?: string;
	/** Probably not used */
	podcastUrl?: string;
	podcastId?: LocalPodcastId;
	/** Url of the episode enclosure */
	url?: string;
	description?: string;
	pubDateUnformatted?: Date;
	pubDate?: string;
	guid?: string;
	isInPlaylist: boolean;
	participants?: [];
	duration?: number;
	lastTimePlayed?: Date;
	lastTimePlayedFormatted?: string;
	pausedAt?: number;
}