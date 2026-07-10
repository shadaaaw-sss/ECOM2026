import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../db.js';
import { authMiddleware, requireAdmin, getUserRoleFromHeader } from '../middleware/auth.js';

export const productsRoutes = Router();

const parseSort = (sort: string) => {
  const parts = sort.split('_');
  const direction = parts.at(-1) === 'asc' ? 'asc' as const : 'desc' as const;
  const field = parts.slice(0, -1).join('_');

  switch (field) {
    case 'price':
      return { price: direction };
    case 'name':
      return { name: direction };
    case 'created_at':
    case 'createdAt':
    case 'created':
      return { created_at: direction };
    default:
      return { created_at: direction };
  }
};

const queryWithRetry = async (text: string, params?: any[]) => {
  const maxRetries = 2;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await pool.query(text, params);
    } catch (err: any) {
      if (i === maxRetries - 1) throw err;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  throw new Error('Query failed after retries');
};

productsRoutes.get('/', async (req, res) => {
  const {
    q,
    filter,
    category,
    brand,
    sort = 'created_at_desc',
    min_price,
    max_price,
    page = '1',
    limit = '12',
    excludeId,
    all,
  } = req.query;

  const userRole = getUserRoleFromHeader(req);
  const allowAll = String(all) === 'true' && (userRole === 'ADMIN' || userRole === 'SUPERADMIN');

  const pageNumber = Math.max(1, parseInt(String(page), 10) || 1);
  const take = Math.max(1, Math.min(100, parseInt(String(limit), 10) || 12));
  const skip = (pageNumber - 1) * take;
  const orderBy = parseSort(String(sort));

  try {
    const whereParts: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (!allowAll) { whereParts.push('p.is_active = true'); }
    if (q) { whereParts.push(`(p.name ILIKE $${idx} OR p.description ILIKE $${idx})`); values.push(`%${String(q)}%`); idx++; }
    if (filter === 'featured') { whereParts.push(`p.is_featured = true`); }
    if (filter === 'new') { whereParts.push(`p.is_new = true`); }
    if (filter === 'sale') { whereParts.push(`p.discount_percent > 0`); }
    if (category) { whereParts.push(`p.category_id = $${idx}`); values.push(String(category)); idx++; }
    if (brand) { whereParts.push(`p.brand_id = $${idx}`); values.push(String(brand)); idx++; }
    if (min_price) {
      const value = parseFloat(String(min_price));
      if (!Number.isNaN(value)) { whereParts.push(`p.price >= $${idx}`); values.push(value); idx++; }
    }
    if (max_price) {
      const value = parseFloat(String(max_price));
      if (!Number.isNaN(value)) { whereParts.push(`p.price <= $${idx}`); values.push(value); idx++; }
    }
    if (excludeId) { whereParts.push(`p.id <> $${idx}`); values.push(String(excludeId)); idx++; }

    const whereSql = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : '';
    const countRes = await queryWithRetry(`SELECT COUNT(*)::int AS count FROM product p ${whereParts.length ? 'WHERE ' + whereParts.join(' AND ') : ''}`, values);
    const total = countRes.rows[0].count;

    const orderField = Object.keys(orderBy)[0];
    const orderDir = Object.values(orderBy)[0] as string;
    const fieldMap: Record<string, string> = { created_at: 'created_at', price: 'price', name: 'name' };
    const orderFieldSql = fieldMap[orderField] || orderField;

    const sql = `
      SELECT
        p.id,
        p.name,
        p.description,
        CAST(p.price AS DOUBLE PRECISION) AS price,
        CAST(p.original_price AS DOUBLE PRECISION) AS original_price,
        p.discount_percent,
        p.brand_id,
        p.category_id,
        p.thumbnail_url,
        p.stock,
        p.is_featured,
        p.is_new,
        p.is_active,
        p.created_at,
        json_build_object('id', b.id, 'name', b.name, 'logo_url', b.logo_url, 'is_featured', b.is_featured, 'is_active', b.is_active) AS brand,
        json_build_object('id', c.id, 'name', c.name, 'image_url', c.image_url, 'is_active', c.is_active) AS category
      FROM product p
      LEFT JOIN brand b ON p.brand_id = b.id
      LEFT JOIN category c ON p.category_id = c.id
      ${whereSql}
      ORDER BY p.${orderFieldSql} ${orderDir}
      LIMIT $${idx} OFFSET $${idx + 1}
    `;

    values.push(take, skip);
    const productsRes = await queryWithRetry(sql, values);
    res.json({ data: productsRes.rows, total });
  } catch (error: any) {
    console.error('Products list error:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch products' });
  }
});

