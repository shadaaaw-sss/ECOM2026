import dotenv from 'dotenv';
import { Pool } from 'pg';
dotenv.config();
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!connectionString)
    throw new Error('DATABASE_URL is not set in env');
export const pool = new Pool({ connectionString });
// Try to create a Drizzle client from the pg Pool. If Drizzle isn't available,
// fall back to exporting an empty object so existing code using `db` won't crash.
let drizzleDb = {};
try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { drizzle } = require('drizzle-orm-pg/node');
    drizzleDb = drizzle(pool);
}
catch (err) {
    // Drizzle not installed or import failed — keep drizzleDb as an empty object
    drizzleDb = {};
}
export const db = drizzleDb;
export default db;
