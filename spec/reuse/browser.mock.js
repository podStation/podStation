'use strict';

var browserStorageMockFn = function($timeout) {
	return {
		app: {
			getDetails: () => { return {"version":''}}
		},
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
		commands: {
			onCommand: new BrowserEventHandler()
		},
		notifications: {
			create: function() {},
			clear: function() {},
		},
		i18n: {
			getMessage: function(msg) {return msg}
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
		},
		idle: {
			onStateChanged: new BrowserEventHandler()
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
			// we don't want to return the reference, as this could 
			// mean the value will changed before a promise is fulfilled
			result[items] = JSON.parse(JSON.stringify(this.storedObject[items]));
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

	function BrowserEventHandler() {
		return {
			addListener: function(fn) {this._listeners.push(fn)},
			_listeners: [],
			_trigger: function() {
				this._listeners.forEach((l) => l.apply(null, arguments))
			}
		}
	}
}
