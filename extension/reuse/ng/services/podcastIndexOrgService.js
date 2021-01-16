(function() {
	'use strict';

	angular
		.module('podstationInternalReuse')
		.factory('podcastIndexOrgService', ['$http', '$window', podcastIndexOrgService]);

	function podcastIndexOrgService($http, $window) {
		const AUTH_KEY = 'NUKSUA3RXTJ8AEQPHCNP';
		const AUTH_SECRET = 'BufqJNuREeuP2ThUMUq55z2A3peQt#bsw$Zdsvc3';
		
		var service = {
			search: search,
			getPodcast: getPodcast
		};

		return service;

		function getAuthHeaders() {
			const authDate = Math.floor((new Date()).valueOf() / 1000);

			return $window.crypto.subtle.digest('SHA-1', (new $window.TextEncoder()).encode(AUTH_KEY + AUTH_SECRET + authDate)).then((authArrayBuffer) => {
				return {
					'X-Auth-Date': authDate,
					'X-Auth-Key': AUTH_KEY,
					'User-Agent': 'podStation',
					'Authorization': buf2hex(authArrayBuffer)
				}
			});
		}

		function search(searchTerms) {
			return getAuthHeaders().then((headers) => {
				return $http.get('https://api.podcastindex.org/api/1.0/search/byterm', {
					headers: headers,
					params: {
						"q": searchTerms
					}
				});
			});
		}

		function getPodcast(feedUrl) {
			return getAuthHeaders().then((headers) => {
				return $http.get('https://api.podcastindex.org/api/1.0/podcasts/byfeedurl', {
					headers: headers,
					params: {
						url: feedUrl
					}
				});
			});
		}

		// https://stackoverflow.com/a/40031979/4274827
		function buf2hex(buffer) {
			return Array.prototype.map.call(new Uint8Array(buffer), x => ('00' + x.toString(16)).slice(-2)).join('');
		}
	}
})();