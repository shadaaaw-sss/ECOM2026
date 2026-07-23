import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../db.js';
import { authMiddleware, requireAdmin, getUserRoleFromHeader } from '../middleware/auth.js';
import { validateQuery, validateBody, validateParams } from '../middleware/validation.js';
import { brandSchema, brandQuerySchema, idParamSchema } from '../schemas/validation.js';

export const brandsRoutes = Router();

brandsRoutes.get('/', validateQuery(brandQuerySchema), async (req, res) => {
  const all = req.query.all === 'true';
  const userRole = getUserRoleFromHeader(req);
  const showAll = all && (userRole === 'ADMIN' || userRole === 'SUPERADMIN');
  try {
    const whereClause = showAll ? '' : 'WHERE is_active = true';
    const { rows } = await pool.query(`SELECT id, name, description, logo_url, CAST(sort_order AS INTEGER) AS sort_order, is_featured, is_active, created_at FROM brand ${whereClause} ORDER BY sort_order ASC`);
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch brands' });
  }
});

brandsRoutes.get('/:id', validateParams(idParamSchema), async (req, res) => {
  try {
    const { rows: brands } = await pool.query('SELECT * FROM brand WHERE id = $1', [String(req.params.id)]);
    const brandRow = brands[0];
    if (!brandRow) return res.status(404).json({ message: 'Brand not found' });
    const { rows: products } = await pool.query('SELECT * FROM product WHERE brand_id = $1 AND is_active = true LIMIT 12', [brandRow.id]);
    const { rows: categories } = await pool.query(
      `SELECT DISTINCT c.id, c.name, c.slug, c.image_url
       FROM category c
       JOIN product p ON p.category_id = c.id
       WHERE p.brand_id = $1 AND p.is_active = true AND c.is_active = true
       ORDER BY c.name`, [brandRow.id]
    );
    res.json({ brand: brandRow, products, categories });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch brand' });
  }
});

brandsRoutes.post('/', authMiddleware, requireAdmin, validateBody(brandSchema), async (req, res) => {
  const { name, description, logoUrl, sortOrder, isFeatured, isActive, bannerMedia } = req.body;
  try {
    const id = uuidv4();
    const slug = String(name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || `brand-${id.slice(0, 8)}`;
    const insert = `INSERT INTO brand(id, name, slug, description, logo_url, sort_order, is_featured, is_active, banner_media, created_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW()) RETURNING *`;
    const { rows } = await pool.query(insert, [
      id,
      name,
      slug,
      description || null,
      logoUrl || null,
      sortOrder !== undefined ? Number(sortOrder) : 0,
      Boolean(isFeatured),
      isActive !== undefined ? Boolean(isActive) : true,
      JSON.stringify(bannerMedia || []),
    ]);
    res.status(201).json(rows[0]);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to create brand' });
  }
});

brandsRoutes.patch('/:id', authMiddleware, requireAdmin, validateParams(idParamSchema), validateBody(brandSchema.partial()), async (req, res) => {
  const { name, description, logoUrl, sortOrder, isFeatured, isActive, bannerMedia } = req.body;
  try {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;
    if (name !== undefined) { fields.push(`name = $${idx++}`); values.push(name); }
    if (description !== undefined) { fields.push(`description = $${idx++}`); values.push(description); }
    if (logoUrl !== undefined) { fields.push(`logo_url = $${idx++}`); values.push(logoUrl); }
    if (sortOrder !== undefined) { fields.push(`sort_order = $${idx++}`); values.push(Number(sortOrder)); }
    if (isFeatured !== undefined) { fields.push(`is_featured = $${idx++}`); values.push(Boolean(isFeatured)); }
    if (isActive !== undefined) { fields.push(`is_active = $${idx++}`); values.push(Boolean(isActive)); }
    if (bannerMedia !== undefined) { fields.push(`banner_media = $${idx++}`); values.push(JSON.stringify(bannerMedia)); }
    if (fields.length === 0) return res.status(400).json({ message: 'No fields to update' });
    const sql = `UPDATE brand SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`;
    values.push(String(req.params.id));
    const { rows } = await pool.query(sql, values);
    res.json(rows[0]);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to update brand' });
  }
});

brandsRoutes.delete('/:id', authMiddleware, requireAdmin, validateParams(idParamSchema), async (req, res) => {
  try {
    await pool.query('DELETE FROM brand WHERE id = $1', [String(req.params.id)]);
    res.json({ ok: true });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to delete brand' });
  }
});