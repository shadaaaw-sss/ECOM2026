'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Package, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function OrderSuccessPage() {
  const searchParams = useSearchParams();
  const { t, isRTL } = useLanguage();
  const orderNumber = searchParams.get('order');

  return (
    <div className="min-h-screen bg-cream py-20" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-lg mx-auto px-4 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} className="text-green-600" />
        </div>
        <h1 className="font-serif text-3xl font-bold text-foreground mb-3">{t('success_title')}</h1>
        <p className="text-muted-foreground font-sans mb-2">
          {t('success_desc')}
        </p>
        {orderNumber && (
          <div className={`bg-white rounded-xl border border-beige-100 p-4 my-6 inline-flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Package size={16} className="text-burgundy-700" />
            <span className="font-sans text-sm">{t('success_order_label')}</span>
            <span className="font-mono font-bold text-burgundy-700">{orderNumber}</span>
          </div>
        )}
        <p className="text-muted-foreground font-sans text-sm mb-8">
          {t('success_delivery')}
        </p>
        <div className={`flex flex-col sm:flex-row gap-3 justify-center ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
          <Link href="/products" className={`btn-primary inline-flex items-center gap-2 justify-center ${isRTL ? 'flex-row-reverse' : ''}`}>
            {t('success_continue')} <ArrowRight size={16} className={isRTL ? 'rotate-180' : ''} />
          </Link>
          <Link href="/orders" className="btn-outline inline-flex items-center gap-2 justify-center">
            {t('success_view_orders')}
          </Link>
        </div>
      </div>
    </div>
  );
}
