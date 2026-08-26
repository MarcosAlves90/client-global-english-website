# Changelog

All notable changes to this project are documented here.

## [Unreleased]

### Added

- Added structured `WebSite` and `EducationalOrganization` JSON-LD for the public site.
- Added regression coverage for metadata, crawler policy, sitemap, and structured-data sanitization.

### Changed

- Refreshed site-wide SEO metadata to reflect the 0.10.0 learning experience, including courses, activities, materials, agenda, grades, progress, and teacher feedback.
- Updated canonical URLs, Open Graph metadata, Twitter cards, dynamic social previews, keywords, and application metadata.
- Updated `robots.txt`, sitemap generation, and the web app manifest to match the current public/private route boundaries and dark visual identity.

### Fixed

- Prevented login, signup, dashboard, password-update, and private API surfaces from being indexed as public content.
- Removed authentication pages from the sitemap and stopped generating artificial `lastModified` timestamps on every sitemap build.
- Fixed corrupted Portuguese SEO text such as `inglÃªs` in root metadata.

## [0.10.0] - 2026-08-26

### Added

- Added a dedicated teacher workspace with assigned-course access, course detail pages, grading, gradebook, and teacher-specific API routes.
- Added teacher activity creation inside assigned courses, reusing the shared activity-authoring flow while enforcing course and enrollment boundaries on the server.
- Added richer course grading workflows with submission pagination, status/activity/date filters, search, sorting, and independent grading-panel sizing on desktop.
- Added student agenda and grades pages plus dedicated course detail navigation.
- Added reusable activity authoring, activity insights, course forms, management grids, assignment pickers, attachment panels, and course-management state/action primitives.
- Added post-creation attachment management for activities and materials.
- Added audio recording for materials, activity attachments, question prompts, and student answers, including audio-response questions and teacher playback.
- Added shared audio limits and Cloudinary compression/storage rules for recorded and uploaded audio.
- Added accessibility controls and shared dashboard primitives for navigation, feedback, search, segmented controls, workspace switching, and mobile navigation.
- Added Zod contracts for shared, admin, and teacher request payloads and reusable authorization helpers.
- Added repository documentation for setup, testing, administrative APIs, and deployment boundaries.
- Added an English pull request template, aggregate `npm run verify` validation, expanded smoke tests, and broader unit/regression coverage.

### Changed

- Redesigned the landing page, authentication flow, dashboard shell, navigation, cards, forms, and major student/admin screens around a consistent Cupertino-inspired visual system.
- Reorganized dashboard components into cohesive shared modules and introduced role-aware workspaces for student, teacher, and admin navigation.
- Refactored course management so course editing happens inside the course detail route instead of opening an edit form in the course catalog.
- Standardized module, material, and activity management layouts and extracted shared creation/attachment behavior to reduce duplication.
- Refactored activity progress, grading, scheduling, automatic scoring, deadlines, and answer presentation into dedicated domain modules.
- Centralized Cloudinary URL normalization, optimization, upload/delete behavior, public-ID handling, and media-type inference.
- Refactored administrative API clients and server routes around shared contracts, request helpers, summaries, enrollment synchronization, and single-flight caching.
- Expanded Firestore authorization rules and access helpers for course content, teacher ownership, and role-specific operations.
- Simplified and reorganized UI primitives, removing obsolete duplicated navigation/auth/layout components.
- Updated README, environment examples, testing configuration, and deployment/testing guidance to match the new architecture.

### Fixed

- Removed the redundant outer frame around the landing dashboard preview that produced a double-border effect.
- Prevented grading selection and question/answer panels from being stretched to the same height on desktop.
- Fixed attachment deletion across Cloudinary image, video/audio, and raw resource types.
- Fixed media-type inference so audio files without a useful MIME type are not misclassified.
- Fixed activity and material attachment workflows so media can be added after content creation with rollback on persistence failures.
- Fixed course-cover draft cleanup so persisted covers are not deleted when editing is cancelled or replaced.
- Stabilized accessibility and navigation tests around jsdom `localStorage`, workspace/sidebar providers, and Next.js navigation mocks.
- Isolated route tests from unrelated heavy component graphs to keep coverage representative of the behavior under test.
- Made E2E smoke-test server startup work across Unix and Windows and isolated Cloudinary URL fixtures from local developer configuration.

### Security

- Enforced teacher course ownership/assignment server-side before allowing course management actions.
- Validated that teacher-targeted activity recipients are enrolled in the selected course.
- Centralized role checks and administrative request authorization instead of relying on client-side visibility.
- Added explicit content-access and teacher-access helpers and tightened Firestore rules around privileged operations.
