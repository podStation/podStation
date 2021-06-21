'use strict';

function PodStationEvent() {
	var handlers = [];
	
	this.addListener = addListener;
	this.removeListeners = removeListeners;
	this.notify = notify;
	return this;	

	function addListener(callback, group) {
		handlers.push({callback: callback, group: group});
	}

	function removeListeners(group) {
		handlers = handlers.filter(handler => handler.group != group );
	}

	function notify() {
		handlers.forEach(handler => {handler.callback.apply(null, arguments)});
	}
}

export default PodStationEvent;