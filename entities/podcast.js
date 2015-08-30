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
		storedPodcast.episodes = this.episodes;

		storageObject[this.getKey()] = storedPodcast;

		chrome.storage.local.set(storageObject);
	}

	this.deleteFromStorage = function() {
		chrome.storage.local.remove(this.getKey());
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

			that.episodes = [];

			xml.find('rss > channel > item').each(function() {
				var feedItem = $(this);
				var episode = {};
				var enclosure;

				episode.title = feedItem.find('title').text();
				episode.link = feedItem.find('link').text();
				episode.pubDate = feedItem.find('pubDate').text();
				episode.description = feedItem.find('description').text();
				enclosure = feedItem.find('enclosure');
				episode.enclosure = {
					url: enclosure.attr('url'),
					length: enclosure.attr('length'),
					type: enclosure.attr('type')
				};

				that.episodes.push(episode);
			});

			that.episodes.sort(function(a, b){
				var dateA = new Date(a.pubDate);
				var dateB = new Date(b.pubDate);
				return dateB - dateA;
			});

			that.status = 'loaded';

			that.store();

			if(typeof callback === "function") {
				callback(that);
			}

		}).fail(function() {
			that.status = 'failed';
		});
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
				that.episodes = storedPodcast.episodes;
				that.status = 'loaded';

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
