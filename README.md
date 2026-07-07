# Makhmal E-commerce

A premium beauty e-commerce experience built with Next.js, TypeScript, Tailwind CSS and a Prisma + PostgreSQL backend.

## Features
- Modern storefront for beauty products, brands and categories
- Product listing and search experience
- Cart and checkout flow
- Admin-ready backend structure with Prisma schema
- Cloudflare R2 upload support via the backend

## Local development
1. Install dependencies for the frontend and backend
2. Create the backend environment file from the example
3. Run the Prisma migrations and seed
4. Start the frontend and backend services

## Deployment on Railway
- Deploy the frontend as a Next.js service
- Deploy the backend as a separate Node.js service
- Attach a PostgreSQL service and set DATABASE_URL
- Add Cloudflare R2 environment variables
- Set NEXT_PUBLIC_API_URL to the backend URL

## Backend environment
See [backend/.env.example](backend/.env.example).
