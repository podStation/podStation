'use strict';

import $ from 'jquery';
import { getBrowserService, getMessageService } from "../../reuse/ng/reuse";
import { getNotificationManagerService } from '../ng/serviceGetters';
import parsePodcastFeed from '../utils/parsePodcastFeed';

/**
 * 
 * @param {string} url Podcast feed url
 */
function Podcast(url) {
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

		// >>> http headers
		storedPodcast.httpETag = this.httpETag;
		storedPodcast.httpLastModified = this.httpLastModified;
		// <<< http headers

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

		// >>> podcast namespace
		storedPodcast.values = this.values;
		// <<< podcast namespace

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

				// >>> http headers
				that.httpETag = storedPodcast.httpETag;
				that.httpLastModified = storedPodcast.httpLastModified;
				// <<< http headers

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

				// >>> podcast namespace
				that.values = storedPodcast.values;
				// <<< podcast namespace
				
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
			accepts: {
				xml: 'application/rss+xml, application/xml, text/xml'
			}
		});

		let headers = {
			'Cache-Control': 'no-cache',
		}

		if(that.httpETag) {
			headers['If-None-Match'] = that.httpETag;
		}

		if(that.httpLastModified) {
			headers['If-Modified-Since'] = that.httpLastModified;
		}

		var promise = (new Promise((resolve, reject) => $.ajax({
			url: this.url, 
			dataType: 'xml',
			headers: headers
		}).then((data, textStatus, jqXHR) => {
			if(jqXHR.status === 304) {
				console.debug('Podcast not modified, HTTP response code 304', that.url);
				that.status = 'loaded';
				podcastChanged(that);
				resolve();
				return;
			}

			if(jqXHR.getResponseHeader('ETag')) {
				that.httpETag = jqXHR.getResponseHeader('ETag');
			}

			if(jqXHR.getResponseHeader('Last-Modified')) {
				that.httpLastModified = jqXHR.getResponseHeader('Last-Modified');
			}
			
			var feedParseResult = parsePodcastFeed(data);

			if(!feedParseResult) {
				that.status = 'failed';
				podcastChanged(that);
				reject();
				return;
			}

			var oldGuids = that.episodes ? that.episodes.map(function(episode) {return episode.guid}) : [];

			that.title = feedParseResult.podcast.title;
			that.description = feedParseResult.podcast.description;
			that.link = feedParseResult.podcast.link;
			that.pubDate = feedParseResult.podcast.pubDate;
			that.image = feedParseResult.podcast.image ? feedParseResult.podcast.image : that.image = defaultImage;

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

			resolve();
		}, 
		// failed
		() => {
			that.status = 'failed';
			podcastChanged(that);
			idNotificationFailed = getNotificationManagerService().updateNotification(idNotificationFailed, {
				icon: 'fa-close',
				groupName: 'Failed to update podcasts',
				text: 'Failed to update ' + (that.title ? that.title : that.url)
			});

			reject();
		})));

		podcastChanged(this);

		return promise;
	};
}

export default Podcast;