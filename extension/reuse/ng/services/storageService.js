(function() {
	'use strict';

	angular
		.module('podstationInternalReuse')
		.factory('storageService', ['$q', 'browser', storageService]);

	function storageService($q, browserService) {
		var service = {
			loadFromStorage: loadFromStorage,
			load: loadFromStorage,
			save: save
		};

		return service;

		/**
		 * Loads a key from the storage defined by storage type.  
		 * Calls loadCallback with the result and stores the value returned
		 * by loadCallback if not undefined.
		 * @param {String} key
		 * @param {Function} loadedCallback
		 * @param {String} storageType `local` or `sync`
		 * @param {Function} defaultBuilder Function that will create a default result, if not found
		 * @return {Promise}
		 */
		function loadFromStorage(key, loadedCallback, storageType, defaultBuilder) {
			const deferred = $q.defer();

			const storage = getStorage(storageType);

			storage.get(key, function(storageObject) {
				var stored = storageObject[key];

				if(!stored && defaultBuilder) {
					stored = defaultBuilder();
				}

				if(loadedCallback) {
					const newValue = loadedCallback(stored);

					if(newValue) {
						const newStorageObject = {};

						newStorageObject[key] = newValue;

						storage.set(newStorageObject, function() {deferred.resolve(newValue)});
					}
					else {
						deferred.resolve(stored);
					}
				}
				else {
					deferred.resolve(stored);
				}
			});

			return deferred.promise;
		}

		function save(key, storageType, content) {
			const deferred = $q.defer();

			const storage = getStorage(storageType);

			const newStorageObject = {};

			newStorageObject[key] = content;

			storage.set(newStorageObject, () => {deferred.resolve()});

			return deferred.promise;
		}

		function getStorage(storageType) {
			if(!storageType || !typeof storageType === 'string')
				throw Error('invalid parameter');

			return browserService.storage[storageType];
		}
	}
})();