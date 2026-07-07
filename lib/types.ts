export interface Brand {
  id: string;
  name: string;
  logo_url?: string | null;
  logoUrl?: string | null;
  description: string | null;
  is_featured?: boolean;
  isFeatured?: boolean;
  is_active?: boolean;
  isActive?: boolean;
  sort_order?: number;
  sortOrder?: number;
  created_at?: string;
  createdAt?: string;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  image_url?: string | null;
  imageUrl?: string | null;
  parentId?: string | null;
  parent?: Category | null;
  is_active?: boolean;
  isActive?: boolean;
  sort_order?: number;
  sortOrder?: number;
  created_at?: string;
  createdAt?: string;
}

export interface SubCategory {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  brand_id?: string | null;
  brandId?: string | null;
  category_id?: string | null;
  categoryId?: string | null;
  sub_category_id?: string | null;
  subCategoryId?: string | null;
  price: number;
  original_price?: number | null;
  originalPrice?: number | null;
  discount_percent?: number;
  discountPercent?: number;
  stock: number;
  weight?: number | null;
  dimensions?: string | null;
  thumbnail_url?: string | null;
  thumbnailUrl?: string | null;
  is_featured?: boolean;
  isFeatured?: boolean;
  is_new?: boolean;
  isNew?: boolean;
  is_active?: boolean;
  isActive?: boolean;
  tags: string[];
  meta_title?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
  brands?: Brand;
  brand?: Brand;
  categories?: Category;
  category?: Category;
  sub_categories?: SubCategory;
  subCategory?: SubCategory;
  product_images?: ProductImage[];
  images?: ProductImage[];
}

export interface ProductImage {
  id: string;
  product_id: string;
  productId?: string;
  url: string;
  alt_text: string | null;
  altText?: string | null;
  sort_order: number;
  sortOrder?: number;
  created_at: string;
  createdAt?: string;
}

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  products?: Product;
}

export interface WishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
  products?: Product;
}

export interface Address {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  address_line1: string;
  address_line2: string | null;
  city: string;
  postal_code: string | null;
  country: string;
  is_default: boolean;
  created_at: string;
}

export interface Order {
  id: string;
  user_id: string | null;
  order_number?: string;
  orderNumber?: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  address_line1: string;
  address_line2: string | null;
  city: string;
  postal_code: string | null;
  country: string;
  notes: string | null;
  shipping_method: string;
  payment_method: string;
  subtotal: number;
  shipping_fee: number;
  tax_amount: number;
  discount_amount: number;
  total: number;
  coupon_code: string | null;
  coupon_id: string | null;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  product_thumbnail: string | null;
  brand_name: string | null;
  price: number;
  quantity: number;
  subtotal: number;
  created_at: string;
}

export interface Coupon {
  id: string;
  code: string;
  description: string | null;
  type: 'percentage' | 'fixed';
  value: number;
  min_order_amount: number;
  max_uses: number | null;
  used_count: number;
  is_active: boolean;
  starts_at: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  image_url?: string | null;
  imageUrl?: string | null;
  link_url?: string | null;
  linkUrl?: string | null;
  button_text?: string | null;
  buttonText?: string | null;
  type: 'hero' | 'promo' | 'category' | 'HERO' | 'PROMO' | 'CATEGORY';
  is_active?: boolean;
  isActive?: boolean;
  sort_order?: number;
  sortOrder?: number;
  starts_at?: string | null;
  startsAt?: string | null;
  ends_at?: string | null;
  endsAt?: string | null;
  created_at?: string;
  createdAt?: string;
}

export interface Review {
  id: string;
  user_id: string;
  product_id: string;
  rating: number;
  title: string | null;
  body: string | null;
  is_approved: boolean;
  created_at: string;
}

export interface LocalCartItem {
  product: Product;
  quantity: number;
}
