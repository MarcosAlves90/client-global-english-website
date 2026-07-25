# Changelog

All notable changes to this project are documented here.

## [Unreleased]

### Added

- Added repository documentation for setup, testing, administrative API routes, and deployment boundaries.
- Added an English pull request template.
- Added the `npm run verify` aggregate validation command.

### Changed

- Centralized Cloudinary URL normalization, optimization, and public-ID matching.
- Added Zod contracts and centralized admin authorization for administrative APIs.
- Refactored course-management state, actions, attachment uploads, activity creation, and activity insights.
- Made E2E smoke-test server startup work on Unix and Windows.

### Fixed

- Stabilized accessibility tests when jsdom does not expose `localStorage`.
- Isolated Cloudinary URL fixtures from the developer's configured cloud name.
