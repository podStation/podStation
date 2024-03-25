import $ from 'jquery';

/**
 * 
 * @param {*} $window 
 * @param {import('../../../reuse/podcast-engine/podcastEngine').IPodcastEngine} podcastEngine 
 * @returns 
 */
function socialService($window, podcastEngine) {
	var service = {
		tweet: tweet,
		shareWithFacebook: shareWithFacebook,
		getUrlForHandle: getUrlForHandle,
		getIconForHandle: getIconForHandle,
		getTextForHandle: getTextForHandle,
		socialHandleMapping: socialHandleMapping,
		participantMapping: participantMapping
	};

	return service;

	async function tweet(episodeId) {
		const episode = await podcastEngine.getEpisode(episodeId);
		
		// https://dev.twitter.com/web/intents
		var tweetUrl;

		tweetUrl = 'https://twitter.com/intent/tweet?' + $.param({
			text: episode.title,
			url: episode.link ? episode.link : episode.enclosureUrl, 
			hashtags: 'podcast,podstation', 
			via: 'podstation_app'
		});

		$window.open(tweetUrl, '_blank', 'width=550,height=420');
	}

	async function shareWithFacebook(episodeId) {
		const episode = await podcastEngine.getEpisode(episodeId);		

		// https://developers.facebook.com/docs/sharing/reference/share-dialog#advancedtopics
		var shareUrl;

		shareUrl = 'https://www.facebook.com/dialog/share?' + $.param({
			app_id: '405324126571182',
			quote: episode.title,
			href: episode.link ? episode.link : episode.enclosure.url, 
			hashtag: '#podstation',
		});

		$window.open(shareUrl, '_blank', 'width=550,height=420');
	}

	function getUrlForHandle(socialHandle) {
		switch(socialHandle.type) {
			// >>> social handles
			case 'telegram':
			case 'telegram.group':
				return 'https://t.me/' + socialHandle.handle;
			case 'twitter':
				return 'https://twitter.com/' + socialHandle.handle;
			case 'youtube':
				return 'https://youtube.com/user/' + socialHandle.handle;
			case 'youtube.channel':
				return 'https://youtube.com/channel/' + socialHandle.handle;
			case 'facebook':
			case 'facebook.page':
				return 'https://facebook.com/' + socialHandle.handle;
			case 'facebook.group':
				return 'https://facebook.com/groups/' + socialHandle.handle;
			case 'instagram':
				return 'https://instagram.com/' + socialHandle.handle;
			// <<< social handles
			// >>> monetization
			case 'patreon':
				return 'https://patreon.com/' + socialHandle.handle;
			case 'padrim':
				return 'https://www.padrim.com.br/' + socialHandle.handle;
			case 'apoia.se':
				return 'https://apoia.se/' + socialHandle.handle;
			// <<< monetization
		}

		return socialHandle.url;
	}

	function getIconForHandle(socialHandle) {
		switch(socialHandle.type) {
			// >>> social handles
			case 'telegram':
			case 'telegram.group':
				return 'telegram';
			case 'twitter':
				return 'twitter';
			case 'youtube':
			case 'youtube.channel':
				return 'youtube-play';
			case 'facebook':
			case 'facebook.page':
			case 'facebook.group':
				return 'facebook';
			case 'instagram':
				return 'instagram';
			// <<< social handles
			// >>> monetization
			case 'paypal':
				return 'paypal'
			// <<< monetization
		}
	}

	function getTextForHandle(socialHandle) {
		switch(socialHandle.type) {
			// >>> social handles
			case 'telegram':
			case 'telegram.group':
				return 'Telegram';
			case 'twitter':
				return 'Twitter';
			case 'youtube':
			case 'youtube.channel':
				return 'Youtube';
			case 'facebook':
				return 'Facebook';
			case 'facebook.page':
				return 'Facebook Page';
			case 'facebook.group':
				return 'Facebook Group';
			case 'instagram':
				return 'Instagram';
			// <<< social handles
			// >>> monetization
			case 'patreon':
				return 'Patreon';
			case 'padrim':
				return 'Padrim';
			case 'apoia.se':
				return 'Apoia.se';
			case 'paypal':
				return 'PayPal'
			// <<< monetization
		}

		return socialHandle.text;
	}

	function socialHandleMapping(socialHandle) {
		return {
			text: getTextForHandle(socialHandle),
			faIcon: getIconForHandle(socialHandle),
			url: getUrlForHandle(socialHandle),
		}
	}
	
	function participantMapping(participant) {
		return {
			name: participant.name,
			socialHandles: participant.socialHandles.map(socialHandleMapping)
		};
	}
}

export default socialService;