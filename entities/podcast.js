var Podcast = function(url) {
	this.url = url;
	this.image = 'images/rss_small.png';

	this.update = function(callback) {
		var that = this;

		$.get(this.url, function(data) {
			var xml = $(data);

			that.title = xml.find('rss > channel > title').text();
			that.description = xml.find('rss > channel > description').text();
			that.link = xml.find('rss > channel > link').text();
			that.image = xml.find('rss > channel > image > url').text();
			if(that.image === "") {
				that.image = xml.find('rss > channel > image').attr('href');
			}

			if(typeof callback === "function") {
				callback(that);
			}
		});
	}

	this.load = function(callback) {
		var that = this;

		var podcastKey = 'podcast' + this.url;

		chrome.storage.sync.get(podcastKey, function(storageObject) {
			if(storageObject && storageObject[podcastKey]) {
				var storedPodcast = storageObject[podcastKey];

				that.title = storedPodcast.title;
				that.description = storedPodcast.description;
				that.link = storedPodcast.link;
				that.image = storedPodcast.image;
				callback(that);
			}
			else {
				that.update(callback);
			}
		});
	};
}
