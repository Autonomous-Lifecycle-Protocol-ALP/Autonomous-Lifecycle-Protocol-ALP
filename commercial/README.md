# ALP Enterprise Commercial

Commercial dashboard and backend for the Autonomous Lifecycle Protocol, demonstrating how companies save $1,400+ per employee annually.

## Structure

```
commercial/
├── BUSINESS_PLAN.md      # Full business plan with ROI analysis
├── alp-server/           # Express + MongoDB backend
│   ├── server.js          # Express API server
│   ├── models/Models.js   # Mongoose schemas
│   ├── controllers/       # Business logic
│   ├── routes/            # API routes
│   ├── scripts/seed.js    # Seed data
│   └── .env               # Environment config
└── enterprise-app/        # React + Vite frontend
    ├── src/
    │   ├── pages/          # Login, Dashboard, Workspaces, Savings, Billing
    │   ├── components/     # Layout
    │   ├── hooks/          # Auth context
    │   └── utils/          # API client
    ├── index.html
    ├── App.jsx
    ├── vite.config.js
    ├── tailwind.config.js
    └── package.json
```

## Quick Start

### Server
```bash
cd alp-server
npm install
cp .env.example .env  # or use existing .env
npm run dev           # nodemon
# or: npm start
```

### Client
```bash
cd enterprise-app
npm install
npm run dev
```

### Seed Data
```bash
cd alp-server
npm install
node scripts/seed.js
# Login: demo@alp-enterprise.com / demo123
```

## Savings Calculator

The dashboard includes a live savings calculator that projects annual savings:
- **LLM API Cost Reduction**: 78% token savings ($3,089/dev/year)
- **Time Savings**: 80x faster context compilation ($50/dev/year)
- **Rework Avoidance**: 35.2% fewer task failures ($40,209/dev/year)

**Total: $43,349 per developer annually** — far exceeding the $1,400 threshold.
