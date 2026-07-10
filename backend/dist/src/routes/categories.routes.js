import { Router } from 'express';
import { pool, db } from '../db.js';
import { authMiddleware, requireAdmin, getUserRoleFromHeader } from '../middleware/auth.js';
import { category, product } from '../../drizzle/schema.js';
import { asc, eq } from 'drizzle-orm/expressions.js';
export const categoriesRoutes = Router();
categoriesRoutes.get('/', async (req, res) => {
    const all = req.query.all === 'true';
    const userRole = getUserRoleFromHeader(req);
    const showAll = all && (userRole === 'ADMIN' || userRole === 'SUPERADMIN');
    try {
        if (db && db.select) {
            let q = db.select().from(category);
            q = q.orderBy(asc(category.sortOrder));
            if (!showAll)
                q = q.where(eq(category.isActive, true));
            const rows = await q;
            return res.json(rows);
        }
        const whereClause = showAll ? '' : 'WHERE is_active = true';
        const { rows } = await pool.query(`SELECT * FROM category ${whereClause} ORDER BY sort_order ASC`);
        res.json(rows);
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to fetch categories' });
    }
});
categoriesRoutes.get('/:id', async (req, res) => {
    try {
        if (db && db.select) {
            const cats = await db.select().from(category).where(eq(category.id, String(req.params.id)));
            const categoryRow = cats[0];
            if (!categoryRow)
                return res.status(404).json({ message: 'Category not found' });
            const products = await db
                .select()
                .from(product)
                .where(eq(product.categoryId, categoryRow.id))
                .where(eq(product.isActive, true))
                .limit(12);
            return res.json({ category: categoryRow, products });
        }
        const { rows: cats } = await pool.query('SELECT * FROM category WHERE id = $1', [String(req.params.id)]);
        const categoryRow = cats[0];
        if (!categoryRow)
            return res.status(404).json({ message: 'Category not found' });
        const { rows: products } = await pool.query('SELECT * FROM product WHERE category_id = $1 AND is_active = true LIMIT 12', [categoryRow.id]);
        res.json({ category: categoryRow, products });
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to fetch category' });
    }
});
categoriesRoutes.post('/', authMiddleware, requireAdmin, async (req, res) => {
    const { name, description, imageUrl, parentId, sortOrder, isActive } = req.body;
    if (!name)
        return res.status(400).json({ message: 'Name is required' });
    try {
        const id = require('uuid').v4();
        const insert = `INSERT INTO category(id,name,description,image_url,parent_id,sort_order,is_active,created_at) VALUES($1,$2,$3,$4,$5,$6,$7,NOW()) RETURNING *`;
        const { rows } = await pool.query(insert, [id, name, description || null, imageUrl || null, parentId || null, sortOrder !== undefined ? Number(sortOrder) : 0, isActive !== undefined ? Boolean(isActive) : true]);
        res.status(201).json(rows[0]);
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to create category' });
    }
});
categoriesRoutes.patch('/:id', authMiddleware, requireAdmin, async (req, res) => {
    const { name, description, imageUrl, parentId, sortOrder, isActive } = req.body;
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
        if (imageUrl !== undefined) {
            fields.push(`image_url = $${idx++}`);
            values.push(imageUrl);
        }
        if (parentId !== undefined) {
            fields.push(`parent_id = $${idx++}`);
            values.push(parentId || null);
        }
        if (sortOrder !== undefined) {
            fields.push(`sort_order = $${idx++}`);
            values.push(Number(sortOrder));
        }
        if (isActive !== undefined) {
            fields.push(`is_active = $${idx++}`);
            values.push(Boolean(isActive));
        }
        if (fields.length === 0)
            return res.status(400).json({ message: 'No fields to update' });
        const sql = `UPDATE category SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`;
        values.push(String(req.params.id));
        const { rows } = await pool.query(sql, values);
        res.json(rows[0]);
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to update category' });
    }
});
categoriesRoutes.delete('/:id', authMiddleware, requireAdmin, async (req, res) => {
    try {
        await pool.query('DELETE FROM category WHERE id = $1', [String(req.params.id)]);
        res.json({ ok: true });
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to delete category' });
    }
});
