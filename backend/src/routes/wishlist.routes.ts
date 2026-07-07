import { Router } from 'express';
import { prisma } from '../index.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

export const wishlistRoutes = Router();

wishlistRoutes.get('/', authMiddleware, async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const items = await prisma.wishlistItem.findMany({
    where: { userId },
    include: { product: { include: { brand: true, category: true } } },
  });
  res.json(items);
});

wishlistRoutes.post('/', authMiddleware, async (req: AuthRequest, res) => {
  const { productId } = req.body;
  if (!productId) return res.status(400).json({ message: 'Product ID is required' });
  const userId = req.userId!;

  const existing = await prisma.wishlistItem.findFirst({ where: { userId, productId } });
  if (existing) return res.status(200).json(existing);

  const item = await prisma.wishlistItem.create({
    data: { userId, productId },
    include: { product: { include: { brand: true, category: true } } },
  });
  res.status(201).json(item);
});

wishlistRoutes.delete('/:productId', authMiddleware, async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const productId = String(req.params.productId);
  const deleted = await prisma.wishlistItem.deleteMany({ where: { userId, productId } });
  if (deleted.count === 0) return res.status(404).json({ message: 'Wishlist item not found' });
  res.status(204).send();
});
