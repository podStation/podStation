// https://stackoverflow.com/questions/33793897/use-angular-elementng-app-injector-with-karma-jasmine
function fixAngularInjector($injector) {
	const original = angular.element;

	angular.element = function() {
		const result = original.apply(this, arguments);

		result.injector = function() { return $injector; };
		return result;
	}

	// also add all the angular.element properties to our fake or some other stuff will break
	for (let prop in original) {
		angular.element[prop] = original[prop];
	}
}