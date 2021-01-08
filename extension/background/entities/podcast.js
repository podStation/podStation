'use strict';

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

			// >>> podcast namespace
			that.values = feedParseResult.podcast.values;
			// <<< podcast namespace

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

	function parsePodcastFeed(feedContent) {

		var result;
		var jQParsedContent = typeof feedContent === "string" ? $.parseXML(feedContent) : feedContent;
		var xml = $(jQParsedContent);

		if(!xml.find('rss > channel')[0]) {
			return result;
		}

		result = {};
		result.podcast = {};
		result.episodes = [];

		result.podcast.title = xml.find('rss > channel > title').text();
		result.podcast.description = processMultiTagText(xml.find('rss > channel > description'));
		result.podcast.link = xml.find('rss > channel > link').text();

		result.podcast.pubDate = 
		postProcessPubDate(xml.find('rss > channel > pubDate').text()) ||
		postProcessPubDate(xml.find('rss > channel > lastBuildDate').text());

		result.podcast.image = 
		$(xml.find('rss > channel > image > url')[0]).text() ||
		xml.find('rss > channel > image').attr('href') ||
		xml.find('rss > channel > itunes\\:image').attr('href');

		result.podcast.email = parseEmailTag(xml.find('rss > channel > managingEditor').text());

		processSocial(xml.find('rss > channel'), result.podcast);
		processPodcastNamespace(xml.find('rss > channel'), result.podcast);

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
			episode.duration = parseItunesDuration(feedItem.find('itunes\\:duration').text());

			processSocial(feedItem, episode);
			processPodcastNamespace(feedItem, episode);

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

		/**
		 * Parse the content of <itunes:duration>
		 * The official documentation is not clear about the format, but I have seen examples
		 * that are seconds and examples that are hh:mm:ss
		 * @param {String} tagContent
		 * @returns {number | undefined} duration in seconds, or undefined
		 */
		function parseItunesDuration(tagContent) {
			let durationInSeconds;
			
			if(tagContent) {
				let splits = tagContent.split(':').reverse().map((s) => parseInt(s)).filter((s) => !isNaN(s));
				durationInSeconds = 
					(splits[0] ? splits[0] : 0) + 
					(splits[1] ? splits[1] * 60 : 0) +
					(splits[2] ? splits[2] * 3600 : 0);
			}

			return durationInSeconds;
		}

		/**
		 * Process the Social RSS namespace (see https://github.com/socialrss/socialrss)
		 * @param {JQuery<HTMLElement>} xmlItem
		 * @param {*} result 
		 */
		function processSocial(xmlItem, result) {
			result.email = result.email || xmlItem.children('social\\:email').text();
			result.email = result.email || xmlItem.find('itunes\\:owner > itunes\\:email').text();
			result.email = result.email || xmlItem.children('googleplay\\:email').text();

			if(!result.email) {
				delete result.email;
			}

			xmlItem.children('social\\:handle').each(function() {
				const feedSocialHandle = $(this);
				const socialHandle = {};

				result.socialHandles = result.socialHandles || [];

				socialHandle.handle = feedSocialHandle.text();
				socialHandle.type = feedSocialHandle.attr('type');
				socialHandle.url = feedSocialHandle.attr('url');
				socialHandle.text = feedSocialHandle.attr('text');
				result.socialHandles.push(socialHandle);
			});

			xmlItem.children('social\\:crowdfunding').each(function() {
				const feedCrowdfunding = $(this);
				const crowdfunding = {};

				result.crowdfundings = result.crowdfundings || [];

				crowdfunding.handle = feedCrowdfunding.text();
				crowdfunding.type = feedCrowdfunding.attr('type');
				crowdfunding.url = feedCrowdfunding.attr('url');
				crowdfunding.text = feedCrowdfunding.attr('text');
				result.crowdfundings.push(crowdfunding);
			});

			xmlItem.children('social\\:participant').each(function() {
				const feedParticipant = $(this);
				const participant = {};

				result.participants = result.participants || [];

				participant.name = feedParticipant.attr('name');
				participant.id = feedParticipant.attr('id');
				participant.permanent = feedParticipant.attr('permanent');

				processSocial(feedParticipant, participant);

				result.participants.push(participant);
			});

			xmlItem.children('social\\:participantReference').each(function() {
				const feedParticipantReference = $(this);
				const participantReference = {};

				result.participantReferences = result.participantReferences || [];
				
				participantReference.id = feedParticipantReference.attr('id');

				result.participantReferences.push(participantReference);
			});
		}

		/**
		 * Process the podcast namespace (see https://github.com/Podcastindex-org/podcast-namespace/blob/main/docs/1.0.md)
		 * @param {JQuery<HTMLElement>} xmlItem
		 * @param {*} result 
		 */
		function processPodcastNamespace(xmlItem, result) {
			xmlItem.children('podcast\\:funding').each(function () {
				const feedFunding = $(this);
				const funding = {};

				result.crowdfundings = result.crowdfundings || [];

				funding.url = feedFunding.attr('url');
				funding.text = feedFunding.text();
				result.crowdfundings.push(funding);
			});

			xmlItem.children('podcast\\:value').each(function () {
				const feedValue = $(this);
				const value = {};

				// currently a single entry is supported, but I believe that
				// many entries will be supported in the future.
				result.values = result.values || [];

				value.type = feedValue.attr('type');
				value.method = feedValue.attr('method');
				value.suggested = parseFloat(feedValue.attr('suggested'));

				feedValue.children('podcast\\:valueRecipient').each(function() {
					const feedRecipient = $(this);
					const recipient = {};

					recipient.name = feedRecipient.attr('name');
					recipient.type = feedRecipient.attr('type');
					recipient.address = feedRecipient.attr('address');
					recipient.split = parseInt(feedRecipient.attr('split'));
					
					value.recipients = value.recipients || [];
					value.recipients.push(recipient);
				});

				result.values.push(value);
			});
		}
	}
}

/**
 * A very cheap email tag parser, does not support mailto links
 * e-mail tags do not have a well defined format :(
 * see 
 * @param {string} tagContent
 * @returns {string} returns a string containing an e-mail
 */
function parseEmailTag(tagContent) {
	let email = undefined;
	
	if(tagContent) {
		let e = tagContent.split(' ');

		if(e[0] !== 'noreply@blogger.com') {
			email = e[0];
		}
	}
	
	return email;
}