import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../db.js';
import { authMiddleware, requireAdmin, AuthRequest, getJwtSecret, getUserRoleFromHeader } from '../middleware/auth.js';
import { validateBody, validateQuery, validateParams } from '../middleware/validation.js';
import { orderCreateSchema, orderStatusSchema, orderQuerySchema, idParamSchema } from '../schemas/validation.js';

export const ordersRoutes = Router();

const getUserIdFromHeader = (authHeader: string | undefined) => {
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return null;
  try {
    const payload = jwt.verify(token, getJwtSecret()) as { sub: string };
    return payload.sub;
  } catch {
    return null;
  }
};

ordersRoutes.post('/', validateBody(orderCreateSchema), async (req, res) => {
  try {
    const authHeader = req.headers.authorization as string | undefined;
    const userId = getUserIdFromHeader(authHeader);
    const { items, ...orderData } = req.body;
    const orderNumber = `ORD-${Date.now()}`;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const orderId = uuidv4();
      await client.query(
        `INSERT INTO "order"(id,user_id,order_number,status,first_name,last_name,email,phone,address_line1,address_line2,city,postal_code,country,notes,shipping_method,payment_method,subtotal,shipping_fee,tax_amount,discount_amount,total,coupon_code,created_at)
         VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,NOW())`,
        [
          orderId, userId || null, orderNumber, 'pending',
          orderData.first_name || '', orderData.last_name || '', orderData.email || '',
          orderData.phone || null, orderData.address_line1 || '', orderData.address_line2 || null,
          orderData.city || '', orderData.postal_code || null, orderData.country || 'Qatar',
          orderData.notes || null, orderData.shippingMethod || 'standard',
          orderData.paymentMethod || 'cash_on_delivery',
          Number(orderData.subtotal || 0), Number(orderData.shippingFee || 0),
          Number(orderData.taxAmount || 0), Number(orderData.discountAmount || 0),
          Number(orderData.total || 0), orderData.couponCode || null,
        ]
      );

      for (const item of items || []) {
        await client.query(
          'UPDATE product SET stock = stock - $1 WHERE id = $2',
          [Number(item.quantity), item.product.id]
        );
        const itemId = uuidv4();
        const subtotal = Number(item.product.price) * Number(item.quantity);
        await client.query(
          `INSERT INTO order_item(id,order_id,product_id,product_name,product_thumbnail,brand_name,price,quantity,subtotal,created_at)
           VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW())`,
          [itemId, orderId, item.product.id, item.product.name,
           item.product.thumbnailUrl || item.product.thumbnail_url || null,
           item.product.brand?.name || null, Number(item.product.price), Number(item.quantity), subtotal]
        );
      }
      await client.query('COMMIT');
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

ordersRoutes.get('/', authMiddleware, validateQuery(orderQuerySchema), async (req: AuthRequest, res) => {
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

ordersRoutes.patch('/:id', authMiddleware, requireAdmin, validateParams(idParamSchema), validateBody(orderStatusSchema), async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Lock the order row for the duration of the transaction so concurrent
    // status changes on the same order can't both revert/decrement stock.
    const { rows: existing } = await client.query('SELECT * FROM "order" WHERE id = $1 FOR UPDATE', [id]);
    const order = existing[0];
    if (!order) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Order not found' });
    }

    const oldStatus = order.status;
    if (oldStatus === status) {
      await client.query('ROLLBACK');
      const { rows: items } = await pool.query('SELECT * FROM order_item WHERE order_id = $1', [id]);
      return res.json({ ...order, items, updatedProducts: [] });
    }

    const wasReverted = oldStatus === 'cancelled' || oldStatus === 'refunded';
    const isNowReverted = status === 'cancelled' || status === 'refunded';
    const updatedProducts: { id: string; stock: number }[] = [];

    if (isNowReverted && !wasReverted) {
      // Cancelled / Refunded → reinject stock for every line item, exactly once
      const { rows: items } = await client.query('SELECT * FROM order_item WHERE order_id = $1', [id]);
      for (const item of items) {
        if (!item.product_id) continue;
        const { rows: productRows } = await client.query(
          'UPDATE product SET stock = stock + $1, updated_at = NOW() WHERE id = $2 RETURNING id, stock',
          [item.quantity, item.product_id]
        );
        if (productRows[0]) updatedProducts.push(productRows[0]);
      }
    } else if (!isNowReverted && wasReverted) {
      // Moving an order back out of cancelled/refunded → re-decrement stock
      // so it isn't double-counted as available.
      const { rows: items } = await client.query('SELECT * FROM order_item WHERE order_id = $1', [id]);
      for (const item of items) {
        if (!item.product_id) continue;
        const { rows: productRows } = await client.query(
          'UPDATE product SET stock = GREATEST(stock - $1, 0), updated_at = NOW() WHERE id = $2 RETURNING id, stock',
          [item.quantity, item.product_id]
        );
        if (productRows[0]) updatedProducts.push(productRows[0]);
      }
    }

    // Paid / Delivered → validate the invoice (idempotent: stamp facture_number only once)
    let factureNumber = order.facture_number;
    let isFacture = order.is_facture;
    let factureStatus = order.facture_status;

    if ((status === 'paid' || status === 'delivered') && !isFacture) {
      factureNumber = `FCT-${Date.now()}`;
      isFacture = true;
      factureStatus = 'issued';
    }

    // Cancelled / Refunded on an order that already carries a validated invoice
    // → credit-note it instead of silently leaving a stale invoice in place.
    if (isNowReverted && isFacture && factureStatus !== 'credited') {
      factureStatus = 'credited';
    }

    await client.query(
      `UPDATE "order" SET status = $1, facture_number = $2, is_facture = $3, facture_status = $4, updated_at = NOW() WHERE id = $5`,
      [status, factureNumber, isFacture, factureStatus, id]
    );

    await client.query('COMMIT');

    const { rows: updated } = await pool.query('SELECT * FROM "order" WHERE id = $1', [id]);
    const { rows: items } = await pool.query('SELECT * FROM order_item WHERE order_id = $1', [id]);
    res.json({ ...updated[0], items, updatedProducts });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Order status update error:', error);
    res.status(500).json({ message: error.message || 'Failed to update order' });
  } finally {
    client.release();
  }
});

// Dashboard polling endpoint (for Electron desktop dashboard)
ordersRoutes.get('/dashboard/summary', authMiddleware, requireAdmin, async (_req, res) => {
  try {
    const [ordersRes, revenueRes, productsRes, customersRes, lowStockRes, recentRes] = await Promise.all([
      pool.query('SELECT COUNT(*)::int AS count FROM "order"'),
      pool.query("SELECT COALESCE(SUM(total), 0) AS total FROM \"order\" WHERE status != 'cancelled' AND status != 'refunded'"),
      pool.query('SELECT COUNT(*)::int AS count FROM product WHERE is_active = true'),
      pool.query('SELECT COUNT(DISTINCT user_id)::int AS count FROM "order" WHERE user_id IS NOT NULL'),
      pool.query("SELECT COUNT(*)::int AS count FROM product WHERE is_active = true AND stock > 0 AND stock <= 5"),
      pool.query("SELECT id, order_number, status, first_name, last_name, email, CAST(total AS NUMERIC(12,2)) AS total, created_at FROM \"order\" ORDER BY created_at DESC LIMIT 8"),
    ]);

    res.json({
      totalOrders: ordersRes.rows[0].count,
      revenue: Number(revenueRes.rows[0].total) || 0,
      totalProducts: productsRes.rows[0].count,
      totalCustomers: customersRes.rows[0].count,
      lowStockCount: lowStockRes.rows[0].count,
      recentOrders: recentRes.rows,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch dashboard summary' });
  }
});
