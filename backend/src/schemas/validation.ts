import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
});

export const updateProfileSchema = z.object({
  password: z.string().min(8).max(128).optional(),
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
});

export const productSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().max(10000).optional(),
  shortDescription: z.string().max(500).optional(),
  brandId: z.string().uuid().nullable().optional(),
  categoryId: z.string().uuid().nullable().optional(),
  price: z.number().positive('Price must be positive').or(z.string().transform(v => parseFloat(v)).refine(v => v > 0, 'Price must be positive')),
  originalPrice: z.number().positive().nullable().optional().or(z.string().transform(v => parseFloat(v)).refine(v => v > 0, 'Original price must be positive')).optional(),
  discountPercent: z.number().int().min(0).max(100).default(0).optional(),
  stock: z.number().int().min(0).default(0).optional(),
  weight: z.number().positive().nullable().optional().or(z.string().transform(v => parseFloat(v)).refine(v => v > 0, 'Weight must be positive')).optional(),
  dimensions: z.string().max(100).optional(),
  tags: z.string().max(500).optional(),
  thumbnailUrl: z.string().url().nullable().optional().or(z.literal('')),
  isFeatured: z.boolean().default(false).optional(),
  isNew: z.boolean().default(false).optional(),
  isActive: z.boolean().default(true).optional(),
  metaTitle: z.string().max(255).optional(),
  metaDescription: z.string().max(500).optional(),
  images: z.array(z.object({
    url: z.string().url(),
    type: z.enum(['image', 'video']).default('image'),
    isMain: z.boolean().default(false),
    altText: z.string().optional(),
    sortOrder: z.number().int().default(0),
  })).superRefine((items, ctx) => {
    if (items.filter((item) => item.isMain).length > 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Only one media item can be marked as main (isMain: true)',
      });
    }
  }).optional(),
});

export const categorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().max(5000).optional(),
  imageUrl: z.string().url().nullable().optional().or(z.literal('')),
  parentId: z.string().uuid().nullable().optional(),
  sortOrder: z.number().int().default(0).optional(),
  isActive: z.boolean().default(true).optional(),
});

export const brandSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().max(5000).optional(),
  logoUrl: z.string().url().nullable().optional().or(z.literal('')),
  sortOrder: z.number().int().default(0).optional(),
  isFeatured: z.boolean().default(false).optional(),
  isActive: z.boolean().default(true).optional(),
});

export const orderStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

export const shippingMethodSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().max(1000).optional(),
  price: z.number().min(0).or(z.string().transform(v => parseFloat(v)).refine(v => v >= 0, 'Price must be non-negative')),
  isActive: z.boolean().default(true).optional(),
});

export const couponSchema = z.object({
  code: z.string().min(1, 'Code is required').max(50).toUpperCase(),
  description: z.string().max(500).optional(),
  discountType: z.enum(['percentage', 'fixed']),
  discountValue: z.number().positive('Discount value must be positive'),
  maxUses: z.number().int().positive().nullable().optional(),
  minOrderAmount: z.number().min(0).nullable().optional(),
  validFrom: z.string().datetime().nullable().optional(),
  validUntil: z.string().datetime().nullable().optional(),
  isActive: z.boolean().default(true).optional(),
});

export const settingsSchema = z.object({
  settingKey: z.string().min(1).max(255),
  settingValue: z.string().optional(),
  settingType: z.enum(['string', 'number', 'boolean', 'json']).default('string'),
});

export const factureSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required').max(255),
  customerPhone: z.string().max(50).optional(),
  customerEmail: z.string().email().optional().or(z.literal('')),
  notes: z.string().max(2000).optional(),
  items: z.array(z.object({
    productId: z.string().uuid(),
    productName: z.string().min(1),
    productThumbnail: z.string().url().nullable().optional(),
    price: z.number().positive('Price must be positive'),
    quantity: z.number().int().positive('Quantity must be positive'),
  })).min(1, 'At least one item is required'),
});

export const wishlistSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
});

