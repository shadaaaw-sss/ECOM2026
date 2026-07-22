# Railway deployment guide

## 1. Create services
- Create one service for the frontend Next.js app
- Create one service for the backend Node.js app
- Add a PostgreSQL service and link it

## 2. Configure environment variables
### Frontend
- NEXT_PUBLIC_API_URL=https://<backend-service>.up.railway.app/api

### Backend
- PORT=4000
- DATABASE_URL=<railway-postgres-url>
- JWT_SECRET=<strong-secret>
- JWT_REFRESH_SECRET=<strong-secret>
- CORS_ORIGIN=https://<frontend-service>.up.railway.app
- R2_ENDPOINT=https://<account_id>.r2.cloudflarestorage.com
- R2_ACCESS_KEY_ID=<key>
- R2_SECRET_ACCESS_KEY=<secret>
- R2_BUCKET_NAME=<bucket>
- R2_PUBLIC_URL=https://<custom-domain-or-public-url>

## 3. Start commands
- Frontend: npm run build && npm run start
- Backend: npm run build && npm run migrate:deploy && npm run start

## 4. Healthcheck
Railway should use GET /health on the backend service.
