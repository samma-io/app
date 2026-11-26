# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

**Always use Docker Compose for running and testing the app.** The app requires PostgreSQL, which is provided by the `postgres` service in `docker-compose.yml`.

```bash
# Start all services (app + postgres) and rebuild if needed
docker compose up --build

# Run in background
docker compose up --build -d

# View logs
docker compose logs -f samma-web

# Run Prisma migrations (run from HOST, not inside container)
DATABASE_URL="postgresql://samma:samma@localhost:5432/samma" \
  npx prisma migrate dev --name <migration-name>

# Stop everything
docker compose down
```

- `npm run build` — Production build (standalone output for Docker)
- `npm run lint` — ESLint checks

> Do NOT use `npm run dev` or `npm run start` directly — the app needs the `postgres` service from docker-compose.

## Tech Stack

- **Next.js 16** with App Router (file-based routing)
- **React 19** with TypeScript (strict mode)
- **Tailwind CSS 4** via PostCSS plugin
- **Clerk** (`@clerk/nextjs`) for authentication
- **Prisma ORM** — two clients: main PostgreSQL + scanner TimescaleDB
- **class-variance-authority (CVA)** for component variants
- **lucide-react** for icons

## Architecture

### Routing & Pages

All routes use the Next.js App Router under `src/app/`. Key routes:

- `/` — Marketing/hero landing page
- `/integration` — Public page for clients and partners: operator → samma.io → partner scanners → results back to the cluster (collector metrics/logs), with the partner API contract
- `/partners` — Public page for prospective partners: how the platform works (scanner + SIEM flows, no environment-specific details), the three kinds of partners, scanner onboarding, and links to `/integration#partners` for the API contract
- `/sign-in`, `/sign-up` — Clerk sign-in / sign-up
- `/dashboard` — Overview: open findings by severity (Critical/High/Medium tiles → `/dashboard/findings`), top findings, scanner status (OK/Stale/Failed), targets by risk. Data: `getVulnerabilitySummary()` in `src/lib/vulnerability-summary.ts`; no demo numbers
- `/dashboard/findings` — Open findings, filterable by `severity`, `scanner`, `target` (search params); rows expand to evidence, remediation, CVEs, references
- `/dashboard/profiles` — Scan profiles list
- `/dashboard/profiles/[id]` — Profile detail with targets table
- `/dashboard/profiles/[id]/targets/[targetId]` — Target detail + scan results from TimescaleDB
- `/dashboard/clusters` — Connected clusters: name, Ready/Down (seen in the last 15 min), version, target count
- `/dashboard/scanners` — Connect external scanners (vendor API key, encrypted with `SCANNER_SECRET_KEY`) and the scanner dashboard: internal + external scanners, runs, targets, cost. Catalog, prices and API URLs: `src/lib/external-scanners.ts` (`EXTERNAL_SCANNER_URL_<ID>` overrides the URL). External runs are real (`ExternalScanRun`, see below); internal runs come from TimescaleDB or demo data when it is unset
- `/dashboard/siem` — SIEM overview: alerts by level (24h/7d, daily chart), the org's SIEMs with status and deployed ruleset vs latest, latest Samma rules (CVE badges), rules-subscription card (`SiemSubscription`, set by hand; no billing). Data: `getSiemOverview()` in `src/lib/siem.ts`. A SIEM that runs `siem-reporter` shows its real report (alert counts, lanes, components); **a SIEM that has never reported shows demo data** (`src/data/mock-siem.ts`, seeded by id, marked with a Demo badge). The rule catalog/release feed is still a demo stand-in (`src/lib/siem-rules.ts`)
- `/dashboard/siem/new` — Create a SIEM: "Deploy with Ankra" (Samma hosting), "Ankra on your hosting" (provider + region from `SIEM_PROVIDERS`), or "Connect a running SIEM". Ankra deploys are **mocked**: nothing is provisioned, status is Deploying for 3 min after `createdAt`, then Running. Every SIEM gets a `samma_siem_…` key, shown once; only its SHA-256 is stored (`SiemInstance.apiKeyHash`). It is not an `ApiToken`: only the `/api/v1/siem/*` routes accept it
- `/dashboard/siem/[id]` — One SIEM: status, alerts, detection lanes (engine version, rules, alerts, flow) and ingest components from its latest report, deployed ruleset with the rules it is missing, rotate key, remove
- `POST /api/v1/siem/report` — A SIEM's reporter posts lane versions, component health and alert counts (schema and validator in `src/lib/siem-report.ts`: counts and versions only, never alert content). Auth is the SIEM key (`authenticateSiemKey()` in `src/lib/siem-auth.ts`), which selects the one `SiemInstance` it updates (`report`, `lastSeenAt`). 20 s minimum between reports (429), 64 KB cap (413)
- **Rule exchange** (`docs/siem-exchange.md` is the contract; code in `src/lib/siem-exchange*.ts`). Every route is off until its env is set (`SIEM_PUBLISH_TOKEN`, `SIEM_RULES_PUBLIC_KEY`, `SIEM_BLOCKLIST_SIGNING_KEY`):
  - `POST /api/v1/siem/releases` — detection-engine CI uploads a signed ruleset bundle (`SiemRuleRelease`, bytes in Postgres, ≤ 5 MB). Auth `SIEM_PUBLISH_TOKEN`; the Ed25519 signature must verify with `SIEM_RULES_PUBLIC_KEY` (the private rules key is never on the app). Versions are immutable (409)
  - `GET /api/v1/siem/feed` (Atom, ETag/304), `GET /api/v1/siem/bundles/[lane]/[version]`, `GET /api/v1/siem/blocklist?version=N` — SIEM key **and** an active `SiemSubscription` (403 otherwise)
  - `POST /api/v1/siem/indicators` — attacker IPs from a SIEM whose OWNER turned on sharing (`SiemInstance.shareIndicators`, card on `/dashboard/siem/[id]`, `setSiemSharing`; off deletes its `SiemIndicator` rows). Public IPs only, 7-day window, no victim data
  - Community blocklist: IPs reported by ≥ `SIEM_BLOCKLIST_MIN_ORGS` (3) organisations, minus `SiemCommunityAllow` (by hand) and `SIEM_BLOCKLIST_EXCLUDE`, signed by the app into `SiemBlocklistSnapshot` (re-checked every 5 min per process, re-signed every 12 h, entries expire after 24 h)
