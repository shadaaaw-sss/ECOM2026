import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../db.js';
import { authMiddleware, requireAdmin, getUserRoleFromHeader } from '../middleware/auth.js';
import { validateQuery, validateBody, validateParams } from '../middleware/validation.js';
import { shippingMethodSchema, categoryQuerySchema, idParamSchema } from '../schemas/validation.js';

export const shippingRoutes = Router();

shippingRoutes.get('/', validateQuery(categoryQuerySchema), async (req, res) => {
  const showAll = req.query.all === 'true';
  const userRole = getUserRoleFromHeader(req);
  const allowAll = showAll && (userRole === 'ADMIN' || userRole === 'SUPERADMIN');
  try {
    const whereClause = allowAll ? '' : 'WHERE is_active = true';
    const { rows } = await pool.query(`SELECT id, name, description, CAST(price AS NUMERIC(10,2)) AS price, is_active, created_at FROM shipping_method ${whereClause} ORDER BY price ASC`);
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch shipping methods' });
  }
});

shippingRoutes.post('/', authMiddleware, requireAdmin, validateBody(shippingMethodSchema), async (req, res) => {
  const { name, description, price, isActive } = req.body;
  try {
    const insert = 'INSERT INTO shipping_method(id, name, description, price, is_active, created_at) VALUES($1,$2,$3,$4,$5,NOW()) RETURNING *';
    const id = uuidv4();
    const { rows } = await pool.query(insert, [id, name, description || null, Number(price), isActive !== undefined ? Boolean(isActive) : true]);
    res.status(201).json(rows[0]);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to create shipping method' });
  }
});

shippingRoutes.patch('/:id', authMiddleware, requireAdmin, validateParams(idParamSchema), validateBody(shippingMethodSchema.partial()), async (req, res) => {
  const { name, description, price, isActive } = req.body;
  try {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;
    if (name !== undefined) { fields.push(`name = $${idx++}`); values.push(name); }
    if (description !== undefined) { fields.push(`description = $${idx++}`); values.push(description); }
    if (price !== undefined) { fields.push(`price = $${idx++}`); values.push(Number(price)); }
    if (isActive !== undefined) { fields.push(`is_active = $${idx++}`); values.push(Boolean(isActive)); }
    if (fields.length === 0) return res.status(400).json({ message: 'No fields to update' });
    const sql = `UPDATE shipping_method SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`;
    values.push(String(req.params.id));
    const { rows } = await pool.query(sql, values);
    res.json(rows[0]);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to update shipping method' });
  }
});

shippingRoutes.delete('/:id', authMiddleware, requireAdmin, validateParams(idParamSchema), async (req, res) => {
  try {
    await pool.query('DELETE FROM shipping_method WHERE id = $1', [String(req.params.id)]);
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to delete shipping method' });
  }
});