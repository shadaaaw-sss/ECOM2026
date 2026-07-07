import { Router } from 'express';
import { prisma } from '../index.js';
import { authMiddleware, requireAdmin } from '../middleware/auth.js';

export const newslettersRoutes = Router();

newslettersRoutes.post('/', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });
  const subscriber = await prisma.newsletterSubscriber.upsert({
    where: { email },
    update: {},
    create: { email },
  });
  res.status(201).json(subscriber);
});

newslettersRoutes.get('/', authMiddleware, requireAdmin, async (_req, res) => {
  const subscribers = await prisma.newsletterSubscriber.findMany({ orderBy: { subscribedAt: 'desc' } });
  res.json(subscribers);
});
