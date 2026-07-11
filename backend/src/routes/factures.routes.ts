import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../db.js';
import { authMiddleware, requireAdmin } from '../middleware/auth.js';

export const facturesRoutes = Router();

facturesRoutes.post('/', async (req, res) => {
  try {
    const { items, customerName, customerPhone, customerEmail, notes } = req.body;
    if (!items || !items.length) {
      return res.status(400).json({ message: 'Items are required' });
    }
    const factureNumber = `FCT-${Date.now()}`;
    const orderId = uuidv4();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Calculate totals
      let subtotal = 0;
      for (const item of items) {
        subtotal += Number(item.price) * Number(item.quantity);
      }
      const total = subtotal;

      // Insert the facture order
      await client.query(
        `INSERT INTO "order"(id,order_number,status,first_name,last_name,email,phone,notes,subtotal,total,is_facture,facture_number,created_at)
         VALUES($1,$2,'DELIVERED',$3,$4,$5,$6,$7,$8,$9,true,$10,NOW())`,
        [
          orderId,
          `FACTURE-${factureNumber}`,
          customerName?.split(' ')[0] || 'Facture',
          customerName?.split(' ').slice(1).join(' ') || 'Customer',
          customerEmail || 'facture@makhmal.com',
          customerPhone || null,
          notes || null,
          String(subtotal),
          String(total),
          factureNumber,
        ]
      );

      // Insert items and update stock
      for (const item of items) {
        const itemId = uuidv4();
        const itemSubtotal = Number(item.price) * Number(item.quantity);
        await client.query(
          `INSERT INTO order_item(id,order_id,product_id,product_name,product_thumbnail,brand_name,price,quantity,subtotal,created_at)
           VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW())`,
          [
            itemId,
            orderId,
            item.productId || null,
            item.productName || 'Manual Sale',
            item.productThumbnail || null,
            item.brandName || null,
            String(item.price),
            Number(item.quantity),
            String(itemSubtotal),
          ]
        );
        // Decrement stock
        if (item.productId) {
          await client.query(
            'UPDATE product SET stock = GREATEST(stock - $1, 0) WHERE id = $2',
            [Number(item.quantity), item.productId]
          );
        }
      }

      await client.query('COMMIT');
      
      const { rows: facture } = await pool.query(
        'SELECT id, order_number, status, first_name, last_name, email, phone, notes, CAST(subtotal AS NUMERIC(12,2)) AS subtotal, CAST(total AS NUMERIC(12,2)) AS total, is_facture, facture_number, created_at FROM "order" WHERE id = $1',
        [orderId]
      );
      
      res.status(201).json(facture[0]);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Facture creation error:', error);
    res.status(500).json({ message: error.message || 'Failed to create facture' });
  }
});

facturesRoutes.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, order_number, status, first_name, last_name, email, phone, notes, 
       CAST(subtotal AS NUMERIC(12,2)) AS subtotal, CAST(total AS NUMERIC(12,2)) AS total, 
       is_facture, facture_number, created_at 
       FROM "order" WHERE is_facture = true ORDER BY created_at DESC`
    );
    
    const orderIds = rows.map((o: any) => o.id);
    let items: any[] = [];
    if (orderIds.length) {
      const { rows: orderItems } = await pool.query(
        'SELECT id, order_id, product_id, product_name, brand_name, CAST(price AS NUMERIC(12,2)) AS price, CAST(quantity AS INTEGER) AS quantity, CAST(subtotal AS NUMERIC(12,2)) AS subtotal FROM order_item WHERE order_id = ANY($1)',
        [orderIds]
      );
      items = orderItems;
    }
    
    const withItems = rows.map((o: any) => ({ ...o, items: items.filter((i: any) => i.order_id === o.id) }));
    res.json(withItems);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch factures' });
  }
});