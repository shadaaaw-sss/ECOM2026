import { Router } from 'express';
import { prisma } from '../index.js';
import { authMiddleware, requireAdmin, AuthRequest, getUserRoleFromHeader } from '../middleware/auth.js';
import { createSlug } from '../utils/slug.js';

export const brandsRoutes = Router();

brandsRoutes.get('/', async (req, res) => {
  const all = req.query.all === 'true';
  const userRole = getUserRoleFromHeader(req);
  const where = all && (userRole === 'ADMIN' || userRole === 'SUPERADMIN')
    ? {}
    : { isActive: true };
  const brands = await prisma.brand.findMany({ where, orderBy: { sortOrder: 'asc' } });
  res.json(brands);
});

brandsRoutes.get('/:id', async (req, res) => {
  const brand = await prisma.brand.findUnique({ where: { id: String(req.params.id) } });
  if (!brand) return res.status(404).json({ message: 'Brand not found' });
  const products = await prisma.product.findMany({ where: { brandId: brand.id, isActive: true }, take: 12 });
  res.json({ brand, products });
});

brandsRoutes.post('/', authMiddleware, requireAdmin, async (req, res) => {
  const { name, description, logoUrl, sortOrder, isFeatured, isActive } = req.body;
  if (!name) return res.status(400).json({ message: 'Name is required' });

  const brand = await prisma.brand.create({
    data: {
      name,
      slug: createSlug(name),
      description,
      logoUrl,
      sortOrder: sortOrder !== undefined ? Number(sortOrder) : 0,
      isFeatured: Boolean(isFeatured),
      isActive: isActive !== undefined ? Boolean(isActive) : true,
    },
  });

  res.status(201).json(brand);
});

brandsRoutes.patch('/:id', authMiddleware, requireAdmin, async (req, res) => {
  const { name, description, logoUrl, sortOrder, isFeatured, isActive } = req.body;
  const updates: any = {};

  if (name !== undefined) {
    updates.name = name;
    updates.slug = createSlug(name);
  }
  if (description !== undefined) updates.description = description;
  if (logoUrl !== undefined) updates.logoUrl = logoUrl;
  if (sortOrder !== undefined) updates.sortOrder = Number(sortOrder);
  if (isFeatured !== undefined) updates.isFeatured = Boolean(isFeatured);
  if (isActive !== undefined) updates.isActive = Boolean(isActive);

  const brand = await prisma.brand.update({ where: { id: String(req.params.id) }, data: updates });
  res.json(brand);
});

brandsRoutes.delete('/:id', authMiddleware, requireAdmin, async (req, res) => {
  await prisma.brand.delete({ where: { id: String(req.params.id) } });
  res.json({ ok: true });
});
