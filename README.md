# podStation Chrome Extension

[![Build Status](https://travis-ci.org/podStation/podStation.svg?branch=master)](https://travis-ci.org/podStation/podStation)

This is a podcast aggregator for chrome.

You can install the extension at the [chrome web store](https://chrome.google.com/webstore/detail/podstation/bpcagekijmfcocgjlnnhpdogbplajjfn).

## Installing the dependencies

You will need to install [Node.js](https://nodejs.org/en/).

After that, install the dependencies in the following order:
* `npm install`
* `npm run bower-install`
* `./copy_dependencies.sh`

## Running locally

1. Clone this repository
2. Go to chrome's extensions page [chrome://extensions/](chrome://extensions/)
3. Enable the _Developer Mode_
4. Click the button _Load unpacked extension_.
5. Choose the root folder of this project

Voilà!  
You should see podStation's icon on chrome's toolbar.  
You are now running a local copy of podStation, have fun!

## Automated tests

We use Karma for automated tests.

You can run the tests with the command line `npm test` if you want to debug the
tests or `npm run test_chrome` if you just want to run them.

## Documentation

You can find the documentation on the [docs](/docs) folder.