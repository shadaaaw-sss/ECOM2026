import { pgTable, serial, text, varchar, integer, boolean, timestamp, numeric } from 'drizzle-orm/pg-core';

export const brand = pgTable('brand', {
  id: varchar('id', { length: 36 }).primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  logoUrl: text('logo_url'),
  sortOrder: integer('sort_order').default(0),
  isFeatured: boolean('is_featured').default(false),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

export const shipping_method = pgTable('shipping_method', {
  id: varchar('id', { length: 36 }).primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  price: numeric('price', { precision: 10, scale: 2 }).notNull().default(0),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

export const product = pgTable('product', {
  id: varchar('id', { length: 36 }).primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  price: numeric('price', { precision: 10, scale: 2 }).default(0),
  brandId: varchar('brand_id', { length: 36 }),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

export const category = pgTable('category', {
  id: varchar('id', { length: 36 }).primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  imageUrl: text('image_url'),
  parentId: varchar('parent_id', { length: 36 }),
  sortOrder: integer('sort_order').default(0),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

export const "order" = pgTable('"order"', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }),
  orderNumber: text('order_number').notNull(),
  status: varchar('status', { length: 20 }).default('PENDING'),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  addressLine1: text('address_line1').notNull(),
  addressLine2: text('address_line2'),
  city: text('city').notNull(),
  postalCode: text('postal_code'),
  country: text('country').notNull(),
  notes: text('notes'),
  shippingMethod: text('shipping_method'),
  paymentMethod: text('payment_method'),
  subtotal: numeric('subtotal', { precision: 12, scale: 2 }).default(0),
  shippingFee: numeric('shipping_fee', { precision: 12, scale: 2 }).default(0),
  taxAmount: numeric('tax_amount', { precision: 12, scale: 2 }).default(0),
  discountAmount: numeric('discount_amount', { precision: 12, scale: 2 }).default(0),
  total: numeric('total', { precision: 12, scale: 2 }).default(0),
  couponCode: text('coupon_code'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const order_item = pgTable('order_item', {
  id: varchar('id', { length: 36 }).primaryKey(),
  orderId: varchar('order_id', { length: 36 }).notNull(),
  productId: varchar('product_id', { length: 36 }),
  productName: text('product_name').notNull(),
  productThumbnail: text('product_thumbnail'),
  brandName: text('brand_name'),
  price: numeric('price', { precision: 12, scale: 2 }).default(0),
  quantity: integer('quantity').default(1),
  subtotal: numeric('subtotal', { precision: 12, scale: 2 }).default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

export const newsletter_subscriber = pgTable('newsletter_subscriber', {
  id: varchar('id', { length: 36 }).primaryKey(),
  email: text('email').notNull(),
  subscribedAt: timestamp('subscribed_at').defaultNow(),
});

export const coupon = pgTable('coupon', {
  id: varchar('id', { length: 36 }).primaryKey(),
  code: varchar('code', { length: 50 }).notNull(),
  discountPercent: integer('discount_percent').default(0),
  startsAt: timestamp('starts_at'),
  endsAt: timestamp('ends_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const wishlist_item = pgTable('wishlist_item', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  productId: varchar('product_id', { length: 36 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const setting = pgTable('setting', {
  id: varchar('id', { length: 36 }).primaryKey(),
  key: text('key').notNull(),
  value: text('value'),
});
