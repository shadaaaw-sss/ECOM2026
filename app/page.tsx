'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight, Shield, RefreshCw, Headphones, Star, CreditCard, CheckCircle
} from 'lucide-react';
import { Product, Category, Brand } from '@/lib/types';
import ProductCard from '@/components/ProductCard';
import HeroSection from '@/components/HeroSection';
import { useLanguage } from '@/context/LanguageContext';
import { api } from '@/lib/api';

export default function HomePage() {
  const { t, isRTL, currency } = useLanguage();
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [newProducts, setNewProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [catRes, brandRes, featRes, newRes] = await Promise.allSettled([
          api.get<Category[]>('/categories'),
          api.get<Brand[]>('/brands'),
          api.get<{ data: Product[]; total: number }>('/products?limit=8'),
          api.get<{ data: Product[]; total: number }>('/products?limit=4&sort=created_at_desc'),
        ]);
        setCategories(catRes.status === 'fulfilled' ? catRes.value || [] : []);
        setBrands(brandRes.status === 'fulfilled' ? (brandRes.value || []).filter((brand) => (brand.isActive ?? brand.is_active ?? true)) : []);
        setFeaturedProducts(featRes.status === 'fulfilled' ? featRes.value?.data?.slice(0, 8) || [] : []);
        setNewProducts(newRes.status === 'fulfilled' ? newRes.value?.data?.slice(0, 4) || [] : []);
        [catRes, brandRes, featRes, newRes].forEach(r => { if (r.status === 'rejected') console.error(r.reason); });
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const visibleCategories = (categories || []).filter((cat) => cat.isActive ?? cat.is_active ?? true).slice(0, 8);
  const visibleBrands = (brands || []).filter((brand) => (brand.isActive ?? brand.is_active ?? true)).slice(0, 8);

  return (
    <div className="bg-cream" dir={isRTL ? 'rtl' : 'ltr'}>
      <HeroSection slides={[
        {
          id: 'hero-1',
          type: 'image',
          src: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1920&q=85',
          title: 'Luxury Beauty,\nTrusted Brands',
          subtitle: 'Discover premium skincare, makeup, fragrances and beauty essentials curated for a refined routine.',
          cta: { label: t('hero_cta_shop'), href: '/products' },
        },
        {
          id: 'hero-2',
          type: 'image',
          src: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=1920&q=85',
          title: 'The Art of\nSkincare',
          subtitle: 'From serums to moisturizers — find your perfect ritual.',
          cta: { label: t('hero_cta_shop'), href: '/products?category=skincare' },
        },
        {
          id: 'hero-3',
          type: 'image',
          src: 'https://images.unsplash.com/photo-1583241800699-4e8c6f0f3c1b?auto=format&fit=crop&w=1920&q=85',
          title: 'Fragrances\nthat Define You',
          subtitle: 'Exclusive perfumes and oud collections from around the world.',
          cta: { label: 'Explore', href: '/products?category=fragrances' },
        },
      ]} />

      {/* ============ TRUST BAR ============ */}
      <section className="bg-white border-y border-beige-100">
        <div className="max-w-7xl mx-auto px-4 py-5">
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: CreditCard, title: t('trust_secure_payment'), desc: t('trust_secure_payment_desc') },
              { icon: Headphones, title: t('trust_support'), desc: t('trust_support_desc') },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-center gap-3 py-2">
                <div className="w-10 h-10 bg-beige-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Icon size={18} className="text-burgundy-700" />
                </div>
                <div>
                  <p className="text-sm font-sans font-semibold text-foreground">{title}</p>
                  <p className="text-xs text-muted-foreground font-sans">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CATEGORIES ============ */}
      <section className="py-14 bg-cream">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8">
            <p className="text-gold-500 font-sans text-xs font-medium uppercase tracking-widest mb-2">{t('section_categories_sub')}</p>
            <h2 className="section-title">{t('section_categories')}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {visibleCategories.length > 0 ? visibleCategories.map(cat => (
              <Link key={cat.id} href={`/categories/${cat.id}`} className="group flex items-center gap-3 rounded-2xl border border-beige-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-1 hover:border-burgundy-200 hover:shadow-md">
                <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-beige-100">
                  {cat.imageUrl || cat.image_url ? (
                    <img src={cat.imageUrl || cat.image_url || ''} alt={cat.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-beige-100 to-beige-200 text-sm font-semibold text-burgundy-700">
                      {cat.name.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground group-hover:text-burgundy-700">{cat.name}</p>
                  <p className="text-xs text-muted-foreground">Discover curated essentials</p>
                </div>
              </Link>
            )) : (
              <div className="col-span-full rounded-2xl border border-dashed border-beige-200 bg-white/70 p-8 text-center text-sm text-muted-foreground">
                No categories have been added yet.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ============ BRANDS ============ */}
      <section className="py-14 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-10 gap-4 flex-wrap">
            <div>
              <p className="text-gold-500 font-sans text-xs font-medium uppercase tracking-widest mb-1">{t('section_brands_sub')}</p>
              <h2 className="section-title">{t('section_brands')}</h2>
            </div>
            <Link href="/brands" className="text-sm font-sans text-burgundy-700 hover:underline flex items-center gap-1">
              {t('section_brands_view_all')} <ArrowRight size={14} className={isRTL ? 'rotate-180' : ''} />
            </Link>
          </div>

          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 md:gap-8">
            {visibleBrands.length > 0 ? visibleBrands.map((brand) => (
              <Link
                key={brand.id}
                href={`/brands/${brand.id}`}
                className="group flex items-center justify-center aspect-[4/3] rounded-lg border border-beige-100 hover:border-beige-200 bg-white transition-all duration-500 hover:shadow-md hover:-translate-y-0.5"
              >
                {brand.logoUrl || brand.logo_url ? (
                  <img
                    src={brand.logoUrl || brand.logo_url || ''}
                    alt={brand.name}
                    className="w-3/5 h-3/5 object-contain transition-transform duration-500 group-hover:scale-110"
                  />
                ) : (
                  <span className="font-serif text-4xl text-beige-300 group-hover:text-burgundy-700/30 transition-colors duration-500">
                    {brand.name.slice(0, 1).toUpperCase()}
                  </span>
                )}
              </Link>
            )) : (
              <div className="col-span-full rounded-lg border border-dashed border-beige-200 bg-white/70 px-4 py-10 text-center text-sm text-muted-foreground">
                No brands have been added yet.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ============ SPECIAL OFFERS BANNER ============ */}
      <section className="py-8 bg-cream">
        <div className="max-w-7xl mx-auto px-4">
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-beige-100 to-beige-50 border border-beige-200">
            <div className="absolute inset-0 opacity-20">
              <img src="https://images.pexels.com/photos/965989/pexels-photo-965989.jpeg?auto=compress&cs=tinysrgb&w=800" alt="" className="w-full h-full object-cover" />
            </div>
            <div className="relative flex flex-col md:flex-row items-center justify-between p-8 md:p-12 gap-6">
              <div>
                <p className="text-gold-500 font-sans text-xs font-medium uppercase tracking-widest mb-2">{t('section_offers_sub')}</p>
                <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-2">{t('section_offers_title')}</h2>
                <p className="text-muted-foreground font-sans">{t('section_offers_desc')}</p>
              </div>
              <div className="flex items-center gap-6">
                <div className="w-28 h-28 rounded-full bg-burgundy-700 flex flex-col items-center justify-center text-white text-center shadow-xl">
                  <p className="text-xs font-sans uppercase tracking-wide">{t('hero_up_to')}</p>
                  <p className="text-4xl font-serif font-bold leading-none">30</p>
                  <p className="text-sm font-sans font-medium">% {t('hero_off')}</p>
                </div>
                <Link href="/products?filter=sale" className="btn-primary">{t('section_offers_cta')}</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ BEST SELLERS ============ */}
      <section className="py-14 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-gold-500 font-sans text-xs font-medium uppercase tracking-widest mb-1">{t('section_best_sellers_sub')}</p>
              <h2 className="section-title">{t('section_best_sellers')}</h2>
            </div>
            <Link href="/products?filter=featured" className="text-sm font-sans text-burgundy-700 hover:underline flex items-center gap-1">
              {t('section_best_sellers_view_all')} <ArrowRight size={14} className={isRTL ? 'rotate-180' : ''} />
            </Link>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {[...Array(4)].map((_, i) => <div key={i} className="bg-beige-50 rounded-xl aspect-square animate-pulse" />)}
            </div>
          ) : featuredProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {featuredProducts.slice(0, 4).map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground font-sans">{t('products_loading')}</div>
          )}
        </div>
      </section>

      {/* ============ NEW ARRIVALS ============ */}
      {(newProducts.length > 0 || !loading) && (
        <section className="py-14 bg-cream">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="text-gold-500 font-sans text-xs font-medium uppercase tracking-widest mb-1">{t('section_new_arrivals_sub')}</p>
                <h2 className="section-title">{t('section_new_arrivals')}</h2>
              </div>
              <Link href="/products?filter=new" className="text-sm font-sans text-burgundy-700 hover:underline flex items-center gap-1">
                {t('section_new_arrivals_view_all')} <ArrowRight size={14} className={isRTL ? 'rotate-180' : ''} />
              </Link>
            </div>
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {[...Array(4)].map((_, i) => <div key={i} className="bg-beige-50 rounded-xl aspect-square animate-pulse" />)}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {(newProducts.length > 0 ? newProducts : featuredProducts.slice(4, 8)).map(p => <ProductCard key={p.id} product={p} />)}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ============ WHY CHOOSE US ============ */}
      <section className="py-14 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-10">
            <p className="text-gold-500 font-sans text-xs font-medium uppercase tracking-widest mb-2">{t('section_why_us_sub')}</p>
            <h2 className="section-title">{t('section_why_us')}</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: CheckCircle, title: t('why_authentic_title'), desc: t('why_authentic_desc') },
              { icon: Shield, title: t('why_brands_title'), desc: t('why_brands_desc') },
              { icon: CreditCard, title: t('why_payment_title'), desc: t('why_payment_desc') },
              { icon: Headphones, title: t('why_support_title'), desc: t('why_support_desc') },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="text-center p-6 rounded-2xl border border-beige-100 hover:border-burgundy-100 hover:shadow-sm transition-all duration-300">
                <div className="w-14 h-14 bg-beige-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon size={24} className="text-burgundy-700" />
                </div>
                <h3 className="font-sans font-semibold text-foreground mb-2">{title}</h3>
                <p className="text-muted-foreground text-sm font-sans leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FEATURED PRODUCTS GRID ============ */}
      {featuredProducts.length > 4 && (
        <section className="py-14 bg-cream">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="text-gold-500 font-sans text-xs font-medium uppercase tracking-widest mb-1">{t('section_more_products_sub')}</p>
                <h2 className="section-title">{t('section_more_products')}</h2>
              </div>
              <Link href="/products" className="text-sm font-sans text-burgundy-700 hover:underline flex items-center gap-1">
                {t('section_view_all_products')} <ArrowRight size={14} className={isRTL ? 'rotate-180' : ''} />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {featuredProducts.slice(4, 8).map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
