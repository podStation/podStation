function AdController($scope, storageService) {
	let ad = this;

	ad.showBanner = false;
	ad.dismiss = dismiss;

	initialize();

	return ad;

	function initialize() {
		loadConfigFromStorage((config) => {
			config.toucan = config.toucan || {};
			
			if(!config.toucan.showAfter) {
				config.toucan.showAfter = sevenDaysFromNow();
			}
			
			$scope.$apply(() => {ad.showBanner = mustShowBanner(config)});

			return config;
		});
	}

	function dismiss() {
		ad.showBanner = false;

		loadConfigFromStorage((config) => {
			config.toucan = config.toucan || {};
			config.toucan.dismissed = true;
			return config;
		});
	}

	function loadConfigFromStorage(loadedCallback) {
		return storageService.loadFromStorage('adConfig', loadedCallback, 'local', () => ({}));
	}

	/**
	 * 
	 * @param {*} config 
	 * @return {boolean}
	 */
	function mustShowBanner(config) {
		let now = new Date();
		return (!config.toucan.dismissed) && now.valueOf() > config.toucan.showAfter;
	}

	function sevenDaysFromNow() {
		let date = new Date();
		date.setDate(date.getDate() + 7);
		return date.valueOf();
	}
}

export default AdController;