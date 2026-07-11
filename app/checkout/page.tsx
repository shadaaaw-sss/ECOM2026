'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, ShoppingBag } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { api } from '@/lib/api';
import { Coupon } from '@/lib/types';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const { t, currency, isRTL } = useLanguage();

  const PAYMENT_METHODS = [
    { id: 'cash_on_delivery', label: t('payment_cod') },
    { id: 'bank_transfer', label: t('payment_bank') },
    { id: 'card', label: t('payment_card') },
  ];

  const [form, setForm] = useState({
    first_name: '', last_name: '', email: user?.email || '', phone: '',
    address_line1: '', address_line2: '', city: '', postal_code: '', country: 'Qatar',
    notes: '',
  });
  const [shippingMethods, setShippingMethods] = useState<Array<{ id: string; name: string; description: string | null; price: number }>>([]);
  const [shippingMethod, setShippingMethod] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash_on_delivery');
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    const fetchShipping = async () => {
      try {
        const res = await api.get<any[]>('/shipping-methods');
        setShippingMethods(res || []);
        if (res && res.length > 0) {
          setShippingMethod(res[0].name);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchShipping();
  }, []);

  const selectedShipping = shippingMethods.find(m => m.name === shippingMethod);
  const shippingFee = selectedShipping ? Number(selectedShipping.price) || 0 : 0;
  const total = Number(subtotal) + shippingFee - Number(discount);

  const set = (field: string, value: string) => {
    setForm(f => ({ ...f, [field]: value }));
    setErrors(e => ({ ...e, [field]: '' }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.first_name.trim()) e.first_name = t('checkout_required');
    if (!form.last_name.trim()) e.last_name = t('checkout_required');
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = t('checkout_valid_email');
    if (!form.address_line1.trim()) e.address_line1 = t('checkout_required');
    if (!form.city.trim()) e.city = t('checkout_required');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCoupon = async () => {
    setCouponError('');
    if (!couponCode.trim()) return;
    try {
      const coupon = await api.get<Coupon>(`/coupons/${couponCode.toUpperCase()}`);
      if (!coupon || !coupon.is_active) { setCouponError(t('checkout_coupon_invalid')); return; }
      if (coupon.min_order_amount && subtotal < coupon.min_order_amount) {
        setCouponError(`Minimum order of ${coupon.min_order_amount} ${currency} required`);
        return;
      }
      const disc = coupon.type === 'percentage' ? (subtotal * coupon.value) / 100 : coupon.value;
      setDiscount(disc);
    } catch {
      setCouponError(t('checkout_coupon_invalid'));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || items.length === 0) return;
    setLoading(true);
    setSubmitError('');
    try {
      const response = await api.post<any>('/orders', {
        ...form,
        shippingMethod,
        paymentMethod,
        subtotal,
        shippingFee,
        taxAmount: 0,
        discountAmount: discount,
        total,
        couponCode: couponCode || null,
        items,
      });
      clearCart();
      router.push(`/checkout/success?order=${response.orderNumber || response.order_number}`);
    } catch (err: any) {
      console.error(err);
      setSubmitError(err.message || 'Failed to place order. Please try again.');
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-cream py-16 text-center">
        <ShoppingBag size={48} className="text-beige-200 mx-auto mb-4" />
        <h1 className="font-serif text-2xl font-bold mb-3">{t('checkout_empty')}</h1>
        <Link href="/products" className="btn-primary inline-block">{t('checkout_empty_cta')}</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream py-8" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto px-4">
        <nav className="flex items-center gap-2 text-sm font-sans text-muted-foreground mb-6">
          <Link href="/cart" className="hover:text-foreground">{t('checkout_breadcrumb_cart')}</Link>
          <ChevronRight size={14} className={isRTL ? 'rotate-180' : ''} />
          <span className="text-foreground font-medium">{t('checkout_title')}</span>
        </nav>
        <h1 className="font-serif text-3xl font-bold text-foreground mb-8">{t('checkout_title')}</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* Contact */}
              <div className="bg-white rounded-xl border border-beige-100 p-6">
                <h2 className="font-serif text-lg font-semibold mb-5">{t('checkout_contact')}</h2>
                <div className="grid grid-cols-2 gap-4">
                  <Field label={t('checkout_first_name')} error={errors.first_name}>
                    <input className="input-field" value={form.first_name} onChange={e => set('first_name', e.target.value)} />
                  </Field>
                  <Field label={t('checkout_last_name')} error={errors.last_name}>
                    <input className="input-field" value={form.last_name} onChange={e => set('last_name', e.target.value)} />
                  </Field>
                  <Field label={t('checkout_email')} error={errors.email} className="col-span-2 sm:col-span-1">
                    <input type="email" className="input-field" value={form.email} onChange={e => set('email', e.target.value)} />
                  </Field>
                  <Field label={t('checkout_phone')} className="col-span-2 sm:col-span-1">
                    <input type="tel" className="input-field" value={form.phone} onChange={e => set('phone', e.target.value)} />
                  </Field>
                </div>
              </div>

              {/* Address */}
              <div className="bg-white rounded-xl border border-beige-100 p-6">
                <h2 className="font-serif text-lg font-semibold mb-5">{t('checkout_address')}</h2>
                <div className="grid grid-cols-2 gap-4">
                  <Field label={t('checkout_address1')} error={errors.address_line1} className="col-span-2">
                    <input className="input-field" value={form.address_line1} onChange={e => set('address_line1', e.target.value)} />
                  </Field>
                  <Field label={t('checkout_address2')} className="col-span-2">
                    <input className="input-field" value={form.address_line2} onChange={e => set('address_line2', e.target.value)} />
                  </Field>
                  <Field label={t('checkout_city')} error={errors.city}>
                    <input className="input-field" value={form.city} onChange={e => set('city', e.target.value)} />
                  </Field>
                  <Field label={t('checkout_postal')}>
                    <input className="input-field" value={form.postal_code} onChange={e => set('postal_code', e.target.value)} />
                  </Field>
                  <Field label={t('checkout_country')} className="col-span-2">
                    <select className="input-field" value={form.country} onChange={e => set('country', e.target.value)}>
                      {['Qatar', 'UAE', 'Saudi Arabia', 'Kuwait', 'Bahrain', 'Oman', 'France', 'Other'].map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label={t('checkout_notes')} className="col-span-2">
                    <textarea className="input-field resize-none h-20" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder={t('checkout_notes_placeholder')} />
                  </Field>
                </div>
              </div>

              {/* Shipping */}
              <div className="bg-white rounded-xl border border-beige-100 p-6">
                <h2 className="font-serif text-lg font-semibold mb-5">{t('checkout_shipping_method')}</h2>
                <div className="space-y-3">
                  {shippingMethods.length > 0 ? (
                    shippingMethods.map(method => (
                      <label key={method.id} className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${shippingMethod === method.name ? 'border-burgundy-700 bg-burgundy-50' : 'border-beige-200 hover:border-beige-300'}`}>
                        <input type="radio" name="shipping" value={method.name} checked={shippingMethod === method.name} onChange={() => setShippingMethod(method.name)} className="hidden" />
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${shippingMethod === method.name ? 'border-burgundy-700 bg-burgundy-700' : 'border-beige-300'}`}>
                          {shippingMethod === method.name && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                        <div className="flex-1">
                          <p className="font-sans font-medium text-sm text-foreground">{method.name}</p>
                          {method.description && <p className="font-sans text-xs text-muted-foreground">{method.description}</p>}
                        </div>
                        <span className="font-sans font-semibold text-sm">{method.price === 0 ? t('checkout_free') : `${method.price} ${currency}`}</span>
                      </label>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground italic font-sans">No shipping methods available.</p>
                  )}
                </div>
              </div>

              {/* Payment */}
              <div className="bg-white rounded-xl border border-beige-100 p-6">
                <h2 className="font-serif text-lg font-semibold mb-5">{t('checkout_payment_method')}</h2>
                <div className="space-y-3">
                  {PAYMENT_METHODS.map(method => (
                    <label key={method.id} className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${paymentMethod === method.id ? 'border-burgundy-700 bg-burgundy-50' : 'border-beige-200 hover:border-beige-300'}`}>
                      <input type="radio" name="payment" value={method.id} checked={paymentMethod === method.id} onChange={() => setPaymentMethod(method.id)} className="hidden" />
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${paymentMethod === method.id ? 'border-burgundy-700 bg-burgundy-700' : 'border-beige-300'}`}>
                        {paymentMethod === method.id && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      <span className="font-sans font-medium text-sm text-foreground">{method.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Summary */}
            <div>
              <div className="bg-white rounded-xl border border-beige-100 p-6 sticky top-24">
                <h2 className="font-serif text-xl font-semibold mb-5">{t('checkout_your_order')}</h2>
                <div className="space-y-3 mb-5 max-h-56 overflow-y-auto">
                  {items.map(({ product, quantity }) => (
                    <div key={product.id} className="flex gap-3 items-start">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-beige-50 flex-shrink-0">
                        {product.thumbnail_url && <img src={product.thumbnail_url} alt={product.name} className="w-full h-full object-cover" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-sans font-medium text-foreground line-clamp-2">{product.name}</p>
                        <p className="text-xs text-muted-foreground font-sans">{t('checkout_qty')} {quantity}</p>
                      </div>
                      <span className="text-xs font-semibold font-sans flex-shrink-0">{(Number(product.price) * quantity).toFixed(2)} {currency}</span>
                    </div>
                  ))}
                </div>

                {/* Coupon */}
                <div className="mb-5 pb-5 border-b border-beige-100">
                  <div className="flex gap-2">
                    <input type="text" value={couponCode} onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponError(''); }} placeholder={t('checkout_coupon_placeholder')} className="input-field flex-1 py-2 text-sm" />
                    <button type="button" onClick={handleCoupon} className="px-4 py-2 bg-foreground text-white rounded-sm text-sm font-sans hover:bg-gray-800 transition-colors">{t('checkout_coupon_apply')}</button>
                  </div>
                  {couponError && <p className="text-xs text-red-600 font-sans mt-1">{couponError}</p>}
                  {discount > 0 && <p className="text-xs text-green-600 font-sans mt-1">{t('checkout_coupon_applied')} -{discount.toFixed(2)} {currency}</p>}
                </div>

                {submitError && (
                  <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-xs font-sans p-3 rounded-lg">
                    {submitError}
                  </div>
                )}

                <div className="space-y-2 mb-5 text-sm font-sans">
                  <div className="flex justify-between"><span className="text-muted-foreground">{t('checkout_subtotal')}</span><span>{subtotal.toFixed(2)} {currency}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">{t('checkout_shipping')}</span><span>{shippingFee === 0 ? t('checkout_free') : `${shippingFee} ${currency}`}</span></div>
                  {discount > 0 && <div className="flex justify-between text-green-600"><span>{t('checkout_discount')}</span><span>-{discount.toFixed(2)} {currency}</span></div>}
                </div>
                <div className="border-t border-beige-100 pt-4 mb-5">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold font-sans">{t('checkout_total')}</span>
                    <span className="font-serif text-2xl font-bold">{total.toFixed(2)} {currency}</span>
                  </div>
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
                  {loading ? t('checkout_placing') : t('checkout_place_order')}
                </button>
                <p className="text-center text-xs text-muted-foreground font-sans mt-3">{t('checkout_terms')}</p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children, error, className = '' }: { label: string; children: React.ReactNode; error?: string; className?: string }) {
  return (
    <div className={`flex flex-col gap-1 col-span-2 sm:col-span-1 ${className}`}>
      <label className="text-xs font-sans font-medium text-foreground">{label}</label>
      {children}
      {error && <p className="text-xs text-red-600 font-sans">{error}</p>}
    </div>
  );
}
