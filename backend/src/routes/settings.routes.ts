import { Router } from 'express';
import { prisma } from '../index.js';

export const settingsRoutes = Router();

settingsRoutes.get('/', async (_req, res) => {
  const settings = await prisma.setting.findMany();
  res.json(Object.fromEntries(settings.map((setting) => [setting.key, setting.value])));
});
