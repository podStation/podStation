import IPodcastEngine, { PodcastEngineHolder } from "../../../reuse/podcast-engine/podcastEngine";
import { ControllerEpisode } from "../common/controllerEpisode";

function EpisodeListDirective() {
	return {
		restrict: 'E',
		scope: {
			episodes: '=episodes',
			listType: '=listType',
			limitTo: '=limitTo',
			reverseOrder: '=reverseOrder',
			orderByField: '=orderBy',
			showOpenAllEpisodesFromPodcast: '=showOpenAllEpisodesFromPodcast'
		},
		controller: ['podcastDataService', 'episodePlayer', 'socialService', 'podcastEngine', EpisodeListController],
		controllerAs: 'episodeList',
		bindToController: true,
		templateUrl: 'ui/ng/partials/episodeList.html'
	};
}

class EpisodeListController {
	private podcastDataService: any;
	private episodePlayer: any;
	private socialService: any;
	private podcastEngine: IPodcastEngine;

	reverseOrder: boolean;
	orderByField: string;

	constructor(podcastDataService: any, episodePlayer: any, socialService: any, podcastEngine: IPodcastEngine) {
		this.podcastDataService = podcastDataService;
		this.episodePlayer = episodePlayer;
		this.socialService = socialService;
		this.podcastEngine = podcastEngine;
	}

	play(episode: any) {
		this.episodePlayer.play(episode.id);
	}

	addToPlaylist(episode: ControllerEpisode) {
		this.podcastEngine.addEpisodeToDefaultPlaylist(episode.id);
	}

	removeFromPlaylist(episode: any) {
		this.podcastEngine.removeEpisodeFromDefaultPlaylist(episode.id);
	}

	deletePlayTime(episode: any) {
		this.podcastEngine.setEpisodeProgress(episode.id, 0);
	}

	tweet(episode: ControllerEpisode) {
		this.socialService.tweet(episode.id);
	}

	shareWithFacebook(episode: ControllerEpisode) {
		this.socialService.shareWithFacebook(episode.id);
	}

	isReverseOrder(): boolean {
		return this.reverseOrder !== undefined ? this.reverseOrder : true;
	}

	orderBy(): string {
		return this.orderByField ? this.orderByField : 'pubDateUnformatted';
	}
}


export default EpisodeListDirective;