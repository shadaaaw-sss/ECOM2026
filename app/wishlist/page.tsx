'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Product } from '@/lib/types';
import ProductCard from '@/components/ProductCard';

export default function WishlistPage() {
  const { user, loading: authLoading } = useAuth();
  const { t, isRTL } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWishlist = async () => {
    if (!user) return;
    const data = await api.get<any[]>('/wishlist');
    const prods = (data || []).map(item => item.product).filter(Boolean);
    setProducts(prods);
    setWishlistIds(prods.map((p: Product) => p.id));
    setLoading(false);
  };

  useEffect(() => {
    if (!authLoading) {
      if (!user) setLoading(false);
      else fetchWishlist();
    }
  }, [user, authLoading]);

  if (!authLoading && !user) {
    return (
      <div className="min-h-screen bg-cream py-20 text-center px-4" dir={isRTL ? 'rtl' : 'ltr'}>
        <Heart size={48} className="text-beige-200 mx-auto mb-4" />
        <h1 className="font-serif text-2xl font-bold mb-3">{t('wishlist_sign_in_title')}</h1>
        <p className="text-muted-foreground font-sans mb-6">{t('wishlist_sign_in_desc')}</p>
        <Link href="/auth/login" className="btn-primary inline-block">{t('wishlist_sign_in')}</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream py-8" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="font-serif text-3xl font-bold text-foreground mb-2">{t('wishlist_title')}</h1>
        <p className="text-muted-foreground font-sans text-sm mb-8">{products.length} {products.length !== 1 ? t('wishlist_items') : t('wishlist_item')}</p>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="aspect-square bg-beige-100 rounded-xl animate-pulse" />)}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {products.map(p => (
              <ProductCard key={p.id} product={p} wishlistIds={wishlistIds} onWishlistChange={fetchWishlist} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-xl border border-beige-100">
            <Heart size={48} className="text-beige-200 mx-auto mb-4" />
            <h2 className="font-serif text-2xl font-semibold mb-3">{t('wishlist_empty_title')}</h2>
            <p className="text-muted-foreground font-sans mb-6">{t('wishlist_empty_desc')}</p>
            <Link href="/products" className="btn-primary inline-flex items-center gap-2">
              <ShoppingBag size={16} /> {t('wishlist_browse')}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
