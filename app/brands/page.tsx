'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';
import { Brand } from '@/lib/types';
import { useLanguage } from '@/context/LanguageContext';

export default function BrandsPage() {
  const { t, isRTL } = useLanguage();
  const [brands, setBrands] = useState<(Brand & { product_count?: number })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const data = await api.get<Brand[]>('/brands');
      setBrands(data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  return (
    <div className="min-h-screen bg-cream py-10" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-gold-500 font-sans text-xs font-medium uppercase tracking-widest mb-2">{t('brands_discover')}</p>
          <h1 className="font-serif text-4xl font-bold text-foreground mb-3">{t('brands_title')}</h1>
          <p className="text-muted-foreground font-sans max-w-xl mx-auto">
            {t('brands_subtitle')}
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-beige-100 rounded-2xl h-48 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {brands.map(brand => (
              <Link
                key={brand.id}
                href={`/brands/${brand.id}`}
                className="group bg-white rounded-2xl border border-beige-100 p-6 flex flex-col items-center text-center hover:border-burgundy-200 hover:shadow-lg transition-all duration-300"
              >
                {brand.logo_url || brand.logoUrl ? (
                  <img src={brand.logo_url || brand.logoUrl || ''} alt={brand.name} className="h-16 max-w-full object-contain mb-4" />
                ) : (
                  <div className="w-16 h-16 bg-beige-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-burgundy-50 transition-colors">
                    <span className="font-serif font-bold text-2xl text-burgundy-700">{brand.name[0]}</span>
                  </div>
                )}
                <h2 className="font-serif font-semibold text-lg text-foreground group-hover:text-burgundy-700 transition-colors mb-2">
                  {brand.name}
                </h2>
                {brand.description && (
                  <p className="text-muted-foreground text-xs font-sans line-clamp-2 mb-3">
                    {brand.description}
                  </p>
                )}
                <span className={`mt-auto text-xs font-sans text-burgundy-700 font-medium flex items-center gap-1 group-hover:gap-2 transition-all ${isRTL ? 'flex-row-reverse' : ''}`}>
                  {t('brands_view_products')} <ArrowRight size={12} className={isRTL ? 'rotate-180' : ''} />
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
