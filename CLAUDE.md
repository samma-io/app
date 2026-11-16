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
- **NextAuth v4** for authentication (email magic links via SMTP, PrismaAdapter)
- **Prisma ORM** — two clients: main PostgreSQL + scanner TimescaleDB
- **class-variance-authority (CVA)** for component variants
- **lucide-react** for icons

## Architecture

### Routing & Pages

All routes use the Next.js App Router under `src/app/`. Key routes:

- `/` — Marketing/hero landing page
- `/sign-in` — Magic link email form (NextAuth)
- `/dashboard` — Main dashboard (protected)
- `/dashboard/profiles` — Scan profiles list
- `/dashboard/profiles/[id]` — Profile detail with targets table
- `/dashboard/profiles/[id]/targets/[targetId]` — Target detail + scan results from TimescaleDB
- `/dashboard/clusters` — Connected clusters: name, Ready/Down (seen in the last 15 min), version, target count
- `/dashboard/tokens` — API token management
- `/dashboard/org/new` — Create first organisation (redirected here on first sign-in)

### Auth (NextAuth — Magic Links)

NextAuth v4 with PrismaAdapter. Users sign in via email magic links (SMTP required). First sign-in auto-creates the user record.

- `src/lib/auth.ts` — NextAuth config (EmailProvider, session callback, signIn event auto-creates org from `pendingOrgName`)
- `src/app/api/auth/[...nextauth]/route.ts` — NextAuth App Router handler
- `src/lib/org.ts` — `getActiveOrg()` reads `active-org-id` cookie; `getUserOrgs()` lists memberships
- `src/middleware.ts` — Cookie-presence check protects `/dashboard` and `/profile` routes; injects `x-pathname` header
- Sign-in flow: `/sign-in` → check if new user → `/onboarding` (new) or magic link (existing) → session → `/dashboard`
- First sign-in: no orgs → redirect `/dashboard/org/new` → create org → dashboard

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

## Target Status Fields

`Target` model has two status fields:
- `scannerStatus: ScannerStatus` — `READY_TO_DEPLOY` | `DEPLOYED`
- `reachabilityStatus: ReachabilityStatus` — `UP` | `DOWN` | `UNKNOWN`. Set when a target is added (dashboard `addTarget`, API POST/PUT): `checkReachability()` in `src/lib/reachability.ts` tries a TCP handshake to the target's port, or 443 and 80, on the addresses it resolved itself (3 s timeout, nothing sent or read). Any connect is `UP`, none is `DOWN`. A LOCAL target (private or unresolvable, `isLocalTarget`) is stored as `DOWN` without a connection and gets no scanners; the dashboard shows it as "Not scanned · Unreachable" (`src/lib/target-labels.ts`). The samma operator registers such Ingress hosts on purpose, so a cluster's inventory is complete. The schema default `UP` only applies to older rows; nothing re-checks yet.

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
