import IPodcastEngine from "../../../reuse/podcast-engine/podcastEngine";
import { LocalEpisodeId, LocalStoragePlaylistEpisode } from "../../../reuse/podcast-engine/storageEngine";

class PlaylistController {
	private $scope: ng.IScope;
	private podcastEngine: IPodcastEngine;

	entries: LocalStoragePlaylistEpisode[] = [];
	// TODO: Persist playlist visibility - local storage should be ok
	isVisible: boolean = true;

	constructor($scope: ng.IScope, messageService: any, episodePlayer: any, podcastDataService: any, podcastEngine: IPodcastEngine) {
		this.$scope = $scope;
		this.podcastEngine = podcastEngine;
		this.readPlaylist();
	}

	async readPlaylist() {
		const playlist = await this.podcastEngine.getDefaultPlaylist();
		this.entries = playlist.episodes;
		this.$scope.$apply();
	}

	play(localEpisodeId: LocalEpisodeId) {
		// episodePlayer.play(playlistEntry.episodeId);
	}

	async remove(localEpisodeId: LocalEpisodeId) {
		await this.podcastEngine.removeEpisodeFromDefaultPlaylist(localEpisodeId);
		this.readPlaylist();
	}

	dragEnded() {
		// playlist.entries should sufice for the moment
		/*
		messageService.for('playlist').sendMessage('set', { 
			entries: playlist.entries.map(function(entry) {
				return entry.episodeId;
			})
		 });
		 */
	}
}

export default PlaylistController;