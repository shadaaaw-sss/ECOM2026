# Makhmal E-commerce

A premium beauty e-commerce experience built with Next.js, TypeScript, Tailwind CSS and a Drizzle + PostgreSQL backend.

## Features
- Modern storefront for beauty products, brands and categories
- Product listing and search experience
- Cart and checkout flow
- Admin-ready backend structure with Drizzle schema
- Cloudflare R2 upload support via the backend

## Local development (no Docker required)
1. Install frontend dependencies from the project root:
   - `npm install`
2. Install backend dependencies:
   - `cd backend && npm install`
3. Create `backend/.env` from `backend/.env.example` and set your local DB and secrets.
4. Run Drizzle migrations or seed if needed:
   - `cd backend && npm run migrate`
   - `cd backend && npm run seed`
5. Start the backend:
   - `cd backend && npm run dev` for development
   - or `cd backend && npm run start` after `npm run build`
6. Start the frontend:
   - `npm run dev` for local development
   - or `npm run build && npm run start` for a production build

## Deployment on Railway
- Deploy the frontend as a Next.js service
- Deploy the backend as a separate Node.js service
- Attach a PostgreSQL service and set DATABASE_URL
- Add Cloudflare R2 environment variables
- Set NEXT_PUBLIC_API_URL to the backend URL

## Production build & deploy checklist

- Ensure production `DATABASE_URL` is set and reachable.
- Set `JWT_SECRET`, `JWT_REFRESH_SECRET`, and SMTP credentials in environment.
- Configure Cloudflare R2 (or S3-compatible storage) env vars for media uploads.
- For Netlify deploy, Netlify plugin handles Next.js; for Railway, deploy backend and frontend as separate services.
- Optionally build Docker images with `backend/Dockerfile` for container platforms.

## Quick local smoke test (after installing deps)
1. Backend:

```bash
cd backend
cp .env.example .env   # edit .env with credentials
npm install
npm run seed           # create schema + seed admin
npm run dev            # start backend (port 4000)
```

2. Frontend (root):

```bash
npm install
npm run dev            # start Next.js on port 3000
```

3. Verify endpoints:

```bash
curl http://localhost:4000/api/health
curl http://localhost:4000/api/products
curl http://localhost:4000/api/categories
```

## Backend environment
See [backend/.env.example](backend/.env.example).
