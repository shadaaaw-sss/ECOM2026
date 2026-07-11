import dotenv from 'dotenv';
import { Pool } from 'pg';
dotenv.config();
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!connectionString)
    throw new Error('DATABASE_URL is not set in env');
// Railway requires SSL, configure it explicitly
export const pool = new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 15000,
    keepAlive: true,
    ssl: {
        rejectUnauthorized: false,
    },
});
// Test connection on startup with retries
const testConnection = async (retries = 3) => {
    for (let i = 0; i < retries; i++) {
        try {
            const client = await pool.connect();
            await client.query('SELECT 1');
            client.release();
            console.log('✓ Database connection established');
            return;
        }
        catch (err) {
            console.error(`Database connection attempt ${i + 1}/${retries} failed:`, err);
            if (i < retries - 1) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
    }
    console.warn('⚠ Could not establish database connection after retries. Routes will fail until connection is available.');
};
testConnection();
pool.on('error', (err) => {
    console.error('Unexpected database error:', err);
});
// All routes use raw SQL via pool directly.
export const db = null;
export default pool;
