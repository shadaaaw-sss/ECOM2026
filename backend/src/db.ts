import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import { config } from './config/index.js';

export const pool = new Pool({
  connectionString: config.database.url,
  max: config.database.pool.max,
  idleTimeoutMillis: config.database.pool.idleTimeoutMs,
  connectionTimeoutMillis: config.database.pool.connectionTimeoutMs,
  keepAlive: config.database.pool.keepAlive,
  ssl: config.database.ssl,
  // Allow exit on SIGTERM even if pool has idle clients
  allowExitOnIdle: true,
});

// Connection health check with exponential backoff retry
let isConnecting = false;
let connectionHealthy = false;

async function checkConnection(retries = 10, baseDelay = 1000): Promise<boolean> {
  if (isConnecting) {
    // Wait for existing connection attempt
    await new Promise(r => setTimeout(r, 500));
    return connectionHealthy;
  }

  isConnecting = true;
  try {
    for (let i = 0; i < retries; i++) {
      try {
        const client = await pool.connect();
        await client.query('SELECT 1');
        client.release();
        connectionHealthy = true;
        if (i > 0) console.log('✓ Database connection restored after retry');
        return true;
      } catch (err) {
        connectionHealthy = false;
        if (i < retries - 1) {
          const delay = Math.min(baseDelay * Math.pow(2, i), 30000);
          console.warn(`Database connection attempt ${i + 1}/${retries} failed, retrying in ${delay}ms:`, err instanceof Error ? err.message : err);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    console.error('✗ Failed to establish database connection after all retries');
    return false;
  } finally {
    isConnecting = false;
  }
}

// Initial connection test
checkConnection();

// Handle pool errors with automatic reconnection
pool.on('error', async (err) => {
  console.error('Unexpected database pool error:', err);
  connectionHealthy = false;
  // Attempt to reconnect in background
  setTimeout(() => checkConnection(5, 2000), 1000);
});

// Monitor connection health periodically in production
if (config.nodeEnv === 'production') {
  setInterval(() => {
    checkConnection(3, 5000).catch(() => {});
  }, 60000); // Check every minute
}

// Helper to get a healthy client with automatic retry
export async function getClient(): Promise<PoolClient> {
  if (!connectionHealthy) {
    await checkConnection(3, 2000);
  }
  return pool.connect();
}

// Helper for executing queries with automatic retry on connection failure
export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[],
  retries = 3
): Promise<QueryResult<T>> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      if (!connectionHealthy) {
        await checkConnection(2, 1000);
      }
      return await pool.query<T>(text, params);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));

      // Check if it's a connection error worth retrying
      const isConnectionError =
        err instanceof Error &&
        (err.message.includes('ECONNREFUSED') ||
          err.message.includes('ENOTFOUND') ||
          err.message.includes('ETIMEDOUT') ||
          err.message.includes('connection terminated') ||
          err.message.includes('no connection') ||
          err.message.includes('pool is draining'));

      if (isConnectionError && attempt < retries - 1) {
        connectionHealthy = false;
        const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
        console.warn(`Query failed (attempt ${attempt + 1}/${retries}), retrying in ${delay}ms:`, lastError.message);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw lastError;
    }
  }

  throw lastError;
}

// Export pool for direct access when needed
export default pool;

// Helper to get connection status
export function isDatabaseHealthy(): boolean {
  return connectionHealthy;
}

// Graceful shutdown
export async function closePool(): Promise<void> {
  await pool.end();
  console.log('✓ Database pool closed');
}