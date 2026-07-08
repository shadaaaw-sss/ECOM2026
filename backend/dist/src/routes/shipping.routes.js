import { Router } from 'express';
import { pool } from '../db.js';
import { authMiddleware, requireAdmin } from '../middleware/auth.js';
export const shippingRoutes = Router();
// GET all shipping methods
shippingRoutes.get('/', async (req, res) => {
    const showAll = req.query.all === 'true';
    try {
        const whereClause = showAll ? '' : 'WHERE is_active = true';
        const { rows } = await pool.query(`SELECT * FROM shipping_method ${whereClause} ORDER BY price ASC`);
        res.json(rows);
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to fetch shipping methods' });
    }
});
// POST create shipping method (Admin only)
shippingRoutes.post('/', authMiddleware, requireAdmin, async (req, res) => {
    const { name, description, price, isActive } = req.body;
    if (!name || price === undefined) {
        return res.status(400).json({ message: 'Name and price are required' });
    }
    try {
        const insert = 'INSERT INTO shipping_method(id, name, description, price, is_active, created_at) VALUES($1,$2,$3,$4,$5,NOW()) RETURNING *';
        const id = require('uuid').v4();
        const { rows } = await pool.query(insert, [id, name, description || null, Number(price), isActive !== undefined ? Boolean(isActive) : true]);
        res.status(201).json(rows[0]);
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to create shipping method' });
    }
});
// PATCH update shipping method (Admin only)
shippingRoutes.patch('/:id', authMiddleware, requireAdmin, async (req, res) => {
    const { name, description, price, isActive } = req.body;
    try {
        const fields = [];
        const values = [];
        let idx = 1;
        if (name !== undefined) {
            fields.push(`name = $${idx++}`);
            values.push(name);
        }
        if (description !== undefined) {
            fields.push(`description = $${idx++}`);
            values.push(description);
        }
        if (price !== undefined) {
            fields.push(`price = $${idx++}`);
            values.push(Number(price));
        }
        if (isActive !== undefined) {
            fields.push(`is_active = $${idx++}`);
            values.push(Boolean(isActive));
        }
        if (fields.length === 0)
            return res.status(400).json({ message: 'No fields to update' });
        const sql = `UPDATE shipping_method SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`;
        values.push(String(req.params.id));
        const { rows } = await pool.query(sql, values);
        res.json(rows[0]);
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to update shipping method' });
    }
});
// DELETE shipping method (Admin only)
shippingRoutes.delete('/:id', authMiddleware, requireAdmin, async (req, res) => {
    try {
        await pool.query('DELETE FROM shipping_method WHERE id = $1', [String(req.params.id)]);
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to delete shipping method' });
    }
});
