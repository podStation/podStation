(function() {
	angular.module('podstationApp').directive('psEpisodeList', ['$window', 'podcastManagerService', 'episodePlayer', 'messageService', 'socialService', EpisodeListDirective]);

	function EpisodeListDirective($window, podcastManagerService, episodePlayer, messageService, socialService) {
		return {
			restrict: 'E',
			scope: {
				episodes: '=episodes',
				listType: '=listType',
				limitTo: '=limitTo',
				reverseOrder: '=reverseOrder',
				orderByField: '=orderBy'
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

			function deletePlayTime(episode) {
				messageService.for('podcastManager').sendMessage('setEpisodeInProgress', {
					url: episode.podcastUrl,
					episodeId: episode.guid,
					currentTime: 0
				});
			}

			function tweet(episode) {
				podcastManagerService.buildEpisodeId(episode).then(function(episodeId) {
					socialService.tweet(episodeId);
				});
			}

			function shareWithFacebook(episode) {
				podcastManagerService.buildEpisodeId(episode).then(function(episodeId) {
					socialService.shareWithFacebook(episodeId);
				});
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