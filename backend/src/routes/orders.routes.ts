import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../db.js';
import { authMiddleware, requireAdmin, AuthRequest } from '../middleware/auth.js';

export const ordersRoutes = Router();

type OrderStatusValue = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';

const normalizeOrderStatus = (value: unknown): OrderStatusValue | null => {
  const normalized = String(value ?? '').trim().toUpperCase();
  const validStatuses: OrderStatusValue[] = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'];
  return validStatuses.includes(normalized as OrderStatusValue) ? (normalized as OrderStatusValue) : null;
};

const getUserIdFromHeader = (authHeader: string | undefined) => {
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return null;
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret') as { sub: string };
    return payload.sub;
  } catch {
    return null;
  }
};

ordersRoutes.post('/', async (req, res) => {
  try {
    const authHeader = req.headers.authorization as string | undefined;
    const userId = getUserIdFromHeader(authHeader);
    const { items, ...orderData } = req.body;
    const orderNumber = `ORD-${Date.now()}`;

    // create order and items in a transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const orderId = require('uuid').v4();
      await client.query(
        `INSERT INTO "order"(id,user_id,order_number,first_name,last_name,email,phone,address_line1,address_line2,city,postal_code,country,notes,shipping_method,payment_method,subtotal,shipping_fee,tax_amount,discount_amount,total,coupon_code,created_at)
         VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,NOW())`,
        [
          orderId,
          userId || null,
          orderNumber,
          orderData.first_name || orderData.firstName || '',
          orderData.last_name || orderData.lastName || '',
          orderData.email || '',
          orderData.phone || null,
          orderData.address_line1 || orderData.addressLine1 || '',
          orderData.address_line2 || orderData.addressLine2 || null,
          orderData.city || '',
          orderData.postal_code || orderData.postalCode || null,
          orderData.country || 'Qatar',
          orderData.notes || null,
          orderData.shippingMethod || 'standard',
          orderData.paymentMethod || 'cash_on_delivery',
          Number(orderData.subtotal || 0),
          Number(orderData.shippingFee || 0),
          Number(orderData.taxAmount || 0),
          Number(orderData.discountAmount || 0),
          Number(orderData.total || 0),
          orderData.couponCode || null,
        ]
      );

      const itemInserts = (items || []).map((item: any) => {
        const itemId = require('uuid').v4();
        const subtotal = Number(item.product.price) * Number(item.quantity);
        return client.query(
          `INSERT INTO order_item(id,order_id,product_id,product_name,product_thumbnail,brand_name,price,quantity,subtotal,created_at)
           VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW())`,
          [
            itemId,
            orderId,
            item.product.id,
            item.product.name,
            item.product.thumbnailUrl || item.product.thumbnail_url || null,
            item.product.brand?.name || null,
            Number(item.product.price),
            Number(item.quantity),
            subtotal,
          ]
        );
      });
      await Promise.all(itemInserts);
      await client.query('COMMIT');
      // return created order with items
      const { rows: orderRows } = await pool.query('SELECT * FROM "order" WHERE id = $1', [orderId]);
      const { rows: orderItems } = await pool.query('SELECT * FROM order_item WHERE order_id = $1', [orderId]);
      res.status(201).json({ ...orderRows[0], items: orderItems });
    } catch (txErr) {
      await client.query('ROLLBACK');
      throw txErr;
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Order creation error:', error);
    res.status(500).json({ message: error.message || 'Failed to create order' });
  }
});

ordersRoutes.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const showAll = req.query.all === 'true';
    let ordersQuery = 'SELECT * FROM "order"';
    const params: any[] = [];
    if (!showAll || !(req.userRole === 'ADMIN' || req.userRole === 'SUPERADMIN')) {
      ordersQuery += ' WHERE user_id = $1';
      params.push(req.userId!);
    }
    ordersQuery += ' ORDER BY created_at DESC';
    const { rows: orders } = await pool.query(ordersQuery, params);
    // fetch items for these orders
    const orderIds = orders.map((o: any) => o.id);
    let items: any[] = [];
    if (orderIds.length) {
      const { rows } = await pool.query('SELECT * FROM order_item WHERE order_id = ANY($1)', [orderIds]);
      items = rows;
    }
    const withItems = orders.map((o: any) => ({ ...o, items: items.filter(i => i.order_id === o.id) }));
    res.json(withItems);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch orders' });
  }
});

ordersRoutes.patch('/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ message: 'Status is required' });
    const normalizedStatus = normalizeOrderStatus(status);
    if (!normalizedStatus) return res.status(400).json({ message: 'Invalid order status' });
    const { rows } = await pool.query('UPDATE "order" SET status = $1 WHERE id = $2 RETURNING *', [normalizedStatus, String(req.params.id)]);
    res.json(rows[0]);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to update order' });
  }
});
