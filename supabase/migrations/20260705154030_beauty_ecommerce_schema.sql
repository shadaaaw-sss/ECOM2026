/*
# Beauty E-Commerce Complete Schema

## Summary
Creates the full database schema for a premium beauty e-commerce platform (Makhmal-style).
Includes product catalog, user authentication integration, orders, cart, wishlist, promotions, and admin configuration.

## New Tables

### Core Catalog
- `brands` - Brand information (name, logo, description, slug, status)
- `categories` - Product categories (Skincare, Makeup, etc.) with images
- `sub_categories` - Sub-categories linked to categories
- `products` - Full product catalog with pricing, stock, SEO fields
- `product_images` - Multiple images per product

### Commerce
- `cart_items` - Shopping cart (session-based or user-linked)
- `wishlist_items` - User wishlists
- `orders` - Customer orders with status tracking
- `order_items` - Line items per order
- `addresses` - Saved customer addresses
- `coupons` - Discount codes (percentage or fixed amount)

### Content & Marketing
- `banners` - Hero and promotional banners
- `newsletter_subscribers` - Email newsletter list
- `reviews` - Product reviews from authenticated users

### Configuration
- `settings` - Global store settings (name, logo, tax, shipping)
- `audit_logs` - Admin action logging

## Security
- RLS enabled on all tables
- Public read on brands, categories, sub_categories, products, product_images, banners
- Authenticated users own their cart, wishlist, orders, addresses, reviews
- Admin role check via user metadata for sensitive operations
- Newsletter subscribers: anon insert allowed for public sign-up
*/

-- ========== BRANDS ==========
CREATE TABLE IF NOT EXISTS brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  logo_url text,
  description text,
  is_featured boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "brands_select" ON brands;
CREATE POLICY "brands_select" ON brands FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "brands_insert_admin" ON brands;
CREATE POLICY "brands_insert_admin" ON brands FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt()->'user_metadata'->>'role') = 'admin');

DROP POLICY IF EXISTS "brands_update_admin" ON brands;
CREATE POLICY "brands_update_admin" ON brands FOR UPDATE TO authenticated
  USING ((auth.jwt()->'user_metadata'->>'role') = 'admin')
  WITH CHECK ((auth.jwt()->'user_metadata'->>'role') = 'admin');

DROP POLICY IF EXISTS "brands_delete_admin" ON brands;
CREATE POLICY "brands_delete_admin" ON brands FOR DELETE TO authenticated
  USING ((auth.jwt()->'user_metadata'->>'role') = 'admin');

-- ========== CATEGORIES ==========
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  image_url text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "categories_select" ON categories;
CREATE POLICY "categories_select" ON categories FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "categories_insert_admin" ON categories;
CREATE POLICY "categories_insert_admin" ON categories FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt()->'user_metadata'->>'role') = 'admin');

DROP POLICY IF EXISTS "categories_update_admin" ON categories;
CREATE POLICY "categories_update_admin" ON categories FOR UPDATE TO authenticated
  USING ((auth.jwt()->'user_metadata'->>'role') = 'admin')
  WITH CHECK ((auth.jwt()->'user_metadata'->>'role') = 'admin');

DROP POLICY IF EXISTS "categories_delete_admin" ON categories;
CREATE POLICY "categories_delete_admin" ON categories FOR DELETE TO authenticated
  USING ((auth.jwt()->'user_metadata'->>'role') = 'admin');

-- ========== SUB CATEGORIES ==========
CREATE TABLE IF NOT EXISTS sub_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  image_url text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sub_categories_category_id_idx ON sub_categories(category_id);

ALTER TABLE sub_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sub_categories_select" ON sub_categories;
CREATE POLICY "sub_categories_select" ON sub_categories FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "sub_categories_insert_admin" ON sub_categories;
CREATE POLICY "sub_categories_insert_admin" ON sub_categories FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt()->'user_metadata'->>'role') = 'admin');

