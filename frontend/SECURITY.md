# Security notes — frontend

This app handles medical images (X-rays / DICOM), so it's treated with
HIPAA-adjacent care even though the backend/infra isn't built yet and full
compliance (audit logging, BAAs, encryption at rest, access review, etc.) is
a whole-system concern, not just a frontend one. What's below is what a
frontend alone can reasonably do, plus the contract the backend needs to
honor for it to actually work.

## What changed and why

### 1. Auth: cookie + CSRF instead of localStorage token
`localStorage`/`sessionStorage` are readable by any JS running on the page —
so a single XSS bug anywhere (a dependency, a rendering bug, a future
feature) would mean full session theft if the token lives there. This app
now assumes:

- **Backend sets the session as an `HttpOnly`, `Secure`, `SameSite=Lax` (or
  `Strict`) cookie** on `POST /auth/login` and `POST /auth/register`. JS
  never sees this value — including a compromised page — because it can't
  read HttpOnly cookies.
- **Backend also sets a second, *non*-HttpOnly `XSRF-TOKEN` cookie** with a
  random value. Axios is configured (`xsrfCookieName` / `xsrfHeaderName` in
  `src/services/api.js`) to automatically read that cookie and echo it back
  as an `X-XSRF-TOKEN` header on every mutating request. The backend must
  reject any POST/PUT/PATCH/DELETE where that header doesn't match the
  cookie — this is what actually stops CSRF once auth is cookie-based.
- **CORS must allow credentials** from an explicit origin (not `*`):
  `Access-Control-Allow-Credentials: true` and
  `Access-Control-Allow-Origin: https://your-frontend-domain` (matching
  whatever origin the SPA is actually served from).
- `GET /auth/me` is now the source of truth for "am I logged in" — the
  frontend calls it on load and whenever it needs to know auth state,
  instead of checking for a client-side token.

### 2. CSRF via double-submit cookie
Covered above — comes for free with the cookie auth switch as long as the
backend implements its half (issue + validate `XSRF-TOKEN`).

### 3. Idle-timeout auto-logout
`AuthContext` now logs the user out after 15 minutes of no mouse/keyboard/
scroll/touch activity. This is a UX-layer safeguard for shared/unattended
workstations — pair it with a real server-side session expiry, since a
client can always be scripted to fake activity events.

### 4. Client-side file signature ("magic byte") checks
`src/utils/fileValidation.js` reads the first bytes of each dropped file and
checks them against known JPEG/PNG/DICOM signatures, instead of trusting the
file extension or browser-reported MIME type (both are just filename
metadata — renaming `payload.svg` to `xray.png` fools extension/MIME
checks instantly). **This is a UX improvement, not a security boundary** —
anyone can skip the frontend and hit the API directly. The backend must
independently verify file signatures and, ideally, re-encode uploaded images
server-side rather than storing/serving the raw uploaded bytes.

### 5. Content-Security-Policy + other headers
- Added a CSP `<meta>` tag in `index.html` as a baseline (works with zero
  server config).
- **Important limitation:** a `<meta>` CSP cannot set `frame-ancestors`, and
  can't set `X-Frame-Options`, `X-Content-Type-Options`,
  `Strict-Transport-Security`, or `Referrer-Policy` at all — those only work
  as real HTTP response headers. Ready-to-use configs for common hosts are
  in `deploy/`: `nginx-security-headers.conf`, `vercel.json`, `_headers`
  (Netlify). Pick the one matching your host and wire it in before
  production launch — without it, clickjacking (`frame-ancestors`/XFO) and
  MIME-sniffing protection are not actually active.
- `style-src 'unsafe-inline'` is included because Tailwind/Framer Motion
  inject inline styles at runtime; tightening this further would require a
  nonce-based approach coordinated with the build.

### 6. Error boundary no longer leaks internals in production
`ErrorBoundary.jsx` only shows the stack trace / component stack in dev
builds (`import.meta.env.DEV`). In production it shows a generic message.
Wire a real error-tracking service (Sentry etc.) into `componentDidCatch`
before launch, and scrub any request/response payloads (which could contain
patient image data or filenames) before they leave the browser.

### 7. `VITE_USE_MOCK` fail-closed fix
`AuthContext.jsx` previously had `USE_MOCK = import.meta.env.VITE_USE_MOCK
=== 'true' || true` — the `|| true` meant mock auth (which accepts almost
any credentials) stayed active **even if you set `VITE_USE_MOCK=false`**.
Fixed to fail closed: only an explicit `"true"` enables mock auth.