- `/dashboard/tokens` — API token management
- `/dashboard/org/new` — Create an organisation (Clerk `<CreateOrganization>`)
- `/dashboard/settings` — Organisation settings: Clerk org profile (general, members and invitations, billing) + billing details

### Auth (Clerk)

Clerk (`@clerk/nextjs`) handles identity. The local Prisma `User` row (linked by `User.clerkId`) remains the anchor for org memberships, so the rest of the data model is unchanged.

- `src/lib/auth.ts` — `getCurrentUser()` (cached per request) maps the Clerk session to the local `User`. On first sign-in it links an existing user by **verified** email (pre-Clerk accounts keep their orgs) or creates a new one. `requireUser()` (pages: redirects to `/sign-in`) and `requireUserForAction()` (server actions: throws).
- `src/middleware.ts` — `clerkMiddleware`; `auth.protect()` on `/dashboard(.*)` and `/profile(.*)`; injects `x-pathname` header. `/api/v1/*` is not protected by Clerk — it uses API tokens.
- `src/app/sign-in/[[...sign-in]]`, `src/app/sign-up/[[...sign-up]]` — Clerk `<SignIn />` / `<SignUp />`
- Client components use `useAuth()` / `useUser()` / `useClerk().signOut()` from `@clerk/nextjs`; `<ClerkProvider>` wraps the root layout.
- `src/lib/org.ts` — `getActiveOrg()` = the active org of the Clerk session (`auth().orgId`), mapped to the local org by `resolveSessionOrg()` (local membership required; on a miss it is confirmed with the Clerk API, then mirrored). `getActiveOrgRole()` for OWNER-only actions.
- Org UI is Clerk: `<OrganizationSwitcher>` in the sidebar (create/switch), `<OrganizationList>` when no org is active, `<CreateOrganization>` on `/dashboard/org/new`, and `/dashboard/settings/[[...rest]]` = `<OrganizationProfile>` (general, members + invitations, Clerk billing) plus Samma's own **Billing details** page (`billing*` columns on `Organisation`, `src/lib/billing-details.ts`, OWNER-only `saveBillingDetails`). Members page: `/dashboard/settings/organization-members`.
- Env: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (build-time, Docker build arg), `CLERK_SECRET_KEY` (runtime). See `.env.example`.
- Organisations are mirrored with **Clerk Organizations** (`src/lib/clerk-sync.ts`). Clerk owns who is in which org and their role; the local `Organisation`/`OrgMembership` rows own everything else and stay the authorisation check. Link: `Organisation.clerkOrgId` (+ `privateMetadata.sammaOrgId` on Clerk orgs Samma created). Role map `org:admin ↔ OWNER`, else `MEMBER`.
  - Clerk → Samma: `POST /api/webhooks/clerk` (Svix, `CLERK_WEBHOOK_SIGNING_SECRET`): `organization.*`, `organizationMembership.*`. Idempotent; out-of-order events are fine.
  - Samma → Clerk: a pre-Clerk org gets its Clerk org the first time an OWNER opens the dashboard (`getActiveOrg` → `ensureClerkOrg`), and new orgs from `createOrganisation` immediately. Members who sign in later are added by `linkUserOrgsToClerk`.
  - `organization.deleted` **locks** the org (`deletedAt`): data kept, API tokens rejected, no external scans, hidden from the dashboard. Never cascade-delete from a webhook.
