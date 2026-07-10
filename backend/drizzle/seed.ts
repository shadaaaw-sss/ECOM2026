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
        category_id varchar(36),
        thumbnail_url text,
        stock integer DEFAULT 10,
        original_price numeric(10,2) DEFAULT 0,
        discount_percent integer DEFAULT 0,
        is_featured boolean DEFAULT false,
        is_new boolean DEFAULT false,
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

    // Insert starter catalog data
    const brand1 = uuidv4();
    const brand2 = uuidv4();
    const brand3 = uuidv4();
    const category1 = uuidv4();
    const category2 = uuidv4();
    const category3 = uuidv4();

    await client.query(
      'INSERT INTO brand(id,name,description,logo_url,sort_order,is_featured,is_active) VALUES($1,$2,$3,$4,$5,$6,$7)',
      [brand1, 'Lancôme', 'Luxury skincare and fragrance', null, 1, true, true]
    );
    await client.query(
      'INSERT INTO brand(id,name,description,logo_url,sort_order,is_featured,is_active) VALUES($1,$2,$3,$4,$5,$6,$7)',
      [brand2, 'Estée Lauder', 'Prestige beauty essentials', null, 2, true, true]
    );
    await client.query(
      'INSERT INTO brand(id,name,description,logo_url,sort_order,is_featured,is_active) VALUES($1,$2,$3,$4,$5,$6,$7)',
      [brand3, 'The Ordinary', 'Clinical skincare with simplicity', null, 3, true, true]
    );

    await client.query(
      'INSERT INTO category(id,name,description,image_url,parent_id,sort_order,is_active) VALUES($1,$2,$3,$4,$5,$6,$7)',
      [category1, 'Skincare', 'Daily essentials and skincare routines', null, null, 1, true]
    );
    await client.query(
      'INSERT INTO category(id,name,description,image_url,parent_id,sort_order,is_active) VALUES($1,$2,$3,$4,$5,$6,$7)',
      [category2, 'Makeup', 'Color, complexion and finishing beauty', null, null, 2, true]
    );
    await client.query(
      'INSERT INTO category(id,name,description,image_url,parent_id,sort_order,is_active) VALUES($1,$2,$3,$4,$5,$6,$7)',
      [category3, 'Fragrance', 'Signature scents and everyday luxury', null, null, 3, true]
    );

    const product1 = uuidv4();
    const product2 = uuidv4();
    const product3 = uuidv4();
    const product4 = uuidv4();
    await client.query(
      'INSERT INTO product(id,name,description,price,brand_id,category_id,thumbnail_url,stock,original_price,discount_percent,is_featured,is_new,is_active) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)',
      [product1, 'Velvet Cream Cleanser', 'Gentle cleansing cream for dry and sensitive skin', 42.00, brand1, category1, 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80', 12, 55.00, 20, true, true, true]
    );
    await client.query(
      'INSERT INTO product(id,name,description,price,brand_id,category_id,thumbnail_url,stock,original_price,discount_percent,is_featured,is_new,is_active) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)',
      [product2, 'Radiance Serum', 'Vitamin-rich serum for a brighter glow', 68.00, brand2, category1, 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=800&q=80', 8, 85.00, 20, true, false, true]
    );
    await client.query(
      'INSERT INTO product(id,name,description,price,brand_id,category_id,thumbnail_url,stock,original_price,discount_percent,is_featured,is_new,is_active) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)',
      [product3, 'Silk Foundation', 'Lightweight liquid foundation with buildable coverage', 49.00, brand2, category2, 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80', 15, 65.00, 25, true, false, true]
    );
    await client.query(
      'INSERT INTO product(id,name,description,price,brand_id,category_id,thumbnail_url,stock,original_price,discount_percent,is_featured,is_new,is_active) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)',
      [product4, 'Golden Eau de Parfum', 'A luminous fragrance with woody and floral notes', 92.00, brand3, category3, 'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?auto=format&fit=crop&w=800&q=80', 5, 120.00, 23, true, true, true]
    );

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
