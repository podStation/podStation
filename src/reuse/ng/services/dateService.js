'use strict';

function dateService() {
	var service = {
		now: now
	};

	return service;

	/**
	 * @return {Date}
	 */
	function now() {
		return new Date();
	}
}

export default dateService;