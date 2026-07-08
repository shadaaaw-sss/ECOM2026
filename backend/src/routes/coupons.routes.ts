import { Router } from 'express';
import { pool } from '../db.js';

export const couponsRoutes = Router();

couponsRoutes.get('/:code', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM coupon WHERE code = $1', [String(req.params.code).toUpperCase()]);
    const coupon = rows[0];
    if (!coupon) return res.status(404).json({ message: 'Coupon not found' });
    res.json(coupon);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch coupon' });
  }
});
