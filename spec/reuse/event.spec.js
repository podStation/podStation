import PodStationEvent from "../../src/reuse/event";

describe('event', () => {
	it('should call listener callback with notify arguments', () => {
		const event = new PodStationEvent();

		var calledArguments;

		event.addListener(function() { calledArguments = Array.from(arguments)});

		event.notify(1, 2);

		expect(calledArguments).toEqual([1, 2]);
	});

	it('should not call a listener callback from a removed group', () => {
		const event = new PodStationEvent();

		var called = false;

		// I want to test that group can be an object instance
		const group = new Array();

		event.addListener(() => called = true, group);

		event.removeListeners(group);

		event.notify();

		expect(called).toBeFalsy();
	});
});