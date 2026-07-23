import { pool } from './db.js';

const initDatabase = async () => {
  try {
    console.log('🔧 Checking database schema...');

    // Check if tables exist first
    const { rows } = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'product', 'category', 'brand', 'order', 'order_item')
    `);

    const existingTables = rows.map(r => r.table_name);

    // Idempotent migrations for already-provisioned databases (e.g. Railway prod)
    // that pre-date the 'paid' order status and facture_status column. These must
    // run before the early-return below, since that guard skips the CREATE TABLE
    // block entirely once the core tables already exist.
    if (existingTables.includes('order')) {
      try {
        await pool.query(`ALTER TABLE "order" ADD COLUMN IF NOT EXISTS facture_status VARCHAR(50);`);
        await pool.query(`
          DO $$
          DECLARE
            cname text;
          BEGIN
            SELECT con.conname INTO cname
            FROM pg_constraint con
            JOIN pg_class rel ON rel.oid = con.conrelid
            WHERE rel.relname = 'order' AND con.contype = 'c'
              AND pg_get_constraintdef(con.oid) ILIKE '%status%IN%';

            IF cname IS NOT NULL THEN
              EXECUTE format('ALTER TABLE "order" DROP CONSTRAINT %I', cname);
            END IF;

            ALTER TABLE "order" ADD CONSTRAINT order_status_check
              CHECK (status IN ('pending','confirmed','paid','processing','shipped','delivered','cancelled','refunded'));
          END $$;
        `);
        console.log('✅ Order table migrated (paid status + facture_status column)');
      } catch (migrationError: any) {
        console.error('❌ Order table migration failed:', migrationError.message);
        throw migrationError;
      }
    }

    // Idempotent migration for brand: ensure the banner_media column exists
    // even on already-provisioned databases where the early return below
    // would skip the CREATE TABLE block.
    if (existingTables.includes('brand')) {
      try {
        await pool.query(`ALTER TABLE brand ADD COLUMN IF NOT EXISTS banner_media JSONB DEFAULT '[]'::jsonb;`);
        console.log('✅ Brand table migrated (banner_media column)');
      } catch (migrationError: any) {
        console.error('❌ Brand table migration failed:', migrationError.message);
        throw migrationError;
      }
    }

    // Idempotent migration for product_image: ensure the table and its
    // multi-media columns (type, is_main) exist even on already-provisioned
    // databases where the early return below would skip the CREATE TABLE block.
    if (existingTables.includes('product')) {
      try {
        await pool.query(`
          CREATE TABLE IF NOT EXISTS product_image (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            product_id UUID NOT NULL REFERENCES product(id) ON DELETE CASCADE,
            url TEXT NOT NULL,
            alt_text TEXT,
            sort_order INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
          CREATE INDEX IF NOT EXISTS idx_product_image_product_id ON product_image(product_id);
        `);
        await pool.query(`ALTER TABLE product_image ADD COLUMN IF NOT EXISTS type VARCHAR(10) NOT NULL DEFAULT 'image';`);
        await pool.query(`ALTER TABLE product_image ADD COLUMN IF NOT EXISTS is_main BOOLEAN DEFAULT false;`);
        console.log('✅ product_image table migrated (type + is_main columns)');
      } catch (migrationError: any) {
        console.error('❌ product_image table migration failed:', migrationError.message);
        throw migrationError;
      }
    }

    if (existingTables.length >= 6) {
      console.log('✅ Database schema already exists');
      return true;
    }

    console.log('📦 Creating database schema...');

    // Create tables without dropping existing ones
    await pool.query(`
      CREATE EXTENSION IF NOT EXISTS "pgcrypto";

      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255),
        role VARCHAR(20) NOT NULL DEFAULT 'CLIENT' CHECK (role IN ('CLIENT','ADMIN','SUPERADMIN')),
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        is_email_verified BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

      CREATE TABLE IF NOT EXISTS brand (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL UNIQUE,
        slug VARCHAR(255) NOT NULL UNIQUE,
        logo_url TEXT,
        description TEXT,
        is_featured BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        sort_order INTEGER DEFAULT 0,
        banner_media JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_brand_slug ON brand(slug);

      CREATE TABLE IF NOT EXISTS category (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL UNIQUE,
        slug VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        image_url TEXT,
        parent_id UUID REFERENCES category(id) ON DELETE SET NULL,
        is_active BOOLEAN DEFAULT true,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_category_slug ON category(slug);

      CREATE TABLE IF NOT EXISTS product (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        price DECIMAL(12,2) NOT NULL,
        original_price DECIMAL(12,2),
        discount_percent INTEGER DEFAULT 0,
        brand_id UUID REFERENCES brand(id) ON DELETE SET NULL,
        category_id UUID REFERENCES category(id) ON DELETE SET NULL,
        thumbnail_url TEXT,
        stock INTEGER DEFAULT 0,
        is_featured BOOLEAN DEFAULT false,
        is_new BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        tags TEXT[],
        meta_title VARCHAR(255),
        meta_description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_product_slug ON product(slug);

      CREATE TABLE IF NOT EXISTS product_image (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id UUID NOT NULL REFERENCES product(id) ON DELETE CASCADE,
        url TEXT NOT NULL,
        alt_text TEXT,
        type VARCHAR(10) NOT NULL DEFAULT 'image' CHECK (type IN ('image', 'video')),
        is_main BOOLEAN DEFAULT false,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_product_image_product_id ON product_image(product_id);

      CREATE TABLE IF NOT EXISTS shipping_method (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS coupon (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        discount_type VARCHAR(50) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
        discount_value DECIMAL(10,2) NOT NULL,
        max_uses INTEGER,
        used_count INTEGER DEFAULT 0,
        min_order_amount DECIMAL(10,2),
        valid_from TIMESTAMP,
        valid_until TIMESTAMP,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "order" (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        order_number VARCHAR(100) NOT NULL UNIQUE,
        status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','paid','processing','shipped','delivered','cancelled','refunded')),
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        address_line1 VARCHAR(255) NOT NULL,
        address_line2 VARCHAR(255),
        city VARCHAR(100) NOT NULL,
        postal_code VARCHAR(20),
        country VARCHAR(100) DEFAULT 'Qatar',
        notes TEXT,
        shipping_method VARCHAR(100) DEFAULT 'standard',
        payment_method VARCHAR(100) DEFAULT 'cash_on_delivery',
        subtotal DECIMAL(12,2) NOT NULL,
        shipping_fee DECIMAL(10,2) DEFAULT 0,
        tax_amount DECIMAL(10,2) DEFAULT 0,
        discount_amount DECIMAL(10,2) DEFAULT 0,
        total DECIMAL(12,2) NOT NULL,
        coupon_code VARCHAR(100),
        is_facture BOOLEAN DEFAULT false,
        facture_number VARCHAR(100) UNIQUE,
        facture_status VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_order_order_number ON "order"(order_number);

      CREATE TABLE IF NOT EXISTS order_item (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID NOT NULL REFERENCES "order"(id) ON DELETE CASCADE,
        product_id UUID REFERENCES product(id) ON DELETE SET NULL,
        product_name VARCHAR(255) NOT NULL,
        product_thumbnail TEXT,
        brand_name VARCHAR(255),
        price DECIMAL(12,2) NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
        subtotal DECIMAL(12,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_order_item_order_id ON order_item(order_id);

      CREATE TABLE IF NOT EXISTS wishlist_item (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        product_id UUID NOT NULL REFERENCES product(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, product_id)
      );

      CREATE TABLE IF NOT EXISTS setting (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        setting_key VARCHAR(255) NOT NULL UNIQUE,
        setting_value TEXT,
        setting_type VARCHAR(50) DEFAULT 'string',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_product_brand_id ON product(brand_id);
      CREATE INDEX IF NOT EXISTS idx_product_category_id ON product(category_id);
      CREATE INDEX IF NOT EXISTS idx_product_is_active ON product(is_active);
      CREATE INDEX IF NOT EXISTS idx_wishlist_item_user_id ON wishlist_item(user_id);

      -- Insert default admin user if not exists
      INSERT INTO users (email, password, role, first_name, last_name)
      VALUES (
        'admin@makhmal.com',
        '$2a$10$2qnrhODy3lhttfjNlJTtVed8BwKhoWN142yjv.Wqh8IMb.yxB/gs6',
        'ADMIN',
        'Admin',
        'User'
      )
      ON CONFLICT (email) DO UPDATE SET
        password = EXCLUDED.password,
        role = EXCLUDED.role,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name;
    `);

    console.log('✅ Database initialized successfully!');
    console.log('📧 Admin Email: admin@makhmal.com (password: admin123)');
    console.log('');

    return true;
  } catch (error: any) {
    console.error('❌ Database initialization failed:', error.message);
    throw error;
  }
};

export default initDatabase;