# Makhmal E-commerce

A premium beauty e-commerce experience built with Next.js, TypeScript, Tailwind CSS and a Prisma + PostgreSQL backend.

## Features
- Modern storefront for beauty products, brands and categories
- Product listing and search experience
- Cart and checkout flow
- Admin-ready backend structure with Prisma schema
- Cloudflare R2 upload support via the backend

## Local development (no Docker required)
1. Install frontend dependencies from the project root:
   - `npm install`
2. Install backend dependencies:
   - `cd backend && npm install`
3. Create `backend/.env` from `backend/.env.example` and set your local DB and secrets.
4. Run Prisma migrations or seed if needed:
   - `cd backend && npm run migrate:deploy`
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

## Backend environment
See [backend/.env.example](backend/.env.example).
