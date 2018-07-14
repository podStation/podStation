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
      'lib/jquery.min.js',
      'lib/angular.js',
      'lib/podStationNGReuse.min.js',
      'lib/jsmediatags.js',
      'bower_components/angular-mocks/angular-mocks.js',
      'reuse/**/*.js',
      'background/entities/backgroundApp.js',
      'background/entities/messageService.js',
      'background/entities/audioPlayer.js',
      'background/entities/episodeSelector.js',
      'background/entities/podcastManager.js',
      'background/entities/notificationManager.js',
      'background/entities/playlist.js',
      'background/entities/podcast.js',
      'background/ng/**/*.js',
      'spec/background/**/*.js',
      'spec/reuse/**/*.js',
      {pattern: 'spec/background/**/*.xml', included: false},
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
      Chrome_travis_ci: {
        base: 'Chrome',
        flags: ['--no-sandbox']
      }
    },

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Chrome', 'ChromeDebugging', 'Chrome_travis_ci'],

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity
  })
}
