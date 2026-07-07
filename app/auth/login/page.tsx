'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const { t, isRTL } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: err } = await signIn(email, password);
    if (err) { setError(err); setLoading(false); return; }
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center py-12 px-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-md w-full">
        {/* Logo */}
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
          <h1 className="font-serif text-2xl font-bold text-foreground mt-6 mb-1">{t('auth_welcome_back')}</h1>
          <p className="text-muted-foreground font-sans text-sm">{t('auth_sign_in_desc')}</p>
        </div>

        <div className="bg-white rounded-2xl border border-beige-100 shadow-sm p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-sans p-3 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-sans font-medium text-foreground mb-1.5">{t('auth_email')}</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="fatima@example.com"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-xs font-sans font-medium text-foreground mb-1.5">{t('auth_password')}</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className={`input-field ${isRTL ? 'pr-10' : 'pr-10'}`}
                />
                <button type="button" onClick={() => setShowPass(v => !v)} className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground`}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className={`flex items-center ${isRTL ? 'justify-start' : 'justify-end'}`}>
              <Link href="/auth/forgot-password" className="text-xs font-sans text-burgundy-700 hover:underline">
                {t('auth_forgot')}
              </Link>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60">
              {loading ? t('auth_signing_in') : t('auth_sign_in_btn')}
            </button>
          </form>

          <p className="text-center text-sm font-sans text-muted-foreground mt-6">
            {t('auth_no_account')}{' '}
            <Link href="/auth/register" className="text-burgundy-700 font-medium hover:underline">{t('auth_create_one')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
