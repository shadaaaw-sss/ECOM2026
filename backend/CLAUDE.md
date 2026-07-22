# Makhmal Backend — CLAUDE.md

## Stack
- **Runtime**: Node.js (ESM via `"type": "module"`) + Express 4.21.1
- **Language**: TypeScript 5.6.3, run via `tsx` (dev) / compiled `tsc` (prod)
- **Database**: PostgreSQL with `pg` 8.11.0 (native pool, retry logic, health monitor)
- **Validation**: Zod 3.23.8 (schemas in `src/schemas/validation.ts`)
- **Auth**: bcryptjs 2.1.4 + jsonwebtoken 9.0.1 (JWT access/refresh tokens)
- **Media Storage**: S3-compatible (Supabase R2) via `@aws-sdk/client-s3`; Cloudflare Images as alternative provider
- **Image Processing**: sharp 0.33.0 + multer 1.4.1
- **Email**: nodemailer 6.10.1
- **Security**: helmet 8.0.1, cors 2.8.5, rate-limiter-flexible 5.0.0
- **Config**: dotenv 16.4.1 (env vars in `/backend/.env`)

## Project Structure
```
src/
  index.ts                 # Server entry: mounts routes, health checks, graceful shutdown
  db.ts                    # Pool with retry, query() helper, health monitor, error recovery
  init-db.ts               # Auto-create tables (CREATE TABLE IF NOT EXISTS) on startup
  config/
    index.ts               # Centralized typed config interface, reads all env vars
  middleware/
    auth.ts                # JWT verify middleware, requireAdmin, getUserRoleFromHeader
    error-handler.ts       # Global Express error handler
    validation.ts          # Zod-based validateBody/validateQuery/validateParams
    rate-limiter.ts        # Rate limiting with rate-limiter-flexible
  routes/
    auth.routes.ts         # POST login, register, forgot-password, reset-password, verify-email
    products.routes.ts     # CRUD + filtered listing with brand/category joins
    categories.routes.ts   # CRUD categories
    brands.routes.ts       # CRUD brands, brand detail with products + categories
    orders.routes.ts       # POST create (with stock decrement), GET list, PATCH status (+ stock revert)
    factures.routes.ts     # Cash-register invoices (manual sales)
    wishlist.routes.ts     # User wishlist items
    coupons.routes.ts      # Coupon CRUD
    shipping.routes.ts     # Shipping methods CRUD
    uploads.routes.ts      # File upload to S3/Cloudflare, signed URLs
    settings.routes.ts     # Key-value settings from `setting` table
    homepage-hero.routes.ts # Hero slides CRUD (images/videos, positions, links)
  schemas/
    validation.ts          # All Zod schemas (products, orders, auth, etc.)
  services/
    currency.service.ts    # Exchange rate fetching (open.er-api.com + ExchangeRate-API fallback)
    media.service.ts       # R2StorageService / CloudflareImagesService abstraction layer
  utils/
    email.ts               # Nodemailer email sender
  seed.ts                  # Destructive DROP + CREATE all tables + admin user
```

## Conventions
- **ESM**: all imports use `.js` extension (`import { x } from './db.js'`)
- **DB field naming**: snake_case in PostgreSQL, camelCase accepted via Zod transforms in API
- **Error handling**: `try/catch` in every route handler, 500 with `{ message }` on failure
- **Transactions**: `BEGIN`/`COMMIT`/`ROLLBACK` via `pool.connect()` + `client.query()` for order creation and status changes
- **Auth**: JWT payload `{ sub: userId, role: string }`, middleware adds `req.userId` / `req.userRole`
- **Validation**: Zod schemas validate request bodies before they reach route handlers

## Config (all via env vars)
| Env Var | Required | Default | Notes |
|---------|----------|---------|-------|
| `PORT` | No | 4000 | Railway injects dynamically |
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `JWT_SECRET` | Yes (prod) | — | Min 32 chars in production |
| `JWT_REFRESH_SECRET` | Yes (prod) | — | Min 32 chars in production |
| `STORAGE_PROVIDER` | No | `r2` | `r2` or `cloudflare-images` |
| `R2_ENDPOINT` | Conditional | — | Supabase S3 endpoint |
| `R2_ACCESS_KEY_ID` | Conditional | — | Supabase S3 access key |
| `R2_SECRET_ACCESS_KEY` | Conditional | — | Supabase S3 secret |
| `R2_BUCKET_NAME` | Conditional | — | Supabase bucket |
| `R2_PUBLIC_URL` | Conditional | — | Supabase public URL |
| `EXCHANGE_RATE_API_KEY` | No | — | Optional, fallback to open.er-api.com |
| `SMTP_HOST/SMTP_USER` | No | — | Email sending |
| `CORS_ORIGIN` | No | `localhost:3000,3001` | Comma-separated |
| `RAILWAY_PUBLIC_DOMAIN` | No | — | Railway production domain |

## Key Patterns
- **Auth optional on public routes**: `getUserRoleFromHeader()` reads token without failing
- **Admin endpoints**: `authMiddleware` + `requireAdmin` middleware chained
- **Stock management**: decremented on order creation, incremented on cancellation/refund
- **Product listing**: full-text search via ILIKE, pagination, sorting, filter chain
- **Media upload**: multer in memory → sharp resize → upload to S3 → return URL
- **Graceful shutdown**: SIGTERM/SIGINT closes pool, drains connections

## Available Scripts
| Command | Description |
|---------|-------------|
| `npm run dev` | Start with `tsx watch` (auto-restart) |
| `npm run build` | TypeScript compile |
| `npm start` | Run compiled JS (production) |
| `npm run seed` | Drop + recreate all tables + admin seed |

## Health Check
`GET /api/health` returns `{ status, timestamp, environment, database: "connected"|"disconnected" }`

## Admin Seed Account
`admin@makhmal.com` / `admin123` (bcrypt hash in seed.ts)
