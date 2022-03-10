import searchService from '../services/searchService';
import { IPodcastEngine } from '../../../reuse/podcast-engine/podcastEngine';

declare var chrome: any;

function SearchController($scope: any, $routeParams: any, $location: any, searchService: any, analyticsService: any, podcastEngine: IPodcastEngine) {
	return new SearchControllerClass($scope, $routeParams, $location, searchService, analyticsService, podcastEngine);
}

class SearchControllerClass {
	private $scope: any;
	private $location: any;
	private searchService: any;
	private analyticsService: any;
	private podcastEngine: IPodcastEngine;

	searchTerms: string;
	searchResults: [];

	constructor($scope: any, $routeParams: any, $location: any, searchService: any, analyticsService: any, podcastEngine: IPodcastEngine) {
		this.$scope = $scope;
		this.$location = $location;
		this.searchService = searchService;
		this.analyticsService = analyticsService;
		this.podcastEngine = podcastEngine;

		this.searchTerms = $routeParams.searchTerms;

		this.search();
	}

	addPodcast(searchResult: any) {
		chrome.runtime.getBackgroundPage((bgPage: any) => {
			this.$scope.$apply(() => {
				this.analyticsService.trackEvent('feed', 'add_by_search');
				bgPage.podcastManager.addPodcast(searchResult.feedUrl);
				
				this.podcastEngine.addPodcast({
					feedUrl: new URL(searchResult.feedUrl),
					title: searchResult.title,
					description: searchResult.description,
					imageUrl: SearchControllerClass.getImageUrl(searchResult),
				});

				this.$location.path('/Podcasts');
			});
		});
	}

	private static getImageUrl(searchResult: any): URL | null {
		const imageUrl = searchResult.imageOriginal || searchResult.image;
		return imageUrl ? new URL(imageUrl) : null;
	}

	fillIsSubscribed(searchResults: any) {
		chrome.runtime.getBackgroundPage((bgPage: any) => {
			this.$scope.$apply(() => {
				searchResults.forEach((searchResult: any) => {
					searchResult.subscribed = bgPage.podcastManager.getPodcast(searchResult.feedUrl) !== undefined;
				});
			});
		});
	}

	search() {
		this.$scope.searchResults = [];

		this.searchService.search(this.searchTerms, (event: string, eventData: any) => {
			switch(event) {
				case 'resultAvailable':
					this.searchResults = eventData;
					this.fillIsSubscribed(this.searchResults);
					break;
			}
		});
	}
}

export default SearchController;