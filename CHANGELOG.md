# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- Value 4 Value: Fixed excessive calls to LNPay for getting walled balance, by introducing a balance cache ([Issue #289](https://github.com/podStation/podStation/issues/289))

## [1.46.1]

### Fixed

- Value 4 Value: Fixed wrong feed parsing and TLV record encoding for `customValue` attribute on the tag `podcast:valueRecipient` ([PR #283](https://github.com/podStation/podStation/pull/288))

## [1.46.0]

### Added

- Value 4 Value: Added `<podcast:value>` on `<item>` level support

### Changed

- Technical Feature: Updated the API endpoint used for LNPay ([PR #273](https://github.com/podStation/podStation/pull/273))
- Regression: Added back lightning payment test mode options removed by mistake with [PR #206](https://github.com/podStation/podStation/pull/206)

## [1.45.0]

This version contains an under-the-hood refactoring to introduce bundling with Webpack.  
It should not introduce any changes to the users, but despite our testing, it may introduce minor bugs.  
Unfortunately, that is a necessary change to support a better development experience (and hopefully faster feature development as a consequence).

### Added

- Technical Feature: Bundling and module support with [webpack](https://webpack.js.org/)
- Technical Feature: Static code check with [ESLint](https://eslint.org/)

## [1.44.1] - 2021-06-16

### Fixed

- Lightning value 4 value: Fixed a text in the options for boost value with LND nodes

## [1.44.0] - 2021-06-06

### Added

- Lightning value 4 value: Added option to generate invoice to recharge the wallet used for sending value.  
  For LND users, the _macaroon_ used for authentication must include the permission `invoices:write`

## [1.43.0] - 2021-05-28

### Added

- Lightning value 4 value: Added a boost button in the player, boost value is configurable in the options ([PR #260](https://github.com/podStation/podStation/pull/260))

## [1.42.0] - 2021-05-25

### Added

- Lightning value 4 value: Added max fee support for LNPay. It works the same way as for LND nodes. The default is 1%, it can be changed on the options.
- Lightning value 4 value: Added value streaming information on the player, when value via lightning is configured

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

[Unreleased]: https://github.com/podStation/podStation/compare/v1.46.1...HEAD
[1.46.1]: https://github.com/podStation/podStation/compare/v1.46.0...v1.46.1
[1.46.0]: https://github.com/podStation/podStation/compare/v1.45.0...v1.46.0
[1.45.0]: https://github.com/podStation/podStation/compare/v1.44.1...v1.45.0
[1.44.1]: https://github.com/podStation/podStation/compare/v1.44.0...v1.44.1
[1.44.0]: https://github.com/podStation/podStation/compare/v1.43.0...v1.44.0
[1.43.0]: https://github.com/podStation/podStation/compare/v1.42.0...v1.43.0
[1.42.0]: https://github.com/podStation/podStation/compare/v1.41.0...v1.42.0
[1.41.0]: https://github.com/podStation/podStation/compare/v1.40.1...v1.41.0
[1.40.1]: https://github.com/podStation/podStation/compare/v1.40.0...v1.40.1
[1.40.0]: https://github.com/podStation/podStation/compare/v1.38.0...v1.40.0