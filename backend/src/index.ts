import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { db as drizzleDb } from './db.js';
import { authRoutes } from './routes/auth.routes.js';
import { productsRoutes } from './routes/products.routes.js';
import { categoriesRoutes } from './routes/categories.routes.js';
import { brandsRoutes } from './routes/brands.routes.js';
import { uploadsRoutes } from './routes/uploads.routes.js';
import { ordersRoutes } from './routes/orders.routes.js';
import { newslettersRoutes } from './routes/newsletters.routes.js';
import { wishlistRoutes } from './routes/wishlist.routes.js';
import { couponsRoutes } from './routes/coupons.routes.js';
import { settingsRoutes } from './routes/settings.routes.js';
import { shippingRoutes } from './routes/shipping.routes.js';
import { errorHandler } from './middleware/error-handler.js';
import { rateLimiter } from './middleware/rate-limiter.js';

// Drizzle client is available as `db` from `./db.ts`.
const app = express();

app.use(helmet());
app.use(compression());
app.use(morgan('tiny'));
const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim()).filter(Boolean)
  : [];
app.use(
  cors(
    corsOrigins.length
      ? { origin: corsOrigins, credentials: true }
      : { origin: true, credentials: true }
  )
);
app.use(express.json({ limit: '2mb' }));
app.use(rateLimiter);

app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));
app.get('/api/health', (_req, res) => res.status(200).json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/brands', brandsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/shipping-methods', shippingRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/coupons', couponsRoutes);
app.use('/api/uploads', uploadsRoutes);
app.use('/api/newsletters', newslettersRoutes);
app.use('/api/settings', settingsRoutes);
app.use(errorHandler);

const port = Number(process.env.PORT || 4000);
app.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
});
