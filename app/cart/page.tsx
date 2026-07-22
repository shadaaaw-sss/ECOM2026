'use client';

import Link from 'next/link';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Shield, Truck } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useLanguage } from '@/context/LanguageContext';
import { useCurrency } from '@/context/CurrencyContext';

export default function CartPage() {
  const { items, removeItem, updateQuantity, subtotal, itemCount, clearCart } = useCart();
  const { t, isRTL } = useLanguage();
  const { format } = useCurrency();

  const SHIPPING_FEE = 39;

  const shippingFee = SHIPPING_FEE;
  const total = subtotal + shippingFee;

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-cream py-16">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <div className="w-20 h-20 bg-beige-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag size={36} className="text-beige-300" />
          </div>
          <h1 className="font-serif text-3xl font-bold text-foreground mb-3">{t('cart_empty_title')}</h1>
          <p className="text-muted-foreground font-sans mb-8">{t('cart_empty_desc')}</p>
          <Link href="/products" className="btn-primary inline-flex items-center gap-2">
            <ShoppingBag size={16} /> {t('cart_browse')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream py-8" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-serif text-3xl font-bold text-foreground">
            {t('cart_title')} <span className="text-muted-foreground text-xl">({itemCount})</span>
          </h1>
          <button onClick={clearCart} className="text-sm text-muted-foreground hover:text-red-600 font-sans transition-colors">
            {t('cart_clear')}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map(({ product, quantity }) => (
              <div key={product.id} className="bg-white rounded-xl border border-beige-100 p-4 flex gap-4">
                <Link href={`/products/${product.id}`} className="flex-shrink-0">
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-beige-50">
                    {product.thumbnail_url ? (
                      <img src={product.thumbnail_url} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag size={24} className="text-beige-200" />
                      </div>
                    )}
                  </div>
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      {(product as any).brands && (
                        <p className="text-xs text-muted-foreground font-sans uppercase tracking-wide mb-0.5">{(product as any).brands?.name || ''}</p>
                      )}
                      <Link href={`/products/${product.id}`}>
                        <h3 className="font-sans font-medium text-sm text-foreground line-clamp-2 hover:text-burgundy-700 transition-colors">{product.name}</h3>
                      </Link>
                    </div>
                    <button onClick={() => removeItem(product.id)} className="text-muted-foreground hover:text-red-600 transition-colors flex-shrink-0 p-1">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center border border-beige-200 rounded-lg overflow-hidden">
                      <button onClick={() => updateQuantity(product.id, quantity - 1)} className="w-8 h-8 flex items-center justify-center hover:bg-beige-50 transition-colors">
                        <Minus size={12} />
                      </button>
                      <span className="w-10 text-center text-sm font-sans font-medium">{quantity}</span>
                      <button onClick={() => updateQuantity(product.id, quantity + 1)} disabled={quantity >= product.stock} className="w-8 h-8 flex items-center justify-center hover:bg-beige-50 transition-colors disabled:opacity-40">
                        <Plus size={12} />
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold font-sans text-sm">{format(Number(product.price) * quantity)}</p>
                      {quantity > 1 && <p className="text-xs text-muted-foreground font-sans">{format(Number(product.price) || 0)} {t('cart_each')}</p>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-beige-100 p-6 sticky top-24">
              <h2 className="font-serif text-xl font-semibold text-foreground mb-5">{t('cart_summary')}</h2>
              <div className="space-y-3 mb-5 text-sm font-sans">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('cart_subtotal')} ({itemCount} {itemCount !== 1 ? t('cart_items') : t('cart_item')})</span>
                  <span className="font-medium">{format(Number(subtotal) || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('cart_shipping')}</span>
                  <span className="font-medium">{format(Number(shippingFee) || 0)}</span>
                </div>
              </div>
              <div className="border-t border-beige-100 pt-4 mb-5">
                <div className="flex justify-between items-center">
                  <span className="font-sans font-semibold text-foreground">{t('cart_total')}</span>
                  <span className="font-serif text-2xl font-bold text-foreground">{format(Number(total) || 0)}</span>
                </div>
              </div>
              <Link href="/checkout" className="btn-primary w-full flex items-center justify-center gap-2 mb-3">
                {t('cart_checkout')} <ArrowRight size={16} className={isRTL ? 'rotate-180' : ''} />
              </Link>
              <Link href="/products" className="block text-center text-sm font-sans text-muted-foreground hover:text-foreground transition-colors">
                {t('cart_continue')}
              </Link>
              <div className="mt-5 pt-5 border-t border-beige-50 space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-sans">
                  <Shield size={12} className="text-gold-500" /> {t('cart_secure')}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-sans">
                  <Truck size={12} className="text-gold-500" /> {t('cart_delivery_msg')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