DROP POLICY IF EXISTS "sub_categories_update_admin" ON sub_categories;
CREATE POLICY "sub_categories_update_admin" ON sub_categories FOR UPDATE TO authenticated
  USING ((auth.jwt()->'user_metadata'->>'role') = 'admin')
  WITH CHECK ((auth.jwt()->'user_metadata'->>'role') = 'admin');

DROP POLICY IF EXISTS "sub_categories_delete_admin" ON sub_categories;
CREATE POLICY "sub_categories_delete_admin" ON sub_categories FOR DELETE TO authenticated
  USING ((auth.jwt()->'user_metadata'->>'role') = 'admin');

-- ========== PRODUCTS ==========
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  brand_id uuid REFERENCES brands(id) ON DELETE SET NULL,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  sub_category_id uuid REFERENCES sub_categories(id) ON DELETE SET NULL,
  price numeric(10,2) NOT NULL,
  original_price numeric(10,2),
  discount_percent integer DEFAULT 0,
  sku text UNIQUE,
  stock integer NOT NULL DEFAULT 0,
  weight numeric(8,2),
  thumbnail_url text,
  is_featured boolean NOT NULL DEFAULT false,
  is_new boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  tags text[] DEFAULT '{}',
  meta_title text,
  meta_description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS products_brand_id_idx ON products(brand_id);
CREATE INDEX IF NOT EXISTS products_category_id_idx ON products(category_id);
CREATE INDEX IF NOT EXISTS products_is_featured_idx ON products(is_featured);
CREATE INDEX IF NOT EXISTS products_is_new_idx ON products(is_new);
CREATE INDEX IF NOT EXISTS products_slug_idx ON products(slug);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "products_select" ON products;
CREATE POLICY "products_select" ON products FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "products_insert_admin" ON products;
CREATE POLICY "products_insert_admin" ON products FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt()->'user_metadata'->>'role') = 'admin');

DROP POLICY IF EXISTS "products_update_admin" ON products;
CREATE POLICY "products_update_admin" ON products FOR UPDATE TO authenticated
  USING ((auth.jwt()->'user_metadata'->>'role') = 'admin')
  WITH CHECK ((auth.jwt()->'user_metadata'->>'role') = 'admin');

DROP POLICY IF EXISTS "products_delete_admin" ON products;
CREATE POLICY "products_delete_admin" ON products FOR DELETE TO authenticated
  USING ((auth.jwt()->'user_metadata'->>'role') = 'admin');

-- ========== PRODUCT IMAGES ==========
CREATE TABLE IF NOT EXISTS product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url text NOT NULL,
  alt_text text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS product_images_product_id_idx ON product_images(product_id);

ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "product_images_select" ON product_images;
CREATE POLICY "product_images_select" ON product_images FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "product_images_insert_admin" ON product_images;
CREATE POLICY "product_images_insert_admin" ON product_images FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt()->'user_metadata'->>'role') = 'admin');

DROP POLICY IF EXISTS "product_images_update_admin" ON product_images;
CREATE POLICY "product_images_update_admin" ON product_images FOR UPDATE TO authenticated
  USING ((auth.jwt()->'user_metadata'->>'role') = 'admin')
  WITH CHECK ((auth.jwt()->'user_metadata'->>'role') = 'admin');

DROP POLICY IF EXISTS "product_images_delete_admin" ON product_images;
CREATE POLICY "product_images_delete_admin" ON product_images FOR DELETE TO authenticated
  USING ((auth.jwt()->'user_metadata'->>'role') = 'admin');

-- ========== CART ITEMS ==========
CREATE TABLE IF NOT EXISTS cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);

