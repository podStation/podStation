(function() {
	angular.module('podstationApp').directive('psParticipantList', [ParticipantListDirective]);

	function ParticipantListDirective() {
		return {
			restrict: 'E',
			scope: {
				participants: '=participants',
			},
			controller: ParticipantListController,
			controllerAs: 'participantList',
			bindToController: true,
			templateUrl: 'ui/ng/partials/participantList.html'
		};

		function ParticipantListController() {
			var participantListController = this;

			return participantListController;
		}
	}
})();