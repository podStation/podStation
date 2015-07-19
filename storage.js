function addRSS(url) {
	if(url !== '') {
		chrome.storage.sync.get('podcastList', function(storageObject) {
			var podcastList;

			if(typeof storageObject.podcastList === "undefined") {
				podcastList = [];
			}
			else {
				podcastList = storageObject.podcastList;
			}

			console.log(podcastList);

			var podcastExistInStorage = false;
			podcastList.forEach(function(podcast) {
				if(podcast.url && podcast.url === url) {
					podcastExistInStorage = true;
				}
			});

			if(podcastExistInStorage) {
				return;
			}

			var podcast = {
				title: 'Title - ' + url,
				url: url
			};

			podcastList.push(podcast);

			chrome.storage.sync.set({'podcastList': podcastList});
		});
	}
}

function removeAllRSS() {
	chrome.storage.sync.set({'podcastList': []});
}
