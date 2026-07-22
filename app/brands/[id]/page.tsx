'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, ChevronLeft, Package } from 'lucide-react';
import { api } from '@/lib/api';
import { Brand, Product, Category } from '@/lib/types';
import ProductCard from '@/components/ProductCard';
import { useLanguage } from '@/context/LanguageContext';

export default function BrandDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { t, isRTL } = useLanguage();
  const [brand, setBrand] = useState<Brand | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filter, setFilter] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const response = await api.get<{ brand: Brand; products: Product[]; categories?: Category[] }>(`/brands/${id}`);
      if (!response?.brand) { router.push('/brands'); return; }
      setBrand(response.brand);
      setProducts((response.products as Product[]) || []);
      setCategories(response.categories || []);
      setLoading(false);
    };
    fetch();
  }, [id]);

  const filtered = filter
    ? products.filter(p => (p.categoryId || p.category_id) === filter)
    : products;

  if (loading) {
    return (
      <div className="min-h-screen bg-cream py-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="h-40 bg-beige-100 rounded-2xl animate-pulse mb-8" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => <div key={i} className="aspect-square bg-beige-100 rounded-xl animate-pulse" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!brand) return null;

  return (
    <div className="min-h-screen bg-cream py-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto px-4">
        {/* Breadcrumb */}
        <nav className={`flex items-center gap-2 text-sm font-sans text-muted-foreground mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Link href="/brands" className="hover:text-foreground">{t('nav_brands')}</Link>
          {isRTL ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
          <span className="text-foreground">{brand.name}</span>
        </nav>

        {/* Brand hero */}
        <div className={`bg-white rounded-2xl border border-beige-100 p-8 md:p-12 mb-8 flex flex-col md:flex-row items-center gap-8 ${isRTL ? 'md:flex-row-reverse' : ''}`}>
          {brand.logo_url || brand.logoUrl ? (
            <img src={brand.logo_url || brand.logoUrl || ''} alt={brand.name} className="h-24 object-contain" />
          ) : (
            <div className="w-24 h-24 bg-burgundy-50 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="font-serif font-bold text-4xl text-burgundy-700">{brand.name[0]}</span>
            </div>
          )}
          <div className={`text-center ${isRTL ? 'md:text-right' : 'md:text-left'}`}>
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-2">{brand.name}</h1>
            {brand.description && (
              <p className="text-muted-foreground font-sans leading-relaxed max-w-xl">{brand.description}</p>
            )}
            <div className={`mt-3 flex items-center gap-1 text-sm font-sans text-muted-foreground ${isRTL ? 'flex-row-reverse justify-center md:justify-start' : 'justify-center md:justify-start'}`}>
              <Package size={14} className="text-gold-500" />
              {products.length} {products.length !== 1 ? t('brands_products_available') : t('brands_products_available').replace('منتج', 'منتج')}
            </div>
          </div>
        </div>

        {/* Category filter sub-nav */}
        {categories.length > 1 && (
          <div className={`flex items-center justify-center gap-8 overflow-x-auto border-b border-beige-200 mb-10 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <button
              onClick={() => setFilter(null)}
              className={`relative whitespace-nowrap pb-4 text-xs font-sans font-medium uppercase tracking-[0.15em] transition-colors ${!filter ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {t('brands_all') || 'All'}
              {!filter && <span className="absolute left-0 right-0 -bottom-px h-px bg-foreground" />}
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setFilter(cat.id)}
                className={`relative whitespace-nowrap pb-4 text-xs font-sans font-medium uppercase tracking-[0.15em] transition-colors ${filter === cat.id ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {cat.name}
                {filter === cat.id && <span className="absolute left-0 right-0 -bottom-px h-px bg-foreground" />}
              </button>
            ))}
          </div>
        )}

        {/* Products */}
        <h2 className="section-title mb-6">{brand.name} {t('brands_products')}</h2>
        {filtered.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {filtered.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-xl border border-beige-100">
            <Package size={40} className="text-beige-200 mx-auto mb-3" />
            <p className="text-muted-foreground font-sans">{t('brands_no_products')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
