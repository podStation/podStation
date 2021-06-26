// Karma configuration
// Generated on Sat Mar 03 2018 16:34:31 GMT+0100 (Hora Padrão da Europa Ocidental)

const jasmineSeedReporter = require('./spec/support/jasmine-seed-reporter.js')
const webpackConfig = require('./webpack.dev.js');

delete webpackConfig.entry;

module.exports = function(config) {
  config.set({

	// base path that will be used to resolve all patterns (eg. files, exclude)
	basePath: '',


	// frameworks to use
	// available frameworks: https://npmjs.org/browse/keyword/karma-adapter
	frameworks: ['jasmine', 'webpack'],

	webpack: webpackConfig,

	// list of files / patterns to load in the browser
	files: [
		'node_modules/angular/angular.js',
		'node_modules/angular-mocks/angular-mocks.js',
		{ pattern: 'spec/**/*.spec.js', watched: false },
		{pattern: 'spec/background/**/*.xml', included: false},
		{pattern: 'spec/background/**/*.opml', included: false},
		{pattern: 'spec/background/**/*.json', included: false}
	],

	// list of files / patterns to exclude
	exclude: [
	],


	// preprocess matching files before serving them to the browser
	// available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
	preprocessors: {
		'spec/**/*.spec.js': [ 'webpack' ],
	},

	plugins: [
		'karma-*',
		jasmineSeedReporter
	],

	// test results reporter to use
	// possible values: 'dots', 'progress'
	// available reporters: https://npmjs.org/browse/keyword/karma-reporter
	reporters: ['progress', 'jasmine-seed'],

	client: {
		jasmine: {
			random: true,
			// seed: 19141 // Specify if you need to re-run the same seed
		}
	},

	// web server port
	port: 9876,


	// enable / disable colors in the output (reporters and logs)
	colors: true,


	// level of logging
	// possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
	logLevel: config.LOG_INFO,


	// enable / disable watching file and executing tests whenever any file changes
	// we set it to false because webpack is already watching files
	autoWatch: false,

	customLaunchers: {
		ChromeDebugging: {
			base: 'Chrome',
			flags: [ '--remote-debugging-port=9333' ]
		},
		ChromeHeadlessNoSandbox: {
			base: 'ChromeHeadless',
			flags: ['--no-sandbox']
		}
	},

	// start these browsers
	// available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
	browsers: ['Chrome', 'ChromeDebugging', 'ChromeHeadless', 'ChromeHeadlessNoSandbox'],

	// Continuous Integration mode
	// if true, Karma captures browsers, runs the tests and exits
	singleRun: false,

	// Concurrency level
	// how many browser should be started simultaneous
	concurrency: Infinity
  })
}
