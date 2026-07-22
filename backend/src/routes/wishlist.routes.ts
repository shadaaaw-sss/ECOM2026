import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../db.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { validateBody, validateParams } from '../middleware/validation.js';
import { wishlistSchema, idParamSchema } from '../schemas/validation.js';

export const wishlistRoutes = Router();

wishlistRoutes.get('/', authMiddleware, async (req: AuthRequest, res) => {
  const userId = req.userId!;
  try {
    const { rows } = await pool.query(
      'SELECT w.id as wishlist_id, w.created_at as wishlist_created_at, p.* FROM wishlist_item w LEFT JOIN product p ON w.product_id = p.id WHERE w.user_id = $1',
      [userId]
    );
    const mapped = rows.map((row: any) => ({
      id: row.wishlist_id,
      product: {
        id: row.id,
        name: row.name,
        description: row.description,
        price: Number(row.price),
        brand_id: row.brand_id,
        category_id: row.category_id,
        thumbnail_url: row.thumbnail_url,
        stock: row.stock,
        original_price: row.original_price !== null ? Number(row.original_price) : null,
        discount_percent: row.discount_percent,
        is_featured: row.is_featured,
        is_new: row.is_new,
        is_active: row.is_active,
        created_at: row.created_at,
        tags: row.tags || [],
      },
      created_at: row.wishlist_created_at,
    }));
    res.json(mapped);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch wishlist' });
  }
});

wishlistRoutes.post('/', authMiddleware, validateBody(wishlistSchema), async (req: AuthRequest, res) => {
  const { productId } = req.body;
  const userId = req.userId!;

  try {
    const { rows: existing } = await pool.query('SELECT id FROM wishlist_item WHERE user_id = $1 AND product_id = $2', [userId, productId]);
    if (existing.length) return res.status(200).json(existing[0]);
    const id = uuidv4();
    const { rows } = await pool.query('INSERT INTO wishlist_item(id,user_id,product_id,created_at) VALUES($1,$2,$3,NOW()) RETURNING *', [id, userId, productId]);
    res.status(201).json(rows[0]);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to add to wishlist' });
  }
});

wishlistRoutes.delete('/:productId', authMiddleware, validateParams(idParamSchema), async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const productId = String(req.params.productId);
  try {
    const result = await pool.query('DELETE FROM wishlist_item WHERE user_id = $1 AND product_id = $2 RETURNING id', [userId, productId]);
    res.json({ deleted: result.rowCount });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to remove from wishlist' });
  }
});