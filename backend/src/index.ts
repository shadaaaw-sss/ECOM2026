import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { config } from './config/index.js';
import { pool } from './db.js';
import { authRoutes } from './routes/auth.routes.js';
import { productsRoutes } from './routes/products.routes.js';
import { categoriesRoutes } from './routes/categories.routes.js';
import { brandsRoutes } from './routes/brands.routes.js';
import { uploadsRoutes } from './routes/uploads.routes.js';
import { ordersRoutes } from './routes/orders.routes.js';
import { wishlistRoutes } from './routes/wishlist.routes.js';
import { couponsRoutes } from './routes/coupons.routes.js';
import { settingsRoutes } from './routes/settings.routes.js';
import { shippingRoutes } from './routes/shipping.routes.js';
import { facturesRoutes } from './routes/factures.routes.js';
import { homepageHeroRoutes } from './routes/homepage-hero.routes.js';
import { getRates, convertPrice } from './services/currency.service.js';
import { errorHandler } from './middleware/error-handler.js';
import { rateLimiter } from './middleware/rate-limiter.js';
import initDatabase from './init-db.js';

//App
const app = express();

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));
app.use(compression());
app.use(morgan(config.nodeEnv === 'production' ? 'combined' : 'dev'));

// CORS setup - use centralized config
app.use(
  cors({
    origin: config.cors.origins,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(rateLimiter);

// Health checks with database connectivity verification
app.get('/health', async (_req, res) => {
  let dbStatus = 'unknown';
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    dbStatus = 'connected';
  } catch {
    dbStatus = 'disconnected';
  }
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    database: dbStatus,
    version: process.env.npm_package_version || '1.0.0',
  });
});
app.get('/api/health', async (_req, res) => {
  let dbStatus = 'unknown';
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    dbStatus = 'connected';
  } catch {
    dbStatus = 'disconnected';
  }
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    database: dbStatus,
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/brands', brandsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/shipping-methods', shippingRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/coupons', couponsRoutes);
app.use('/api/uploads', uploadsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/factures', facturesRoutes);
app.use('/api/homepage-hero', homepageHeroRoutes);

// Currency rates
app.get('/api/rates', async (_req, res) => {
  try {
    const rates = await getRates();
    res.json({ base: 'QAR', rates, updatedAt: new Date().toISOString() });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch rates' });
  }
});

app.get('/api/rates/convert', async (req, res) => {
  try {
    const amount = Number(req.query.amount) || 0;
    const to = (req.query.to as string) || 'USD';
    const converted = await convertPrice(amount, to);
    res.json({ amount: Number(req.query.amount) || 0, from: 'QAR', to: to.toUpperCase(), result: converted });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Conversion failed' });
  }
});

// Error handler (must be last)
app.use(errorHandler);

// Graceful shutdown handling
let isShuttingDown = false;
const shutdown = async (signal: string) => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`\n${signal} received. Starting graceful shutdown...`);

  try {
    await pool.end();
    console.log('✓ Database pool closed');
    process.exit(0);
  } catch (err) {
    console.error('✗ Error during shutdown:', err);
    process.exit(1);
  }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Start server
const startServer = async () => {
  try {
    // Initialize database (create tables, seed admin)
    await initDatabase();

    app.listen(config.port, () => {
      console.log(`✓ Backend listening on port ${config.port}`);
      console.log(`  Environment: ${config.nodeEnv}`);
      console.log(`  CORS origins: ${config.cors.origins.join(', ')}`);
      if (config.railway.publicDomain) {
        console.log(`  Railway domain: https://${config.railway.publicDomain}`);
      }
    });
  } catch (error) {
    console.error('✗ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
