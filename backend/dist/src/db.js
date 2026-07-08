import dotenv from 'dotenv';
// @ts-ignore: optional peer dependency may not be installed yet in workspace
import { Pool } from 'pg';
dotenv.config();
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!connectionString)
    throw new Error('DATABASE_URL is not set in env');
export const pool = new Pool({ connectionString });
// Drizzle may not be installed in this environment yet. Export a placeholder `db`.
export const db = {};
export default db;
