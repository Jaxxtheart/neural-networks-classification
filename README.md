# Etihuku — AI Data Operations Platform

Enterprise DataOps-as-a-Service for Telecommunications, Security, Mining, and Engineering.

## Quick Start

```bash
cd apps/web
npm install        # or: pnpm install
npm run dev        # → http://localhost:3000
```

The root page redirects to `/overview` (dashboard). The login page is at `/login`.

## Project Structure

```
apps/web/
├── app/
│   ├── (auth)/login/        # Login page with email + Google/Azure SSO
│   ├── (dashboard)/         # Authenticated layout (sidebar + topbar)
│   │   ├── layout.tsx       # Dashboard shell
│   │   ├── overview/        # Home dashboard ← START HERE
│   │   ├── datasets/
│   │   ├── pipelines/
│   │   ├── quality/
│   │   ├── annotations/
│   │   ├── monitoring/
│   │   ├── connectors/
│   │   ├── catalog/
│   │   ├── governance/
│   │   └── settings/
│   ├── globals.css          # Etihuku design tokens + component classes
│   └── layout.tsx           # Root layout (fonts, metadata)
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx              # Collapsible sidebar + vertical selector
│   │   ├── TopBar.tsx               # Search + notifications + user menu
│   │   └── DashboardLayoutClient.tsx
│   ├── dashboard/
│   │   ├── MetricCard.tsx           # KPI card with sparkline
│   │   ├── VerticalBreakdownCard.tsx
│   │   ├── RecentPipelinesTable.tsx
│   │   └── DriftAlertsList.tsx
│   └── shared/
│       ├── StatusBadge.tsx          # success/running/failed/warning/draft
│       └── QualityScore.tsx         # SVG circular ring, color-coded
├── lib/
│   ├── stores/ui.store.ts   # Zustand: sidebar state, active vertical
│   └── utils/
│       ├── cn.ts            # clsx + tailwind-merge
│       └── format.ts        # SA-context formatters (ZAR, SAST, DD/MM/YYYY)
├── tailwind.config.ts       # Full Etihuku design token mapping
└── package.json
```

## Design System

| Token | Value |
|---|---|
| Primary | `#5046E5` (Etihuku Indigo) |
| Gold accent | `#D1A039` |
| Background | `#0F0F1A` |
| Surface | `#1A1A2E` / `#2D2D44` |
| Display font | Sora |
| Body font | Inter |
| Mono font | JetBrains Mono |

See `app/globals.css` for the full token set as CSS variables.

## Tech Stack

- **Next.js 14** (App Router) + TypeScript strict
- **Tailwind CSS** + shadcn/ui (themed)
- **Zustand** (client state) · **TanStack Query** (server state)
- **Recharts** (sparklines/charts) · **TanStack Table** (data grids)
- **Lucide React** (icons)