CREATE INDEX IF NOT EXISTS cart_items_user_id_idx ON cart_items(user_id);

ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cart_select_own" ON cart_items;
CREATE POLICY "cart_select_own" ON cart_items FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "cart_insert_own" ON cart_items;
CREATE POLICY "cart_insert_own" ON cart_items FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "cart_update_own" ON cart_items;
CREATE POLICY "cart_update_own" ON cart_items FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "cart_delete_own" ON cart_items;
CREATE POLICY "cart_delete_own" ON cart_items FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ========== WISHLIST ITEMS ==========
CREATE TABLE IF NOT EXISTS wishlist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);

CREATE INDEX IF NOT EXISTS wishlist_items_user_id_idx ON wishlist_items(user_id);

ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wishlist_select_own" ON wishlist_items;
CREATE POLICY "wishlist_select_own" ON wishlist_items FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "wishlist_insert_own" ON wishlist_items;
CREATE POLICY "wishlist_insert_own" ON wishlist_items FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "wishlist_update_own" ON wishlist_items;
CREATE POLICY "wishlist_update_own" ON wishlist_items FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "wishlist_delete_own" ON wishlist_items;
CREATE POLICY "wishlist_delete_own" ON wishlist_items FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ========== ADDRESSES ==========
CREATE TABLE IF NOT EXISTS addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  phone text,
  address_line1 text NOT NULL,
  address_line2 text,
  city text NOT NULL,
  postal_code text,
  country text NOT NULL DEFAULT 'Morocco',
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS addresses_user_id_idx ON addresses(user_id);

ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "addresses_select_own" ON addresses;
CREATE POLICY "addresses_select_own" ON addresses FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "addresses_insert_own" ON addresses;
CREATE POLICY "addresses_insert_own" ON addresses FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "addresses_update_own" ON addresses;
CREATE POLICY "addresses_update_own" ON addresses FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "addresses_delete_own" ON addresses;
CREATE POLICY "addresses_delete_own" ON addresses FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ========== COUPONS ==========
CREATE TABLE IF NOT EXISTS coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  description text,
  type text NOT NULL DEFAULT 'percentage' CHECK (type IN ('percentage', 'fixed')),
  value numeric(10,2) NOT NULL,
  min_order_amount numeric(10,2) DEFAULT 0,
  max_uses integer,
  used_count integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  starts_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "coupons_select" ON coupons;
CREATE POLICY "coupons_select" ON coupons FOR SELECT TO anon, authenticated USING (is_active = true);

DROP POLICY IF EXISTS "coupons_insert_admin" ON coupons;
CREATE POLICY "coupons_insert_admin" ON coupons FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt()->'user_metadata'->>'role') = 'admin');

DROP POLICY IF EXISTS "coupons_update_admin" ON coupons;
CREATE POLICY "coupons_update_admin" ON coupons FOR UPDATE TO authenticated
  USING ((auth.jwt()->'user_metadata'->>'role') = 'admin')
  WITH CHECK ((auth.jwt()->'user_metadata'->>'role') = 'admin');

DROP POLICY IF EXISTS "coupons_delete_admin" ON coupons;
CREATE POLICY "coupons_delete_admin" ON coupons FOR DELETE TO authenticated
  USING ((auth.jwt()->'user_metadata'->>'role') = 'admin');

-- ========== ORDERS ==========
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  order_number text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','processing','shipped','delivered','cancelled','refunded')),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  phone text,
  address_line1 text NOT NULL,
  address_line2 text,
  city text NOT NULL,
  postal_code text,
  country text NOT NULL DEFAULT 'Morocco',
  notes text,
  shipping_method text DEFAULT 'standard',
  payment_method text DEFAULT 'cash_on_delivery',
  subtotal numeric(10,2) NOT NULL,
  shipping_fee numeric(10,2) NOT NULL DEFAULT 0,
  tax_amount numeric(10,2) NOT NULL DEFAULT 0,
  discount_amount numeric(10,2) NOT NULL DEFAULT 0,
  total numeric(10,2) NOT NULL,
  coupon_code text,
  coupon_id uuid REFERENCES coupons(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS orders_user_id_idx ON orders(user_id);
CREATE INDEX IF NOT EXISTS orders_status_idx ON orders(status);
CREATE INDEX IF NOT EXISTS orders_order_number_idx ON orders(order_number);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "orders_select_own" ON orders;
CREATE POLICY "orders_select_own" ON orders FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR (auth.jwt()->'user_metadata'->>'role') = 'admin');

