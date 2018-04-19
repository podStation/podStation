'use strict';

var browserStorageMockFn = function($timeout) {
	return {
		runtime: {
			onInstalled: {
				addListener: function() {}
			},
			sendMessage: function() {},
			onMessage: {
				addListener: function() {}
			}
		},
		browserAction: {
			setBadgeText: function() {}
		},
		contextMenus: {
			onClicked: {
				addListener: function() {}
			},
			create: function() {},
			remove: function() {}
		},
		i18n: {
			getMessage: function() {}
		},
		storage: {
			onChanged: {
				addListener: function() {}
			},
			sync: {
				get: get,
				set: set,
				remove: remove,
				_setFullStorage: _setFullStorage,
				_getFullStorage: _getFullStorage
			},
			local: {
				get: get,
				set: set,
				remove: remove,
				_setFullStorage: _setFullStorage,
				_getFullStorage: _getFullStorage
			}
		}
	}

	/**
	 * 
	 * @param {(String|Array.String|Object)} items 
	 * @param {Function} callback 
	 */
	function get(items, callback) {
		if(!typeof items === 'string') {
			throw Error('not implemented')
		}

		var result = {};

		if(this.storedObject && this.storedObject[items]) {
			result[items] = this.storedObject[items];
		}

		callback(result);
	}

	/**
	 * 
	 * @param {Object} items 
	 * @param {Function} callback 
	 */
	function set(items, callback) {
		this.storedObject = this.storedObject || {};
		
		for(var key in items) {
			this.storedObject[key] = JSON.parse(JSON.stringify(items[key]))
		}

		callback && callback();
	}

	function remove(keys) {
		if(typeof keys === 'string') {
			delete this.storedObject[keys];
		} 
		else {
			throw Error('not implemented');
		}
	}

	function _setFullStorage(storedObject) {
		this.storedObject = storedObject;
	}

	function _getFullStorage() {
		return this.storedObject;
	}
}
