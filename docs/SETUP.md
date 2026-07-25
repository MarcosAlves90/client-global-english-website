# Local setup

## Requirements

- Node.js 20 (the repository CI uses Node 20).
- npm.
- A Firebase project with Authentication and Firestore enabled.
- A Firebase Admin service account for server routes and smoke tests.
- A Cloudinary account for image and attachment operations.

## Environment

Copy the example file and fill in values for the target environment:

```bash
cp .env.local.example .env.local
```

Keep `.env.local` untracked. Public Firebase settings use the `NEXT_PUBLIC_FIREBASE_*` names. Server-side Firebase Admin settings are `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY`; represent private-key line breaks as `\n` in the dotenv value. Admin role resolution uses the server-only `ADMIN_EMAILS` list.

Cloudinary requires `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, and the matching `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`. The fixed asset IDs are also required by the home, login, and signup surfaces.

## Install and run

```bash
npm ci
npm run dev
```

The development server runs at `http://localhost:3000`.

## Cloudinary migration

The migration reads `.env.local` by default and supports an explicit environment file. Always inspect the dry run before writing:

```bash
npm run migrate:cloudinary-cloud-name -- --dry-run
npm run migrate:cloudinary-cloud-name
```

The migration scans `users`, `courses`, `materials`, and `activities`. It can update image URLs and attachment URLs to the configured cloud name and remove Cloudinary version segments.
