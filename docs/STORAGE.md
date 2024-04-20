# Storage

podStation uses chrome's `local` and `sync` storage for persistency:
https://developer.chrome.com/apps/storage

We have only 100 KB of `sync` storage!

## Tricks for sync storage

### Testing

For testing sync storage, check the following links:
- <https://groups.google.com/a/chromium.org/g/chromium-extensions/c/qp_087h_vrU/m/ucb63AT5BQAJ>
- <https://stackoverflow.com/questions/20970833/does-chrome-app-id-for-extensions-affect-sync-storage>

Once you managed to get the `key`, create a `.env` file and add a line with `EXTENSION_KEY=<key value>`.

Now, when you run `npm start`, the resulting `manifest.json` file will have the `key` field set.

Now, loading the unpacked extensions in two computers, and logging in with your google user, will make it possible to test the sync storage for development.

### Attribute naming

When using the sync storage, due to limited space, podStation
used abreviated names such as `t` for _current playtime_ and `l`
for _last time played_.

It is not a strict rule, there is a compromise of readability for
space. If it is an atribute of an array it will probably be
abreviated. If it is guaranteed to occur only once, maybe it
will have a more readable name.

## Persisted data

### Options

The options are stored in `sync`.

Here is the data structure:

```js
{
	"syncOptions": {
		// auto update podcast feeds
		"autoUpdate": true,
		// auto update interval in minutes
		"autoUpdateEvery": 60,
		// integrate with the Screen Shader extension
		"integrateWithScreenShader": true,
		// activate analytics functions
		"analytics": true
	}
}
```

### Player Options

To be written.

### User Interface Options

To be written.

### Playlist

Playlists are stored in `sync` storage.  
They are stored under the key `pl_<playlistId>`.  
Althoug the design was made to support multiple playlists, currently
podStation supports a single playlist with the id `default`.

Here is the data structure:

```js
{
	// the playlist key in storage
	"pl_default": {
		// entries
		"e": [
			{
				// podcast id
				"p": 1, 
				// episode id
				"e": "http://podcast.com/p=1"
			}
		]
	}
}
```

### Podcasts & Episodes

Podcast and episode data are split into `local` and `sync` 
storage.

The data we parse from the feed is stored in `local` storage,
as it is basically a mirror of the feed, we do not need to 
have it synched. 

Now, user specific data like the list of subscribed podcasts
and the episodes in progress are stored in `sync`, so that
it keeps the same data across devices.

#### Podcasts list

##### Sync

The list of subscribed podcasts is stored in `sync`.

Here is the data structure:

```js
{
	"syncPodcastList": [
		{
			// Feed url
			"url": "https://feedaddress.com",
			// podcast id
			"i": 1
		}
	]
}
```

The `podcast id` is assigned sequentially. If a podcast is excluded, its
id will be reused in case a new podcast is added.

Podcasts ids were introduced so that podcasts can be referred to in
`sync` storage with a low space usage.

##### Local

To be written.

#### Podcast extended data & episodes - `sync`

Extended data for podcasts and episodes that require `sync` storage
are stored under a single key for each podcast.

The key for each podcast is formed like `P<podcast id>`

Here is the data structure:

```js
{
	"P1": {
		// episodes
		"e": [
			{
				// episode id
				"i": "espisode id", 
				// elapsed play time in seconds
				"t": 15,
				// last time played
				"l": "2018-01-30T13:47:39.841Z"
			}
		]
	}
}
```

podStation only store data for the episodes that have `t != 0`.
