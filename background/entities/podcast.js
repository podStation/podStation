var Podcast = function(url) {
	var defaultImage = 'images/rss-alt-8x.png';

	this.url = url;
	this.image = defaultImage;
	this.status = 'new';
	this.episodes = [];

	var idNotificationFailed = 0;
	var idNotificationNewEpisodes = 0;

	function podcastChanged(podcast, episodeListChanged) {
		getMessageService().for('podcast').sendMessage('changed', {
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

		// >>> social namespace
		storedPodcast.email = this.email ? this.email : undefined;
		storedPodcast.socialHandles = this.socialHandles;
		storedPodcast.crowdfundings = this.crowdfundings;
		storedPodcast.participants = this.participants;
		// <<< social namespace

		storedPodcast.episodes = this.episodes;

		storageObject[this.getKey()] = storedPodcast;

		getBrowserService().storage.local.set(storageObject);
	};

	this.deleteFromStorage = function() {
		getBrowserService().storage.local.remove(this.getKey());
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

			// >>> social namespace
			that.email = feedParseResult.podcast.email;
			that.socialHandles = feedParseResult.podcast.socialHandles;
			that.crowdfundings = feedParseResult.podcast.crowdfundings;
			that.participants = feedParseResult.podcast.participants;
			// <<< social namespace

			that.episodes = feedParseResult.episodes;

			// post process episodes >>>
			var participantsById = {};

			that.participants && that.participants.forEach(function(participant) {
				if(participant.id) {
					participantsById[participant.id] = participant;
				}
			});

			that.episodes.forEach(function(episode) {
				episode.participantReferences && episode.participantReferences.forEach(function(participantReference) {
					if(participantReference.id && participantsById[participantReference.id]) {
						episode.participants = episode.participants || [];
						episode.participants.push(participantsById[participantReference.id]);
					} 
				});
			});
			// <<< post process episodes >>>
			
			that.status = 'loaded';
			podcastChanged(that, true);
			that.store();

			if(idNotificationFailed) {
				getNotificationManagerService().removeNotification(idNotificationFailed);
			}

			var newEpisodesCount = feedParseResult.episodes.reduce(function(previousValue, currentValue) {
				
				return oldGuids.indexOf(currentValue.guid) < 0 ? previousValue + 1 : previousValue;
			}, 0);

			if(newEpisodesCount) {
				idNotificationNewEpisodes = getNotificationManagerService().updateNotification(idNotificationNewEpisodes, {
					icon: 'fa-check',
					groupName: 'New episodes',
					text: newEpisodesCount + ' new episode(s) for ' + that.title
				});
			}

		}, 'xml').fail(function(jqXHR, textStatus, errorThrown) {
			that.status = 'failed';
			podcastChanged(that);
			idNotificationFailed = getNotificationManagerService().updateNotification(idNotificationFailed, {
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

		getBrowserService().storage.local.get(podcastKey, function(storageObject) {
			if(storageObject && storageObject[podcastKey]) {
				var storedPodcast = storageObject[podcastKey];

				that.title = storedPodcast.title;
				that.description = storedPodcast.description;
				that.link = storedPodcast.link;
				that.pubDate = storedPodcast.pubDate;
				that.image = storedPodcast.image;
				
				// >>> social namespace
				that.email = storedPodcast.email;
				that.socialHandles = storedPodcast.socialHandles;
				that.crowdfundings = storedPodcast.crowdfundings;
				that.participants = storedPodcast.participants;
				// <<< social namespace
				
				that.episodes = storedPodcast.episodes;
				that.status = 'loaded';
			}
			else {
				that.update();
			}
		});
	};
}
