'use client';

import Link from 'next/link';
import { Mail, Phone, MapPin } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function Footer() {
  const { t, isRTL } = useLanguage();

  return (
    <footer className="bg-[#1a0a0e] text-white mt-16" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <div className={`flex items-center gap-2 mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className="w-10 h-10 bg-burgundy-700 rounded-full flex items-center justify-center relative overflow-hidden">
                <span className="absolute text-white font-serif font-bold text-lg">M</span>
                <img 
                  src="/logo.png" 
                  alt="Makhmal" 
                  className="absolute inset-0 w-full h-full object-cover bg-burgundy-700" 
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} 
                />
              </div>
              <div className={isRTL ? 'text-right' : ''}>
                <p className="font-serif font-bold text-white text-xl leading-none">MAKHMAL</p>
                <p className="text-white/50 text-[10px] tracking-widest uppercase font-sans mt-0.5">Skincare & Beauty</p>
              </div>
            </div>
            <p className={`text-white/60 text-sm font-sans leading-relaxed max-w-xs ${isRTL ? 'text-right' : ''}`}>
              {t('footer_tagline')}
            </p>
          </div>

          {/* Quick Links */}
          <div className={isRTL ? 'text-right' : ''}>
            <h4 className="font-sans font-semibold text-white mb-4 uppercase tracking-wider text-xs">{t('footer_shop')}</h4>
            <ul className="space-y-2.5">
              <li>
                <Link href="/products" className="text-white/60 text-sm font-sans hover:text-white transition-colors">
                  {t('categories_browse_all') || 'All Products'}
                </Link>
              </li>
              <li>
                <Link href="/brands" className="text-white/60 text-sm font-sans hover:text-white transition-colors">
                  {t('nav_brands') || 'Brands'}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className={isRTL ? 'text-right' : ''}>
            <h4 className="font-sans font-semibold text-white mb-4 uppercase tracking-wider text-xs">{t('footer_info')}</h4>
            <div className="space-y-3">
              <a href="mailto:hello@makhmal.com" className={`flex items-center gap-2 text-white/60 text-sm font-sans hover:text-white transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Mail size={14} /> hello@makhmal.com
              </a>
              <a href="tel:+97444000000" className={`flex items-center gap-2 text-white/60 text-sm font-sans hover:text-white transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Phone size={14} /> +974 4400 0000
              </a>
              <p className={`flex items-start gap-2 text-white/60 text-sm font-sans ${isRTL ? 'flex-row-reverse' : ''}`}>
                <MapPin size={14} className="mt-0.5 flex-shrink-0" /> Doha, Qatar
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/40 text-xs font-sans text-center sm:text-left">
            &copy; {new Date().getFullYear()} {t('footer_copyright')}
          </p>
          <div className="flex items-center gap-3">
            {['VISA', 'MC', 'PayPal', 'Cash'].map(m => (
              <span key={m} className="text-white/40 text-xs font-sans bg-white/10 px-2 py-1 rounded">
                {m}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