DROP POLICY IF EXISTS "orders_insert_own" ON orders;
CREATE POLICY "orders_insert_own" ON orders FOR INSERT TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "orders_update_admin" ON orders;
CREATE POLICY "orders_update_admin" ON orders FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR (auth.jwt()->'user_metadata'->>'role') = 'admin')
  WITH CHECK (auth.uid() = user_id OR (auth.jwt()->'user_metadata'->>'role') = 'admin');

DROP POLICY IF EXISTS "orders_delete_admin" ON orders;
CREATE POLICY "orders_delete_admin" ON orders FOR DELETE TO authenticated
  USING ((auth.jwt()->'user_metadata'->>'role') = 'admin');

-- ========== ORDER ITEMS ==========
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  product_thumbnail text,
  brand_name text,
  price numeric(10,2) NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  subtotal numeric(10,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON order_items(order_id);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "order_items_select" ON order_items;
CREATE POLICY "order_items_select" ON order_items FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders o WHERE o.id = order_items.order_id
        AND (o.user_id = auth.uid() OR (auth.jwt()->'user_metadata'->>'role') = 'admin')
    )
  );

DROP POLICY IF EXISTS "order_items_insert" ON order_items;
CREATE POLICY "order_items_insert" ON order_items FOR INSERT TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "order_items_update_admin" ON order_items;
CREATE POLICY "order_items_update_admin" ON order_items FOR UPDATE TO authenticated
  USING ((auth.jwt()->'user_metadata'->>'role') = 'admin')
  WITH CHECK ((auth.jwt()->'user_metadata'->>'role') = 'admin');

DROP POLICY IF EXISTS "order_items_delete_admin" ON order_items;
CREATE POLICY "order_items_delete_admin" ON order_items FOR DELETE TO authenticated
  USING ((auth.jwt()->'user_metadata'->>'role') = 'admin');

-- ========== REVIEWS ==========
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title text,
  body text,
  is_approved boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);

CREATE INDEX IF NOT EXISTS reviews_product_id_idx ON reviews(product_id);
CREATE INDEX IF NOT EXISTS reviews_user_id_idx ON reviews(user_id);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reviews_select" ON reviews;
CREATE POLICY "reviews_select" ON reviews FOR SELECT TO anon, authenticated
  USING (is_approved = true OR auth.uid() = user_id OR (auth.jwt()->'user_metadata'->>'role') = 'admin');

DROP POLICY IF EXISTS "reviews_insert_own" ON reviews;
CREATE POLICY "reviews_insert_own" ON reviews FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "reviews_update_own" ON reviews;
CREATE POLICY "reviews_update_own" ON reviews FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR (auth.jwt()->'user_metadata'->>'role') = 'admin')
  WITH CHECK (auth.uid() = user_id OR (auth.jwt()->'user_metadata'->>'role') = 'admin');

DROP POLICY IF EXISTS "reviews_delete_own" ON reviews;
CREATE POLICY "reviews_delete_own" ON reviews FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR (auth.jwt()->'user_metadata'->>'role') = 'admin');

-- ========== BANNERS ==========
CREATE TABLE IF NOT EXISTS banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subtitle text,
  description text,
  image_url text,
  link_url text,
  button_text text,
  type text NOT NULL DEFAULT 'hero' CHECK (type IN ('hero','promo','category')),
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE banners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "banners_select" ON banners;
CREATE POLICY "banners_select" ON banners FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "banners_insert_admin" ON banners;
CREATE POLICY "banners_insert_admin" ON banners FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt()->'user_metadata'->>'role') = 'admin');