productsRoutes.get('/:id', async (req, res) => {
  try {
    const { rows } = await queryWithRetry(`
      SELECT
        p.id,
        p.name,
        p.description,
        CAST(p.price AS DOUBLE PRECISION) AS price,
        CAST(p.original_price AS DOUBLE PRECISION) AS original_price,
        p.discount_percent,
        p.brand_id,
        p.category_id,
        p.thumbnail_url,
        p.stock,
        p.is_featured,
        p.is_new,
        p.is_active,
        p.created_at,
        json_build_object('id', b.id, 'name', b.name, 'logo_url', b.logo_url, 'is_featured', b.is_featured, 'is_active', b.is_active) AS brand,
        json_build_object('id', c.id, 'name', c.name, 'image_url', c.image_url, 'is_active', c.is_active) AS category
      FROM product p
      LEFT JOIN brand b ON p.brand_id = b.id
      LEFT JOIN category c ON p.category_id = c.id
      WHERE p.id = $1
    `, [String(req.params.id)]);
    const product = rows[0];
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (error: any) {
    console.error('Product detail error:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch product' });
  }
});

productsRoutes.post('/', authMiddleware, requireAdmin, async (req, res) => {
  const {
    name,
    description,
    brandId,
    categoryId,
    price,
    originalPrice,
    discountPercent,
    stock,
    thumbnailUrl,
    isFeatured,
    isNew,
    isActive,
  } = req.body;

  if (!name || price === undefined) {
    return res.status(400).json({ message: 'Name and price are required' });
  }

  try {
    const id = uuidv4();
    const { rows } = await queryWithRetry(
      `INSERT INTO product(id, name, description, price, brand_id, category_id, thumbnail_url, stock, original_price, discount_percent, is_featured, is_new, is_active, created_at)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,NOW()) RETURNING *`,
      [
        id,
        name,
        description || null,
        Number(price),
        brandId || null,
        categoryId || null,
        thumbnailUrl || null,
        stock !== undefined ? Number(stock) : 10,
        originalPrice !== undefined ? Number(originalPrice) : null,
        discountPercent !== undefined ? Number(discountPercent) : 0,
        Boolean(isFeatured),
        Boolean(isNew),
        isActive !== undefined ? Boolean(isActive) : true,
      ]
    );
    res.status(201).json(rows[0]);
  } catch (error: any) {
    console.error('Create product error:', error);
    res.status(500).json({ message: error.message || 'Failed to create product' });
  }
});

productsRoutes.patch('/:id', authMiddleware, requireAdmin, async (req, res) => {
  const {
    name,
    description,
    brandId,
    categoryId,
    price,
    originalPrice,
    discountPercent,
    stock,
    thumbnailUrl,
    isFeatured,
    isNew,
    isActive,
  } = req.body;

  try {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;
    if (name !== undefined) { fields.push(`name = $${idx++}`); values.push(name); }
    if (description !== undefined) { fields.push(`description = $${idx++}`); values.push(description); }
    if (brandId !== undefined) { fields.push(`brand_id = $${idx++}`); values.push(brandId || null); }
    if (categoryId !== undefined) { fields.push(`category_id = $${idx++}`); values.push(categoryId || null); }
    if (price !== undefined) { fields.push(`price = $${idx++}`); values.push(Number(price)); }
    if (originalPrice !== undefined) { fields.push(`original_price = $${idx++}`); values.push(originalPrice !== null ? Number(originalPrice) : null); }
    if (discountPercent !== undefined) { fields.push(`discount_percent = $${idx++}`); values.push(Number(discountPercent)); }
    if (stock !== undefined) { fields.push(`stock = $${idx++}`); values.push(Number(stock)); }
    if (thumbnailUrl !== undefined) { fields.push(`thumbnail_url = $${idx++}`); values.push(thumbnailUrl || null); }
    if (isFeatured !== undefined) { fields.push(`is_featured = $${idx++}`); values.push(Boolean(isFeatured)); }
    if (isNew !== undefined) { fields.push(`is_new = $${idx++}`); values.push(Boolean(isNew)); }
    if (isActive !== undefined) { fields.push(`is_active = $${idx++}`); values.push(Boolean(isActive)); }
    if (fields.length === 0) return res.status(400).json({ message: 'No fields to update' });
    const sql = `UPDATE product SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`;
    values.push(String(req.params.id));
    const { rows } = await queryWithRetry(sql, values);
    res.json(rows[0]);
  } catch (error: any) {
    console.error('Update product error:', error);
    res.status(500).json({ message: error.message || 'Failed to update product' });
  }
});

productsRoutes.delete('/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    await queryWithRetry('DELETE FROM product WHERE id = $1', [String(req.params.id)]);
    res.json({ ok: true });
  } catch (error: any) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: error.message || 'Failed to delete product' });
  }
});