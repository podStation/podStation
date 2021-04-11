var PodcastManager;

(function(){
	var instance;

	PodcastManager = function() {
		if(instance) {
			return instance;
		}

		this.podcastList = [];
		
		var notificationIdLoading = 0;

		this.setEpisodeProgress = setEpisodeProgress;
		this.getEpisodesInProgress = getEpisodesInProgress;
		this.getEpisodeIds = getEpisodeIds;
		this.reset = reset;
		this.getOpml = getOpml;

		function triggerNotifications() {
			var loadingEpisodes = 0;

			instance.podcastList.forEach(function(podcast) {
				if(podcast.isUpdating()) {
					loadingEpisodes++;
				}
			});

			if(loadingEpisodes) {
				notificationIdLoading = getNotificationManagerService().updateNotification(notificationIdLoading, {
					icon: 'fa-refresh fa-spin',
					text: getBrowserService().i18n.getMessage('updating_podcasts')
				});
			}
			else {
				if(notificationIdLoading) {
					getNotificationManagerService().removeNotification(notificationIdLoading);
					notificationIdLoading = 0;
				}
			}
		}

		/**
		 * @returns {Promise<[]>}
		 */
		function getEpisodesInProgress() {
			const podcastDataService = getPodcastDataService();
			const podcastStorageService = getPodcastStorageService();

			return podcastStorageService.getAllEpisodesUserData().then(function(allEpisodesUserData) {
				return allEpisodesUserData.map(function(item) {
					const podcast = instance.getPodcast(item.episodeSelector.podcastUrl); 
					const episode = podcast.episodes.find(function(episode) { 
						return item.episodeSelector.matchesId(podcastDataService.episodeId(episode, podcast.url));
					});

					// return
					return {
						podcast: podcast,
						episode: episode,
						episodeUserData: item.episodeUserData
					}
				}).filter(function(episodeInProgress) {return episodeInProgress.episode});
			});
		}

		this.getPodcast = function(url) {
			return this.podcastList.find(function(podcast) {
				return podcast.url === url;
			});
		};

		this.addPodcast = function(url) {
			if(url !== '') {
				this.addPodcasts([url]);
			}
		};

		this.addPodcasts = function(urls) {
			if(urls && urls.length) {
				getAnalyticsService().trackEvent('feed', 'add', undefined, urls.length);
				var that = this;

				podcastStorageService = getPodcastStorageService();

				podcastStorageService.storePodcastsByFeedUrls(urls).then(function(addedUrls) {
					addedUrls.forEach(function(addedUrl) {
						var podcast = new Podcast(addedUrl);

						that.podcastList.unshift(podcast);
					});

					if(addedUrls.length) {
						that.updatePodcast(addedUrls);
						
						sendPodcastListChangedMessage()
					}
				});
			}
		};

		this.deletePodcast = function(url) {
			var that = this;

			this.podcastList.forEach(function(item, index) {
				if( item.url === url) {
					getAnalyticsService().trackEvent('feed', 'delete');
					item.deleteFromStorage();
					that.podcastList.splice(index, 1);
					return false;
				}
			});

			getPodcastStorageService().deletePodcastsByFeedUrl(url);

			sendPodcastListChangedMessage();
		}

		this.updatePodcast = function(url) {
			if(typeof url === "string" && url !== '') {
				var podcast;
				podcast = this.getPodcast(url);

				podcast.update();
			}
			else {
				var podcastIndex;
				var maxConcurrentUpdates = 3;
				var that = this;

				var podcastsToUpdate = Array.isArray(url) ? url : undefined;

				that.podcastList.forEach(function(podcast) {
					if(podcast.isUpdating())
						maxConcurrentUpdates--;	
				});

				if(maxConcurrentUpdates <= 0)
					return;
				
				var podcastUpdate = function() {
					if(podcastIndex >= that.podcastList.length)
						return;

					var promise;

					if(!podcastsToUpdate || podcastsToUpdate.indexOf(that.podcastList[podcastIndex].url) >= 0) {
						promise = that.podcastList[podcastIndex].update();
					}

					if(promise) {
						promise.finally(function() {
							podcastIndex++;
							podcastUpdate();
						});
					}
					else {
						// most likely, it is already updating
						// or not selected for update
						setTimeout(function() {
							// we want it to be async because of the loop below
							podcastIndex++;
							podcastUpdate();
						}, 0);
					}
				}

				for(podcastIndex = 0; podcastIndex < maxConcurrentUpdates; podcastIndex++) {
					podcastUpdate();
				}

				// we want it to remain in the last podcastIndex that the look actually processed
				podcastIndex--;
			}
		}

		this.getPodcast = function(urlOrIndex) {
			var podcast;

			if(typeof urlOrIndex === "string") {
				this.podcastList.forEach(function(item) {
					if( item.url === urlOrIndex) {
						podcast = item;
						return undefined;
					}
				});
			}
			else {
				podcast = this.podcastList[urlOrIndex];
			}

			return podcast;
		}

		/**
		 * 
		 * @param {EpisodeId} currentEpisodeId 
		 * @param {Number} delta 
		 * @param {Function} callback 
		 */
		function getEpisodeFromPodcast(currentEpisodeId, delta, callback) {
			const podcast = instance.getPodcast(currentEpisodeId.values.podcastUrl);

			const indexOfCurrentEpisode = podcast.episodes.findIndex(function(episode) {
				return getPodcastDataService().episodeMatchesId(episode, podcast.url, currentEpisodeId);
			});

			const indexWithDelta = indexOfCurrentEpisode + delta;

			if(indexWithDelta >= 0 && indexWithDelta < podcast.episodes.length) {
				callback(getPodcastDataService().episodeId(podcast.episodes[indexWithDelta], podcast.url));
			}
		}

		/**
		 * 
		 * @param {EpisodeId} currentEpisodeId 
		 * @param {Number} delta 
		 * @param {Function} callback 
		 */
		function getEpisodeFromLastEpisodes(currentEpisodeId, delta, callback) {
			const allEpisodes = instance.getAllEpisodes();

			const indexOfCurrentEpisode = allEpisodes.findIndex(function(entry) {
				return getPodcastDataService().episodeMatchesId(entry.episode, entry.podcast.url, currentEpisodeId);
			});
					
			const indexWithDelta = indexOfCurrentEpisode + delta;

			if(indexWithDelta >= 0 && indexWithDelta < allEpisodes.length) {
				callback(getPodcastDataService().episodeId(allEpisodes[indexWithDelta].episode, allEpisodes[indexWithDelta].podcast));
			}
		}

		/**
		 * 
		 * @param {EpisodeId} currentEpisodeId 
		 * @param {Number} delta 
		 * @param {Function} callback 
		 */
		function getEpisodeFromPlaylist(currentEpisodeId, delta, callback) {
			getMessageService().for('playlist').sendMessage('get', {}, function(response) {
				if(!response) {
					// TODO: investigate why the messageService is calling the response
					// callback with empty response before calling it with a proper
					// reponse
					console.log('podcastManager - get playlist - empty reponse');
					return;
				}

				var indexOfCurrentEpisode = response.entries.findIndex(function(playlistEpisodeId) {
					return getPodcastDataService().episodeIdEqualsId(currentEpisodeId, playlistEpisodeId);
				});

				var newIndex = 0;
				
				if(indexOfCurrentEpisode >= 0) {
					// The playlist goes backwards.
					// For the playlist we want the next to go
					// "down" the list, not up.
					const indexWithDelta = indexOfCurrentEpisode - delta;

					newIndex = indexWithDelta >= 0 && indexWithDelta < response.entries.length ? indexWithDelta : 0;
				}

				callback(response.entries[newIndex]);
			});
		}

		function getEpisode(order, currentEpisode, delta, callback) {
			switch(order ? order : 'from_last_episodes') {
				case 'from_podcast':
				default:
					getEpisodeFromPodcast(currentEpisode, delta, callback);
					break;
				case 'from_last_episodes':
					getEpisodeFromLastEpisodes(currentEpisode, delta, callback);
					break;
				case 'from_playlist':
					getEpisodeFromPlaylist(currentEpisode, delta, callback);
					break;
			}
		}

		this.getNextOrPreviousEpisode = function(isNext, order, currentEpisode, callback) {
			getEpisode(order, currentEpisode, isNext ? -1 : 1, callback);
		};

		this.deleteAllPodcasts = function () {
			getBrowserService().storage.sync.set({'syncPodcastList': []});
			this.podcastList.forEach(function(item) {
				item.deleteFromStorage();
			});
			this.podcastList = [];

			sendPodcastListChangedMessage();
		}

		this.getAllEpisodes = function(episodesFilter) {
			var allEpisodes = [];

			this.podcastList.forEach(function(podcast, podcastIndex) {
				podcast.episodes.forEach(function(episode) {
					if(episodesFilter && !episodesFilter(podcast, episode))
						return;

					var episodeContainer = {
						podcastIndex: podcastIndex,
						podcast: podcast,
						episode: episode,
						pubDate: new Date(episode.pubDate)
					};

					allEpisodes.push(episodeContainer);
				});
			});

			allEpisodes.sort(function (a, b) { return b.pubDate - a.pubDate; });

			return allEpisodes;
		}

		this.getPodcastAndEpisode = function(episodeId) {
			var podcast = this.getPodcast(episodeId.values.podcastUrl);

			var episode = podcast.episodes.find(function(episode) {
				return getPodcastDataService().episodeMatchesId(episode, podcast, episodeId);
			});

			return {
				podcast: podcast,
				episode: episode
			};
		};

		/**
		 * 
		 * @param {EpisodeId} episodeId 
		 * @param {number} progress 
		 */
		function setEpisodeProgress(episodeId, progress) {
			getPodcastStorageService().storeEpisodeUserData(episodeId, {
				currentTime: progress
			});
		}

		/**
		 * Returns an array of episode Ids matching the corresponding
		 * selectors. Failed matches are ignored.
		 * @param {EpisodeSelector[]} episodeSelectors 
		 * @returns {EpisodeId[]}
		 */
		function getEpisodeIds(episodeSelectors) {
			const that = this;
			const podcastMapByUrl = {};

			return episodeSelectors.map(function(episodeSelector) {
				if(!episodeSelector.podcastUrl) {
					throw Error('episodeSelector must have url');
				}

				var podcast;

				if(!(podcast = podcastMapByUrl[episodeSelector.podcastUrl])) {
					podcast = that.podcastList.find(function(podcast) {
						return podcast.url === episodeSelector.podcastUrl;
					});
					podcastMapByUrl[episodeSelector.podcastUrl] = podcast;
				}

				if(!podcast) {
					return undefined;
				}

				return podcast.episodes.map(function(episode) {
					return getPodcastDataService().episodeId(episode, podcast);
				}).find(function(episodeId) {
					return episodeSelector.matchesId(episodeId);
				});
			}).filter(function(episodeId) {
				// unmatched selectors are left out of the return
				return episodeId
			});
		}

		/**
		 * Resets the status of the podcastManager, used only for
		 * unit testing, as it is at the moment a true singleon an
		 * the state remains from one test to the other
		 */
		function reset() {
			this.podcastList = [];
			registerMessageListeners();
		}

		instance = this;

		function loadPodcasts() {
			getPodcastStorageService().getStoredPodcasts().then(function(storedPodcasts) {
				storedPodcasts.forEach(function(storedPodcast) {
					var podcast = new Podcast(storedPodcast.url);

					instance.podcastList.push(podcast);

					podcast.load();
				});

				sendPodcastListChangedMessage();
			});
		};

		function sendPodcastListChangedMessage() {
			getBrowserService().runtime.sendMessage({
				type: 'podcastListChanged',
			});

			getMessageService().for('podcastManager').sendMessage('podcastListChanged');
		}

		function getOpml() {
			const subscriptions = instance.podcastList.reduce((previous, current) => {
				return previous + `<outline title="${escapeXml(current.title)}" type="rss" xmlUrl="${escapeXml(current.url)}"/>\n`
			}, '');

			return `<?xml version="1.0" encoding="utf-8"?>
<opml version="1.1">
	<head>
		<title>podStation OPML export</title>
	</head>
	<body>
		<outline text="Subscriptions">
			${subscriptions}
		</outline>
	</body>
</opml>`;
			function escapeXml(unsafe) {
				return unsafe.replace(/[<>&'"]/g, function (c) {
					switch (c) {
						case '<': return '&lt;';
						case '>': return '&gt;';
						case '&': return '&amp;';
						case '\'': return '&apos;';
						case '"': return '&quot;';
					}
				});
			}
		}

		// do it async as it need to be executed after
		// angular bootstrap
		angular.element(document).ready(function() {
			registerMessageListeners();

			loadPodcasts();
		});

		function registerMessageListeners() {
			getMessageService().for('podcast').onMessage('changed', function() {
				triggerNotifications();
			});
	
			getMessageService().for('podcastManager')
			  .onMessage('addPodcasts', function(message) {
				instance.addPodcasts(message.podcasts);
			}).onMessage('setEpisodeInProgress', function(message) {
				setEpisodeProgress(message.episodeId, message.currentTime);
			}).onMessage('getSyncPodcastInfo', function(message, sendResponse) {
				loadPodcastInfoFromSync(message.url, function(syncPodcastInfo) {
	
					if(!syncPodcastInfo.e) {
						syncPodcastInfo.e = [];
					}
	
					sendResponse(syncPodcastInfo);
	
					return false;
				});
				return true;
			}).onMessage('getOpml', (message, sendResponse) => {
				sendResponse(getOpml());
				return true;
			}).onMessage('checkIsSubscribed', (message, sendResponse) => {
				const response = {};
				
				message.feeds.forEach((feedUrl) => {
					const podcast = instance.podcastList.find((podcast) => {
						return podcast.url === feedUrl;
					});

					response[feedUrl] = podcast ? true : false;
				});
				
				sendResponse(response);
				
				return true;
			});
		}
	}
})();

angular.module('podstationBackgroundApp').service('podcastManager', PodcastManager);