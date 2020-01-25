// Karma configuration
// Generated on Sat Mar 03 2018 16:34:31 GMT+0100 (Hora Padrão da Europa Ocidental)

const jasmineSeedReporter = require('./spec/support/jasmine-seed-reporter.js')

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine'],

    // list of files / patterns to load in the browser
    files: [
      'extension/lib/jquery.min.js',
      'extension/lib/angular.js',
      'extension/lib/podStationNGReuse.min.js',
      'extension/lib/jsmediatags.min.js',
      'bower_components/angular-mocks/angular-mocks.js',
      'extension/reuse/**/*.js',
      'extension/background/entities/backgroundApp.js',
      'extension/background/entities/messageService.js',
      'extension/background/entities/audioPlayer.js',
      'extension/background/entities/episodeSelector.js',
      'extension/background/entities/podcastManager.js',
      'extension/background/entities/notificationManager.js',
      'extension/background/entities/optionsManager.js',
      'extension/background/entities/playlist.js',
      'extension/background/entities/podcast.js',
      'extension/background/ng/**/*.js',
      'spec/background/**/*.js',
      'spec/reuse/**/*.js',
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
    autoWatch: true,

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
