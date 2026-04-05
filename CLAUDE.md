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

# Run Prisma migrations inside the running container
docker compose exec samma-web npx prisma migrate deploy

# Stop everything
docker compose down
```

- `npm run build` — Production build (standalone output for Docker)
- `npm run lint` — ESLint checks

> Do NOT use `npm run dev` or `npm run start` directly — the app needs the `postgres` service from docker-compose, and `DATABASE_URL` in `.env.local` points to the `postgres` hostname (not `localhost`).

## Tech Stack

- **Next.js 16** with App Router (file-based routing)
- **React 19** with TypeScript (strict mode)
- **Tailwind CSS 4** via PostCSS plugin
- **NextAuth v4** for authentication (email magic links via SMTP, PrismaAdapter)
- **Recharts** for data visualization
- **class-variance-authority (CVA)** for component variants
- **lucide-react** for icons

## Architecture

### Routing & Pages

All routes use the Next.js App Router under `src/app/`. Key routes:

- `/` — Marketing/hero landing page
- `/scanners` — Scanner management dashboard (shows scanner status, scan results)
- `/siem` — SIEM dashboard (rules, alerts, log sources, charts)
- `/about` — Product capabilities page
- `/profile` — User profile (protected by middleware)
- `/sign-in` — Magic link email form (NextAuth)
- `/dashboard/org/new` — Create first organisation (redirected here on first sign-in)

### Auth (NextAuth — Magic Links)

NextAuth v4 with the PrismaAdapter handles authentication. Users sign in via email magic links (SMTP required). First sign-in auto-creates the user record.

- `src/lib/auth.ts` — NextAuth config (EmailProvider, session callback adds `user.id`)
- `src/app/api/auth/[...nextauth]/route.ts` — NextAuth App Router handler
- `src/lib/org.ts` — `getActiveOrg()` reads `active-org-id` cookie; `getUserOrgs()` lists memberships
- `src/middleware.ts` — `withAuth` protects `/dashboard` and `/profile` routes
- Sign-in flow: `/sign-in` → magic link email → session → `/dashboard`
- First sign-in: no orgs → redirect `/dashboard/org/new` → create org → dashboard

### Component Organization

- `src/components/ui/` — Reusable primitives (Button, Card, Badge, StatCard) built with CVA + `cn()` utility
- `src/components/layout/` — Navbar (responsive, auth-aware) and Footer
- `src/components/siem/` — Feature-specific components (charts)

### Data Layer

Currently uses mock data files in `src/data/` with TypeScript interfaces. Data types include scanners (nmap, nikto, tsunami, dnsrecon), SIEM rules with compliance mappings, alerts with severity levels, and log source/destination configurations.

### Utilities

- `src/lib/utils.ts` — `cn()` (clsx + tailwind-merge), `formatDate()`, `severityColor()`, `statusColor()`
- `src/lib/constants.ts` — Site metadata, `NAV_LINKS`, `SCANNER_TYPES`

## Styling Conventions

- Path alias: `@/*` maps to `src/*`
- Use `cn()` from `@/lib/utils` for conditional class composition
- Brand colors defined as CSS variables in `globals.css`: `samma-navy`, `samma-lavender`, `samma-gold`
- Severity colors: `severity-critical` (red), `severity-high` (orange), `severity-medium` (amber), `severity-low` (green), `severity-info` (blue)
- Fonts: Geist and Geist Mono loaded via `next/font/google`
- Interactive components require `"use client"` directive

## Product Context

Samma.io is a Kubernetes-native security scanning platform. The frontend serves as both a marketing site and operational dashboard for multi-scanner orchestration (Nmap, Nikto, Tsunami, DNSRecon), a SIEM rule engine with NATS-based event streaming, and compliance tracking across PCI-DSS, GDPR, HIPAA, NIST 800-53, and MITRE ATT&CK frameworks.
