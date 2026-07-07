'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, ShoppingBag, Heart, User, Menu, X, Package, Globe } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Product } from '@/lib/types';
import { Locale } from '@/lib/translations';
import { api } from '@/lib/api';

const LANG_LABELS: Record<Locale, string> = {
  en: 'EN',
  fr: 'FR',
  ar: 'AR',
};

export default function Navbar() {
  const router = useRouter();
  const { itemCount } = useCart();
  const { user, signOut, isAdmin } = useAuth();
  const { t, locale, setLocale, isRTL } = useLanguage();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const langMenuRef = useRef<HTMLDivElement>(null);
  const searchDebounce = useRef<NodeJS.Timeout>();

  const NAV_LINKS = [
    { label: t('nav_home'), href: '/' },
    { label: t('nav_skincare'), href: '/categories/skincare' },
    { label: t('nav_makeup'), href: '/categories/makeup' },
    { label: t('nav_fragrances'), href: '/categories/fragrances' },
    { label: t('nav_haircare'), href: '/categories/hair-care' },
    { label: t('nav_bodycare'), href: '/categories/body-care' },
    { label: t('nav_accessories'), href: '/categories/accessories' },
    { label: t('nav_brands'), href: '/brands' },
    { label: t('nav_offers'), href: '/products?filter=sale', highlight: true },
  ];

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) setLangMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const data = await api.get<Product[]>('/products');
        const filtered = data.filter((product) => product.name.toLowerCase().includes(searchQuery.toLowerCase()));
        setSearchResults(filtered.slice(0, 6));
      } catch (error) {
        console.error(error);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
    return () => clearTimeout(searchDebounce.current);
  }, [searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <header className={`sticky top-0 z-50 bg-white transition-shadow duration-300 ${scrolled ? 'shadow-md' : 'shadow-sm'}`}>
      {/* Main header row */}
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
        <Link href="/" className="flex-shrink-0 flex items-center gap-2 mr-4">
          {/* Use absolute layout to fully overlay the image over the fallback avatar when loaded */}
          <div className="w-14 h-14 rounded-full overflow-hidden bg-white flex items-center justify-center relative shadow-sm border border-beige-100">
            <span className="absolute text-burgundy-700 font-serif font-bold text-xl">M</span>
            <img 
              src="/logo.png" 
              alt="Makhmal" 
              className="absolute inset-0 w-full h-full object-cover bg-white" 
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} 
            />
          </div>
          <div className="hidden sm:block">
            <p className="font-serif font-bold text-burgundy-700 text-2xl leading-none tracking-wide">MAKHMAL</p>
            <p className="text-muted-foreground text-[10px] tracking-widest uppercase font-sans mt-1">Skincare & Beauty</p>
          </div>
        </Link>

        {/* Search bar */}
        <div ref={searchRef} className="flex-1 relative max-w-xl mx-auto">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setSearchOpen(true); }}
              onFocus={() => setSearchOpen(true)}
              placeholder={t('nav_search_placeholder')}
              className="w-full border border-beige-200 rounded-full pl-5 pr-12 py-2.5 text-sm font-sans focus:outline-none focus:border-burgundy-700 focus:ring-1 focus:ring-burgundy-700 transition-colors bg-beige-50"
              dir={isRTL ? 'rtl' : 'ltr'}
            />
            <button type="submit" className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-muted-foreground hover:text-burgundy-700 transition-colors`}>
              <Search size={18} />
            </button>
          </form>

          {/* Search dropdown */}
          {searchOpen && searchQuery.trim() && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-beige-200 z-50 overflow-hidden">
              {searchLoading ? (
                <div className="p-4 text-center text-sm text-muted-foreground">{t('nav_searching')}</div>
              ) : searchResults.length > 0 ? (
                <>
                  {searchResults.map(p => (
                    <Link
                      key={p.id}
                      href={`/products/${p.id}`}
                      onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-beige-50 transition-colors"
                    >
                      {p.thumbnailUrl && (
                        <img src={p.thumbnailUrl} alt={p.name} className="w-10 h-10 object-cover rounded" />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{(p as any).brands?.name} · {p.price.toFixed(2)} {t('currency')}</p>
                      </div>
                    </Link>
                  ))}
                  <button
                    onClick={handleSearch}
                    className="w-full px-4 py-3 text-center text-sm text-burgundy-700 font-medium border-t border-beige-100 hover:bg-beige-50 transition-colors"
                  >
                    {t('nav_search_results_link')} "{searchQuery}"
                  </button>
                </>
              ) : (
                <div className="p-4 text-center text-sm text-muted-foreground">{t('nav_no_products')}</div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Language switcher */}
          <div ref={langMenuRef} className="relative">
            <button
              onClick={() => setLangMenuOpen(v => !v)}
              className="flex items-center gap-1 p-2 rounded-lg hover:bg-beige-50 transition-colors text-foreground"
            >
              <Globe size={17} />
              <span className="text-xs font-sans font-semibold hidden sm:block">{LANG_LABELS[locale]}</span>
            </button>
            {langMenuOpen && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-beige-200 rounded-lg shadow-lg z-50 overflow-hidden min-w-[100px]">
                {(['en', 'fr', 'ar'] as Locale[]).map(lang => (
                  <button
                    key={lang}
                    onClick={() => { setLocale(lang); setLangMenuOpen(false); }}
                    className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm font-sans transition-colors hover:bg-beige-50 ${locale === lang ? 'text-burgundy-700 font-semibold' : 'text-foreground'}`}
                  >
                    <span className="text-base">{lang === 'ar' ? '🇶🇦' : lang === 'fr' ? '🇫🇷' : '🇬🇧'}</span>
                    {lang === 'en' ? 'English' : lang === 'fr' ? 'Français' : 'العربية'}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Account */}
          <div ref={userMenuRef} className="relative">
            <button
              onClick={() => setUserMenuOpen(v => !v)}
              className="flex flex-col items-center gap-0.5 p-2 rounded-lg hover:bg-beige-50 transition-colors text-foreground"
            >
              <User size={20} />
              <span className="text-[10px] font-sans hidden sm:block">{user ? t('nav_my_account') : t('nav_login')}</span>
            </button>
            {userMenuOpen && (
              <div className={`absolute ${isRTL ? 'left-0' : 'right-0'} top-full mt-1 bg-white border border-beige-200 rounded-lg shadow-lg z-50 min-w-[160px] py-1`}>
                {user ? (
                  <>
                    <div className="px-4 py-2 border-b border-beige-100">
                      <p className="text-xs font-medium truncate">{user.email}</p>
                    </div>
                    <Link href="/profile" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-beige-50 transition-colors">
                      <User size={14} /> {t('nav_my_account')}
                    </Link>
                    <Link href="/orders" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-beige-50 transition-colors">
                      <Package size={14} /> {t('nav_my_orders')}
                    </Link>
                    <Link href="/wishlist" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-beige-50 transition-colors">
                      <Heart size={14} /> {t('nav_wishlist')}
                    </Link>
                    {isAdmin && (
                      <Link href="/admin" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-burgundy-700 font-medium hover:bg-beige-50 transition-colors border-t border-beige-100">
                        {t('nav_admin')}
                      </Link>
                    )}
                    <button
                      onClick={() => { signOut(); setUserMenuOpen(false); }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-beige-50 transition-colors border-t border-beige-100"
                    >
                      {t('nav_sign_out')}
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/auth/login" onClick={() => setUserMenuOpen(false)} className="block px-4 py-2 text-sm hover:bg-beige-50 transition-colors">{t('nav_sign_in')}</Link>
                    <Link href="/auth/register" onClick={() => setUserMenuOpen(false)} className="block px-4 py-2 text-sm hover:bg-beige-50 transition-colors">{t('nav_create_account')}</Link>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Wishlist */}
          <Link href="/wishlist" className="flex flex-col items-center gap-0.5 p-2 rounded-lg hover:bg-beige-50 transition-colors text-foreground">
            <Heart size={20} />
            <span className="text-[10px] font-sans hidden sm:block">{t('nav_wishlist')}</span>
          </Link>

          {/* Cart */}
          <Link href="/cart" className="flex flex-col items-center gap-0.5 p-2 rounded-lg hover:bg-beige-50 transition-colors text-foreground relative">
            <div className="relative">
              <ShoppingBag size={20} />
              {itemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-burgundy-700 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-sans hidden sm:block">{t('nav_cart')} ({itemCount})</span>
          </Link>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileOpen(v => !v)}
            className="lg:hidden p-2 rounded-lg hover:bg-beige-50 transition-colors"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Navigation row */}
      <nav className="hidden lg:block border-t border-beige-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
            {NAV_LINKS.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-3 text-sm font-sans font-medium whitespace-nowrap transition-colors hover:text-burgundy-700 ${
                  (link as any).highlight ? 'text-burgundy-700 font-semibold' : 'text-foreground'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-beige-100 bg-white">
          <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-1">
            {NAV_LINKS.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`px-3 py-2.5 rounded-lg text-sm font-sans font-medium transition-colors ${
                  (link as any).highlight ? 'text-burgundy-700 bg-burgundy-50' : 'text-foreground hover:bg-beige-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
            {/* Language switcher in mobile */}
            <div className="border-t border-beige-100 mt-2 pt-2">
              <p className="px-3 py-1 text-xs font-sans text-muted-foreground uppercase tracking-wide">Language</p>
              <div className="flex gap-2 px-3 py-2">
                {(['en', 'fr', 'ar'] as Locale[]).map(lang => (
                  <button
                    key={lang}
                    onClick={() => { setLocale(lang); setMobileOpen(false); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-sans font-medium transition-colors ${locale === lang ? 'bg-burgundy-700 text-white' : 'bg-beige-50 text-foreground hover:bg-beige-100'}`}
                  >
                    {lang.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <div className="border-t border-beige-100 mt-1 pt-1 flex flex-col gap-1">
              {user ? (
                <>
                  <Link href="/profile" onClick={() => setMobileOpen(false)} className="px-3 py-2.5 text-sm font-sans hover:bg-beige-50 rounded-lg">{t('nav_my_account')}</Link>
                  <Link href="/orders" onClick={() => setMobileOpen(false)} className="px-3 py-2.5 text-sm font-sans hover:bg-beige-50 rounded-lg">{t('nav_my_orders')}</Link>
                  {isAdmin && <Link href="/admin" onClick={() => setMobileOpen(false)} className="px-3 py-2.5 text-sm font-sans text-burgundy-700 font-medium hover:bg-beige-50 rounded-lg">{t('nav_admin')}</Link>}
                  <button onClick={() => { signOut(); setMobileOpen(false); }} className="text-left px-3 py-2.5 text-sm font-sans text-red-600 hover:bg-beige-50 rounded-lg">{t('nav_sign_out')}</button>
                </>
              ) : (
                <>
                  <Link href="/auth/login" onClick={() => setMobileOpen(false)} className="px-3 py-2.5 text-sm font-sans hover:bg-beige-50 rounded-lg">{t('nav_sign_in')}</Link>
                  <Link href="/auth/register" onClick={() => setMobileOpen(false)} className="px-3 py-2.5 text-sm font-sans hover:bg-beige-50 rounded-lg">{t('nav_create_account')}</Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
