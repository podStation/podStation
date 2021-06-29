# Bundling with Webpack

On mid 2021 we introduced bundling with Webpack in podStation.  
This is a purely technical change, and it is intended to improve the foundation to ease future changes.

By converting all our javascript code into modules, we have a better isolation on the code and it becomes easier to maintain.

This should also make the transition into typescript easier, which is something I am aiming for the future.

This document collects information for future reference regarding this change.

## Import issue with jsmediatags

The `jsmediatags` dependency is used to extract images from the audio files.

After a successful migration to Webpack, I continued to do some changes, which resulted in errors importing this module.  
It is not clear what triggered this change, but after some tests I found out that I had to import it in a specific way:

```js
import jsmediatags from 'jsmediatags/dist/jsmediatags.min.js';
```

## Automated testing

This was one of the most challenging parts, adapting the automated testing.  
The change was not very hard, but there were some bumps in the road that require analysis.

### Using `angular-mocks`

`angular-mocks` is used in the automated tests that involve angular modules.
The `angular-mocks` javascript file does not export anything (at least in the version we are using), and acts directing on the `window` object.

I could not make it work with an import, so I had to declare it directly as a file to be imported by karma:
```js
files: [
	'node_modules/jquery/dist/jquery.js', 
	'node_modules/angular/angular.js',
	'node_modules/angular-mocks/angular-mocks.js',
	...
],
```

### jQuery and AngularJS

After fixing most of the imports and other issues, some tests were still failing.

Analysis showed that this was due to a difference on JQLite and jQuery, specifically with respect to the `ready` function.

jQuery will synchronously call its callback if the document is loaded, while JQLite, which is used by AngularJS when jQuery is not available, calls the callback asynchronously.

This had an impact on tests, and I fixed it by importing jquery directly on the karma configuration.

## References

- https://krzysztofzuraw.com/blog/2020/setting-up-chrome-extension-dev
- https://github.com/sroze/ngInfiniteScroll#readme
- https://stackoverflow.com/questions/38482692/cant-load-font-awesome-with-webpack
- https://www.timroes.de/using-ecmascript-6-es6-with-angularjs-1-x
- https://stackoverflow.com/questions/28969861/managing-jquery-plugin-dependency-in-webpack
- https://github.com/monospaced/angular-qrcode#es2015--webpack
- Testing
	- https://mike-ward.net/2015/09/07/tips-on-setting-up-karma-testing-with-webpack/
	- https://www.npmjs.com/package/karma-webpack
	- https://gist.github.com/trinitroglycerin/68754b920df83a977f12