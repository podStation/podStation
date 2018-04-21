'use strict';

const FEEDS = {
	WITH_GUID: {
		URL: 'https://feed-with-guid.podstation.com',
		FILE: 'feed-with-guid.xml',
		FILE_WITHOUT_1ST_EP: 'feed-with-guid-without-1st-episode.xml',
		EP1: {
			podcastUrl: 'https://feed-with-guid.podstation.com',
			title: "Title 1",
			link: "http://feed1.podstation.com/?p=1",
			guid: "http://feed1.podstation.com/?p=1"
		},
		EP2: {
			podcastUrl: 'https://feed-with-guid.podstation.com',
			title: "Title 2",
			link: "http://feed1.podstation.com/?p=2",
			guid: "http://feed1.podstation.com/?p=2"
		},
		EP3: {
			podcastUrl: 'https://feed-with-guid.podstation.com',
			title: "Title 3",
			link: "http://feed1.podstation.com/?p=3",
			guid: "http://feed1.podstation.com/?p=3"
		}
	},
	WITHOUT_GUID: {
		URL: 'https://feed-without-guid.podstation.com',
		EP1: {
			podcastUrl: 'https://feed-without-guid.podstation.com',
			title: "Title 1",
			link: "http://feed2.podstation.com/?p=1",
			enclosure: {
				url: "http://feed2.podstation.com/1.mp3",
			}
		},
		EP2: {
			podcastUrl: 'https://feed-without-guid.podstation.com',
			title: "Title 2",
			link: "http://feed2.podstation.com/?p=2",
			enclosure: {
				url: "http://feed2.podstation.com/2.mp3",
			}
		},
		EP3: {
			podcastUrl: 'https://feed-without-guid.podstation.com',
			title: "Title 3",
			link: "http://feed2.podstation.com/?p=3",
			enclosure: {
				url: "http://feed2.podstation.com/3.mp3",
			}
		}
	}
};