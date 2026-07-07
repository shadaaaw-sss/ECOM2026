import { Router } from 'express';
import { prisma } from '../index.js';
export const couponsRoutes = Router();
couponsRoutes.get('/:code', async (req, res) => {
    const coupon = await prisma.coupon.findUnique({ where: { code: String(req.params.code).toUpperCase() } });
    if (!coupon)
        return res.status(404).json({ message: 'Coupon not found' });
    res.json(coupon);
});
