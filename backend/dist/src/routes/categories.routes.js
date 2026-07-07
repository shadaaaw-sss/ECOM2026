import { Router } from 'express';
import { prisma } from '../index.js';
import { authMiddleware, requireAdmin, getUserRoleFromHeader } from '../middleware/auth.js';
import { createSlug } from '../utils/slug.js';
export const categoriesRoutes = Router();
categoriesRoutes.get('/', async (req, res) => {
    const all = req.query.all === 'true';
    const userRole = getUserRoleFromHeader(req);
    const where = all && (userRole === 'ADMIN' || userRole === 'SUPERADMIN')
        ? {}
        : { isActive: true };
    const categories = await prisma.category.findMany({ where, orderBy: { sortOrder: 'asc' } });
    res.json(categories);
});
categoriesRoutes.get('/:id', async (req, res) => {
    const category = await prisma.category.findUnique({ where: { id: String(req.params.id) } });
    if (!category)
        return res.status(404).json({ message: 'Category not found' });
    const products = await prisma.product.findMany({ where: { categoryId: category.id, isActive: true }, take: 12 });
    res.json({ category, products });
});
categoriesRoutes.post('/', authMiddleware, requireAdmin, async (req, res) => {
    const { name, description, imageUrl, parentId, sortOrder, isActive } = req.body;
    if (!name)
        return res.status(400).json({ message: 'Name is required' });
    const category = await prisma.category.create({
        data: {
            name,
            slug: createSlug(name),
            description,
            imageUrl,
            parentId: parentId || null,
            sortOrder: sortOrder !== undefined ? Number(sortOrder) : 0,
            isActive: isActive !== undefined ? Boolean(isActive) : true,
        },
    });
    res.status(201).json(category);
});
categoriesRoutes.patch('/:id', authMiddleware, requireAdmin, async (req, res) => {
    const { name, description, imageUrl, parentId, sortOrder, isActive } = req.body;
    const updates = {};
    if (name !== undefined) {
        updates.name = name;
        updates.slug = createSlug(name);
    }
    if (description !== undefined)
        updates.description = description;
    if (imageUrl !== undefined)
        updates.imageUrl = imageUrl;
    if (parentId !== undefined)
        updates.parentId = parentId || null;
    if (sortOrder !== undefined)
        updates.sortOrder = Number(sortOrder);
    if (isActive !== undefined)
        updates.isActive = Boolean(isActive);
    const category = await prisma.category.update({ where: { id: String(req.params.id) }, data: updates });
    res.json(category);
});
categoriesRoutes.delete('/:id', authMiddleware, requireAdmin, async (req, res) => {
    await prisma.category.delete({ where: { id: String(req.params.id) } });
    res.json({ ok: true });
});
