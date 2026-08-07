# ALP Enterprise Server

Express + Socket.IO backend for the ALP Enterprise platform.

## Prerequisites

- Node.js >= 18
- MongoDB (local or Atlas)

## Setup

```bash
cp .env.example .env
npm install
```

## Run

```bash
# In-memory MongoDB with seeded demo data
npm run dev:mongo

# Real MongoDB (requires MONGO_URI in .env)
npm run dev
```

## Seed

```bash
npm run seed
```

## API Routes

| Route | Description |
|-------|-------------|
| `GET /health` | Health check |
| `POST /api/auth/register` | Register user |
| `POST /api/auth/login` | Login |
| `GET /api/organizations` | List organizations |
| `GET /api/workspaces` | List workspaces |
| `GET /api/metrics/savings` | API cost savings metrics |
| `GET /api/billing/subscription` | Current subscription |
| `POST /api/billing/checkout` | Create checkout session |
| `GET /api/ide/workspaces/:id/files` | Workspace file tree |
| `GET /api/platform/status` | Platform status |

## Demo Credentials

- Email: `demo@alp-enterprise.com`
- Password: `demo123`

## Environment

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5000` | Server port |
| `MONGO_URI` | `mongodb://localhost:27017/alp-enterprise` | MongoDB connection |
| `JWT_SECRET` | `dev-jwt-secret` | JWT signing secret |
| `FRONTEND_URL` | `http://localhost:5174` | CORS allowed origin |
| `STRIPE_SECRET_KEY` | — | Stripe secret key |

## Socket.IO

WebSocket server is mounted on the same HTTP server. Client connection:

```js
const socket = io('http://localhost:5000');
```
