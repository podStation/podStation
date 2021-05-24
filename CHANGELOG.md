# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Lightning value 4 value: Added max fee support for LNPay. It works the same way as for LND nodes. The default is 1%, it can be changed on the options.

## [1.41.0] - 2021-05-20

### Added

- Lightning value 4 value: Minimal support for the TLV custom record 7629169 as defined [here](https://github.com/satoshisstream/satoshis.stream/blob/main/TLV_registry.md#field-7629169), which enabled sending value to podcasts using <https://satoshis.stream/>.

### Fixed

- Fixed OPML export for feeds with invalid XML characters ([Issue #157](https://github.com/podStation/podStation/issues/157))

## [1.40.1] - 2021-04-03

### Changed

- Use font-family `sans-serif` for player time, it avoids the player from "jumping" ([Issue #212](https://github.com/podStation/podStation/issues/212))

### Fixed

- Missing Portuguese translation for "Play in reverse order"
- Fixed side effect of [Pull Request #193](https://github.com/podStation/podStation/pull/193), removing an unnecessary new line in the "All episodes from" button shown in the "Last episodes" view.

## [1.40.0] - 2021-03-30

### Added

- Player option to play next or previous episodes in reverse order (i.e. play older episodes next instead of newer)

[Unreleased]: https://github.com/podStation/podStation/compare/v1.40.1...HEAD
[1.41.0]: https://github.com/podStation/podStation/compare/v1.41.0...v1.40.1
[1.40.1]: https://github.com/podStation/podStation/compare/v1.40.1...v1.40.0
[1.40.0]: https://github.com/podStation/podStation/compare/v1.40.0...v1.38.0