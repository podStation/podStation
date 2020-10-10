(function() {
	angular.module('podstationApp').directive('psEpisodeList', ['$window', 'podcastManagerService', 'podcastDataService', 'episodePlayer', 'messageService', 'socialService', EpisodeListDirective]);

	function EpisodeListDirective($window, podcastManagerService, podcastDataService, episodePlayer, messageService, socialService) {
		return {
			restrict: 'E',
			scope: {
				episodes: '=episodes',
				listType: '=listType',
				limitTo: '=limitTo',
				reverseOrder: '=reverseOrder',
				orderByField: '=orderBy',
				searchText: '=searchText'
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
			episodeListController.deletePlayTime = deletePlayTime;
			episodeListController.tweet = tweet;
			episodeListController.shareWithFacebook = shareWithFacebook;
			
			episodeListController.isReverseOrder = isReverseOrder;
			episodeListController.orderBy = orderBy;

			return episodeListController;

			function play(episode) {
				episodePlayer.play(podcastDataService.episodeId(episode));
			}

			function addToPlaylist(episode) {
				messageService.for('playlist').sendMessage('add', {
					episodeId: podcastDataService.episodeId(episode)
				});
			}

			function removeFromPlaylist(episode) {
				messageService.for('playlist').sendMessage('remove', {
					episodeId: podcastDataService.episodeId(episode)
				});
			}

			function deletePlayTime(episode) {
				messageService.for('podcastManager').sendMessage('setEpisodeInProgress', {
					episodeId: podcastDataService.episodeId(episode),
					currentTime: 0
				});
			}

			function tweet(episode) {
				socialService.tweet(podcastDataService.episodeId(episode));
			}

			function shareWithFacebook(episode) {
				socialService.shareWithFacebook(podcastDataService.episodeId(episode));
			}

			function isReverseOrder() {
				return episodeListController.reverseOrder !== undefined ? episodeListController.reverseOrder : true;
			}

			function orderBy() {
				return episodeListController.orderByField ? episodeListController.orderByField : 'pubDateUnformatted';
			}
		}
	}
})();