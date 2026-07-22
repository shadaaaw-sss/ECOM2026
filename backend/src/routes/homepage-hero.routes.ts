import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../db.js';
import { authMiddleware, requireAdmin } from '../middleware/auth.js';
import { validateBody, validateParams } from '../middleware/validation.js';
import { idParamSchema } from '../schemas/validation.js';
import { z } from 'zod';

export const homepageHeroRoutes = Router();

const heroSchema = z.object({
  url: z.string().min(1),
  type: z.enum(['image', 'video']),
  title: z.string().max(255).optional().default(''),
  subtitle: z.string().optional().default(''),
  cta_label: z.string().max(100).optional().default(''),
  cta_href: z.string().max(500).optional().default(''),
  link_product_id: z.string().uuid().nullable().optional().default(null),
  position: z.number().int().min(0).optional().default(0),
  is_active: z.boolean().optional().default(true),
});

homepageHeroRoutes.get('/', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM homepage_hero WHERE is_active = true ORDER BY position ASC');
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch hero slides' });
  }
});

homepageHeroRoutes.get('/all', authMiddleware, requireAdmin, async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM homepage_hero ORDER BY position ASC');
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch hero slides' });
  }
});

homepageHeroRoutes.post('/', authMiddleware, requireAdmin, validateBody(heroSchema), async (req, res) => {
  try {
    const id = uuidv4();
    const { url, type, title, subtitle, cta_label, cta_href, link_product_id, position, is_active } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO homepage_hero(id,url,type,title,subtitle,cta_label,cta_href,link_product_id,position,is_active)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [id, url, type, title || '', subtitle || '', cta_label || '', cta_href || '', link_product_id || null, position ?? 0, is_active ?? true]
    );
    res.status(201).json(rows[0]);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to create hero slide' });
  }
});

homepageHeroRoutes.patch('/:id', authMiddleware, requireAdmin, validateParams(idParamSchema), validateBody(heroSchema.partial()), async (req, res) => {
  try {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;
    for (const [key, col] of Object.entries({ url: 'url', type: 'type', title: 'title', subtitle: 'subtitle', cta_label: 'cta_label', cta_href: 'cta_href', link_product_id: 'link_product_id', position: 'position', is_active: 'is_active' })) {
      if (req.body[key] !== undefined) { fields.push(`${col} = $${idx++}`); values.push(req.body[key]); }
    }
    if (fields.length === 0) return res.status(400).json({ message: 'No fields to update' });
    values.push(String(req.params.id));
    const { rows } = await pool.query(`UPDATE homepage_hero SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`, values);
    res.json(rows[0]);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to update hero slide' });
  }
});

homepageHeroRoutes.delete('/:id', authMiddleware, requireAdmin, validateParams(idParamSchema), async (req, res) => {
  try {
    await pool.query('DELETE FROM homepage_hero WHERE id = $1', [String(req.params.id)]);
    res.json({ ok: true });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to delete hero slide' });
  }
});
