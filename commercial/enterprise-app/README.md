# Enterprise App

React frontend for the ALP Enterprise platform.

## Prerequisites

- Node.js >= 18

## Setup

```bash
npm install
```

## Run

```bash
npm run dev
```

Dev server runs on `http://localhost:5174` and proxies `/api` to `http://localhost:5000`.

## Build

```bash
npm run build
npm run preview
```

## Routing

- `/` — Public home page
- `/login` — Login / registration (public)
- `/dashboard` — Dashboard overview (protected)
- `/workspaces` — Workspace list (protected)
- `/ide/:id` — Cloud IDE (protected)
- `/savings` — API cost savings (protected)
- `/billing` — Subscription management (protected)
- `/products` — Product catalog (protected)
- `/docs` — Documentation (protected)

## Environment

No required env vars. The Vite dev proxy handles API routing to the backend.

To point to a remote API in production, set `VITE_API_URL` and update `vite.config.js` proxy target.
