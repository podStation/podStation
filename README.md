# podStation Chrome Extension

This is a podcast aggregator for chrome.

You can install the extension at the [chrome web store](https://chrome.google.com/webstore/detail/podstation/bpcagekijmfcocgjlnnhpdogbplajjfn).

## Installing the dependencies

You will need to install [Node.js](https://nodejs.org/en/)
and then install [bower](http://bower.io/) (with the command line
`npm install -g bower`.

After installing bower, install the dependencies with the command
`bower install` and copy them to the right places using the shell
script `copy_depependencies.sh`.

## Running locally

1. Clone this repository
2. Go to chrome's extensions page [chrome://extensions/](chrome://extensions/)
3. Enable the _Developer Mode_
4. Click the button _Load unpacked extension_.
5. Choose the root folder of this project

Voilà!  
You should see podStation's icon on chrome's toolbar.  
You are now running a local copy of podStation, have fun!

## Documentation

You can find the documentation on the [docs](/docs) folder.