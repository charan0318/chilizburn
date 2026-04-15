# ChilizBurn.info

> **Real-time transparency for CHZ burns** — the default analytics layer for Chiliz ecosystem token burn tracking, built for accuracy and accessibility.

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Latest-336791?logo=postgresql)](https://www.postgresql.org)
[![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000000?logo=vercel)](https://vercel.com)
[![License](https://img.shields.io/badge/License-MIT-green)](./LICENSE)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [Development](#-development)
- [Deployment](#-deployment)
- [Architecture](#-architecture)
- [Data Pipeline](#-data-pipeline)
- [API Reference](#-api-reference)
- [Environment Variables](#-environment-variables)
- [Database](#-database)
- [Scripts](#-scripts)
- [Contributing](#-contributing)

---

## Overview

ChilizBurn.info is a production-grade transparency platform that tracks, visualizes, and reports on all CHZ token burns on the Chiliz Chain. Built for traders, analysts, and sports fan community members, it provides real-time data ingestion, historical analytics, and verifiable on-chain transparency.

**What's a burn?** A CHZ transfer to the zero address (`0x0000...0000`), permanently removing tokens from circulation.

**Why it matters:**
- 50%+ of token holders care about supply dynamics
- Transparency builds ecosystem trust
- Verifiable on-chain data beats spreadsheets
- Foundation for predictive tokenomics models

---

## ✨ Features

### Core Analytics
- **Real-time Burn Tracking** — Automatic detection and ingestion every 10 minutes via Vercel Crons
- **KPI Dashboard** — Total burned, latest amount, monthly totals, percentage of supply
- **Interactive Charts** — Cumulative burn timeline, monthly burn volume, burn vs. price correlation
- **Burn Feed** — Sortable, paginated transaction history with live USD valuations
- **Transaction Details** — Full on-chain data: hash, block, timestamp, gas fees, types

### Data Quality
- **Duplicate Detection** — Unique upserts prevent redundant records
- **Failed TX Filtering** — Skips errored transactions automatically
- **API Resilience** — Exponential backoff and retry on rate limits
- **Atomic Operations** — Prisma transactions ensure consistency
- **Historical Pricing** — Daily CHZ/USD valuations from CoinGecko

### Architecture
- **Type-Safe** — Full TypeScript coverage, strict mode enabled
- **Database Indexed** — Fast queries on `timestamp`, `block_number`, `burn_type`
- **Scalable Ingestion** — Handles paginated Blockscout API with configurable batch sizes
- **Edge-Ready** — Deployed on Vercel with serverless functions and cron jobs

---

## 🛠 Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend** | Next.js (App Router) | 16.2.3 |
| **Styling** | Tailwind CSS + PostCSS | ^4 |
| **Database** | PostgreSQL (Supabase) | Latest |
| **ORM** | Prisma | 7.7.0 |
| **Charts** | Recharts | 3.8.1 |
| **Language** | TypeScript | 5 |
| **Runtime** | Node.js | 18+ |
| **Deployment** | Vercel | - |

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ and npm
- **PostgreSQL** 12+ or Supabase account
- **Git**

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/chilizburn.git
cd chilizburn

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your DATABASE_URL, DIRECT_URL, and API keys
```

### Local Development

```bash
# Generate Prisma client
npm run prisma:generate

# Create/apply database migrations
npm run prisma:migrate

# Start development server (http://localhost:3000)
npm run dev
```

### Test Data Ingestion (Optional)

```bash
# Dry run: validate pipeline without writing
npm run burns:ingest:dry

# Live run: fetch and store burns
npm run burns:ingest
```

---

## 👨‍💻 Development

### Directory Structure

```
chilizburn/
├── app/                    # Next.js app directory (pages + API routes)
│   ├── (routes)/          # Public pages
│   ├── api/               # API endpoints
│   │   ├── burns/        # Burn data endpoints
│   │   ├── charts/       # Chart data aggregation
│   │   └── internal/     # Protected ingestion endpoints
│   └── layout.tsx        # Root layout
├── components/            # React components
│   ├── charts/           # Chart wrappers
│   ├── layout/           # Layout components (navbar, etc)
│   └── ui/               # Base UI primitives (card, table, etc)
├── lib/                   # Utilities and helpers
│   ├── cache.ts          # Caching layer
│   ├── constants.ts      # Configuration
│   ├── prisma.ts         # Prisma client singleton
│   └── utils.ts          # Helper functions
├── services/              # Business logic
│   └── burns.ts          # Burn ingestion & queries
├── prisma/               # Database
│   └── schema.prisma     # Data models
├── scripts/              # Workers & maintenance
│   ├── ingest-burns.mjs  # One-off ingestion script
│   └── cron-burns.mjs    # Background cron job
├── types/                # TypeScript types
│   └── burn.ts           # Burn domain types
└── styles/               # Global styles & themes
```

### Development Workflow

```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Open Prisma Studio (inspect/edit database live)
npm run prisma:studio

# Format with Prettier (configure in package.json)
npm run format
```

### Code Conventions

- **Component Structure**: One component per file, named exports
- **Type Safety**: Strict TypeScript, no `any` types
- **Naming**: camelCase for functions/variables, PascalCase for components
- **API Routes**: RESTful conventions, proper HTTP status codes
- **Database**: Always use Prisma for queries, leverage migrations

---

## 🌐 Deployment

### Vercel (Production)

#### 1. Create Supabase Project
```bash
# Get these from Supabase dashboard
ANON_KEY=
POOLING_URL=postgresql://...@...pool.supabase.com:6543/postgres
DIRECT_URL=postgresql://...@...supabase.com:5432/postgres
```

**Important:** For Supabase URLs, append:
```
?uselibpqcompat=true&sslmode=require
```

#### 2. Set Vercel Environment Variables

Go to **Project Settings → Environment Variables**:

| Variable | Value | Example |
|----------|-------|---------|
| `DATABASE_URL` | Supabase pooled URL (port 6543) | `postgresql://...pool.supabase.com:6543/postgres?...` |
| `DIRECT_URL` | Supabase direct URL (port 5432) | `postgresql://...supabase.com:5432/postgres?...` |
| `INGESTION_CRON_SECRET` | Strong random string (for auth) | `super_secret_key_min_32_chars` |
| `CHILIZ_BLOCKSCOUT_API_URL` | Block explorer API | `https://scan-api.chiliz.com/api` |

#### 3. Deploy & Migrate

```bash
# Trigger deployment
git push origin main

# After deployment, run production migrations
npm run prisma:migrate:deploy
```

#### 4. Verify Cron Job

Vercel will automatically run `/api/internal/ingest/burns` every 10 minutes (configured in `vercel.json`).

Check logs:
```bash
vercel logs --follow
```

---

## 🏗 Architecture

### Data Flow

```
Blockscout API
      ↓ (paginated txlist/tokentx)
Ingestion Worker (ingest-burns.mjs or cron)
      ↓ (filter, decode, fetch prices)
PostgreSQL via Prisma
      ↓ (indexed by timestamp, block, type)
API Endpoints (/api/burns, /api/charts, /api/stats)
      ↓ (cached, aggregated)
React Frontend (charts, tables, KPIs)
```

### Error Handling

| Scenario | Handling |
|----------|----------|
| **API Rate Limit (429)** | Exponential backoff: 1s → 2s → 4s → 8s |
| **Failed Transactions** | Skipped via `isError` flag & status code checks |
| **Duplicate Burns** | Handled by `txHash` unique constraint (upsert) |
| **Missing Prices** | Gracefully null; frontend shows "N/A" |
| **Network Errors** | Retry with jitter; log to monitoring service |

### Performance

- **Database Indexes:** `timestamp`, `blockNumber`, `burnType` for fast queries
- **Caching:** Response caching on API routes (configurable TTL)
- **Pagination:** 50 items per page default, cursor-based for large datasets
- **Batch Ingestion:** Configurable page size (default 1000 txs per request)

---

## 📊 Data Pipeline

### Burn Definition

A CHZ burn is strictly defined as:
```typescript
transfer.to === "0x0000000000000000000000000000000000000000" // Zero address
```

### Ingestion Process

**Step 1: Fetch** (`BURN_BLOCKSCOUT_ACTION`)
```bash
# Option A: Native transfers (ETH sends)
GET /api?action=txlist&address=...

# Option B: Token transfers (ERC-20 style)
GET /api?action=tokentx&contractaddress=CHZ_TOKEN_ADDRESS&address=...
```

**Step 2: Filter**
- Remove failed transactions (`isError=0`, `txreceipt_status=1`)
- Match receiver: `to === "0x0000...0000"`
- Enforce non-zero amounts

**Step 3: Normalize**
```
Raw Amount: 123456789012345678
Decimals: 18
Normalized: 123.456789012345678 CHZ
```

**Step 4: Enrich**
```javascript
{
  timestamp: "2026-04-15T08:30:00Z",
  amountChz: 123.456789,
  usdValue: 123.456789 * pricePerCHZ,
  burnType: "TOKEN_BURN" // or TREASURY_BURN, MANUAL_BURN
}
```

**Step 5: Persist**
```sql
INSERT INTO burns (tx_hash, amount_chz, timestamp, ...)
VALUES (...)
ON CONFLICT (tx_hash) DO UPDATE SET amount_chz = ...;
```

### API Standards

- Fetch endpoint: Blockscout (maintained by Chiliz Chain team)
- Pricing: CoinGecko (free tier, unlimited calls)
- Rate Limiting: 5 req/sec (Blockscout limit)

---

## 📡 API Reference

### Burn Endpoints

#### List All Burns (Paginated)
```bash
GET /api/burns?page=1&limit=50&sort=timestamp&order=desc
```

**Response:**
```json
{
  "data": [
    {
      "txHash": "0xabc...",
      "blockNumber": 12345,
      "timestamp": "2026-04-15T08:30:00Z",
      "amountChz": 1500.5,
      "usdValue": 2100.70,
      "burnType": "TOKEN_BURN"
    }
  ],
  "total": 5432,
  "page": 1,
  "pageSize": 50
}
```

#### Get Latest Burn
```bash
GET /api/burns/latest
```

#### Statistics & KPIs
```bash
GET /api/stats
```

**Response:**
```json
{
  "totalBurned": 45230000,
  "latestBurnAmount": 1500.5,
  "monthlyBurnTotal": 8930000,
  "burnCount": 5432,
  "percentOfSupplyBurned": 2.34
}
```

#### Chart Data
```bash
GET /api/charts
```

**Response:**
```json
{
  "cumulative": [
    { "date": "2026-01-01", "total": 100000 },
    { "date": "2026-01-02", "total": 105000 }
  ],
  "monthly": [
    { "month": "2026-01", "burned": 850000 }
  ],
  "burnVsPrice": [
    { "date": "2026-01-01", "burned": 50000, "price": 0.95 }
  ]
}
```

---

## 🔐 Environment Variables

Create a `.env.local` file in the root directory:

```env
# Database (choose one: Supabase or self-hosted Postgres)
DATABASE_URL=postgresql://user:password@host:6543/db?sslmode=require
DIRECT_URL=postgresql://user:password@host:5432/db?sslmode=require

# External APIs
CHILIZ_BLOCKSCOUT_API_URL=https://scan-api.chiliz.com/api
COINGECKO_API_URL=https://api.coingecko.com/api/v3

# Security (Cron job authentication)
INGESTION_CRON_SECRET=your_random_32_char_secret_key

# Environment
NODE_ENV=development
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**In Vercel:** Use the Vercel dashboard to set these per environment (preview, production).

---

## 💾 Database

### Schema Overview

```prisma
model Burn {
  id          BigInt   @id @default(autoincrement())
  txHash      String   @unique              // Block explorer link
  amountRaw   String                        // Raw wei/units
  amountChz   Decimal  @db.Decimal(30, 8)  // Normalized CHZ
  timestamp   DateTime                      // Block timestamp
  blockNumber Int                          // Block height
  fromAddress String                       // Sender
  usdValue    Decimal? @db.Decimal(30, 8) // Historical price
  burnType    BurnType                      // TOKEN_BURN, etc.
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([timestamp])
  @@index([blockNumber])
  @@index([burnType])
}
```

### Common Queries

```bash
# Create a new migration (after schema edit)
npm run prisma:migrate

# Apply migrations to production
npm run prisma:migrate:deploy

# Push schema without migrations (dev only)
npm run db:push

# Open browser UI to inspect/edit data
npm run prisma:studio
```

---

## 📜 Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start local dev server (port 3000) |
| `npm run build` | Build for production |
| `npm run start` | Run built app |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript compiler |
| `npm run prisma:generate` | Regenerate Prisma client |
| `npm run prisma:migrate` | Create and apply migration |
| `npm run prisma:migrate:deploy` | Apply production migrations |
| `npm run db:push` | Push schema (dev-only shortcut) |
| `npm run prisma:studio` | Open Prisma Studio UI |
| `npm run burns:ingest` | Fetch and store burns (one-off) |
| `npm run burns:ingest:dry` | Test pipeline without DB writes |
| `npm run burns:cron` | Start background cron scheduler |
| `npm run burns:trigger:local` | Trigger ingestion API locally |

---

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

1. **Fork & Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Commit Standards**
   - Use present tense: `Add burn detail page` not `Added...`
   - Reference issues: `Fix #123: Improve chart performance`

3. **Code Quality**
   - Run `npm run typecheck && npm run lint` before pushing
   - Write tests for new features
   - Update documentation

4. **Pull Request**
   - Describe what changed and why
   - Link related issues
   - Request review from maintainers

---

## 📄 License

MIT License — see [LICENSE](./LICENSE) for details.

---

## 🔗 Resources

- **Chiliz Chain:** https://chiliz.com
- **Block Explorer:** https://scan.chiliz.com
- **Blockscout API Docs:** https://docs.blockscout.com
- **Supabase Docs:** https://supabase.com/docs
- **Prisma Docs:** https://www.prisma.io/docs
- **Next.js Docs:** https://nextjs.org/docs

---

**Questions?** Open an issue or reach out to the team. We're building transparency, one burn at a time.
```

Cron every 10 minutes:

```bash
npm run burns:cron
```

Vercel cron:

- `vercel.json` schedules `GET /api/internal/ingest/burns` every 10 minutes.
- Endpoint requires `INGESTION_CRON_SECRET` in `Authorization: Bearer <secret>` or `x-cron-secret`.
- Manual test route: `GET /api/internal/ingest/burns?dryRun=1`

## Public API

### GET /api/burns

Query params:

- page: number (default 1)
- pageSize: number (default 20, max 100)
- sortBy: timestamp | amountChz | blockNumber (default timestamp)
- sortOrder: asc | desc (default desc)

Response shape:

```json
{
	"data": [
		{
			"txHash": "0x...",
			"blockNumber": 33056379,
			"timestamp": "2026-04-07T07:54:18.000Z",
			"from": "0x...",
			"to": "0x0000000000000000000000000000000000000000",
			"amountRaw": "9247244482348740000000000",
			"amountChz": 9247244.48234874,
			"usdValue": 392947.25,
			"gasFeeChz": 0,
			"burnType": "TOKEN_BURN"
		}
	],
	"total": 1234,
	"page": 1,
	"pageSize": 20
}
```

### GET /api/burns/latest

```json
{
	"data": {
		"txHash": "0x...",
		"amountChz": 9247244.48234874,
		"timestamp": "2026-04-07T07:54:18.000Z"
	}
}
```

### GET /api/stats

```json
{
	"data": {
		"totalBurned": 14329022.11,
		"monthlyBurnTotal": 9231001.55,
		"burnCount": 390,
		"latestBurnAmount": 9247244.48234874,
		"percentOfSupplyBurned": 0.16120155
	}
}
```

### GET /api/charts

```json
{
	"data": {
		"cumulative": [
			{ "date": "2026-04-01", "total": 1000.5 },
			{ "date": "2026-04-02", "total": 2001.75 }
		],
		"monthly": [
			{ "month": "2026-03", "burned": 511000.25 },
			{ "month": "2026-04", "burned": 9231001.55 }
		]
	}
}
```

## Project Structure

```text
app/
	api/
		burns/
		charts/
		stats/
	burns/
	tx/[hash]/
components/
	charts/
	layout/
	ui/
lib/
services/
prisma/
types/
styles/
scripts/
```

## Environment

See `.env.example` for required variables.
