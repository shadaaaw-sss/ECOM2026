import { Router } from 'express';
import { pool, db } from '../db.js';
import { authMiddleware, requireAdmin, getUserRoleFromHeader } from '../middleware/auth.js';
import { brand, product } from '../../drizzle/schema.js';
import { asc, eq } from 'drizzle-orm/expressions.js';
export const brandsRoutes = Router();
brandsRoutes.get('/', async (req, res) => {
    const all = req.query.all === 'true';
    const userRole = getUserRoleFromHeader(req);
    const showAll = all && (userRole === 'ADMIN' || userRole === 'SUPERADMIN');
    try {
        if (db && db.select) {
            let q = db.select().from(brand);
            q = q.orderBy(asc(brand.sortOrder));
            if (!showAll)
                q = q.where(eq(brand.isActive, true));
            const rows = await q;
            return res.json(rows);
        }
        const whereClause = showAll ? '' : 'WHERE is_active = true';
        const { rows } = await pool.query(`SELECT * FROM brand ${whereClause} ORDER BY sort_order ASC`);
        res.json(rows);
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to fetch brands' });
    }
});
brandsRoutes.get('/:id', async (req, res) => {
    try {
        if (db && db.select) {
            const brands = await db.select().from(brand).where(eq(brand.id, String(req.params.id)));
            const brandRow = brands[0];
            if (!brandRow)
                return res.status(404).json({ message: 'Brand not found' });
            const products = await db
                .select()
                .from(product)
                .where(eq(product.brandId, brandRow.id))
                .where(eq(product.isActive, true))
                .limit(12);
            return res.json({ brand: brandRow, products });
        }
        const { rows: brands } = await pool.query('SELECT * FROM brand WHERE id = $1', [String(req.params.id)]);
        const brandRow = brands[0];
        if (!brandRow)
            return res.status(404).json({ message: 'Brand not found' });
        const { rows: products } = await pool.query('SELECT * FROM product WHERE brand_id = $1 AND is_active = true LIMIT 12', [brandRow.id]);
        res.json({ brand: brandRow, products });
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to fetch brand' });
    }
});
brandsRoutes.post('/', authMiddleware, requireAdmin, async (req, res) => {
    const { name, description, logoUrl, sortOrder, isFeatured, isActive } = req.body;
    if (!name)
        return res.status(400).json({ message: 'Name is required' });
    try {
        const id = require('uuid').v4();
        const insert = `INSERT INTO brand(id, name, description, logo_url, sort_order, is_featured, is_active, created_at) VALUES($1,$2,$3,$4,$5,$6,$7,NOW()) RETURNING *`;
        const { rows } = await pool.query(insert, [id, name, description || null, logoUrl || null, sortOrder !== undefined ? Number(sortOrder) : 0, Boolean(isFeatured), isActive !== undefined ? Boolean(isActive) : true]);
        res.status(201).json(rows[0]);
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to create brand' });
    }
});
brandsRoutes.patch('/:id', authMiddleware, requireAdmin, async (req, res) => {
    const { name, description, logoUrl, sortOrder, isFeatured, isActive } = req.body;
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
        if (logoUrl !== undefined) {
            fields.push(`logo_url = $${idx++}`);
            values.push(logoUrl);
        }
        if (sortOrder !== undefined) {
            fields.push(`sort_order = $${idx++}`);
            values.push(Number(sortOrder));
        }
        if (isFeatured !== undefined) {
            fields.push(`is_featured = $${idx++}`);
            values.push(Boolean(isFeatured));
        }
        if (isActive !== undefined) {
            fields.push(`is_active = $${idx++}`);
            values.push(Boolean(isActive));
        }
        if (fields.length === 0)
            return res.status(400).json({ message: 'No fields to update' });
        const sql = `UPDATE brand SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`;
        values.push(String(req.params.id));
        const { rows } = await pool.query(sql, values);
        res.json(rows[0]);
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to update brand' });
    }
});
brandsRoutes.delete('/:id', authMiddleware, requireAdmin, async (req, res) => {
    try {
        await pool.query('DELETE FROM brand WHERE id = $1', [String(req.params.id)]);
        res.json({ ok: true });
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to delete brand' });
    }
});
