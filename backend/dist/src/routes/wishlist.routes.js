import { Router } from 'express';
import { pool } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
export const wishlistRoutes = Router();
wishlistRoutes.get('/', authMiddleware, async (req, res) => {
    const userId = req.userId;
    try {
        const { rows } = await pool.query('SELECT w.*, p.* FROM wishlist_item w LEFT JOIN product p ON w.product_id = p.id WHERE w.user_id = $1', [userId]);
        res.json(rows);
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to fetch wishlist' });
    }
});
wishlistRoutes.post('/', authMiddleware, async (req, res) => {
    const { productId } = req.body;
    if (!productId)
        return res.status(400).json({ message: 'Product ID is required' });
    const userId = req.userId;
    const { rows: existingCheck } = await pool.query('SELECT id FROM wishlist_item WHERE user_id = $1 AND product_id = $2', [userId, productId]);
    if (existingCheck.length)
        return res.status(200).json(existingCheck[0]);
    try {
        const { rows: existing } = await pool.query('SELECT id FROM wishlist_item WHERE user_id = $1 AND product_id = $2', [userId, productId]);
        if (existing.length)
            return res.status(409).json({ message: 'Already in wishlist' });
        const id = require('uuid').v4();
        const { rows } = await pool.query('INSERT INTO wishlist_item(id,user_id,product_id,created_at) VALUES($1,$2,$3,NOW()) RETURNING *', [id, userId, productId]);
        res.status(201).json(rows[0]);
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to add to wishlist' });
    }
});
wishlistRoutes.delete('/:productId', authMiddleware, async (req, res) => {
    const userId = req.userId;
    const productId = String(req.params.productId);
    try {
        const result = await pool.query('DELETE FROM wishlist_item WHERE user_id = $1 AND product_id = $2 RETURNING id', [userId, productId]);
        res.json({ deleted: result.rowCount });
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to remove from wishlist' });
    }
});
