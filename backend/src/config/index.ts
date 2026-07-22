import dotenv from 'dotenv';

dotenv.config();

interface DatabaseConfig {
  url: string;
  ssl: boolean | { rejectUnauthorized: boolean };
  pool: {
    max: number;
    idleTimeoutMs: number;
    connectionTimeoutMs: number;
    keepAlive: boolean;
  };
}

interface JwtConfig {
  secret: string;
  refreshSecret: string;
  accessTokenExpiry: string;
  refreshTokenExpiry: string;
}

interface CorsConfig {
  origins: (string | RegExp)[];
}

interface StorageConfig {
  provider: 'r2' | 'cloudflare-images';
  r2: {
    endpoint: string;
    accessKeyId: string;
    secretAccessKey: string;
    bucketName: string;
    publicUrl: string;
  };
  cloudflareImages: {
    accountId: string;
    apiToken: string;
    deliveryUrl: string;
  };
}

interface UploadConfig {
  maxImageSizeMb: number;
  maxImagesPerProduct: number;
}

interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
}

interface FrontendConfig {
  url: string;
}

interface RateLimitConfig {
  points: number;
  duration: number;
  blockDuration: number;
}

interface RailwayConfig {
  publicDomain?: string;
}

interface CurrencyConfig {
  apiKey: string;
}

export interface Config {
  port: number;
  nodeEnv: string;
  database: DatabaseConfig;
  jwt: JwtConfig;
  cors: CorsConfig;
  storage: StorageConfig;
  upload: UploadConfig;
  smtp: SmtpConfig;
  frontend: FrontendConfig;
  rateLimit: RateLimitConfig;
  railway: RailwayConfig;
  currency: CurrencyConfig;
}

function getDatabaseConfig(): DatabaseConfig {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!connectionString) throw new Error('DATABASE_URL is not set in env');

  const useSsl = (() => {
    if (/sslmode=disable/i.test(connectionString)) return false;
    if (process.env.PGSSLMODE && /disable/i.test(process.env.PGSSLMODE)) return false;
    if (process.env.DB_SSL === 'false' || process.env.DB_SSL === '0') return false;
    return true;
  })();

  return {
    url: connectionString,
    ssl: useSsl ? { rejectUnauthorized: false } : false,
    pool: {
      max: Number(process.env.DB_POOL_MAX) || 20,
      idleTimeoutMs: Number(process.env.DB_IDLE_TIMEOUT_MS) || 30000,
      connectionTimeoutMs: Number(process.env.DB_CONNECTION_TIMEOUT_MS) || 15000,
      keepAlive: true,
    },
  };
}

function getCorsConfig(): CorsConfig {
  const envOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(o => o.trim().replace(/\/+$/, '')).filter(Boolean)
    : [];

  const defaultOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
  ];

  const isDev = process.env.NODE_ENV !== 'production';
  const electronOrigins = isDev ? ['file://', 'capacitor://', 'tauri://'] : [];

  const railwayDomain = process.env.RAILWAY_PUBLIC_DOMAIN
    ? [`https://${process.env.RAILWAY_PUBLIC_DOMAIN}`]
    : [];

  // Use string array for exact matches, RegExp for pattern matching in dev
  const allOrigins: (string | RegExp)[] = [
    ...new Set([...envOrigins, ...defaultOrigins, ...electronOrigins, ...railwayDomain]),
  ];

  return { origins: allOrigins };
}

function getStorageConfig(): StorageConfig {
  return {
    provider: (process.env.STORAGE_PROVIDER as 'r2' | 'cloudflare-images') || 'r2',
    r2: {
      endpoint: process.env.R2_ENDPOINT || '',
      accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
      bucketName: process.env.R2_BUCKET_NAME || '',
      publicUrl: process.env.R2_PUBLIC_URL || '',
    },
    cloudflareImages: {
      accountId: process.env.CLOUDFLARE_IMAGES_ACCOUNT_ID || '',
      apiToken: process.env.CLOUDFLARE_IMAGES_API_TOKEN || '',
      deliveryUrl: process.env.CLOUDFLARE_IMAGES_DELIVERY_URL || '',
    },
  };
}

export const config: Config = {
  port: Number(process.env.PORT) || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',
  database: getDatabaseConfig(),
  jwt: {
    secret: process.env.JWT_SECRET!,
    refreshSecret: process.env.JWT_REFRESH_SECRET!,
    accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || '7d',
    refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '30d',
  },
  cors: getCorsConfig(),
  storage: getStorageConfig(),
  upload: {
    maxImageSizeMb: Number(process.env.MAX_IMAGE_SIZE_MB) || 5,
    maxImagesPerProduct: Number(process.env.MAX_IMAGES_PER_PRODUCT) || 8,
  },
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 465,
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.EMAIL_FROM || 'noreply@makhmal.com',
  },
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:3000',
  },
  rateLimit: {
    points: Number(process.env.RATE_LIMIT_POINTS) || 100,
    duration: Number(process.env.RATE_LIMIT_DURATION) || 60,
    blockDuration: Number(process.env.RATE_LIMIT_BLOCK_DURATION) || 60,
  },
  railway: {
    publicDomain: process.env.RAILWAY_PUBLIC_DOMAIN,
  },
  currency: {
    apiKey: process.env.EXCHANGE_RATE_API_KEY || '',
  },
};

// Validate required secrets in production
if (config.nodeEnv === 'production') {
  const requiredSecrets = [
    { key: 'JWT_SECRET', value: config.jwt.secret },
    { key: 'JWT_REFRESH_SECRET', value: config.jwt.refreshSecret },
    { key: 'DATABASE_URL', value: config.database.url },
  ];

  for (const secret of requiredSecrets) {
    if (!secret.value || secret.value.length < 32) {
      throw new Error(`Missing or weak required secret in production: ${secret.key}`);
    }
  }
}

export default config;