# Samma.io — Security Scanning Dashboard

Samma.io is a Kubernetes-native security scanning platform. This repository contains the Next.js web application that serves as the operational dashboard for managing scan targets, viewing scan results, and administering organisations.

## Getting Started

**Always use Docker Compose** — the app requires PostgreSQL.

```bash
# Start app + postgres, rebuild on code changes
docker compose up --build -d

# View logs
docker compose logs -f samma-web

# Run database migrations (from host, not inside container)
DATABASE_URL="postgresql://samma:samma@localhost:5432/samma" \
  npx prisma migrate dev --name <migration-name>

# Stop everything
docker compose down
```

## Environment Variables

Copy `.env.example` to `.env` and fill in the values:

| Variable | Description |
|---|---|
| `DATABASE_URL` | Main PostgreSQL connection string |
| `SCANNER_DATABASE_URL` | Scanner results TimescaleDB connection string |
| `NEXTAUTH_URL` | Public URL of the app |
| `NEXTAUTH_SECRET` | Random secret for session signing |
| `EMAIL_SERVER_HOST` | SMTP host for magic link emails |
| `EMAIL_SERVER_PORT` | SMTP port |
| `EMAIL_SERVER_USER` | SMTP username |
| `EMAIL_SERVER_PASSWORD` | SMTP password |
| `EMAIL_FROM` | From address for magic link emails |
| `OPERATOR_API_URL` | URL of the Kubernetes operator Flask API |
| `OPERATOR_API_TOKEN` | Bearer token sent on every operator API request — shared secret with the operator, server-side only (required whenever `OPERATOR_API_URL` is set) |

## Architecture

### Tech Stack

- **Next.js 16** — App Router, React Server Components
- **React 19** — TypeScript strict mode
- **Tailwind CSS 4** — PostCSS plugin
- **NextAuth v4** — Email magic link authentication, PrismaAdapter
- **Prisma ORM** — PostgreSQL (main DB) + TimescaleDB (scanner results)
- **lucide-react** — Icons

### Key Routes

| Route | Description |
|---|---|
| `/` | Marketing landing page |
| `/sign-in` | Magic link sign-in |
| `/dashboard` | Main dashboard |
| `/dashboard/profiles` | Scan profiles list |
| `/dashboard/profiles/[id]` | Profile detail — targets table |
| `/dashboard/profiles/[id]/targets/[targetId]` | Target detail + scan results |
| `/dashboard/tokens` | API token management |
| `/dashboard/org/new` | Create first organisation |

### Data Flow

```
User adds target
  → Samma DB (Target record)
  → Operator API PUT /target
    → Kubernetes Scanner CRDs
      → Scanner jobs run
        → Results stored in TimescaleDB (scan_results)
          → Dashboard reads via SCANNER_DATABASE_URL
```

The join key between the two databases is `Target.id` (Samma DB) = `scan_results.samma_id` (TimescaleDB).

### Key Files

| File | Description |
|---|---|
| `src/lib/auth.ts` | NextAuth config |
| `src/lib/org.ts` | Organisation helpers (`getActiveOrg`) |
| `src/lib/operator.ts` | Operator API integration |
| `src/lib/scanner-db.ts` | Lazy Prisma client for scanner TimescaleDB |
| `src/lib/prisma.ts` | Main Prisma client |
| `src/app/dashboard/actions.ts` | Server actions (targets, profiles, tokens, orgs) |
| `src/app/api/v1/targets/route.ts` | REST API for external target ingestion |
| `prisma/schema.prisma` | Full database schema |

### Multi-tenancy

Organisations → OrgMembership → Users. The active organisation is stored in an `active-org-id` httpOnly cookie. All data (profiles, targets, tokens) is scoped to an organisation.

### Scan Profiles

Each organisation has scan profiles (`SMALL` or `FULL`). A default `SMALL` profile is created automatically with each new organisation.

- `SMALL` → operator profile `detect` (port, DNS, HTTP headers, TLS scanners)
- `FULL` → operator profile `all` (detect + classic scanners)

### Target Status Fields

Each target tracks two status fields:

