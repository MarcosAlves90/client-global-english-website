# Build and deployment

## Required runtime configuration

The production runtime must provide the public Firebase settings, Firebase Admin service-account settings, Cloudinary credentials, Cloudinary fixed-asset IDs, `ADMIN_EMAILS`, and `NEXT_PUBLIC_SITE_URL`. See [`.env.local.example`](../.env.local.example) for the complete variable names.

Never commit `.env`, `.env.local`, service-account keys, or Cloudinary secrets. Configure them through the deployment platform's secret store.

## Build and start

```bash
npm ci
npm run build
npm run start
```

The application is a Next.js App Router application. `npm run start` serves the build produced by `npm run build`; the repository does not define a deployment provider or deployment workflow.

`npm run build` was verified during this documentation pass with the required environment configuration. `npm run start` was not launched because it is a long-lived server process.

## Release checks

Run the local aggregate gate before a release:

```bash
npm run verify
```

For an environment with permitted Firebase/Cloudinary test data, also run:

```bash
npm run ci
```

The repository-owned GitHub Actions workflow currently validates install, lint, and unit tests only. Deployment, promotion, rollback, health checks, and alerting are not defined in this repository.

## Cloudinary data migration

When changing Cloudinary accounts or cloud names, use the dry run first:

```bash
npm run migrate:cloudinary-cloud-name -- --dry-run
```

Review the reported collections and fields before running the write mode. The migration writes Firestore documents in the configured Firebase project; take the operational backup required by your environment before applying it.

The migration was not run during this documentation pass because even dry-run mode reads the configured Firestore project.
