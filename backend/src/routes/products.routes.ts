import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../db.js';
import { authMiddleware, requireAdmin, getUserRoleFromHeader } from '../middleware/auth.js';
import { validateQuery, validateBody, validateParams } from '../middleware/validation.js';
import { productQuerySchema, productSchema, idParamSchema } from '../schemas/validation.js';

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

productsRoutes.get('/', validateQuery(productQuerySchema), async (req, res) => {
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
    const countRes = await pool.query(`SELECT COUNT(*)::int AS count FROM product p ${whereParts.length ? 'WHERE ' + whereParts.join(' AND ') : ''}`, values);
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
        p.tags,
        CAST(p.stock AS INTEGER) AS stock,
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
    const productsRes = await pool.query(sql, values);
    res.json({ data: productsRes.rows, total });
  } catch (error: any) {
    console.error('Products list error:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch products' });
  }
});

productsRoutes.get('/:id', validateParams(idParamSchema), async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        p.id,
        p.name,
        p.description,
        p.short_description,
        CAST(p.price AS DOUBLE PRECISION) AS price,
        CAST(p.original_price AS DOUBLE PRECISION) AS original_price,
        p.discount_percent,
        p.brand_id,
        p.category_id,
        p.thumbnail_url,
        p.tags,
        CAST(p.stock AS INTEGER) AS stock,
        p.weight,
        p.dimensions,
        p.is_featured,
        p.is_new,
        p.is_active,
        p.meta_title,
        p.meta_description,
        p.created_at,
        p.updated_at,
        json_build_object('id', b.id, 'name', b.name, 'logo_url', b.logo_url, 'is_featured', b.is_featured, 'is_active', b.is_active) AS brand,
        json_build_object('id', c.id, 'name', c.name, 'image_url', c.image_url, 'is_active', c.is_active) AS category
      FROM product p
      LEFT JOIN brand b ON p.brand_id = b.id
      LEFT JOIN category c ON p.category_id = c.id
      WHERE p.id = $1
    `, [String(req.params.id)]);
    const product = rows[0];
    if (!product) return res.status(404).json({ message: 'Product not found' });
    const { rows: images } = await pool.query(
      `SELECT id, url, alt_text AS "altText", type, is_main AS "isMain", sort_order AS "sortOrder"
       FROM product_image WHERE product_id = $1 ORDER BY is_main DESC, sort_order ASC`,
      [String(req.params.id)]
    );
    res.json({ ...product, images });
  } catch (error: any) {
    console.error('Product detail error:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch product' });
  }
});

productsRoutes.post('/', authMiddleware, requireAdmin, validateBody(productSchema), async (req, res) => {
  const {
    name,
    description,
    shortDescription,
    brandId,
    categoryId,
    price,
    originalPrice,
    discountPercent,
    stock,
    weight,
    dimensions,
    tags,
    thumbnailUrl,
    isFeatured,
    isNew,
    isActive,
    metaTitle,
    metaDescription,
    images,
  } = req.body;

  const normalizedTags = Array.isArray(tags)
    ? tags.map((tag: any) => String(tag).trim()).filter(Boolean)
    : typeof tags === 'string'
      ? tags.split(',').map((tag: string) => tag.trim()).filter(Boolean)
      : [];

  try {
    const id = uuidv4();
    const slug = String(name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || `product-${id.slice(0, 8)}`;
    const { rows } = await pool.query(
      `INSERT INTO product(id, name, slug, description, short_description, price, brand_id, category_id, thumbnail_url, tags, stock, original_price, discount_percent, is_featured, is_new, is_active, weight, dimensions, meta_title, meta_description, created_at)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,NOW()) RETURNING *`,
      [
        id, name, slug,
        description || null, shortDescription || null,
        Number(price), brandId || null, categoryId || null,
        thumbnailUrl || null, normalizedTags,
        stock !== undefined ? Number(stock) : 10,
        originalPrice !== undefined ? Number(originalPrice) : null,
        discountPercent !== undefined ? Number(discountPercent) : 0,
        Boolean(isFeatured), Boolean(isNew),
        isActive !== undefined ? Boolean(isActive) : true,
        weight !== undefined ? Number(weight) : null,
        dimensions || null, metaTitle || null, metaDescription || null,
      ]
    );

    // Insert media (images/videos) with type and is_main
    if (Array.isArray(images) && images.length > 0) {
      for (const [index, img] of images.entries()) {
        const imgId = uuidv4();
        await pool.query(
          `INSERT INTO product_image(id, product_id, url, alt_text, type, is_main, sort_order) VALUES($1,$2,$3,$4,$5,$6,$7)`,
          [imgId, id, img.url, img.altText || null, img.type || 'image', Boolean(img.isMain), img.sortOrder ?? index]
        );
      }
    }

    res.status(201).json(rows[0]);
  } catch (error: any) {
    console.error('Create product error:', error);
    res.status(500).json({ message: error.message || 'Failed to create product' });
  }
});

productsRoutes.patch('/:id', authMiddleware, requireAdmin, validateParams(idParamSchema), validateBody(productSchema.partial()), async (req, res) => {
  const {
    name,
    description,
    shortDescription,
    brandId,
    categoryId,
    price,
    originalPrice,
    discountPercent,
    stock,
    weight,
    dimensions,
    tags,
    thumbnailUrl,
    isFeatured,
    isNew,
    isActive,
    metaTitle,
    metaDescription,
    images,
  } = req.body;

  const normalizedTags = Array.isArray(tags)
    ? tags.map((tag: any) => String(tag).trim()).filter(Boolean)
    : typeof tags === 'string'
      ? tags.split(',').map((tag: string) => tag.trim()).filter(Boolean)
      : undefined;

  try {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;
    if (name !== undefined) { fields.push(`name = $${idx++}`); values.push(name); }
    if (description !== undefined) { fields.push(`description = $${idx++}`); values.push(description); }
    if (shortDescription !== undefined) { fields.push(`short_description = $${idx++}`); values.push(shortDescription); }
    if (brandId !== undefined) { fields.push(`brand_id = $${idx++}`); values.push(brandId || null); }
    if (categoryId !== undefined) { fields.push(`category_id = $${idx++}`); values.push(categoryId || null); }
    if (price !== undefined) { fields.push(`price = $${idx++}`); values.push(Number(price)); }
    if (originalPrice !== undefined) { fields.push(`original_price = $${idx++}`); values.push(originalPrice !== null ? Number(originalPrice) : null); }
    if (discountPercent !== undefined) { fields.push(`discount_percent = $${idx++}`); values.push(Number(discountPercent)); }
    if (stock !== undefined) { fields.push(`stock = $${idx++}`); values.push(Number(stock)); }
    if (weight !== undefined) { fields.push(`weight = $${idx++}`); values.push(weight !== null ? Number(weight) : null); }
    if (dimensions !== undefined) { fields.push(`dimensions = $${idx++}`); values.push(dimensions); }
    if (thumbnailUrl !== undefined) { fields.push(`thumbnail_url = $${idx++}`); values.push(thumbnailUrl || null); }
    if (normalizedTags !== undefined) { fields.push(`tags = $${idx++}`); values.push(normalizedTags); }
    if (isFeatured !== undefined) { fields.push(`is_featured = $${idx++}`); values.push(Boolean(isFeatured)); }
    if (isNew !== undefined) { fields.push(`is_new = $${idx++}`); values.push(Boolean(isNew)); }
    if (isActive !== undefined) { fields.push(`is_active = $${idx++}`); values.push(Boolean(isActive)); }
    if (metaTitle !== undefined) { fields.push(`meta_title = $${idx++}`); values.push(metaTitle); }
    if (metaDescription !== undefined) { fields.push(`meta_description = $${idx++}`); values.push(metaDescription); }
    if (fields.length === 0) return res.status(400).json({ message: 'No fields to update' });
    const sql = `UPDATE product SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`;
    values.push(String(req.params.id));
    const { rows } = await pool.query(sql, values);

    // Replace media (images/videos) if provided
    if (Array.isArray(images)) {
      await pool.query('DELETE FROM product_image WHERE product_id = $1', [String(req.params.id)]);
      for (const [index, img] of images.entries()) {
        const imgId = uuidv4();
        await pool.query(
          `INSERT INTO product_image(id, product_id, url, alt_text, type, is_main, sort_order) VALUES($1,$2,$3,$4,$5,$6,$7)`,
          [imgId, String(req.params.id), img.url, img.altText || null, img.type || 'image', Boolean(img.isMain), img.sortOrder ?? index]
        );
      }
    }

    res.json(rows[0]);
  } catch (error: any) {
    console.error('Update product error:', error);
    res.status(500).json({ message: error.message || 'Failed to update product' });
  }
});

productsRoutes.delete('/:id', authMiddleware, requireAdmin, validateParams(idParamSchema), async (req, res) => {
  try {
    await pool.query('DELETE FROM product WHERE id = $1', [String(req.params.id)]);
    res.json({ ok: true });
  } catch (error: any) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: error.message || 'Failed to delete product' });
  }
});