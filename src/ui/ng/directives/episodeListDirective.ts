function EpisodeListDirective() {
	return {
		restrict: 'E',
		scope: {
			episodes: '=episodes',
			listType: '=listType',
			limitTo: '=limitTo',
			reverseOrder: '=reverseOrder',
			orderByField: '=orderBy'
		},
		controller: ['podcastDataService', 'episodePlayer', 'messageService', 'socialService', EpisodeListController],
		controllerAs: 'episodeList',
		bindToController: true,
		templateUrl: 'ui/ng/partials/episodeList.html'
	};
}

class EpisodeListController {
	private podcastDataService: any;
	private episodePlayer: any;
	private messageService: any;
	private socialService: any;

	reverseOrder: boolean;
	orderByField: string;

	constructor(podcastDataService: any, episodePlayer: any, messageService: any, socialService: any) {
		this.podcastDataService = podcastDataService;
		this.episodePlayer = episodePlayer;
		this.messageService = messageService;
		this.socialService = socialService;
	}

	play(episode: any) {
		this.episodePlayer.play(this.podcastDataService.episodeId(episode));
	}

	addToPlaylist(episode: any) {
		this.messageService.for('playlist').sendMessage('add', {
			episodeId: this.podcastDataService.episodeId(episode)
		});
	}

	removeFromPlaylist(episode: any) {
		this.messageService.for('playlist').sendMessage('remove', {
			episodeId: this.podcastDataService.episodeId(episode)
		});
	}

	deletePlayTime(episode: any) {
		this.messageService.for('podcastManager').sendMessage('setEpisodeInProgress', {
			episodeId: this.podcastDataService.episodeId(episode),
			currentTime: 0
		});
	}

	tweet(episode: any) {
		this.socialService.tweet(this.podcastDataService.episodeId(episode));
	}

	shareWithFacebook(episode: any) {
		this.socialService.shareWithFacebook(this.podcastDataService.episodeId(episode));
	}

	isReverseOrder(): boolean {
		return this.reverseOrder !== undefined ? this.reverseOrder : true;
	}

	orderBy(): string {
		return this.orderByField ? this.orderByField : 'pubDateUnformatted';
	}
}


export default EpisodeListDirective;