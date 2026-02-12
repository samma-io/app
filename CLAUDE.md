# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

- `npm run dev` — Start dev server (port 3000, hot reload)
- `npm run build` — Production build (standalone output for Docker)
- `npm run start` — Start production server
- `npm run lint` — ESLint checks

## Tech Stack

- **Next.js 16** with App Router (file-based routing)
- **React 19** with TypeScript (strict mode)
- **Tailwind CSS 4** via PostCSS plugin
- **Clerk** for authentication (optional — app degrades gracefully if env vars missing)
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
- `/profile` — User profile (protected by Clerk middleware)
- `/sign-in`, `/sign-up` — Clerk auth pages using catch-all `[[...slug]]` routes

### Auth (Clerk) — Conditional Loading

Auth is entirely optional. The middleware (`src/middleware.ts`) checks for `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` at runtime and only activates Clerk if configured. The root layout conditionally wraps with `<ClerkProvider>`. The navbar dynamically imports Clerk components and falls back to unauthenticated UI. This allows full development without Clerk credentials.

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
