import 'dotenv/config';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../src/db.js';

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Clear all existing data
    await client.query('DELETE FROM order_item');
    await client.query('DELETE FROM "order"');
    await client.query('DELETE FROM wishlist_item');
    await client.query('DELETE FROM product_image');
    await client.query('DELETE FROM product');
    await client.query('DELETE FROM category');
    await client.query('DELETE FROM brand');
    await client.query('DELETE FROM shipping_method');
    await client.query('DELETE FROM coupon');
    await client.query('DELETE FROM newsletter_subscriber');
    await client.query('DELETE FROM setting');

    // Create only admin user - no predefined data
    const adminId = uuidv4();
    await client.query(
      'INSERT INTO users(id,email,password,first_name,last_name,role,is_email_verified,created_at) VALUES($1,$2,$3,$4,$5,$6,true,NOW())',
      [adminId, 'admin@makhmal.com', '$2a$10$rQ7Hx8q9Y2zB5vR8wX3yUeJ5nK2mP4qS7tU9vW2xY4zA6bC8dE0fG', 'Admin', 'User', 'SUPERADMIN']
    );

    await client.query('COMMIT');
    console.log('✅ Database cleared and admin user created');
    console.log('📧 Email: admin@makhmal.com');
    console.log('🔑 Password: admin123');
    console.log('🎉 Database seeded successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Seed error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();