'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import {
  ChevronLeft, ChevronRight, ArrowRight, Shield, RefreshCw, Headphones, Star, Truck, CreditCard, CheckCircle
} from 'lucide-react';
import { Product, Category, Brand, Banner } from '@/lib/types';
import ProductCard from '@/components/ProductCard';
import { useLanguage } from '@/context/LanguageContext';
import { api } from '@/lib/api';

export default function HomePage() {
  const { t, isRTL, currency } = useLanguage();
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [newProducts, setNewProducts] = useState<Product[]>([]);
  const [heroBanners, setHeroBanners] = useState<Banner[]>([]);
  const [heroIndex, setHeroIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const brandScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [catRes, brandRes, featRes, newRes] = await Promise.all([
          api.get<Category[]>('/categories'),
          api.get<Brand[]>('/brands'),
          api.get<{ data: Product[]; total: number }>('/products?limit=8'),
          api.get<{ data: Product[]; total: number }>('/products?limit=4&sort=createdAt_desc'),
        ]);
        setCategories(catRes || []);
        setBrands((brandRes || []).filter((brand) => brand.isFeatured) || []);
        setFeaturedProducts(featRes?.data?.slice(0, 8) || []);
        setNewProducts(newRes?.data?.slice(0, 4) || []);
        setHeroBanners([{ id: 'hero-1', title: 'Luxury Beauty, Trusted Brands', subtitle: 'Discover premium skincare, makeup, fragrances and beauty essentials', description: 'Curated essentials for a refined routine', imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1000&q=80', linkUrl: '/products', buttonText: 'Shop Now', type: 'HERO', isActive: true, sortOrder: 1, startsAt: null, endsAt: null, createdAt: '' } as Banner]);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  useEffect(() => {
    if (heroBanners.length < 2) return;
    const interval = setInterval(() => setHeroIndex(i => (i + 1) % heroBanners.length), 5000);
    return () => clearInterval(interval);
  }, [heroBanners.length]);

  const scrollBrands = (dir: 'left' | 'right') => {
    if (!brandScrollRef.current) return;
    brandScrollRef.current.scrollBy({ left: dir === 'left' ? -240 : 240, behavior: 'smooth' });
  };

  const HERO_SLIDES = heroBanners.length > 0 ? heroBanners : [{
    id: '1', title: 'Luxury Beauty, Trusted Brands', subtitle: 'Discover premium skincare, makeup, fragrances and beauty essentials', description: "from the world's most trusted cosmetic brands", imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1000&q=80', linkUrl: '/products', buttonText: 'Shop Now', type: 'HERO' as const, isActive: true, sortOrder: 1, startsAt: null, endsAt: null, createdAt: ''
  }];

  const DEFAULT_CATEGORIES: Category[] = [
    { id: '1', name: t('nav_skincare'), imageUrl: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80', isActive: true, sortOrder: 1, createdAt: '', description: null },
    { id: '2', name: t('nav_makeup'), imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80', isActive: true, sortOrder: 2, createdAt: '', description: null },
    { id: '3', name: t('nav_fragrances'), imageUrl: 'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=600&q=80', isActive: true, sortOrder: 3, createdAt: '', description: null },
    { id: '4', name: t('nav_haircare'), imageUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80', isActive: true, sortOrder: 4, createdAt: '', description: null },
    { id: '5', name: t('nav_bodycare'), imageUrl: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=600&q=80', isActive: true, sortOrder: 5, createdAt: '', description: null },
    { id: '6', name: t('nav_accessories'), imageUrl: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=600&q=80', isActive: true, sortOrder: 6, createdAt: '', description: null },
  ];

  return (
    <div className="bg-cream" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden bg-beige-50">
        <div className="max-w-7xl mx-auto px-4 py-10 md:py-16 lg:py-20 flex flex-col lg:flex-row items-center gap-8 min-h-[480px] md:min-h-[560px]">
          <div className="flex-1 z-10 text-center lg:text-left">
            <p className="text-gold-500 font-sans text-sm font-medium uppercase tracking-widest mb-3">{t('hero_badge')}</p>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-4">
              {HERO_SLIDES[heroIndex]?.title?.split(',')[0]},<br />
              <span className="text-burgundy-700">{HERO_SLIDES[heroIndex]?.title?.split(',')[1] || 'Trusted Brands'}</span>
            </h1>
            <p className="font-sans text-muted-foreground text-base md:text-lg mb-8 max-w-md mx-auto lg:mx-0 leading-relaxed">
              {HERO_SLIDES[heroIndex]?.subtitle}
            </p>
            <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
              <Link href="/products" className="btn-primary inline-flex items-center gap-2">
                {t('hero_cta_shop')} <ArrowRight size={16} className={isRTL ? 'rotate-180' : ''} />
              </Link>
              <Link href="/brands" className="btn-outline inline-flex items-center gap-2">
                {t('hero_cta_brands')}
              </Link>
            </div>
            <div className="flex flex-wrap gap-4 mt-8 justify-center lg:justify-start">
              {[
                { icon: CheckCircle, text: t('hero_trust_authentic') },
                { icon: Truck, text: t('hero_trust_delivery') },
                { icon: Shield, text: t('hero_trust_payment') },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-1.5 text-muted-foreground text-xs font-sans">
                  <Icon size={14} className="text-gold-500" />
                  {text}
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 flex justify-center lg:justify-end relative">
            <div className="relative w-72 md:w-96 lg:w-[440px]">
              <div className="absolute inset-0 -m-8 rounded-full bg-beige-200/60 blur-2xl" />
              <img
                src={HERO_SLIDES[heroIndex]?.imageUrl || 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1000&q=80'}
                alt="Beauty products"
                className="relative w-full h-72 md:h-96 lg:h-[460px] object-cover rounded-2xl shadow-2xl"
              />
              <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg p-3 flex items-center gap-2">
                <div className="w-8 h-8 bg-gold-100 rounded-full flex items-center justify-center">
                  <Star size={14} className="text-gold-500 fill-gold-500" />
                </div>
                <div>
                  <p className="text-xs font-semibold font-sans text-foreground">{t('hero_best_seller')}</p>
                  <p className="text-[10px] text-muted-foreground font-sans">4.9/5 {t('hero_rating')}</p>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 bg-burgundy-700 text-white rounded-xl shadow-lg p-3 text-center">
                <p className="text-xs font-sans font-bold">{t('hero_up_to')}</p>
                <p className="text-xl font-serif font-bold leading-none">30%</p>
                <p className="text-xs font-sans">{t('hero_off')}</p>
              </div>
            </div>
          </div>
        </div>

        {HERO_SLIDES.length > 1 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
            {HERO_SLIDES.map((_, i) => (
              <button key={i} onClick={() => setHeroIndex(i)} className={`w-2 h-2 rounded-full transition-all ${i === heroIndex ? 'bg-burgundy-700 w-6' : 'bg-beige-300'}`} />
            ))}
          </div>
        )}
      </section>

      {/* ============ TRUST BAR ============ */}
      <section className="bg-white border-y border-beige-100">
        <div className="max-w-7xl mx-auto px-4 py-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Truck, title: t('trust_free_delivery'), desc: t('trust_free_delivery_desc') },
              { icon: CreditCard, title: t('trust_secure_payment'), desc: t('trust_secure_payment_desc') },
              { icon: RefreshCw, title: t('trust_easy_returns'), desc: t('trust_easy_returns_desc') },
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
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3 md:gap-4">
            {(categories.length > 0 ? categories : DEFAULT_CATEGORIES).map(cat => (
              <Link key={cat.id} href={`/categories/${cat.id}`} className="group flex flex-col items-center gap-3">
                <div className="w-full aspect-square rounded-2xl overflow-hidden bg-beige-100 border border-beige-200 group-hover:border-burgundy-200 group-hover:shadow-md transition-all duration-300">
                  {cat.imageUrl || cat.image_url ? (
                    <img src={cat.imageUrl || cat.image_url || ''} alt={cat.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-beige-100 to-beige-200" />
                  )}
                </div>
                <span className="text-sm font-sans font-medium text-foreground group-hover:text-burgundy-700 transition-colors text-center">{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ============ BRANDS ============ */}
      <section className="py-14 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-gold-500 font-sans text-xs font-medium uppercase tracking-widest mb-1">{t('section_brands_sub')}</p>
              <h2 className="section-title">{t('section_brands')}</h2>
            </div>
            <Link href="/brands" className="text-sm font-sans text-burgundy-700 hover:underline flex items-center gap-1">
              {t('section_brands_view_all')} <ArrowRight size={14} className={isRTL ? 'rotate-180' : ''} />
            </Link>
          </div>
          <div className="relative">
            <button onClick={() => scrollBrands('left')} className={`absolute ${isRTL ? '-right-4' : '-left-4'} top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-white rounded-full shadow-md border border-beige-100 flex items-center justify-center hover:bg-beige-50 transition-colors`}>
              <ChevronLeft size={18} />
            </button>
            <div ref={brandScrollRef} className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth px-2 py-2">
              {(brands.length > 0 ? brands : [
                { id: '1', name: 'Lancôme', logoUrl: null, description: null, isFeatured: true, isActive: true, sortOrder: 1, createdAt: '' },
                { id: '2', name: 'Estée Lauder', logoUrl: null, description: null, isFeatured: true, isActive: true, sortOrder: 2, createdAt: '' },
                { id: '3', name: 'The Ordinary', logoUrl: null, description: null, isFeatured: true, isActive: true, sortOrder: 3, createdAt: '' },
                { id: '4', name: 'La Roche-Posay', logoUrl: null, description: null, isFeatured: true, isActive: true, sortOrder: 4, createdAt: '' },
                { id: '5', name: 'Vichy', logoUrl: null, description: null, isFeatured: true, isActive: true, sortOrder: 5, createdAt: '' },
                { id: '6', name: 'Evenlisse', logoUrl: null, description: null, isFeatured: true, isActive: true, sortOrder: 6, createdAt: '' },
              ] as Brand[]).map(brand => (
                <Link key={brand.id} href={`/brands/${brand.id}`} className="flex-shrink-0 w-40 h-20 bg-beige-50 border border-beige-100 rounded-xl flex items-center justify-center hover:border-burgundy-200 hover:shadow-md transition-all duration-300 group px-4">
                  {brand.logoUrl || brand.logo_url ? (
                    <img src={brand.logoUrl || brand.logo_url || ''} alt={brand.name} className="max-h-10 max-w-full object-contain" />
                  ) : (
                    <span className="font-serif font-semibold text-foreground text-sm text-center group-hover:text-burgundy-700 transition-colors leading-tight">{brand.name}</span>
                  )}
                </Link>
              ))}
            </div>
            <button onClick={() => scrollBrands('right')} className={`absolute ${isRTL ? '-left-4' : '-right-4'} top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-white rounded-full shadow-md border border-beige-100 flex items-center justify-center hover:bg-beige-50 transition-colors`}>
              <ChevronRight size={18} />
            </button>
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