export const productQuerySchema = z.object({
  q: z.string().max(200).optional(),
  filter: z.enum(['featured', 'new', 'sale']).optional(),
  category: z.string().uuid().optional(),
  brand: z.string().uuid().optional(),
  sort: z.enum(['price_asc', 'price_desc', 'name_asc', 'name_desc', 'created_at_asc', 'created_at_desc']).default('created_at_desc'),
  min_price: z.string().regex(/^\d+(\.\d+)?$/).optional(),
  max_price: z.string().regex(/^\d+(\.\d+)?$/).optional(),
  page: z.string().regex(/^\d+$/).transform(v => parseInt(v)).pipe(z.number().int().min(1).max(1000)).default('1'),
  limit: z.string().regex(/^\d+$/).transform(v => parseInt(v)).pipe(z.number().int().min(1).max(100)).default('12'),
  excludeId: z.string().uuid().optional(),
  all: z.enum(['true', 'false']).optional(),
});

export const categoryQuerySchema = z.object({
  all: z.enum(['true', 'false']).optional(),
});

export const brandQuerySchema = z.object({
  all: z.enum(['true', 'false']).optional(),
});

export const orderQuerySchema = z.object({
  all: z.enum(['true', 'false']).optional(),
});

export const idParamSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
});

const normalizeField = <T extends string>(
  snakeCase: string,
  camelCase: string
): z.ZodEffects<z.ZodObject<any>, any, any> =>
  z.object({ [snakeCase]: z.any().optional(), [camelCase]: z.any().optional() }).transform((val) =>
    val[camelCase] !== undefined ? val[camelCase] : val[snakeCase]
  );

const numericAmount = (message: string, opts: { min?: number; positive?: boolean } = {}) => {
  const check = (v: number) => (opts.positive ? v > 0 : opts.min !== undefined ? v >= opts.min : true);
  return z.number().or(z.string().transform(v => parseFloat(v))).refine(v => !isNaN(v) && check(v), message);
};

export const orderCreateSchema = z.object({
  items: z.array(z.object({
    product: z.object({
      id: z.string().uuid(),
      name: z.string().min(1),
      price: numericAmount('Price must be positive', { positive: true }),
      thumbnailUrl: z.string().url().nullable().optional(),
      thumbnail_url: z.string().url().nullable().optional(),
      brand: z.object({ name: z.string().nullable().optional() }).nullable().optional(),
    }),
    quantity: z.number().int().positive().or(z.string().transform(v => parseInt(v, 10))).refine(v => Number.isInteger(v) && v > 0, 'Quantity must be a positive integer'),
  })).min(1, 'At least one item is required'),
  email: z.string().email(),
  first_name: z.string().optional().default(''),
  firstName: z.string().optional().default(''),
  last_name: z.string().optional().default(''),
  lastName: z.string().optional().default(''),
  phone: z.string().max(20).nullable().optional().default(null),
  address_line1: z.string().optional().default(''),
  addressLine1: z.string().optional().default(''),
  address_line2: z.string().nullable().optional().default(null),
  addressLine2: z.string().nullable().optional().default(null),
  city: z.string().optional().default(''),
  postal_code: z.string().max(20).nullable().optional().default(null),
  postalCode: z.string().max(20).nullable().optional().default(null),
  country: z.string().default('Qatar'),
  notes: z.string().max(2000).nullable().optional().default(null),
  shippingMethod: z.string().default('standard'),
  paymentMethod: z.string().default('cash_on_delivery'),
  subtotal: numericAmount('Subtotal must be non-negative', { min: 0 }),
  shippingFee: numericAmount('Shipping fee must be non-negative', { min: 0 }).default(0),
  taxAmount: numericAmount('Tax amount must be non-negative', { min: 0 }).default(0),
  discountAmount: numericAmount('Discount amount must be non-negative', { min: 0 }).default(0),
  total: numericAmount('Total must be positive', { positive: true }),
  couponCode: z.string().max(100).nullable().optional().default(null),
}).transform((data) => ({
  ...data,
  first_name: data.firstName || data.first_name,
  last_name: data.lastName || data.last_name,
  address_line1: data.addressLine1 || data.address_line1,
  address_line2: data.addressLine2 ?? data.address_line2,
  postal_code: data.postalCode ?? data.postal_code,
}));