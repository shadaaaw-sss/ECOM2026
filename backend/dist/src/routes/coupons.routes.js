import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../db.js';
import { authMiddleware, requireAdmin } from '../middleware/auth.js';
export const couponsRoutes = Router();
// GET /api/coupons/:code - Validate a coupon code (public)
couponsRoutes.get('/:code', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM coupon WHERE code = $1 AND (starts_at IS NULL OR starts_at <= NOW()) AND (ends_at IS NULL OR ends_at >= NOW())', [String(req.params.code).toUpperCase()]);
        const coupon = rows[0];
        if (!coupon)
            return res.status(404).json({ message: 'Coupon not found' });
        res.json(coupon);
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to fetch coupon' });
    }
});
// GET /api/coupons - List all coupons (admin only)
couponsRoutes.get('/', authMiddleware, requireAdmin, async (_req, res) => {
    try {
        const { rows } = await pool.query('SELECT id, code, CAST(discount_percent AS INTEGER) AS discount_percent, starts_at, ends_at, created_at FROM coupon ORDER BY created_at DESC');
        res.json(rows);
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to fetch coupons' });
    }
});
// POST /api/coupons - Create a coupon (admin only)
couponsRoutes.post('/', authMiddleware, requireAdmin, async (req, res) => {
    const { code, discountPercent, startsAt, endsAt } = req.body;
    if (!code || discountPercent === undefined) {
        return res.status(400).json({ message: 'Code and discountPercent are required' });
    }
    try {
        const id = uuidv4();
        const { rows } = await pool.query('INSERT INTO coupon(id, code, discount_percent, starts_at, ends_at, created_at) VALUES($1,$2,$3,$4,$5,NOW()) RETURNING *', [id, String(code).toUpperCase(), Number(discountPercent), startsAt || null, endsAt || null]);
        res.status(201).json(rows[0]);
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to create coupon' });
    }
});
// DELETE /api/coupons/:id - Delete a coupon (admin only)
couponsRoutes.delete('/:id', authMiddleware, requireAdmin, async (req, res) => {
    try {
        await pool.query('DELETE FROM coupon WHERE id = $1', [String(req.params.id)]);
        res.json({ ok: true });
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to delete coupon' });
    }
});
