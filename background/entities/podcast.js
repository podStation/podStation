function parsePodcastFeed(feedContent) {

	var result;
	var xml = $(feedContent);

	if(!xml.find('rss > channel')[0]) {
		return result;
	}

	result = {};
	result.podcast = {};
	result.episodes = [];

	result.podcast.title = xml.find('rss > channel > title').text();
	result.podcast.description = processMultiTagText(xml.find('rss > channel > description'));
	result.podcast.link = xml.find('rss > channel > link').text();

	result.podcast.pubDate = postProcessPubDate(xml.find('rss > channel > pubDate').text());
	if(result.podcast.pubDate === '') {
		result.podcast.pubDate = postProcessPubDate(xml.find('rss > channel > lastBuildDate').text());
	}

	result.podcast.image = $(xml.find('rss > channel > image > url')[0]).text();
	if(result.podcast.image === undefined || result.podcast.image === "") {
		result.podcast.image = xml.find('rss > channel > image').attr('href');
	}

	xml.find('rss > channel > item').each(function() {
		var feedItem = $(this);
		var episode = {};
		var enclosure;

		// the selector will find 'title' for all namespaces, we may find more
		// than one. They are in theory all the same, so we take the first.
		episode.title = $(feedItem.find('title')[0]).text();
		episode.link = feedItem.find('link').text();
		episode.pubDate = postProcessPubDate(feedItem.find('pubDate').text());
		episode.parsedPubDate = new Date(episode.pubDate);
		episode.description = feedItem.find('description').text();
		episode.guid = feedItem.find('guid').text();
		enclosure = feedItem.find('enclosure');
		episode.enclosure = {
			url: enclosure.attr('url'),
			length: enclosure.attr('length'),
			type: enclosure.attr('type')
		};

		result.episodes.push(episode);
	});

	result.episodes.sort(function(a, b) {
		return b.parsedPubDate - a.parsedPubDate;
	});

	// if the podcast pubdate is missing or older then the most recent episode, 
	// we want to show the pubdate of the most recent e espisode
	if(result.episodes[0] && result.episodes[0].pubDate  &&
		(
			result.podcast.pubDate === undefined || result.podcast.pubDate === '' ||
			(new Date(result.episodes[0].pubDate)) > (new Date(result.podcast.pubDate))
		)
	) {
		result.podcast.pubDate = result.episodes[0].pubDate;
	}

	return result;

	function postProcessPubDate(pubDate) {
		return pubDate.replace('GTM', 'GMT');
	}

	function processMultiTagText(selectedTags) {
		var text = '';
		var texts = [];

		selectedTags.each(function() {
			var selectedTag = $(this);
			if(texts.indexOf(selectedTag.text()) < 0) {
				if(text) {
					text += '<br>';
				}

				text += selectedTag.text();

				texts.push(selectedTag.text());
			}
		});

		return text;
	}
}

var Podcast = function(url) {
	var defaultImage = 'images/rss-alt-8x.png';

	this.url = url;
	this.image = defaultImage;
	this.status = 'new';
	this.episodes = [];

	var idNotificationFailed = 0;
	var idNotificationNewEpisodes = 0;

	function podcastChanged(podcast, episodeListChanged) {
		messageService.for('podcast').sendMessage('changed', {
			podcast: podcast,
			episodeListChanged: episodeListChanged ? true : false
		});
	}

	this.getKey = function() {
		return 'podcast' + this.url;
	};

	this.store = function() {
		var storageObject = {};

		var storedPodcast = {};

		storedPodcast.title = this.title;
		storedPodcast.description = this.description;
		storedPodcast.link = this.link;
		storedPodcast.pubDate = this.pubDate;
		storedPodcast.image = this.image;
		storedPodcast.episodes = this.episodes;

		storageObject[this.getKey()] = storedPodcast;

		chrome.storage.local.set(storageObject);
	};

	this.deleteFromStorage = function() {
		chrome.storage.local.remove(this.getKey());
	};

	this.isUpdating = function() {
		return this.status == 'updating';
	};

	this.update = function() {
		var that = this;

		if(this.isUpdating()) {
			console.log('Already updating: ' + this.url);
			return;
		}

		this.status = 'updating';
		console.log('Updating: ' + this.url);

		$.ajaxSetup({
			cache: false,

			accepts: {
				xml: 'application/rss+xml, application/xml, text/xml'
			}
		});

		var jqxhr = $.get(this.url, function(data) {
			var feedParseResult = parsePodcastFeed(data);

			if(!feedParseResult) {
				that.status = 'failed';
				podcastChanged(that);
				return;
			}

			var oldGuids = that.episodes ? that.episodes.map(function(episode) {return episode.guid}) : [];

			that.title = feedParseResult.podcast.title;
			that.description = feedParseResult.podcast.description;
			that.link = feedParseResult.podcast.link;
			that.pubDate = feedParseResult.podcast.pubDate;
			that.image = feedParseResult.podcast.image ? feedParseResult.podcast.image : that.image = defaultImage;;
			that.episodes = feedParseResult.episodes;
			
			that.status = 'loaded';
			podcastChanged(that, true);
			that.store();

			if(idNotificationFailed) {
				notificationManager.removeNotification(idNotificationFailed);
			}

			var newEpisodesCount = feedParseResult.episodes.reduce(function(previousValue, currentValue) {
				
				return oldGuids.indexOf(currentValue.guid) < 0 ? previousValue + 1 : previousValue;
			}, 0);

			if(newEpisodesCount) {
				idNotificationNewEpisodes = notificationManager.updateNotification(idNotificationNewEpisodes, {
					icon: 'fa-check',
					groupName: 'New episodes',
					text: newEpisodesCount + ' new episode(s) for ' + that.title
				});
			}

		}, 'xml').fail(function(jqXHR, textStatus, errorThrown) {
			that.status = 'failed';
			podcastChanged(that);
			idNotificationFailed = notificationManager.updateNotification(idNotificationFailed, {
				icon: 'fa-close',
				groupName: 'Failed to update podcasts',
				text: 'Failed to update ' + (that.title ? that.title : that.url)
			});
		});

		podcastChanged(this);

		return jqxhr;
	};

	this.load = function() {
		var that = this;

		var podcastKey = this.getKey();

		chrome.storage.local.get(podcastKey, function(storageObject) {
			if(storageObject && storageObject[podcastKey]) {
				var storedPodcast = storageObject[podcastKey];

				that.title = storedPodcast.title;
				that.description = storedPodcast.description;
				that.link = storedPodcast.link;
				that.pubDate = storedPodcast.pubDate;
				that.image = storedPodcast.image;
				that.episodes = storedPodcast.episodes;
				that.status = 'loaded';
			}
			else {
				that.update();
			}
		});
	};
}
