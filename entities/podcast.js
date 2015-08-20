var Podcast = function(url) {
	this.url = url;
	this.image = 'images/rss_small.png';
	this.status = 'new';
	this.episodes = [];

	this.getKey = function() {
		return 'podcast' + this.url;
	}

	this.store = function() {
		var storageObject = {};

		var storedPodcast = {};

		storedPodcast.title = this.title;
		storedPodcast.description = this.description;
		storedPodcast.link = this.link;
		storedPodcast.image = this.image;

		storageObject[this.getKey()] = storedPodcast;

		chrome.storage.local.set(storageObject);
	}

	this.update = function(callback) {
		var that = this;

		this.status = 'updating';

		$.get(this.url, function(data) {
			var xml = $(data);

			that.title = xml.find('rss > channel > title').text();
			that.description = xml.find('rss > channel > description').text();
			that.link = xml.find('rss > channel > link').text();
			that.image = xml.find('rss > channel > image > url').text();

			if(that.image === "") {
				that.image = xml.find('rss > channel > image').attr('href');
			}

			that.status = 'loaded';

			that.store();

			if(typeof callback === "function") {
				callback(that);
			}

		}/*, function() {
			that.status = 'failed';
		}*/);
	}

	this.load = function(callback) {
		var that = this;

		var podcastKey = this.getKey();

		chrome.storage.local.get(podcastKey, function(storageObject) {
			if(storageObject && storageObject[podcastKey]) {
				var storedPodcast = storageObject[podcastKey];

				that.title = storedPodcast.title;
				that.description = storedPodcast.description;
				that.link = storedPodcast.link;
				that.image = storedPodcast.image;

				if(typeof callback === "function") {
					callback(that);
				}
			}
			else {
				that.update(callback);
			}
		});
	};
}
