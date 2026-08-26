# Testing

## Test layers

- Unit and component tests use Vitest, Testing Library, and jsdom.
- Static checks use ESLint and TypeScript without emitting files.
- The two smoke suites run the Next development server and exercise Firebase Admin, Firebase Authentication, Firestore, and Cloudinary-backed attachment flows.

## Commands

```bash
npm run lint
npm run type
npm run test
npm run test:coverage
npm run build
npm run verify
npm run ci
```

`npm run verify` runs lint, typecheck, all unit tests, and the production build. `npm run ci` runs those first three checks and then both E2E smoke suites; it requires a valid `.env.local` and access to the configured Firebase project.

Run an individual smoke suite when narrowing a failure:

```bash
npm run test:e2e:attachments-smoke
npm run test:e2e:course-activity-smoke
```

The smoke suites create timestamped test records and clean them up in their `finally` paths. Use a permitted test project, not an environment where test writes are unacceptable.

## Current verification baseline

The repository has verified 12 test files and 40 unit tests. `npm run ci` also passes both smoke suites when `.env.local` contains valid Firebase Admin credentials and the required public Firebase and Cloudinary settings.

The latest coverage run passed with 84.21% statement coverage, 74.33% branch coverage, 82.19% function coverage, and 85.47% line coverage. Coverage is reported but no minimum threshold is enforced by the current configuration.

The GitHub Actions workflow currently runs `npm ci`, `npm run lint`, and `npm run test`; it does not invoke `npm run verify` or the E2E smoke suites.
