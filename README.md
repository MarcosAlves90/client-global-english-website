# Client Global English Website

Web application for the academic operations of an English school/platform. The system provides authentication, student and administrator dashboards, and management of courses, tracks, materials, activities, and attachments.

## Stack

- Next.js 16 App Router, React 19, and TypeScript 5
- Tailwind CSS 4, Radix UI, and internal components in `components/ui`
- Firebase Authentication, Cloud Firestore, and the Firebase Admin SDK
- Cloudinary for images and attachments
- ESLint, Vitest, Testing Library, and jsdom

## Structure

- `app/`: pages, layouts, and API routes.
- `components/`: shared components and UI.
- `modules/`: course, track, material, activity, and user domains.
- `lib/`: Firebase, Cloudinary, authentication, contracts, and utilities.
- `tests/`: unit and behavior tests.
- `scripts/`: Cloudinary migration and E2E smoke tests.

## Local setup

Requirements: Node.js 20 and npm. Configure Firebase Authentication/Firestore, Firebase Admin, and Cloudinary before starting:

```bash
cp .env.local.example .env.local
npm ci
npm run dev
```

The application is available at `http://localhost:3000`. See [docs/SETUP.md](docs/SETUP.md) for environment variable groups and Cloudinary URL migration.

Never commit `.env`, `.env.local`, service-account keys, or Cloudinary secrets.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |
| `npm run type` | Run TypeScript without emitting files |
| `npm run test` | Run unit and component tests |
| `npm run test:coverage` | Run tests with V8 coverage |
| `npm run verify` | Run lint, typecheck, tests, and build |
| `npm run ci` | Run the checks above and both E2E smoke tests |
| `npm run migrate:cloudinary-cloud-name -- --dry-run` | Preview a Cloudinary migration |
| `npm run migrate:cloudinary-cloud-name` | Apply a Cloudinary migration |

The E2E smoke tests require a valid `.env.local` and perform temporary operations in the configured Firebase/Cloudinary environment. Read [docs/TESTING.md](docs/TESTING.md) before running them.

## System flow

1. The user authenticates with Firebase Auth.
2. The backend resolves the role from the user document and `ADMIN_EMAILS`.
3. Dashboards consume the domain modules.
4. Routes under `app/api/admin/*` require a Firebase token and the `admin` role.
5. Images and attachments use Cloudinary where applicable.

See [docs/API.md](docs/API.md) for administrative routes and request/response contracts.

## CI and release

The workflow in `.github/workflows/ci.yml` runs `npm ci`, `npm run lint`, and `npm run test`. The most complete local gate is `npm run verify`; `npm run ci` includes the smoke tests and requires access to the configured services.

The repository does not define a deployment provider, promotion flow, rollback procedure, or health check. See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for runtime requirements and documented operational boundaries.

## Documentation

- [Local setup](docs/SETUP.md)
- [Testing](docs/TESTING.md)
- [Administrative API](docs/API.md)
- [Build and deployment](docs/DEPLOYMENT.md)
- [Changelog](CHANGELOG.md)

## License

No license file or `license` field is currently declared in the repository.
