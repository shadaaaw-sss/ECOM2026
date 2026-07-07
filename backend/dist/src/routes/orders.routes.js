import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../index.js';
import { authMiddleware, requireAdmin } from '../middleware/auth.js';
export const ordersRoutes = Router();
const normalizeOrderStatus = (value) => {
    const normalized = String(value ?? '').trim().toUpperCase();
    const validStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'];
    return validStatuses.includes(normalized) ? normalized : null;
};
const getUserIdFromHeader = (authHeader) => {
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token)
        return null;
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
        return payload.sub;
    }
    catch {
        return null;
    }
};
ordersRoutes.post('/', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        const userId = getUserIdFromHeader(authHeader);
        const { items, ...orderData } = req.body;
        const orderNumber = `ORD-${Date.now()}`;
        const order = await prisma.order.create({
            data: {
                userId: userId || null,
                orderNumber,
                firstName: orderData.first_name || orderData.firstName || '',
                lastName: orderData.last_name || orderData.lastName || '',
                email: orderData.email || '',
                phone: orderData.phone || null,
                addressLine1: orderData.address_line1 || orderData.addressLine1 || '',
                addressLine2: orderData.address_line2 || orderData.addressLine2 || null,
                city: orderData.city || '',
                postalCode: orderData.postal_code || orderData.postalCode || null,
                country: orderData.country || 'Qatar',
                notes: orderData.notes || null,
                shippingMethod: orderData.shippingMethod || 'standard',
                paymentMethod: orderData.paymentMethod || 'cash_on_delivery',
                subtotal: Number(orderData.subtotal || 0),
                shippingFee: Number(orderData.shippingFee || 0),
                taxAmount: Number(orderData.taxAmount || 0),
                discountAmount: Number(orderData.discountAmount || 0),
                total: Number(orderData.total || 0),
                couponCode: orderData.couponCode || null,
                items: {
                    create: (items || []).map((item) => ({
                        productId: item.product.id,
                        productName: item.product.name,
                        productThumbnail: item.product.thumbnailUrl || item.product.thumbnail_url || null,
                        brandName: item.product.brand?.name || null,
                        price: Number(item.product.price),
                        quantity: Number(item.quantity),
                        subtotal: Number(item.product.price) * Number(item.quantity),
                    })),
                },
            },
        });
        res.status(201).json(order);
    }
    catch (error) {
        console.error('Order creation error:', error);
        res.status(500).json({ message: error.message || 'Failed to create order' });
    }
});
ordersRoutes.get('/', authMiddleware, async (req, res) => {
    const showAll = req.query.all === 'true';
    const where = {};
    if (showAll && req.userRole && (req.userRole === 'ADMIN' || req.userRole === 'SUPERADMIN')) {
        // all orders for admin
    }
    else {
        where.userId = req.userId;
    }
    const orders = await prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: { items: true },
    });
    res.json(orders);
});
ordersRoutes.patch('/:id', authMiddleware, requireAdmin, async (req, res) => {
    const { status } = req.body;
    if (!status)
        return res.status(400).json({ message: 'Status is required' });
    const normalizedStatus = normalizeOrderStatus(status);
    if (!normalizedStatus) {
        return res.status(400).json({ message: 'Invalid order status' });
    }
    const order = await prisma.order.update({
        where: { id: String(req.params.id) },
        data: { status: normalizedStatus },
    });
    res.json(order);
});