- `scannerStatus` — `READY_TO_DEPLOY` or `DEPLOYED` (set after successful operator call)
- `reachabilityStatus` — `UP`, `DOWN`, or `UNKNOWN` (updated by future cron job)

## Production Deployment (Kubernetes)

Managed by ArgoCD from `git@github.com:samma-io/deploy.git` (path `app/deploy.yaml`, namespace `samma`).

CI builds `ghcr.io/samma-io/app:sha-<7chars>` on every push to `main` and commits a re-rendered `deploy.yaml` to the deploy repo. ArgoCD auto-syncs.

### Required Secret — `samma-app-secrets`

Must be created manually (not managed by Helm):

```bash
kubectl create secret generic samma-app-secrets -n samma \
  --from-literal=NEXTAUTH_URL="https://samma.io" \
  --from-literal=NEXTAUTH_SECRET="$(openssl rand -base64 32)" \
  --from-literal=EMAIL_SERVER_HOST="postfix-internal.hrb.svc" \
  --from-literal=EMAIL_SERVER_PORT="25" \
  --from-literal=EMAIL_SERVER_USER="mahe@hacking.robots.beer" \
  --from-literal=EMAIL_SERVER_PASSWORD="<password>" \
  --from-literal=EMAIL_FROM="Samma.io <noreply@samma.io>" \
  --from-literal=EMAIL_SERVER_SECURE="false" \
  --from-literal=EMAIL_TLS_REJECT_UNAUTHORIZED="false" \
  --from-literal=SCANNER_DATABASE_URL="postgresql://samma:<timescaledb-password>@timescaledb.samma-io.svc:5432/samma" \
  --from-literal=OPERATOR_API_URL="http://api.samma-io.svc:8080" \
  --from-literal=OPERATOR_API_TOKEN="<operator-api-token>"
```

Replace `<timescaledb-password>` with the password from the operator chart's TimescaleDB Secret (key `password`), which you set via the chart values `timescaledb.password` or point at with `timescaledb.existingSecret`.

`DATABASE_URL` is injected automatically from the CNPG-generated secret `samma-pg-app`.

### Operator API Bearer Token

`OPERATOR_API_TOKEN` is the bearer token the app sends on every request to the operator API (`PUT /target` to register scanners, `DELETE /target` to remove them). If `OPERATOR_API_URL` is set without `OPERATOR_API_TOKEN`, target create/delete fails immediately with an error naming the missing variable — the app never sends an unauthenticated request to the operator.

**Coordinated rollout:** the same token value must be deployed on the operator chart (`api.token`, or the secret referenced by `api.existingSecret`) and on the app via `samma-app-secrets` in one rollout. This app change can ship before the operator starts enforcing authentication — an operator that does not check the token ignores the extra header — but once `OPERATOR_API_TOKEN` is required on the app, both sides must carry the same value.

**Storage:** the token lives only in the `OPERATOR_API_TOKEN` env var (from the hand-created `samma-app-secrets` cluster secret) — it is never committed to git, never logged, and never sent to the client (server-only, no `NEXT_PUBLIC_` prefix).

### SMTP

`EMAIL_SERVER_SECURE` and `EMAIL_TLS_REJECT_UNAUTHORIZED` control TLS behaviour at runtime via the secret — no code change needed to switch relay settings.

### CloudNativePG — Known Gotchas

The `timescale/timescaledb-ha` image uses **UID/GID 1000**. The Helm chart sets `postgresUID: 1000` / `postgresGID: 1000` accordingly. Using the CNPG default of 70 causes `permission denied` during initdb.

TimescaleDB must be listed under `spec.postgresql.shared_preload_libraries` (not `spec.postgresql.parameters`) — the CNPG webhook rejects it in the parameters map.

## REST API

Targets can be added programmatically using an API token:

```bash
# Create target (POST — always creates)
curl -X POST https://your-domain/api/v1/targets \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"value": "192.168.1.1", "type": "ip", "profileId": "<optional>"}'

# Upsert target (PUT — returns 202 if already exists)
curl -X PUT https://your-domain/api/v1/targets \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"value": "example.com", "type": "dns"}'
```

Manage API tokens at `/dashboard/tokens`.
