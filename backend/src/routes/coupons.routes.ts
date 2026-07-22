import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../db.js';
import { authMiddleware, requireAdmin } from '../middleware/auth.js';

export const couponsRoutes = Router();

const normalizeCoupon = (row: any) => ({
  id: row.id,
  code: row.code,
  description: row.description ?? null,
  type: row.discount_type,
  value: Number(row.discount_value),
  min_order_amount: row.min_order_amount ?? 0,
  max_uses: row.max_uses ?? null,
  used_count: row.used_count ?? 0,
  is_active: row.is_active ?? true,
  starts_at: row.valid_from ?? null,
  expires_at: row.valid_until ?? null,
  created_at: row.created_at,
});

// GET /api/coupons/:code - Validate a coupon code (public)
couponsRoutes.get('/:code', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM coupon WHERE code = $1 AND (valid_from IS NULL OR valid_from <= NOW()) AND (valid_until IS NULL OR valid_until >= NOW())',
      [String(req.params.code).toUpperCase()]
    );
    const coupon = rows[0];
    if (!coupon) return res.status(404).json({ message: 'Coupon not found' });
    res.json(normalizeCoupon(coupon));
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch coupon' });
  }
});

// GET /api/coupons - List all coupons (admin only)
couponsRoutes.get('/', authMiddleware, requireAdmin, async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM coupon ORDER BY created_at DESC');
    res.json(rows.map(normalizeCoupon));
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch coupons' });
  }
});

// POST /api/coupons - Create a coupon (admin only)
couponsRoutes.post('/', authMiddleware, requireAdmin, async (req, res) => {
  const {
    code,
    description,
    type,
    value,
    discountPercent,
    minOrderAmount,
    maxUses,
    startsAt,
    endsAt,
    isActive,
  } = req.body;

  const couponType = type || (discountPercent !== undefined ? 'percentage' : null);
  const couponValue = value ?? (discountPercent !== undefined ? Number(discountPercent) : null);

  if (!code || couponType === null || couponValue === null) {
    return res.status(400).json({ message: 'Code, type, and value are required' });
  }

  try {
    const id = uuidv4();
    const { rows } = await pool.query(
      'INSERT INTO coupon(id, code, description, discount_type, discount_value, max_uses, min_order_amount, valid_from, valid_until, is_active, created_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW()) RETURNING *',
      [
        id,
        String(code).toUpperCase(),
        description || null,
        couponType,
        Number(couponValue),
        maxUses ?? null,
        minOrderAmount ?? null,
        startsAt || null,
        endsAt || null,
        isActive !== undefined ? Boolean(isActive) : true,
      ]
    );
    res.status(201).json(normalizeCoupon(rows[0]));
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to create coupon' });
  }
});

// DELETE /api/coupons/:id - Delete a coupon (admin only)
couponsRoutes.delete('/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM coupon WHERE id = $1', [String(req.params.id)]);
    res.json({ ok: true });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to delete coupon' });
  }
});