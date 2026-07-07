import { Router } from 'express';
import { prisma } from '../index.js';
import { authMiddleware, requireAdmin } from '../middleware/auth.js';
export const shippingRoutes = Router();
// GET all shipping methods
shippingRoutes.get('/', async (req, res) => {
    const showAll = req.query.all === 'true';
    const where = showAll ? {} : { isActive: true };
    try {
        const methods = await prisma.shippingMethod.findMany({
            where,
            orderBy: { price: 'asc' },
        });
        res.json(methods);
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to fetch shipping methods' });
    }
});
// POST create shipping method (Admin only)
shippingRoutes.post('/', authMiddleware, requireAdmin, async (req, res) => {
    const { name, description, price, isActive } = req.body;
    if (!name || price === undefined) {
        return res.status(400).json({ message: 'Name and price are required' });
    }
    try {
        const method = await prisma.shippingMethod.create({
            data: {
                name,
                description,
                price: Number(price),
                isActive: isActive !== undefined ? Boolean(isActive) : true,
            },
        });
        res.status(201).json(method);
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to create shipping method' });
    }
});
// PATCH update shipping method (Admin only)
shippingRoutes.patch('/:id', authMiddleware, requireAdmin, async (req, res) => {
    const { name, description, price, isActive } = req.body;
    try {
        const method = await prisma.shippingMethod.update({
            where: { id: String(req.params.id) },
            data: {
                name,
                description,
                price: price !== undefined ? Number(price) : undefined,
                isActive: isActive !== undefined ? Boolean(isActive) : undefined,
            },
        });
        res.json(method);
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to update shipping method' });
    }
});
// DELETE shipping method (Admin only)
shippingRoutes.delete('/:id', authMiddleware, requireAdmin, async (req, res) => {
    try {
        await prisma.shippingMethod.delete({
            where: { id: String(req.params.id) },
        });
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to delete shipping method' });
    }
});