DROP POLICY IF EXISTS "banners_update_admin" ON banners;
CREATE POLICY "banners_update_admin" ON banners FOR UPDATE TO authenticated
  USING ((auth.jwt()->'user_metadata'->>'role') = 'admin')
  WITH CHECK ((auth.jwt()->'user_metadata'->>'role') = 'admin');

DROP POLICY IF EXISTS "banners_delete_admin" ON banners;
CREATE POLICY "banners_delete_admin" ON banners FOR DELETE TO authenticated
  USING ((auth.jwt()->'user_metadata'->>'role') = 'admin');

-- ========== NEWSLETTER SUBSCRIBERS ==========
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  subscribed_at timestamptz DEFAULT now()
);

ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "newsletter_insert" ON newsletter_subscribers;
CREATE POLICY "newsletter_insert" ON newsletter_subscribers FOR INSERT TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "newsletter_select_admin" ON newsletter_subscribers;
CREATE POLICY "newsletter_select_admin" ON newsletter_subscribers FOR SELECT TO authenticated
  USING ((auth.jwt()->'user_metadata'->>'role') = 'admin');

DROP POLICY IF EXISTS "newsletter_update_admin" ON newsletter_subscribers;
CREATE POLICY "newsletter_update_admin" ON newsletter_subscribers FOR UPDATE TO authenticated
  USING ((auth.jwt()->'user_metadata'->>'role') = 'admin')
  WITH CHECK ((auth.jwt()->'user_metadata'->>'role') = 'admin');

DROP POLICY IF EXISTS "newsletter_delete_admin" ON newsletter_subscribers;
CREATE POLICY "newsletter_delete_admin" ON newsletter_subscribers FOR DELETE TO authenticated
  USING ((auth.jwt()->'user_metadata'->>'role') = 'admin');

-- ========== SETTINGS ==========
CREATE TABLE IF NOT EXISTS settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "settings_select" ON settings;
CREATE POLICY "settings_select" ON settings FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "settings_insert_admin" ON settings;
CREATE POLICY "settings_insert_admin" ON settings FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt()->'user_metadata'->>'role') = 'admin');

DROP POLICY IF EXISTS "settings_update_admin" ON settings;
CREATE POLICY "settings_update_admin" ON settings FOR UPDATE TO authenticated
  USING ((auth.jwt()->'user_metadata'->>'role') = 'admin')
  WITH CHECK ((auth.jwt()->'user_metadata'->>'role') = 'admin');

DROP POLICY IF EXISTS "settings_delete_admin" ON settings;
CREATE POLICY "settings_delete_admin" ON settings FOR DELETE TO authenticated
  USING ((auth.jwt()->'user_metadata'->>'role') = 'admin');

-- ========== AUDIT LOGS ==========
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  table_name text,
  record_id uuid,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_logs_user_id_idx ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx ON audit_logs(created_at);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_logs_select_admin" ON audit_logs;
CREATE POLICY "audit_logs_select_admin" ON audit_logs FOR SELECT TO authenticated
  USING ((auth.jwt()->'user_metadata'->>'role') = 'admin');

DROP POLICY IF EXISTS "audit_logs_insert" ON audit_logs;
CREATE POLICY "audit_logs_insert" ON audit_logs FOR INSERT TO authenticated
  WITH CHECK (true);

-- ========== SEED DEFAULT SETTINGS ==========
INSERT INTO settings (key, value) VALUES
  ('store_name', 'Makhmal Beauty'),
  ('store_email', 'hello@makhmal.com'),
  ('store_phone', '+212 600 000 000'),
  ('store_address', 'Casablanca, Morocco'),
  ('currency', 'MAD'),
  ('tax_rate', '20'),
  ('free_shipping_threshold', '499'),
  ('standard_shipping_fee', '39'),
  ('express_shipping_fee', '79')
ON CONFLICT (key) DO NOTHING;