- Email templates: `clerk/emails/*.html` (Handlebars: `{{otp_code}}`, `{{requested_from}}`, `{{requested_at}}`, `{{current_year}}`), pushed with `CLERK_SECRET_KEY=… clerk/apply-email-templates.sh`. Not part of the deploy, and custom templates need a paid Clerk plan.
- Never call `auth()`/`currentUser()` directly for app authorisation — go through `getCurrentUser()` so the local user id is used.

### Data Layer

Two Prisma clients:

1. **Main DB** (`src/lib/prisma.ts`) — PostgreSQL via `DATABASE_URL`. Holds users, orgs, profiles, targets, API tokens.
2. **Scanner DB** (`src/lib/scanner-db.ts`) — TimescaleDB via `SCANNER_DATABASE_URL`. Read-only, holds `scan_results`. Returns `null` if env var not set (safe in dev).

`scan_results` schema: `time, host, port, status, type, scanner, samma_id, tags, raw (jsonb)`

Join key: `Target.id` (main DB) = `scan_results.samma_id` (scanner DB).

### Operator Integration

When a target is created (UI or API), `src/lib/operator.ts` calls the Kubernetes operator's Flask API (`PUT {OPERATOR_API_URL}/target`) to deploy Scanner CRDs. The call is awaited and the result updates `Target.scannerStatus`:

- Operator returns 2xx/207 → `scannerStatus = DEPLOYED`
- Failure or `OPERATOR_API_URL` not set → `scannerStatus = READY_TO_DEPLOY`

Payload sent to operator:
```json
{
  "target": "<target value>",
  "samma_io_id": "<target ID>",
  "profile": "detect | all",
  "samma_io_tags": "samma,<profileId>",
  "samma_io_json": "{\"profileId\": \"<profileId>\"}"
}
```

Profile mapping: `SMALL` → `"detect"`, `FULL` → `"all"`.

#### Connected clusters

An `/api/v1` call carrying `X-Samma-Cluster: <name>` (and optionally `X-Samma-Version`) upserts a `Cluster` (`organisationId`, `name` unique) and moves its `lastSeenAt`. `authenticateApiToken` does this for every token, read-only included, and hands routes `clusterId` (a promise). POST/PUT `/api/v1/targets` store it on new targets, and PUT claims an existing target that has none. Status is derived on read: `clusterStatus()` in `src/lib/clusters.ts` (Ready within `READY_WINDOW_MS`, 15 min). The operator and collector send the header when the Helm chart's `clusterName` is set. An invalid name is ignored.

## External scanner runs

`src/lib/external-scans.ts`. A target added (dashboard or API POST/PUT) to a profile with external scanners enabled, or **Rescan** on the target page (`rescanExternal` action), calls `POST {apiUrl}/scans` with the connection's decrypted key (`src/lib/external-scanner-client.ts`) and stores an `ExternalScanRun` with the scanner's uuid. LOCAL targets are never sent. Results are pulled, not pushed: opening `/dashboard/scanners` or a target page runs `refreshExternalScans()`, which `GET`s `{apiUrl}/scans/<uuid>` for RUNNING runs (at most every 5 s; 24 h → FAILED). Only `application/json` results are accepted (1 MB cap); `formatExternalResult()` is the one place the format is read (a `findings` array becomes a table, anything else is shown as raw JSON). Only COMPLETED runs are charged. The scanner itself is `samma-io/external-scanner`.

