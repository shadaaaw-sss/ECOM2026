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
  const [bannerIndex, setBannerIndex] = useState(0);

  const bannerMedia = (brand?.bannerMedia || brand?.banner_media || [])
    .slice()
    .sort((a, b) => a.position - b.position);

  useEffect(() => {
    if (bannerMedia.length <= 1) return;
    const timer = setInterval(() => setBannerIndex((i) => (i + 1) % bannerMedia.length), 6000);
    return () => clearInterval(timer);
  }, [bannerMedia.length]);

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

  const logo = brand.logo_url || brand.logoUrl;

  return (
    <div className="min-h-screen bg-cream" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto px-4 pt-6">
        {/* Breadcrumb */}
        <nav className={`flex items-center gap-2 text-sm font-sans text-muted-foreground mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Link href="/brands" className="hover:text-foreground">{t('nav_brands')}</Link>
          {isRTL ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
          <span className="text-foreground">{brand.name}</span>
        </nav>
      </div>

      {bannerMedia.length > 0 ? (
        /* Brand hero, mirroring the homepage HeroSection: identity panel on one
           side, media carousel on the other. */
        <section className="relative bg-cream overflow-hidden mb-8 md:mb-10">
          <div className="grid grid-cols-1 lg:grid-cols-12">
            <div className="relative order-2 lg:order-1 lg:col-span-5 flex items-center justify-center bg-gradient-to-br from-cream via-beige-50 to-beige-100 px-8 py-14 lg:px-14 xl:px-20">
              <div className="max-w-md text-center lg:text-start">
                {logo ? (
                  <img src={logo} alt={brand.name} className="h-16 md:h-20 object-contain mb-6 mx-auto lg:mx-0" />
                ) : (
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-burgundy-50 rounded-full flex items-center justify-center mb-6 mx-auto lg:mx-0">
                    <span className="font-serif font-bold text-2xl md:text-3xl text-burgundy-700">{brand.name[0]}</span>
                  </div>
                )}
                <h1 className="font-serif text-4xl md:text-5xl font-light uppercase tracking-[0.15em] text-foreground mb-5">{brand.name}</h1>
                {brand.description && (
                  <p className="font-sans text-sm md:text-base text-muted-foreground leading-relaxed mb-6">{brand.description}</p>
                )}
                <div className={`flex items-center gap-1 text-sm font-sans text-muted-foreground justify-center lg:justify-start ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Package size={14} className="text-gold-500" />
                  {products.length} {products.length !== 1 ? t('brands_products_available') : t('brands_products_available').replace('منتج', 'منتج')}
                </div>
              </div>
            </div>

            <div className="relative order-1 lg:order-2 lg:col-span-7 h-[45vh] sm:h-[55vh] lg:h-[65vh] lg:min-h-[480px] overflow-hidden bg-black select-none">
              {bannerMedia.map((item, i) => (
                <div
                  key={item.url}
                  className={`absolute inset-0 transition-opacity duration-1000 ${i === bannerIndex ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                >
                  {item.type === 'video' ? (
                    <video src={item.url} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                  ) : (
                    <img src={item.url} alt={brand.name} className="w-full h-full object-cover" />
                  )}
                </div>
              ))}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/5 to-transparent" />

              {bannerMedia.length > 1 && (
                <div className="absolute bottom-5 right-6 flex gap-1.5 z-10">
                  {bannerMedia.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setBannerIndex(i)}
                      aria-label={`Slide ${i + 1}`}
                      className={`h-1.5 rounded-full transition-all ${i === bannerIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/70'}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      ) : (
        <div className="max-w-7xl mx-auto px-4">
          {/* Brand hero fallback (no banner media set) */}
          <div className={`bg-white rounded-2xl border border-beige-100 p-8 md:p-12 mb-8 flex flex-col md:flex-row items-center gap-8 ${isRTL ? 'md:flex-row-reverse' : ''}`}>
            {logo ? (
              <img src={logo} alt={brand.name} className="h-24 object-contain" />
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
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 pb-6">
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
