'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Package, ChevronRight, ChevronDown, ChevronLeft } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Order } from '@/lib/types';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  refunded: 'bg-gray-100 text-gray-700',
};

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const { t, currency, isRTL } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (!user) { setLoading(false); return; }
      api.get<Order[]>('/orders')
        .then((data) => {
          setOrders(data || []);
        })
        .catch(() => setOrders([]))
        .finally(() => setLoading(false));
    }
  }, [user, authLoading]);

  if (!authLoading && !user) {
    return (
      <div className="min-h-screen bg-cream py-20 text-center px-4" dir={isRTL ? 'rtl' : 'ltr'}>
        <Package size={48} className="text-beige-200 mx-auto mb-4" />
        <h1 className="font-serif text-2xl font-bold mb-3">{t('orders_sign_in_title')}</h1>
        <p className="text-muted-foreground font-sans mb-6">{t('orders_sign_in_desc')}</p>
        <Link href="/auth/login" className="btn-primary inline-block">{t('orders_sign_in')}</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream py-8" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="font-serif text-3xl font-bold text-foreground mb-8">{t('orders_title')}</h1>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-beige-100 rounded-xl animate-pulse" />)}
          </div>
        ) : orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map(order => (
              <div key={order.id} className="bg-white rounded-xl border border-beige-100 overflow-hidden">
                <div className={`p-5 flex items-start ${isRTL ? 'flex-row-reverse' : ''} justify-between gap-4`}>
                  <div className={`flex-1 min-w-0 ${isRTL ? 'text-right' : 'text-left'}`}>
                    <div className={`flex items-center gap-3 mb-1 flex-wrap ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
                      <span className="font-mono text-sm font-bold text-foreground">#{order.order_number}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-sans font-medium capitalize ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-700'}`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="text-xs font-sans text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString(isRTL ? 'ar' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                    <p className="text-xs font-sans text-muted-foreground mt-1">
                      {order.city}, {order.country}
                    </p>
                  </div>
                  <div className={`flex-shrink-0 ${isRTL ? 'text-left' : 'text-right'}`}>
                    <p className="font-serif font-bold text-lg">{order.total.toFixed(2)} {currency}</p>
                    <button
                      onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                      className={`text-xs font-sans text-burgundy-700 hover:underline flex items-center gap-1 ${isRTL ? 'mr-auto' : 'ml-auto'} mt-1 ${isRTL ? 'flex-row-reverse' : ''}`}
                    >
                      {expanded === order.id ? t('orders_hide') : t('orders_view')} {t('orders_details')}
                      <ChevronDown size={12} className={`transition-transform ${expanded === order.id ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                </div>

                {expanded === order.id && order.order_items && (
                  <div className="border-t border-beige-100 p-5 bg-beige-50">
                    <div className="space-y-3 mb-4">
                      {order.order_items.map(item => (
                        <div key={item.id} className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          {item.product_thumbnail && (
                            <img src={item.product_thumbnail} alt={item.product_name} className="w-12 h-12 object-cover rounded-lg" />
                          )}
                          <div className={`flex-1 min-w-0 ${isRTL ? 'text-right' : 'text-left'}`}>
                            <p className="text-sm font-sans font-medium truncate">{item.product_name}</p>
                            {item.brand_name && <p className="text-xs text-muted-foreground font-sans">{item.brand_name}</p>}
                          </div>
                          <div className={`text-sm font-sans ${isRTL ? 'text-left' : 'text-right'}`}>
                            <p className="font-medium">{item.subtotal.toFixed(2)} {currency}</p>
                            <p className="text-xs text-muted-foreground">{t('checkout_qty')} {item.quantity}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-beige-200 pt-3 space-y-1 text-xs font-sans">
                      <div className={`flex justify-between text-muted-foreground ${isRTL ? 'flex-row-reverse' : ''}`}><span>{t('checkout_subtotal')}</span><span>{order.subtotal.toFixed(2)} {currency}</span></div>
                      <div className={`flex justify-between text-muted-foreground ${isRTL ? 'flex-row-reverse' : ''}`}><span>{t('checkout_shipping')}</span><span>{order.shipping_fee === 0 ? t('checkout_free') : `${order.shipping_fee} ${currency}`}</span></div>
                      {order.discount_amount > 0 && <div className={`flex justify-between text-green-600 ${isRTL ? 'flex-row-reverse' : ''}`}><span>{t('checkout_discount')}</span><span>-{order.discount_amount.toFixed(2)} {currency}</span></div>}
                      <div className={`flex justify-between font-bold text-sm text-foreground border-t border-beige-200 pt-2 mt-2 ${isRTL ? 'flex-row-reverse' : ''}`}><span>{t('checkout_total')}</span><span>{order.total.toFixed(2)} {currency}</span></div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-xl border border-beige-100">
            <Package size={48} className="text-beige-200 mx-auto mb-4" />
            <h2 className="font-serif text-2xl font-semibold mb-3">{t('orders_empty_title')}</h2>
            <p className="text-muted-foreground font-sans mb-6">{t('orders_empty_desc')}</p>
            <Link href="/products" className="btn-primary inline-block">{t('orders_browse')}</Link>
          </div>
        )}
      </div>
    </div>
  );
}
