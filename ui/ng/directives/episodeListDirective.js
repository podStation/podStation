(function() {
	angular.module('podstationApp').directive('psEpisodeList', ['episodePlayer', 'messageService', EpisodeListDirective]);

	function EpisodeListDirective(episodePlayer, messageService) {
		return {
			restrict: 'E',
			scope: {
				episodes: '=episodes',
				listType: '=listType',
				limitTo: '=limitTo',
				reverseOrder: '=reverseOrder'
			},
			controller: EpisodeListController,
			controllerAs: 'episodeList',
			bindToController: true,
			templateUrl: 'ui/ng/partials/episodeList.html'
		};

		function EpisodeListController() {
			var episodeListController = this;

			episodeListController.play = play;
			episodeListController.addToPlaylist = addToPlaylist;
			episodeListController.removeFromPlaylist = removeFromPlaylist;
			
			episodeListController.isReverseOrder = isReverseOrder;

			return episodeListController;

			function play(episode) {
				episodePlayer.play({
					episodeGuid: episode.guid,
					podcastUrl:  episode.podcastUrl
				});
			}

			function addToPlaylist(episode) {
				messageService.for('playlist').sendMessage('add', {
					podcastUrl:  episode.podcastUrl,
					episodeGuid: episode.guid
				});
			}

			function removeFromPlaylist(episode) {
				messageService.for('playlist').sendMessage('remove', {
					podcastUrl:  episode.podcastUrl,
					episodeGuid: episode.guid
				});
			}

			function isReverseOrder() {
				return episodeListController.reverseOrder !== undefined ? episodeListController.reverseOrder : true;
			}
		}
	}
})();