### 8. Login form hardening
- `autoComplete="email"` / `"current-password"` / `"new-password"` set
  correctly so password managers behave and browsers don't mis-tag fields.
- Generic "Invalid email or password" message instead of surfacing whatever
  the backend returns — avoids confirming which emails are registered.
- A soft client-side lockout (30s after 5 failed attempts) — again, UX only.
  **The backend must independently rate-limit `/auth/login`** (per-IP and/or
  per-account, with backoff) since this can be bypassed by calling the API
  directly.
- Password strength check on registration (length ≥ 8 plus a mix of
  character classes) before submit.

### 9. Fail-open bugs in `AppLayout.jsx` / `Navbar.jsx`
Both had a `try { useAuth() } catch { auth = <fake logged-in user> }` pattern.
If `useAuth()` ever threw (context missing, provider error), the app treated
that as **authenticated**, and `Navbar`'s fallback logout button did nothing
but `console.log('logout')` — a user clicking "Logout" would see it happen
in the UI while their session stayed live. Removed both fallbacks; a broken
auth context now surfaces as a real error instead of silently granting
access or faking a logout.

### 10. bfcache replay after logout
Hitting the browser Back button after logging out can, in some browsers,
restore a protected page from the back-forward cache (already-rendered DOM)
without re-running React or the auth check. `AppLayout.jsx` now listens for
`pageshow` with `event.persisted` and forces a reload, so the route guard
actually re-runs instead of briefly showing stale content.

### 11. PHI-safe logging (`src/utils/safeLog.js`)
Wraps `console.log`/`console.error` and strips known-sensitive keys
(filenames, image URLs, email, name, tokens, etc.) before logging, and caps
string/array size. Wired into `ErrorBoundary.jsx` and `DashboardPage.jsx`.
**This isn't fully rolled out** — as more pages start logging job/user data,
use `safeLog` instead of `console.*` there too. When a real error-tracking
service (Sentry etc.) gets added, route it through this wrapper, not around it.

### 12. Dependency audit
`npm audit` currently reports 4 advisories (3 moderate, 1 high), all in
`react-router`/`esbuild`:
- The `esbuild` advisory only affects the **local dev server**
  (`npm run dev`) — a malicious website could read dev-server responses. Not
  a production risk, but don't run `npm run dev` on a network you don't
  trust.
- The two `react-router` advisories (open redirect via `redirect()` in
  loaders/actions) explicitly don't apply to apps using plain declarative
  `<BrowserRouter>` routing with no loaders/actions — which is all this app
  uses. Confirmed no `redirect()`/data-router usage in this codebase.
- Still worth planning an eventual upgrade to `react-router-dom` v7 since
  that's where the fix lives; re-run `npm audit` periodically regardless.


- Real rate limiting / brute-force protection on auth endpoints.
- Authoritative file-type validation, virus/malware scanning of uploads, and
  safe storage (e.g. re-encoding images rather than serving user-uploaded
  bytes as-is).
- Session/token expiry and revocation.
- Encryption at rest for stored images/data.
- Audit logging of who accessed which patient images, if HIPAA-level
  compliance is eventually required.
- Role-based authorization on API endpoints (the frontend route guard only
  checks "is logged in," not "is allowed to see this specific job/image" —
  that check has to happen server-side regardless of what the UI shows).

## Changes — 2026-09-24 security hardening sprint

### 13. `DashboardPage.jsx` — second `|| true` fail-open fixed
Same class of bug as §7 (the `AuthContext` fix), but this one survived in
`DashboardPage.jsx`. Line 10 had `const USE_MOCK = ... || true` which kept
mock data permanently active even in production. Now uses strict equality
(`=== 'true'`), and the `else` branch wires `uploadService.getJobs()` for
real backend data.

### 14. `UploadPage.jsx` — rewritten to use real services + file validation
The page previously defined its own inline `mockUploadService` and inline
`FileUploadZone` that **completely bypassed** the magic-byte signature
validation in `src/utils/fileValidation.js`. Rewritten to:
- Import the real `FileUploadZone` component (which calls
  `validateFileSignatures()` on every drop)
