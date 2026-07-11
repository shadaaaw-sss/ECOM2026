'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Heart, ShoppingBag, Star, Minus, Plus, ChevronRight, ChevronLeft, Shield, Truck, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';
import { Product } from '@/lib/types';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import ProductCard from '@/components/ProductCard';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { addItem, isInCart } = useCart();
  const { user } = useAuth();
  const { t, currency, isRTL } = useLanguage();

  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [inWishlist, setInWishlist] = useState(false);
  const [tab, setTab] = useState<'description' | 'details'>('description');

  useEffect(() => {
    const fetch = async () => {
      const response = await api.get<any>(`/products/${id}`);
      if (!response) { router.push('/products'); return; }
      setProduct(response);

      if (user) {
        try {
          const wishlistItems = await api.get<any[]>('/wishlist');
          setInWishlist(wishlistItems.some(item => item.product?.id === response.id));
        } catch {}
      }

      if (response.category_id) {
        try {
          const categoryRelated = await api.get<{ data: Product[]; total: number }>(`/products?category=${response.category_id}&excludeId=${response.id}&limit=4`);
          setRelated(categoryRelated?.data || []);
        } catch {}
      }
      setLoading(false);
    };
    fetch();
  }, [id, user]);

  const handleAddToCart = () => {
    if (!product) return;
    setAdding(true);
    addItem(product, quantity);
    setTimeout(() => setAdding(false), 800);
  };

  const handleWishlist = async () => {
    if (!product || !user) { router.push('/auth/login'); return; }
    if (inWishlist) {
      await api.delete(`/wishlist/${product.id}`);
      setInWishlist(false);
    } else {
      await api.post('/wishlist', { productId: product.id });
      setInWishlist(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream py-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="aspect-square bg-beige-100 rounded-2xl animate-pulse" />
            <div className="space-y-4">
              <div className="h-6 bg-beige-100 rounded animate-pulse w-1/3" />
              <div className="h-10 bg-beige-100 rounded animate-pulse" />
              <div className="h-4 bg-beige-100 rounded animate-pulse w-1/4" />
              <div className="h-20 bg-beige-100 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) return null;

  const images = product.product_images?.length
    ? product.product_images.sort((a, b) => a.sort_order - b.sort_order).map(i => i.url)
    : product.thumbnail_url ? [product.thumbnail_url] : [];

  const discountAmount = (product as any).original_price
    ? Math.round((((product as any).original_price - product.price) / (product as any).original_price) * 100)
    : product.discount_percent || 0;

  const savings = (product as any).original_price ? (product as any).original_price - product.price : 0;

  return (
    <div className="min-h-screen bg-cream py-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto px-4">
        {/* Breadcrumb */}
        <nav className={`flex items-center gap-2 text-sm font-sans text-muted-foreground mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Link href="/" className="hover:text-foreground transition-colors">{t('categories_breadcrumb_home')}</Link>
          {isRTL ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
          <Link href="/products" className="hover:text-foreground transition-colors">{t('categories_breadcrumb_products')}</Link>
          {(product as any).category && (
            <>
              {isRTL ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
              <Link href={`/categories/${(product as any).category.id}`} className="hover:text-foreground transition-colors">
                {(product as any).category.name}
              </Link>
            </>
          )}
          {isRTL ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
          <span className="text-foreground line-clamp-1">{product.name}</span>
        </nav>

        {/* Product */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-14">
          {/* Images */}
          <div className="space-y-3">
            <div className="aspect-square bg-beige-50 rounded-2xl overflow-hidden border border-beige-100">
              {images.length > 0 ? (
                <img
                  src={images[selectedImage]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ShoppingBag size={64} className="text-beige-200" />
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${i === selectedImage ? 'border-burgundy-700' : 'border-transparent'}`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            {(product as any).brand && (
              <Link href={`/brands/${(product as any).brand.id}`} className="text-xs font-sans font-medium text-burgundy-700 uppercase tracking-wider hover:underline">
                {(product as any).brand.name}
              </Link>
            )}
            <h1 className="font-serif text-2xl md:text-3xl font-bold text-foreground mt-2 mb-4 leading-snug">{product.name}</h1>

            {/* Price */}
            <div className={`flex items-baseline gap-3 mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <span className="text-3xl font-bold font-sans text-foreground">{(Number(product.price) || 0).toFixed(2)} {currency}</span>
              {(product as any).original_price && (
                <span className="text-lg font-sans text-muted-foreground line-through">{(Number((product as any).original_price) || 0).toFixed(2)}</span>
              )}
              {discountAmount > 0 && (
                <span className="badge-discount">-{discountAmount}%</span>
              )}
            </div>
            {savings > 0 && (
              <p className="text-green-600 text-sm font-sans font-medium mb-4">
                {t('product_you_save')} {(Number(savings) || 0).toFixed(2)} {currency}
              </p>
            )}

            {/* Stock status */}
            <div className="mb-6">
              {product.stock > 10 ? (
                <span className={`inline-flex items-center gap-1.5 text-green-600 text-sm font-sans font-medium ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <span className="w-2 h-2 rounded-full bg-green-500" /> {t('product_in_stock')}
                </span>
              ) : product.stock > 0 ? (
                <span className={`inline-flex items-center gap-1.5 text-orange-600 text-sm font-sans font-medium ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <span className="w-2 h-2 rounded-full bg-orange-500" /> {t('product_low_stock')} {product.stock} {t('product_low_stock_left')}
                </span>
              ) : (
                <span className={`inline-flex items-center gap-1.5 text-red-600 text-sm font-sans font-medium ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <span className="w-2 h-2 rounded-full bg-red-500" /> {t('product_out_of_stock')}
                </span>
              )}
            </div>

            {/* Quantity */}
            <div className={`flex items-center gap-4 mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <label className="text-sm font-sans font-medium text-foreground">{t('product_quantity')}</label>
              <div className="flex items-center border border-beige-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="w-10 h-10 flex items-center justify-center hover:bg-beige-50 transition-colors"
                >
                  <Minus size={14} />
                </button>
                <span className="w-12 text-center font-sans text-sm font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                  disabled={quantity >= product.stock}
                  className="w-10 h-10 flex items-center justify-center hover:bg-beige-50 transition-colors disabled:opacity-40"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className={`flex gap-3 mb-8 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="flex-1 btn-primary flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <ShoppingBag size={16} />
                {product.stock === 0 ? t('product_out_of_stock') : adding ? t('product_added') : t('product_add_cart')}
              </button>
              <button
                onClick={handleWishlist}
                className={`w-12 h-12 rounded-sm border-2 flex items-center justify-center transition-all ${
                  inWishlist
                    ? 'bg-burgundy-700 border-burgundy-700 text-white'
                    : 'border-beige-200 text-muted-foreground hover:border-burgundy-700 hover:text-burgundy-700'
                }`}
              >
                <Heart size={18} fill={inWishlist ? 'currentColor' : 'none'} />
              </button>
            </div>

            {/* Trust badges */}
            <div className="border-t border-beige-100 pt-6 space-y-3">
              {[
                { icon: Shield, text: t('product_trust_authentic') },
                { icon: Truck, text: t('product_trust_delivery') },
                { icon: RefreshCw, text: t('product_trust_returns') },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className={`flex items-center gap-2 text-sm text-muted-foreground font-sans ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Icon size={14} className="text-gold-500 flex-shrink-0" />
                  {text}
                </div>
              ))}
            </div>

            {/* Tags */}
            {product.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {product.tags.map(tag => (
                  <span key={tag} className="px-2 py-1 bg-beige-50 text-muted-foreground text-xs font-sans rounded capitalize">
                    #{tag.replace(/-/g, ' ')}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Description tabs */}
        <div className="bg-white rounded-2xl border border-beige-100 mb-14">
          <div className={`flex border-b border-beige-100 ${isRTL ? 'flex-row-reverse' : ''}`}>
            {(['description', 'details'] as const).map(tabName => (
              <button
                key={tabName}
                onClick={() => setTab(tabName)}
                className={`px-6 py-4 text-sm font-sans font-medium capitalize transition-colors ${tab === tabName ? 'text-burgundy-700 border-b-2 border-burgundy-700' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {tabName === 'description' ? t('product_description') : t('product_details')}
              </button>
            ))}
          </div>
          <div className="p-6">
            {tab === 'description' ? (
              <p className="text-muted-foreground font-sans leading-relaxed text-sm">
                {product.description || t('product_no_description')}
              </p>
            ) : (
              <div className="space-y-3">
                {[
                  { label: t('product_brand'), value: (product as any).brand?.name },
                  { label: t('product_category'), value: (product as any).category?.name },
                  { label: t('product_weight'), value: product.weight ? `${product.weight} g` : null },
                  { label: t('product_stock'), value: `${product.stock} ${t('product_units')}` },
                  { label: t('product_tags'), value: product.tags?.join(', ') },
                ].filter(r => r.value).map(row => (
                  <div key={row.label} className={`flex items-start gap-4 py-2 border-b border-beige-50 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <span className="text-sm font-sans font-medium text-foreground w-28 flex-shrink-0">{row.label}</span>
                    <span className="text-sm font-sans text-muted-foreground">{row.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Related products */}
        {related.length > 0 && (
          <div>
            <h2 className="section-title mb-6">{t('product_related')}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {related.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}