`GET /api/v1/targets/<id>/results` also returns the latest finished external run per connection (`src/lib/external-results.ts`) as scanner `external:<catalog id>` (outcome `succeeded`/`failed`, partner `detail` in `evidence`, which the collector never logs), and refreshes the target's running runs first, so the operator's collector brings partner results into the cluster without anyone opening the dashboard. With no scanner DB it still answers with the external part.

## Target Status Fields

`Target` model has two status fields:
- `scannerStatus: ScannerStatus` — `READY_TO_DEPLOY` | `DEPLOYED`
- `reachabilityStatus: ReachabilityStatus` — `UP` | `DOWN` | `UNKNOWN`. Set when a target is added (dashboard `addTarget`, API POST/PUT): `checkReachability()` in `src/lib/reachability.ts` tries a TCP handshake to the target's port, or 443 and 80, on the addresses it resolved itself (3 s timeout, nothing sent or read). Any connect is `UP`, none is `DOWN`. A LOCAL target (private or unresolvable, `isLocalTarget`) is stored as `DOWN` without a connection and gets no scanners; the dashboard shows it as "Not scanned · Unreachable" (`src/lib/target-labels.ts`). The samma operator registers such Ingress hosts on purpose, so a cluster's inventory is complete. The schema default `UP` only applies to older rows; nothing re-checks yet.

## Metrics and health

Prometheus metrics with `prom-client`, code in `src/lib/metrics/`:

- `GET /api/metrics` — scraped on the pod IP by the PodMonitor in `chart/templates/podmonitor.yaml`. It answers 404 unless the request is addressed to an IP or `localhost`, so it is not reachable on the public hostnames.
- `GET /api/health` (liveness, no database) and `GET /api/ready` (readiness, `SELECT 1` on the app database). `src/middleware.ts` answers these three paths without Clerk.
- `registry.ts` — one registry on `globalThis`; create metrics only through its `counter()` / `gauge()` / `histogram()` helpers.
- `instrument.ts` — `withMetrics(routeTemplate, handler)` for route handlers, `timed(dependency, op, fn)` for outbound calls, and the event counters. A new `/api` route should be exported through `withMetrics`.
- Users: `User.createdAt` and `User.lastSeenAt` (moved by `getCurrentUser()` at most every 5 minutes) feed `samma_app_users_new` / `samma_app_users_active`. `samma_app_signups_total` and `samma_app_logins_total` count Clerk `user.created` / `session.created` webhook events, which must be enabled on the webhook endpoint in Clerk.
- `business.ts` — `samma_app_*` gauges from the app database and `scan_results`, refreshed at most once a minute. `samma_app_business_metrics_up{db}` is 0 when a database cannot be read.

**Labels are fixed, small sets. Never put an organisation, user, target, token or finding in a label**: metrics leave the app's access control. Queries on `scan_results` must be time-bounded.

### Component Organization

- `src/components/ui/` — Reusable primitives (Button, Card, Badge, StatCard) built with CVA + `cn()` utility
- `src/components/layout/` — Navbar (responsive, auth-aware) and Footer
- `src/components/dashboard/` — Dashboard-specific components (forms, buttons, accordion)

### Utilities

- `src/lib/utils.ts` — `cn()` (clsx + tailwind-merge), `formatDate()`, `severityColor()`, `statusColor()`
- `src/lib/token.ts` — `generateToken()` and `hashToken()` for API tokens (SHA-256)

## Styling Conventions

- Path alias: `@/*` maps to `src/*`
- Use `cn()` from `@/lib/utils` for conditional class composition
- Brand colors defined as CSS variables in `globals.css`: `samma-navy`, `samma-lavender`, `samma-gold`
- Fonts: Geist and Geist Mono loaded via `next/font/google`
- Interactive components require `"use client"` directive

## Database Migrations

Run migrations from the **host machine** (not inside the container), pointing at the exposed postgres port:

```bash
DATABASE_URL="postgresql://samma:samma@localhost:5432/samma" \
  npx prisma migrate dev --name <descriptive-name>
```

The container uses hostname `postgres` (docker-compose service name). The host uses `localhost:5432` (exposed port).

## Product Context

Samma.io is a Kubernetes-native security scanning platform. The frontend serves as both a marketing site and operational dashboard for multi-scanner orchestration (Nmap, Nikto, Tsunami, DNSRecon, HTTP headers, TLS). Results flow from scanner jobs → NATS → TimescaleDB → Samma dashboard.
