import { Router } from 'express';
import { pool } from '../db.js';
import { authMiddleware, requireAdmin, getUserRoleFromHeader } from '../middleware/auth.js';
export const productsRoutes = Router();
const parseSort = (sort) => {
    const [field, direction] = sort.split('_');
    const ascending = direction === 'asc';
    const sortOrder = ascending ? 'asc' : 'desc';
    switch (field) {
        case 'price':
            return { price: sortOrder };
        case 'name':
            return { name: sortOrder };
        default:
            return { createdAt: sortOrder };
    }
};
productsRoutes.get('/', async (req, res) => {
    const { q, filter, category, brand, sort = 'createdAt_desc', min_price, max_price, page = '1', limit = '12', excludeId, all, } = req.query;
    const userRole = getUserRoleFromHeader(req);
    const allowAll = String(all) === 'true' && (userRole === 'ADMIN' || userRole === 'SUPERADMIN');
    const where = {};
    if (!allowAll) {
        where.isActive = true;
    }
    if (q) {
        where.OR = [
            { name: { contains: String(q), mode: 'insensitive' } },
            { description: { contains: String(q), mode: 'insensitive' } },
            { shortDescription: { contains: String(q), mode: 'insensitive' } },
        ];
    }
    if (filter === 'featured') {
        where.isFeatured = true;
    }
    if (filter === 'new') {
        where.isNew = true;
    }
    if (filter === 'sale') {
        where.discountPercent = { gt: 0 };
    }
    if (category) {
        where.categoryId = String(category);
    }
    if (brand) {
        where.brandId = String(brand);
    }
    if (min_price) {
        const value = parseFloat(String(min_price));
        if (!Number.isNaN(value))
            where.price = { ...where.price, gte: value };
    }
    if (max_price) {
        const value = parseFloat(String(max_price));
        if (!Number.isNaN(value))
            where.price = { ...where.price, lte: value };
    }
    if (excludeId) {
        where.id = { not: String(excludeId) };
    }
    const pageNumber = Math.max(1, parseInt(String(page), 10) || 1);
    const take = Math.max(1, Math.min(100, parseInt(String(limit), 10) || 12));
    const skip = (pageNumber - 1) * take;
    const orderBy = parseSort(String(sort));
    try {
        const whereParts = [];
        const values = [];
        let idx = 1;
        if (!allowAll) {
            whereParts.push('is_active = true');
        }
        if (q) {
            whereParts.push(`(name ILIKE $${idx} OR description ILIKE $${idx})`);
            values.push(`%${String(q)}%`);
            idx++;
        }
        if (brand) {
            whereParts.push(`brand_id = $${idx}`);
            values.push(String(brand));
            idx++;
        }
        if (excludeId) {
            whereParts.push(`id <> $${idx}`);
            values.push(String(excludeId));
            idx++;
        }
        const whereSql = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : '';
        const countRes = await pool.query(`SELECT COUNT(*)::int AS count FROM product ${whereSql}`, values);
        const total = countRes.rows[0].count;
        const orderField = Object.keys(orderBy)[0];
        const orderDir = Object.values(orderBy)[0];
        const sql = `SELECT p.*, b.* AS brand FROM product p LEFT JOIN brand b ON p.brand_id = b.id ${whereSql} ORDER BY p.${orderField} ${orderDir} LIMIT $${idx} OFFSET $${idx + 1}`;
        values.push(take, skip);
        const productsRes = await pool.query(sql, values);
        res.json({ data: productsRes.rows, total });
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to fetch products' });
    }
});
productsRoutes.get('/:id', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT p.*, b.* AS brand FROM product p LEFT JOIN brand b ON p.brand_id = b.id WHERE p.id = $1', [String(req.params.id)]);
        const product = rows[0];
        if (!product)
            return res.status(404).json({ message: 'Product not found' });
        res.json(product);
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to fetch product' });
    }
});
productsRoutes.post('/', authMiddleware, requireAdmin, async (req, res) => {
    const { name, description, shortDescription, brandId, categoryId, subCategoryId, price, originalPrice, discountPercent, stock, weight, dimensions, tags, thumbnailUrl, isFeatured, isNew, isActive, metaTitle, metaDescription, images, } = req.body;
    if (!name || price === undefined) {
        return res.status(400).json({ message: 'Name and price are required' });
    }
    try {
        const id = require('uuid').v4();
        const insert = `INSERT INTO product(id,name,description,price,brand_id,is_active,created_at) VALUES($1,$2,$3,$4,$5,$6,NOW()) RETURNING *`;
        const { rows } = await pool.query(insert, [id, name, description || null, Number(price), brandId || null, isActive !== undefined ? Boolean(isActive) : true]);
        res.status(201).json(rows[0]);
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to create product' });
    }
});
productsRoutes.patch('/:id', authMiddleware, requireAdmin, async (req, res) => {
    const { name, description, shortDescription, brandId, categoryId, subCategoryId, price, originalPrice, discountPercent, stock, weight, dimensions, tags, thumbnailUrl, isFeatured, isNew, isActive, metaTitle, metaDescription, images, } = req.body;
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
        if (brandId !== undefined) {
            fields.push(`brand_id = $${idx++}`);
            values.push(brandId || null);
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
        const sql = `UPDATE product SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`;
        values.push(String(req.params.id));
        const { rows } = await pool.query(sql, values);
        res.json(rows[0]);
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to update product' });
    }
});
productsRoutes.delete('/:id', authMiddleware, requireAdmin, async (req, res) => {
    try {
        await pool.query('DELETE FROM product WHERE id = $1', [String(req.params.id)]);
        res.json({ ok: true });
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to delete product' });
    }
});
