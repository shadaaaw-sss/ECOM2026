import dotenv from 'dotenv';
import { pool } from '../src/db.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

async function run() {
  console.log('Recreating database schema (this will DROP existing tables)...');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Drop tables if exist (drop dependent tables first)
    await client.query(`
      DROP TABLE IF EXISTS order_item;
      DROP TABLE IF EXISTS "order";
      DROP TABLE IF EXISTS wishlist_item;
      DROP TABLE IF EXISTS product;
      DROP TABLE IF EXISTS brand;
      DROP TABLE IF EXISTS category;
      DROP TABLE IF EXISTS shipping_method;
      DROP TABLE IF EXISTS newsletter_subscriber;
      DROP TABLE IF EXISTS coupon;
      DROP TABLE IF EXISTS setting;
      DROP TABLE IF EXISTS "user";
    `);

    // Create minimal tables
    await client.query(`
      CREATE TABLE "user" (
        id varchar(36) PRIMARY KEY,
        email text UNIQUE NOT NULL,
        password text NOT NULL,
        role varchar(20) NOT NULL DEFAULT 'USER',
        is_email_verified boolean DEFAULT false,
        created_at timestamptz DEFAULT NOW()
      );
      CREATE TABLE brand (
        id varchar(36) PRIMARY KEY,
        name text NOT NULL,
        description text,
        logo_url text,
        sort_order integer DEFAULT 0,
        is_featured boolean DEFAULT false,
        is_active boolean DEFAULT true,
        created_at timestamptz DEFAULT NOW()
      );
      CREATE TABLE shipping_method (
        id varchar(36) PRIMARY KEY,
        name text NOT NULL,
        description text,
        price numeric(10,2) DEFAULT 0,
        is_active boolean DEFAULT true,
        created_at timestamptz DEFAULT NOW()
      );
        CREATE TABLE category (
          id varchar(36) PRIMARY KEY,
          name text NOT NULL,
          description text,
          image_url text,
          parent_id varchar(36),
          sort_order integer DEFAULT 0,
          is_active boolean DEFAULT true,
          created_at timestamptz DEFAULT NOW()
        );
      CREATE TABLE product (
        id varchar(36) PRIMARY KEY,
        name text NOT NULL,
        description text,
        price numeric(10,2) DEFAULT 0,
        brand_id varchar(36),
        is_active boolean DEFAULT true,
        created_at timestamptz DEFAULT NOW()
      );
        CREATE TABLE order_item (
          id varchar(36) PRIMARY KEY,
          order_id varchar(36) NOT NULL,
          product_id varchar(36),
          product_name text NOT NULL,
          product_thumbnail text,
          brand_name text,
          price numeric(12,2) DEFAULT 0,
          quantity integer DEFAULT 1,
          subtotal numeric(12,2) DEFAULT 0,
          created_at timestamptz DEFAULT NOW()
        );
        CREATE TABLE "order" (
          id varchar(36) PRIMARY KEY,
          user_id varchar(36),
          order_number text NOT NULL,
          status varchar(20) DEFAULT 'PENDING',
          first_name text NOT NULL,
          last_name text NOT NULL,
          email text NOT NULL,
          phone text,
          address_line1 text NOT NULL,
          address_line2 text,
          city text NOT NULL,
          postal_code text,
          country text NOT NULL,
          notes text,
          shipping_method text,
          payment_method text,
          subtotal numeric(12,2) DEFAULT 0,
          shipping_fee numeric(12,2) DEFAULT 0,
          tax_amount numeric(12,2) DEFAULT 0,
          discount_amount numeric(12,2) DEFAULT 0,
          total numeric(12,2) DEFAULT 0,
          coupon_code text,
          created_at timestamptz DEFAULT NOW()
        );
        CREATE TABLE newsletter_subscriber (
          id varchar(36) PRIMARY KEY,
          email text NOT NULL,
          subscribed_at timestamptz DEFAULT NOW()
        );
        CREATE TABLE coupon (
          id varchar(36) PRIMARY KEY,
          code varchar(50) NOT NULL,
          discount_percent integer DEFAULT 0,
          starts_at timestamptz,
          ends_at timestamptz,
          created_at timestamptz DEFAULT NOW()
        );
        CREATE TABLE wishlist_item (
          id varchar(36) PRIMARY KEY,
          user_id varchar(36) NOT NULL,
          product_id varchar(36) NOT NULL,
          created_at timestamptz DEFAULT NOW()
        );
        CREATE TABLE setting (
          id varchar(36) PRIMARY KEY,
          key text NOT NULL,
          value text
        );
    `);

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@makhmal.com';
    const adminPass = process.env.ADMIN_PASSWORD || 'Admin123!';
    const hashed = await bcrypt.hash(adminPass, 10);
    const adminId = uuidv4();
    await client.query('INSERT INTO "user"(id,email,password,role) VALUES($1,$2,$3,$4)', [adminId, adminEmail, hashed, 'ADMIN']);

    // Insert default shipping methods
    const ship1 = uuidv4();
    const ship2 = uuidv4();
    await client.query('INSERT INTO shipping_method(id,name,description,price,is_active) VALUES($1,$2,$3,$4,$5)', [ship1, 'Standard', 'Standard shipping', 5.00, true]);
    await client.query('INSERT INTO shipping_method(id,name,description,price,is_active) VALUES($1,$2,$3,$4,$5)', [ship2, 'Express', 'Faster delivery', 15.00, true]);

    await client.query('COMMIT');
    console.log('Seed completed. Admin:', adminEmail);
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Seed failed', e);
  } finally {
    client.release();
    process.exit(0);
  }
}

run();
