# Performance baseline

## Baseline

Captured on `release/current` at `b003ba787b37a92966460269e74b886c4e8507ed`, after a successful `npm run build`, using the production server on localhost. Measurements are local and warmed; there is no production RUM or authenticated production latency baseline available.

| Route | Initial JavaScript (gzip bytes) | Route CSS (gzip bytes) |
| --- | ---: | ---: |
| `/` | 358,338 | 27,578 |
| `/login` | 373,724 | 27,578 |
| `/dashboard` | 396,417 | 27,578 |
| `/dashboard/activities` | 395,405 | 27,578 |
| `/dashboard/admin/courses` | 473,430 | 27,578 |
| `/dashboard/admin/users` | 469,996 | 27,578 |
| `/dashboard/teacher/grading` | 466,118 | 27,578 |

The figures are sums of the gzip size of each JS/CSS asset referenced by the route's generated HTML. They are not browser transfer traces and may not reflect HTTP cache reuse between shared chunks.

Warm sequential localhost requests across 25 samples per route produced p50 TTFB of 1–2 ms and p95 total response time of 1–3 ms across `/`, `/login`, `/dashboard`, `/dashboard/activities`, `/dashboard/admin/courses`, `/dashboard/admin/users`, and `/dashboard/teacher/gradebook`. These timings measure a local server and are not representative of production network latency.

The public landing route's shared initial JavaScript chunk contained Firebase Auth and Firestore package markers. `AuthProvider` attached an auth listener on every route and read a signed-in user's profile from Firestore. Markdown editor and preview styles were imported from the root layout. Material and activity loaders fetched tracks before starting their independent content queries. Auth-gated initial HTML omitted the login/dashboard content while session resolution returned `null`.

The static `/dashboard/admin/courses` route returned `x-nextjs-cache: HIT`, `x-nextjs-prerender: 1`, and a static cache policy. An unauthenticated `/api/admin/users` request returned 401; no claim is made about headers for a successful authenticated response.

## Target

The primary local build acceptance target is at least a 20% reduction in initial gzip JavaScript for `/`: from 358,338 bytes to at most 286,670 bytes. This is an engineering threshold based on the measured baseline, not a production SLO.

Keep personalized Firestore data out of shared caches unless separate freshness, invalidation, and privacy behavior is specified. Preserve the verified static-route cache hit.

## Results

Measured after implementation with the same static HTML asset-reference method:

| Route | Initial JavaScript (gzip bytes) | Route CSS (gzip bytes) | Change in JavaScript |
| --- | ---: | ---: | ---: |
| `/` | 211,350 | 21,558 | −146,988 (−41.0%) |
| `/login` | 386,870 | 21,558 | +13,146 (+3.5%) |
| `/dashboard` | 409,920 | 21,558 | +13,503 (+3.4%) |
| `/dashboard/admin/courses` | 486,906 | 21,558 | +13,476 (+2.8%) |

The landing route is under the 286,670-byte target. Its referenced JS assets no longer contain Firebase Auth/Firestore package or endpoint markers; the small AuthProvider initializer still contains the `onAuthStateChanged` symbol and dynamic chunk references. Its CSS assets no longer contain Markdown stylesheet markers. The production build still emits separate CSS assets with editor and preview selectors for the routes that use them. Login and dashboard static HTML now include a visible “Verificando sua sessão...” state, and dashboard includes the “Carregando painel...” fallback.

Auth-dependent routes reference 2.8–3.5% more initial JS bytes than the baseline route sets. This is a measured tradeoff from the route-level bundle split and loading UI; it should be revisited with authenticated browser transfer traces. No production request latency or RUM improvement is claimed from this build comparison.

The production server after the change still returned `200`, `x-nextjs-cache: HIT`, `x-nextjs-prerender: 1`, and `Cache-Control: s-maxage=31536000` for `/dashboard/admin/courses`. Login and dashboard HTML returned the new visible loading labels in the same local production-server check.
