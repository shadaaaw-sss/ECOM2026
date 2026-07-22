'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useLanguage } from '@/context/LanguageContext';

export default function ForgotPasswordPage() {
  const { t, isRTL } = useLanguage();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err: any) {
      setError(err.message || 'Unable to send reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center py-12 px-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center gap-2">
            <div className="w-14 h-14 bg-burgundy-700 rounded-full flex items-center justify-center relative overflow-hidden shadow-sm">
              <span className="absolute text-white font-serif font-bold text-2xl">M</span>
              <img 
                src="/logo.png" 
                alt="Makhmal" 
                className="absolute inset-0 w-full h-full object-cover bg-burgundy-700" 
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} 
              />
            </div>
            <p className="font-serif font-bold text-burgundy-700 text-2xl">MAKHMAL</p>
          </Link>
          <h1 className="font-serif text-2xl font-bold text-foreground mt-6 mb-1">{t('auth_reset_title')}</h1>
          <p className="text-muted-foreground font-sans text-sm">{t('auth_reset_desc')}</p>
        </div>

        <div className="bg-white rounded-2xl border border-beige-100 shadow-sm p-8">
          {sent ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-green-600 text-2xl">✓</span>
              </div>
              <h3 className="font-serif text-lg font-semibold mb-2">{t('auth_check_email')}</h3>
              <p className="text-muted-foreground font-sans text-sm">{t('auth_check_email_desc')} <strong>{email}</strong></p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-sans p-3 rounded-lg">{error}</div>}
              <div>
                <label className="block text-xs font-sans font-medium text-foreground mb-1.5">{t('auth_email')}</label>
                <input type="email" className="input-field" value={email} onChange={e => setEmail(e.target.value)} required placeholder="fatima@example.com" />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60">
                {loading ? t('auth_sending') : t('auth_send_link')}
              </button>
            </form>
          )}
          <p className="text-center text-sm font-sans text-muted-foreground mt-6">
            <Link href="/auth/login" className="text-burgundy-700 font-medium hover:underline">{t('auth_back_sign_in')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