- Import `FilePreviewCard` from the shared component library
- Toggle between `mockUploadService` and `uploadService` via strict
  `VITE_USE_MOCK` check
- Sanitize filenames via `sanitizeFilename()` before processing
- Use `safeLog` for error logging instead of `console.*`

### 15. `ProcessingPage.jsx` — wired to real job status API
Previously had an inline `mockApiService` with an automatic state
progression timer that always reached "completed" regardless of actual job
state. Rewritten to:
- Call `activeService.getJobStatus(jobId)` via the real polling hook
- Import shared `usePolling` (with exponential backoff) and `StatusBadge`
  instead of defining them inline
- Map real backend status values (`pending`, `queued`, `processing`,
  `completed`, `failed`) to the UI stepper
- Navigate to `/viewer/${jobId}` only when the backend confirms completion

### 16. `HistoryPage.jsx` — crash fix + server-side operations
- Fixed `TypeError: data.sort is not a function` — `uploadService.getJobs()`
  returns `{ jobs: [], ... }`, not an array. Now extracts `.jobs` safely.
- `handleDelete` now calls `uploadService.deleteJob(id)` on the server
  before removing from client state (was previously client-only, leaving
  orphaned records on the backend).
- Search input sanitized via `sanitizeSearchQuery()` to strip control
  characters and cap length.
- Error logging uses `safeLog.error` instead of `console.*`.

### 17. `ImageViewerPage.jsx` — property name fix + CDN leak removed
- Fixed property name mismatch: `job.originalImageUrl` → `job.originalUrl`
  (matching the actual data model). The mismatch caused the viewer to always
  fall back to `https://placehold.co`, leaking network requests to a
  third-party CDN from a medical app and violating the CSP `img-src` policy.
- Download buttons now use `uploadService.downloadImage()` (with
  credentials) instead of `<a href download>` tags that can't authenticate
  cross-origin.

### 18. `helpers.js` — cryptographically secure ID generation
`generateId()` replaced `Math.random()` (predictable PRNG) with
`crypto.randomUUID()` / `crypto.getRandomValues()` fallback. Prevents
ID guessing/enumeration if IDs are ever used in security-sensitive contexts.

### 19. `usePolling.js` — exponential backoff on errors
Polling hook now tracks consecutive errors and doubles the interval on each
failure (base × 2^errorCount, capped at 60s). Prevents hammering a
struggling or rate-limiting backend. Resets to base interval on success.
Accepts optional `onError` callback.

### 20. `api.js` — HTTPS enforcement + 429 handling
- Production builds now log a loud `[SECURITY]` console error if
  `VITE_API_BASE_URL` starts with `http://`, since the `Secure` cookie flag
  means auth silently breaks over plain HTTP.
- Response interceptor now handles HTTP 429 (Too Many Requests) with a
  user-friendly toast, in addition to 401/403/5xx.

### 21. `mockData.js` — external CDN URLs removed
Replaced `picsum.photos`, `pravatar.cc`, and `placehold.co` URLs with `null`
throughout mock data. In a medical/healthcare app, loading from third-party
CDNs leaks network requests that can be logged externally, and violates the
app's CSP `img-src` policy. UI components handle `null` URLs with local
placeholders.

### 22. `src/utils/inputSanitizer.js` — new defense-in-depth utility
New utility providing:
- `stripHtml(input)` — removes HTML tags from user text
- `sanitizeUrl(url)` — blocks `javascript:`, `data:`, `vbscript:` protocols
- `isValidRouteParam(param)` — validates URL params against path traversal
- `sanitizeSearchQuery(query)` — strips control characters, caps length

## Before going to production
1. Confirm the backend implements the cookie + CSRF contract above; until
   then `authService.js` calls will fail against a real backend that still
   expects a bearer token — coordinate the switch together.
2. Apply one of the `deploy/` header configs on whatever serves the built
   app.
3. Set `VITE_USE_MOCK=false` (or remove it) in the production `.env`.
4. Update the CSP's `connect-src` in both `index.html` and the chosen
   `deploy/` config to your real API domain (currently
   `http://localhost:5000` as a placeholder).
5. Wire a real error-tracking service (Sentry etc.) through the `safeLog`
   wrapper — never bypass it, since raw payloads may contain PHI.
6. Use `isValidRouteParam()` from `inputSanitizer.js` on route params
   (`jobId` etc.) as an extra defense layer when wiring to a real backend.

