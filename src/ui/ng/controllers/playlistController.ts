import IPodcastEngine from "../../../reuse/podcast-engine/podcastEngine";
import { LocalEpisodeId, LocalStoragePlaylistEpisode } from "../../../reuse/podcast-engine/storageEngine";

class PlaylistController {
	private $scope: ng.IScope;
	private podcastEngine: IPodcastEngine;
	private episodePlayer: any;

	private playlistId: number;
	private onToggleVisibilityDeregistrator: any;
	entries: LocalStoragePlaylistEpisode[] = [];
	// TODO: Persist playlist visibility - local storage should be ok
	isVisible: boolean = true;

	constructor($scope: ng.IScope, messageService: any, episodePlayer: any, podcastDataService: any, podcastEngine: IPodcastEngine) {
		this.$scope = $scope;
		this.podcastEngine = podcastEngine;
		this.episodePlayer = episodePlayer;
		this.subscribeToPlaylist();

		this.onToggleVisibilityDeregistrator = $scope.$on('playlist.toggleVisibility', (event, args) => {
			this.isVisible = !this.isVisible
		});

		$scope.$on('$destroy', () => this.onToggleVisibilityDeregistrator());
	}

	async subscribeToPlaylist() {
		const playlistObservable = this.podcastEngine.getDefaultPlaylistObservable();

		playlistObservable.subscribe((playlists) => {
			if(playlists.length) {
				this.playlistId = playlists[0].id;
				this.entries = playlists[0].episodes;
				this.$scope.$apply();
			}
		});
	}

	play(localEpisodeId: LocalEpisodeId) {
		this.episodePlayer.play(localEpisodeId);
	}

	async remove(localEpisodeId: LocalEpisodeId) {
		await this.podcastEngine.removeEpisodeFromDefaultPlaylist(localEpisodeId);
		this.subscribeToPlaylist();
	}

	dragEnded() {
		this.podcastEngine.reorderPlaylistEpisodes(this.playlistId, this.entries.map((episode) => episode.episodeId));
	}
}

export default PlaylistController;