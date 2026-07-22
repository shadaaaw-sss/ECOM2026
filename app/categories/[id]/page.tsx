'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { api } from '@/lib/api';
import { Category, Product } from '@/lib/types';
import ProductCard from '@/components/ProductCard';
import { useLanguage } from '@/context/LanguageContext';

export default function CategoryPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, isRTL } = useLanguage();
  const sort = searchParams.get('sort') || 'created_at_desc';

  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const response = await api.get<{ category: Category; products: Product[] }>(`/categories/${id}`);
      if (!response?.category) { router.push('/products'); return; }
      setCategory(response.category);

      const [sortField, sortDir] = sort === 'price_asc' ? ['price', 'asc'] : sort === 'price_desc' ? ['price', 'desc'] : ['createdAt', 'desc'];
      setProducts((response.products as Product[]) || []);
      setLoading(false);
    };
    fetch();
  }, [id, sort]);

  const SORT_OPTIONS = [
    { value: 'created_at_desc', label: t('products_sort_newest') },
    { value: 'price_asc', label: t('products_sort_price_asc') },
    { value: 'price_desc', label: t('products_sort_price_desc') },
    { value: 'name_asc', label: t('products_sort_name_asc') },
  ];

  return (
    <div className="min-h-screen bg-cream py-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto px-4">
        {/* Breadcrumb */}
        <nav className={`flex items-center gap-2 text-sm font-sans text-muted-foreground mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Link href="/" className="hover:text-foreground">{t('categories_breadcrumb_home')}</Link>
          {isRTL ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
          <Link href="/products" className="hover:text-foreground">{t('categories_breadcrumb_products')}</Link>
          {isRTL ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
          <span className="text-foreground">{category?.name || id}</span>
        </nav>

        {/* Category header */}
        {category && (
          <div className={`relative rounded-2xl overflow-hidden mb-10 bg-beige-100 h-40 md:h-52 ${isRTL ? 'bg-gradient-to-l' : ''}`}>
            {(category.image_url || category.imageUrl) && (
              <img src={category.image_url || category.imageUrl || ''} alt={category.name} className="w-full h-full object-cover" />
            )}
            <div className={`absolute inset-0 ${isRTL ? 'bg-gradient-to-l from-black/60 to-transparent' : 'bg-gradient-to-r from-black/60 to-transparent'} flex items-center px-8 ${isRTL ? 'justify-end' : ''}`}>
              <div className={isRTL ? 'text-right' : ''}>
                <h1 className="font-serif text-3xl md:text-4xl font-bold text-white">{category.name}</h1>
                {category.description && (
                  <p className="text-white/80 font-sans text-sm mt-1 max-w-md">{category.description}</p>
                )}
                <p className="text-white/60 text-xs font-sans mt-2">{products.length} {t('products_found').split(' ')[0]}</p>
              </div>
            </div>
          </div>
        )}

        {/* Sort bar */}
        <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} justify-between mb-6`}>
          <p className="text-sm text-muted-foreground font-sans">{loading ? t('products_loading') : `${products.length} ${t('products_found').split(' ')[0]}`}</p>
          <select
            value={sort}
            onChange={e => {
              const params = new URLSearchParams(searchParams.toString());
              params.set('sort', e.target.value);
              router.push(`?${params.toString()}`);
            }}
            className="input-field py-2 text-sm w-auto"
          >
            {SORT_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => <div key={i} className="aspect-square bg-beige-100 rounded-xl animate-pulse" />)}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {products.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-xl border border-beige-100">
            <p className="text-muted-foreground font-sans">{t('categories_no_products')}</p>
            <Link href="/products" className="btn-primary inline-block mt-4">{t('categories_browse_all')}</Link>
          </div>
        )}
      </div>
    </div>
  );
}
