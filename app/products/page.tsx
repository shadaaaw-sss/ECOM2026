'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, SlidersHorizontal, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { api } from '@/lib/api';
import { Product, Category, Brand } from '@/lib/types';
import ProductCard from '@/components/ProductCard';
import { useLanguage } from '@/context/LanguageContext';

const PAGE_SIZE = 12;

export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, isRTL, locale } = useLanguage();

  const SORT_OPTIONS = [
    { value: 'created_at_desc', label: t('products_sort_newest') },
    { value: 'price_asc', label: t('products_sort_price_asc') },
    { value: 'price_desc', label: t('products_sort_price_desc') },
    { value: 'name_asc', label: t('products_sort_name_asc') },
  ];

  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const q = searchParams.get('q') || '';
  const filter = searchParams.get('filter') || '';
  const categoryId = searchParams.get('category') || '';
  const brandId = searchParams.get('brand') || '';
  const sort = searchParams.get('sort') || 'created_at_desc';
  const page = parseInt(searchParams.get('page') || '1');
  const minPrice = searchParams.get('min_price') || '';
  const maxPrice = searchParams.get('max_price') || '';

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value); else params.delete(key);
    if (key !== 'page') params.delete('page');
    router.push(`/products?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push('/products');
  };

  useEffect(() => {
    const fetch = async () => {
      const [categoriesData, brandsData] = await Promise.all([
        api.get<Category[]>('/categories'),
        api.get<Brand[]>('/brands'),
      ]);
      setCategories(categoriesData || []);
      setBrands(brandsData || []);
    };
    fetch();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (q) queryParams.set('q', q);
      if (filter) queryParams.set('filter', filter);
      if (categoryId) queryParams.set('category', categoryId);
      if (brandId) queryParams.set('brand', brandId);
      if (sort) queryParams.set('sort', sort);
      if (page) queryParams.set('page', String(page));
      if (minPrice) queryParams.set('min_price', minPrice);
      if (maxPrice) queryParams.set('max_price', maxPrice);

      const response = await api.get<{ data: Product[]; total: number }>(`/products?${queryParams.toString()}`);
      setProducts(response?.data || []);
      setTotal(response?.total || 0);
      setLoading(false);
    };
    if (categories.length >= 0 && brands.length >= 0) fetchProducts();
  }, [q, filter, categoryId, brandId, sort, page, minPrice, maxPrice, categories.length, brands.length]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const hasActiveFilters = q || filter || categoryId || brandId || minPrice || maxPrice;

  const FilterSidebar = () => (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h3 className="font-sans font-semibold text-sm text-foreground mb-3 uppercase tracking-wide">{t('products_category')}</h3>
        <div className="space-y-1">
          <button
            onClick={() => setParam('category', '')}
            className={`w-full ${isRTL ? 'text-right' : 'text-left'} px-3 py-2 rounded-lg text-sm font-sans transition-colors ${!categoryId ? 'bg-burgundy-50 text-burgundy-700 font-medium' : 'text-muted-foreground hover:bg-beige-50'}`}
          >
            {t('products_all_categories')}
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setParam('category', cat.id)}
              className={`w-full ${isRTL ? 'text-right' : 'text-left'} px-3 py-2 rounded-lg text-sm font-sans transition-colors ${categoryId === cat.id ? 'bg-burgundy-50 text-burgundy-700 font-medium' : 'text-muted-foreground hover:bg-beige-50'}`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Brands */}
      <div>
        <h3 className="font-sans font-semibold text-sm text-foreground mb-3 uppercase tracking-wide">{t('products_brand')}</h3>
        <div className="space-y-1">
          <button
            onClick={() => setParam('brand', '')}
            className={`w-full ${isRTL ? 'text-right' : 'text-left'} px-3 py-2 rounded-lg text-sm font-sans transition-colors ${!brandId ? 'bg-burgundy-50 text-burgundy-700 font-medium' : 'text-muted-foreground hover:bg-beige-50'}`}
          >
            {t('products_all_brands')}
          </button>
          {brands.map(brand => (
            <button
              key={brand.id}
              onClick={() => setParam('brand', brand.id)}
              className={`w-full ${isRTL ? 'text-right' : 'text-left'} px-3 py-2 rounded-lg text-sm font-sans transition-colors ${brandId === brand.id ? 'bg-burgundy-50 text-burgundy-700 font-medium' : 'text-muted-foreground hover:bg-beige-50'}`}
            >
              {brand.name}
            </button>
          ))}
        </div>
      </div>

      {/* Price range */}
      <div>
        <h3 className="font-sans font-semibold text-sm text-foreground mb-3 uppercase tracking-wide">{t('products_price')}</h3>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min"
            defaultValue={minPrice}
            onBlur={e => setParam('min_price', e.target.value)}
            className="w-full input-field text-xs py-2"
          />
          <input
            type="number"
            placeholder="Max"
            defaultValue={maxPrice}
            onBlur={e => setParam('max_price', e.target.value)}
            className="w-full input-field text-xs py-2"
          />
        </div>
      </div>

      {/* Special filters */}
      <div>
        <h3 className="font-sans font-semibold text-sm text-foreground mb-3 uppercase tracking-wide">{t('products_filter')}</h3>
        <div className="space-y-1">
          {[
            { label: t('products_filter_all'), value: '' },
            { label: t('products_filter_featured'), value: 'featured' },
            { label: t('products_filter_new'), value: 'new' },
            { label: t('products_filter_sale'), value: 'sale' },
          ].map(f => (
            <button
              key={f.value}
              onClick={() => setParam('filter', f.value)}
              className={`w-full ${isRTL ? 'text-right' : 'text-left'} px-3 py-2 rounded-lg text-sm font-sans transition-colors ${filter === f.value ? 'bg-burgundy-50 text-burgundy-700 font-medium' : 'text-muted-foreground hover:bg-beige-50'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-cream py-8" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="font-serif text-3xl font-bold text-foreground">
            {q ? `${t('products_search_title')} "${q}"` :
             filter === 'featured' ? t('products_best_sellers') :
             filter === 'new' ? t('products_new_arrivals') :
             filter === 'sale' ? t('products_offers') :
             categoryId ? categories.find(c => c.id === categoryId)?.name || t('products_title') :
             brandId ? brands.find(b => b.id === brandId)?.name || t('products_title') :
             t('products_title')}
          </h1>
          <p className="text-muted-foreground font-sans text-sm mt-1">
            {loading ? t('products_loading') : `${total} ${total !== 1 ? t('products_found') : t('products_found_one')}`}
          </p>
        </div>

        <div className={`flex gap-8 ${isRTL ? 'flex-row-reverse' : ''}`}>
          {/* Desktop sidebar */}
          <aside className="hidden lg:block w-56 flex-shrink-0">
            <div className="bg-white rounded-xl border border-beige-100 p-5 sticky top-24">
              <div className={`flex items-center justify-between mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <h2 className="font-sans font-semibold text-foreground">{t('products_filters')}</h2>
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="text-xs text-burgundy-700 hover:underline">{t('products_clear_all')}</button>
                )}
              </div>
              <FilterSidebar />
            </div>
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className={`flex items-center gap-3 mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <button
                onClick={() => setFiltersOpen(true)}
                className="lg:hidden flex items-center gap-2 px-4 py-2 bg-white border border-beige-200 rounded-lg text-sm font-sans hover:bg-beige-50 transition-colors"
              >
                <SlidersHorizontal size={16} /> {t('products_filters')}
                {hasActiveFilters && <span className="bg-burgundy-700 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">!</span>}
              </button>

              <div className={`flex items-center gap-2 ${isRTL ? '' : 'ml-auto'} ${isRTL ? 'ml-auto' : ''}`}>
                <span className="text-sm text-muted-foreground font-sans hidden sm:block">{t('products_sort_by')}</span>
                <select
                  value={sort}
                  onChange={e => setParam('sort', e.target.value)}
                  className="input-field py-2 text-sm w-auto pr-8"
                >
                  {SORT_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Active filter chips */}
            {hasActiveFilters && (
              <div className={`flex flex-wrap gap-2 mb-4 ${isRTL ? 'justify-end' : ''}`}>
                {q && <Chip label={`${t('products_search_prefix')} ${q}`} onRemove={() => setParam('q', '')} />}
                {filter && <Chip label={filter === 'featured' ? t('products_filter_featured') : filter === 'new' ? t('products_filter_new') : t('products_filter_sale')} onRemove={() => setParam('filter', '')} />}
                {categoryId && <Chip label={categories.find(c => c.id === categoryId)?.name || categoryId} onRemove={() => setParam('category', '')} />}
                {brandId && <Chip label={brands.find(b => b.id === brandId)?.name || brandId} onRemove={() => setParam('brand', '')} />}
                {minPrice && <Chip label={`Min: ${minPrice} QAR`} onRemove={() => setParam('min_price', '')} />}
                {maxPrice && <Chip label={`Max: ${maxPrice} QAR`} onRemove={() => setParam('max_price', '')} />}
              </div>
            )}

            {/* Products grid */}
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-beige-100 rounded-xl aspect-square animate-pulse" />
                ))}
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
                {products.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
            ) : (
              <div className="text-center py-20 bg-white rounded-xl border border-beige-100">
                <Search size={40} className="text-beige-300 mx-auto mb-4" />
                <h3 className="font-serif text-xl font-semibold text-foreground mb-2">{t('products_no_found')}</h3>
                <p className="text-muted-foreground font-sans text-sm mb-4">{t('products_no_found_desc')}</p>
                <button onClick={clearFilters} className="btn-primary">{t('products_clear_filters')}</button>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button
                  onClick={() => setParam('page', String(page - 1))}
                  disabled={page <= 1}
                  className="w-9 h-9 flex items-center justify-center rounded-lg border border-beige-200 hover:bg-beige-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {isRTL ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                </button>
                {[...Array(totalPages)].map((_, i) => {
                  const p = i + 1;
                  if (p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1)) {
                    return (
                      <button
                        key={p}
                        onClick={() => setParam('page', String(p))}
                        className={`w-9 h-9 rounded-lg text-sm font-sans font-medium transition-colors ${p === page ? 'bg-burgundy-700 text-white' : 'border border-beige-200 hover:bg-beige-50'}`}
                      >
                        {p}
                      </button>
                    );
                  }
                  if (p === page - 2 || p === page + 2) return <span key={p} className="text-muted-foreground">…</span>;
                  return null;
                })}
                <button
                  onClick={() => setParam('page', String(page + 1))}
                  disabled={page >= totalPages}
                  className="w-9 h-9 flex items-center justify-center rounded-lg border border-beige-200 hover:bg-beige-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {isRTL ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter drawer */}
      {filtersOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setFiltersOpen(false)} />
          <div className={`relative ${isRTL ? 'mr-auto' : 'ml-auto'} w-72 bg-white h-full overflow-y-auto p-5`}>
            <div className={`flex items-center justify-between mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <h2 className="font-sans font-semibold text-foreground">{t('products_filters')}</h2>
              <button onClick={() => setFiltersOpen(false)}><X size={20} /></button>
            </div>
            <FilterSidebar />
            <button onClick={() => setFiltersOpen(false)} className="btn-primary w-full mt-6">{t('products_apply')}</button>
          </div>
        </div>
      )}
    </div>
  );
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-3 py-1 bg-burgundy-50 text-burgundy-700 text-xs font-sans rounded-full">
      {label}
      <button onClick={onRemove} className="hover:text-burgundy-900"><X size={12} /></button>
    </span>
  );
}
