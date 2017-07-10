(function() {
	'use strict';

	angular
		.module('podstationApp')
		.factory('storageService', [storageService]);

	function storageService() {
		var service = {
			loadSyncUIOptions: loadSyncUIOptions
		};

		function loadSyncUIOptions(loaded) {
			chrome.storage.sync.get('ui', function(storageObject) {
				var uiOptions = storageObject.ui ? storageObject.ui : {};

				// default values

				// podcast list type
				if(typeof uiOptions.plt === 'undefined')
					uiOptions.plt = 'big_list';

				// podcast episodes list type
				if(typeof uiOptions.elt === 'undefined')
					uiOptions.elt = 'big_list';

				// podcast episodes sorting
				if(typeof uiOptions.es === 'undefined')
					uiOptions.es = 'by_pubdate_descending';

				// last episodes list type
				if(typeof uiOptions.llt === 'undefined')
					uiOptions.llt = 'big_list';

				// in progress episodes list type
				if(typeof uiOptions.ilt === 'undefined')
					uiOptions.ilt = 'big_list';

				if(loaded(uiOptions)) {
					chrome.storage.sync.set({ui: uiOptions});
				}
			});
		}

		return service;
	}

})();