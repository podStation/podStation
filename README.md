# podStation Chrome Extension

[![Build Status](https://travis-ci.org/podStation/podStation.svg?branch=master)](https://travis-ci.org/podStation/podStation)

## About 

**podStation** is a podcast aggregator for chrome.
It is distributed as a browser extension (see https://en.wikipedia.org/wiki/Browser_extension), but it behaves essentially like a standalone app that uses Chrome as a platform. 

## How to install

You can install it at the [chrome web store][at-chrome-web-store].

Although not officially supported yet (no tests in place), it also works on:
- PC
  - Opera (https://www.opera.com/)
  - Chromium (I think, https://www.chromium.org/getting-involved/download-chromium)
  - Edge (the new one based on chromium, https://www.microsoft.com/en-us/edge)
  - Brave (https://brave.com/)
- Mobile (it works, but the experience is not nice)
  - Kiwi (Android, https://kiwibrowser.com/)
  - Yandex (Android, https://browser.yandex.com/mobile/)
    - I tried to install on iOS, but I don't think extensions are supported
    
A port for Firefox is on the way. If there is any browser not listed above where you use podStation, please let me know.
If you want to request a port for a browser, create an issue here, or send us a mail (see the session _Support and Contact_)

## History

Back in the days before I had a good Bluetooth headset, that I now use with all my devices, switching between audio from PCs (at work and at home) to mobile was not the most comfortable thing.

As such, I was searching for a cost effective solution to listen to podcasts on desktop operational systems, and also synchronize the list of podcasts between my home and work PC.

There were solutions on the market, but I was thinking that I could build somthing myself.
Due to the projects I was working on at the time, I was learning font end development and also how to create chrome extensions.

After some research, I decided a very cost effective way of keeping my list of podcasts in sync would be to use chrome's sync storage (in the order of Kilobytes) for extensions and chrome apps.

That was how the development of podStation started.

## Vision

podStation has reached a mature state where increments are more tipically on the direction of bug fixes, optimizations and reduction of technical debt (see https://en.wikipedia.org/wiki/Technical_debt).

If you would like to see all the proposed enhancements, check the open issues:
* at [github][open-issues-at-github],
* at [bitbucket][open-issues-at-bitbucket].

For an idea of the work in progress, check our [planning project][planning-project].

Some features I consider more important (I will add links to existing issues later):
- Become **podStation Browser Extension**: podStation is currently only available for chrome. Althouth this most likely address the majority of possible users, I don't like the idea of contributing to _vendor lock-in_. Having a port that works on other browsers would make it easier for our users to choose other browsers, and contribute to the competitiveness of this market
- Reduce the necessary _permissions_ required by podStation

There are also some features that I would like to implement, but they are unlikely to become a reality, as it would be a lot of effort:
- Support _marking episodes as listened_ (history) - not enough Snyc Storage space
- Integration with [mygpo](https://github.com/gpodder/mygpo) (http://gpodder.net/)

## Development

### Installing the dependencies

You will need to install [Node.js](https://nodejs.org/en/).

After that, install the dependencies in the following order:
* `npm install`
* `npm run bower-install`
* `./copy_dependencies.sh`

### Running locally

1. Clone this repository
2. Go to chrome's extensions page [chrome://extensions/](chrome://extensions/)
3. Enable the _Developer Mode_
4. Click the button _Load unpacked extension_.
5. Choose the `extension` folder

Voilà!  
You should see podStation's icon on chrome's toolbar.  
You are now running a local copy of podStation, have fun!

### Automated tests

We use Karma for automated tests.

You can run the tests with the command line `npm test`. 
If you want to debug the tests run `npm run test_chrome` if you just want to run them.

### Documentation

You can find the documentation on the [docs](/docs) folder.

## Contributing

If you are interesting in contributing to podStation, take a look at our [contribution documentation](https://github.com/podStation/.github/blob/master/CONTRIBUTING.md).

## Support and Contact

If you would like to report bugs, request new features or ask questions or contact the owners of this project for any general topic, please [create an issue](https://github.com/podStation/podStation/issues/new) here at github.

If you are not sure how to use github, but still want to contact us, reach us by email at podstationapp@gmail.com.

[at-chrome-web-store]: https://chrome.google.com/webstore/detail/podstation/bpcagekijmfcocgjlnnhpdogbplajjfn
[open-issues-at-github]: https://github.com/podStation/podStation/issues
[open-issues-at-bitbucket]: https://bitbucket.org/dellagustin/podstation_chrome_ext/issues?status=new&status=open
[planning-project]: https://github.com/orgs/podStation/projects/1
