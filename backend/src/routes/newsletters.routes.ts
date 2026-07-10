import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../db.js';
import { authMiddleware, requireAdmin } from '../middleware/auth.js';

export const newslettersRoutes = Router();

newslettersRoutes.post('/', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });
  try {
    const id = uuidv4();
    await pool.query('INSERT INTO newsletter_subscriber(id,email) VALUES($1,$2) ON CONFLICT (email) DO NOTHING', [id, email]);
    res.status(201).json({ ok: true });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to subscribe' });
  }
});

newslettersRoutes.get('/', authMiddleware, requireAdmin, async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM newsletter_subscriber ORDER BY subscribed_at DESC');
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch subscribers' });
  }
});