-- ========== SEED CATEGORIES ==========
INSERT INTO categories (name, slug, description, image_url, sort_order) VALUES
  ('Skincare', 'skincare', 'Premium skincare products for all skin types', 'https://images.pexels.com/photos/3785147/pexels-photo-3785147.jpeg?w=400', 1),
  ('Makeup', 'makeup', 'Professional makeup and cosmetics', 'https://images.pexels.com/photos/2533266/pexels-photo-2533266.jpeg?w=400', 2),
  ('Fragrances', 'fragrances', 'Luxury perfumes and fragrances', 'https://images.pexels.com/photos/965989/pexels-photo-965989.jpeg?w=400', 3),
  ('Hair Care', 'hair-care', 'Professional hair care treatments', 'https://images.pexels.com/photos/3997991/pexels-photo-3997991.jpeg?w=400', 4),
  ('Body Care', 'body-care', 'Nourishing body care essentials', 'https://images.pexels.com/photos/3737582/pexels-photo-3737582.jpeg?w=400', 5),
  ('Accessories', 'accessories', 'Beauty tools and accessories', 'https://images.pexels.com/photos/4612373/pexels-photo-4612373.jpeg?w=400', 6)
ON CONFLICT (slug) DO NOTHING;

-- ========== SEED BRANDS ==========
INSERT INTO brands (name, slug, description, logo_url, is_featured, sort_order) VALUES
  ('Lancôme', 'lancome', 'French luxury cosmetics and skincare brand', 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Lanc%C3%B4me_logo.svg/200px-Lanc%C3%B4me_logo.svg.png', true, 1),
  ('Estée Lauder', 'estee-lauder', 'Prestige skincare, makeup and fragrance', null, true, 2),
  ('The Ordinary', 'the-ordinary', 'Clinical formulations with integrity', null, true, 3),
  ('Vichy', 'vichy', 'Thermal spa water skincare from France', null, true, 4),
  ('La Roche-Posay', 'la-roche-posay', 'Dermatologist recommended skincare', null, true, 5),
  ('Evenlisse', 'evenlisse', 'Professional cosmetics and beauty care', null, true, 6)
ON CONFLICT (slug) DO NOTHING;

-- ========== SEED SAMPLE PRODUCTS ==========
DO $$
DECLARE
  v_brand_estee uuid;
  v_brand_lancome uuid;
  v_brand_ordinary uuid;
  v_brand_vichy uuid;
  v_brand_lrp uuid;
  v_cat_skincare uuid;
  v_cat_makeup uuid;
  v_cat_fragrance uuid;
BEGIN
  SELECT id INTO v_brand_estee FROM brands WHERE slug = 'estee-lauder';
  SELECT id INTO v_brand_lancome FROM brands WHERE slug = 'lancome';
  SELECT id INTO v_brand_ordinary FROM brands WHERE slug = 'the-ordinary';
  SELECT id INTO v_brand_vichy FROM brands WHERE slug = 'vichy';
  SELECT id INTO v_brand_lrp FROM brands WHERE slug = 'la-roche-posay';
  SELECT id INTO v_cat_skincare FROM categories WHERE slug = 'skincare';
  SELECT id INTO v_cat_makeup FROM categories WHERE slug = 'makeup';
  SELECT id INTO v_cat_fragrance FROM categories WHERE slug = 'fragrances';

  INSERT INTO products (name, slug, description, brand_id, category_id, price, original_price, discount_percent, stock, thumbnail_url, is_featured, is_new, tags)
  VALUES
    ('Advanced Night Repair Serum', 'estee-lauder-advanced-night-repair', 'The iconic serum that repairs visible signs of aging overnight. Clinically proven to reduce multiple signs of aging in just 4 weeks.', v_brand_estee, v_cat_skincare, 760.00, 950.00, 20, 45, 'https://images.pexels.com/photos/6621462/pexels-photo-6621462.jpeg?w=400', true, false, ARRAY['serum','anti-aging','night']),
    ('La Vie Est Belle Eau de Parfum', 'lancome-la-vie-est-belle', 'A floral gourmand fragrance, an ode to happiness and a feminine choice. Top notes of blackcurrant and pear.', v_brand_lancome, v_cat_fragrance, 890.00, 1050.00, 15, 30, 'https://images.pexels.com/photos/965989/pexels-photo-965989.jpeg?w=400', true, false, ARRAY['fragrance','floral','edp']),
    ('Niacinamide 10% + Zinc 1%', 'the-ordinary-niacinamide-10-zinc-1', 'High-strength vitamin and mineral blemish formula. Reduces the appearance of skin blemishes and congestion.', v_brand_ordinary, v_cat_skincare, 67.00, null, 0, 120, 'https://images.pexels.com/photos/7797553/pexels-photo-7797553.jpeg?w=400', true, false, ARRAY['serum','niacinamide','acne']),
    ('Mineral 89 Booster', 'vichy-mineral-89-booster', 'Daily strengthening and plumping face moisturizer with hyaluronic acid. Instantly plumps, strengthens, and protects.', v_brand_vichy, v_cat_skincare, 270.00, 340.00, 20, 60, 'https://images.pexels.com/photos/3685523/pexels-photo-3685523.jpeg?w=400', true, false, ARRAY['moisturizer','hyaluronic-acid','plumping']),
    ('Effaclar Duo+ Moisturiser', 'la-roche-posay-effaclar-duo-plus', 'Anti-acne moisturiser for oily and blemish-prone skin. Dual action formula reduces blemishes and marks.', v_brand_lrp, v_cat_skincare, 195.00, null, 0, 85, 'https://images.pexels.com/photos/3997991/pexels-photo-3997991.jpeg?w=400', false, true, ARRAY['moisturizer','acne','oily-skin']),
    ('Génifique Youth Activating Serum', 'lancome-genifique-youth-serum', 'Clinically proven to visibly reduce 10 signs of skin aging in just 7 days. Advanced formula with probiotics.', v_brand_lancome, v_cat_skincare, 850.00, 1000.00, 15, 25, 'https://images.pexels.com/photos/6621462/pexels-photo-6621462.jpeg?w=400', false, true, ARRAY['serum','anti-aging','probiotics']),
    ('Double Wear Foundation', 'estee-lauder-double-wear-foundation', '24-hour wear foundation with SPF10. Stays fresh all day without touchups. Won''t streak, smear or transfer.', v_brand_estee, v_cat_makeup, 470.00, null, 0, 70, 'https://images.pexels.com/photos/2533266/pexels-photo-2533266.jpeg?w=400', false, false, ARRAY['foundation','long-wear','spf']),
    ('Hyaluronic Acid 2% + B5', 'the-ordinary-hyaluronic-acid-2-b5', 'Multi-depth hyaluronic acid with vitamin B5. Supports surface hydration and improves suppleness.', v_brand_ordinary, v_cat_skincare, 52.00, null, 0, 150, 'https://images.pexels.com/photos/7797553/pexels-photo-7797553.jpeg?w=400', false, true, ARRAY['serum','hydration','hyaluronic-acid'])
  ON CONFLICT (slug) DO NOTHING;
END $$;

-- ========== SEED BANNERS ==========
INSERT INTO banners (title, subtitle, description, image_url, link_url, button_text, type, sort_order) VALUES
  ('Luxury Beauty, Trusted Brands', 'Discover premium skincare, makeup, fragrances and beauty essentials', 'From the world''s most trusted cosmetic brands', 'https://images.pexels.com/photos/6621462/pexels-photo-6621462.jpeg?w=1200', '/products', 'Shop Now', 'hero', 1),
  ('Special Offers', 'Save up to 30% on selected products', 'Exclusive deals on your favorite brands', 'https://images.pexels.com/photos/965989/pexels-photo-965989.jpeg?w=1200', '/products?filter=sale', 'Discover Offers', 'promo', 1)
ON CONFLICT DO NOTHING;
