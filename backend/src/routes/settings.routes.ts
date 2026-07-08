import { Router } from 'express';
import { pool } from '../db.js';

export const settingsRoutes = Router();

settingsRoutes.get('/', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT key, value FROM setting');
    res.json(Object.fromEntries(rows.map((s: any) => [s.key, s.value])));
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch settings' });
  }
});
