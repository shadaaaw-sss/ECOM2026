'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Check } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';

export default function RegisterPage() {
  const router = useRouter();
  const { signUp } = useAuth();
  const { t, isRTL } = useLanguage();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const set = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) { setError('Passwords do not match'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    const { error: err } = await signUp(form.email, form.password, form.firstName, form.lastName);
    if (err) { setError(err); setLoading(false); return; }
    setSuccess(true);
    setTimeout(() => router.push('/auth/login'), 5000);
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
          <h1 className="font-serif text-2xl font-bold text-foreground mt-6 mb-1">{t('auth_create_account')}</h1>
          <p className="text-muted-foreground font-sans text-sm">{t('auth_join_community')}</p>
        </div>

        <div className="bg-white rounded-2xl border border-beige-100 shadow-sm p-8">
          {success ? (
            <div className="text-center py-6">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check size={24} className="text-green-600" />
              </div>
              <h3 className="font-serif text-xl font-bold mb-2 text-foreground">{t('auth_account_created') || 'Registration Successful!'}</h3>
              <p className="text-muted-foreground text-sm font-sans mb-6">
                {t('auth_check_email_msg' as any) || 'A verification link has been sent to your email. Please check your inbox (and spam folder) to verify your account.'}
              </p>
              <Link href="/auth/login" className="btn-primary w-full inline-block text-center py-2.5 rounded-full font-medium">
                {t('nav_sign_in') || 'Sign In'}
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-sans p-3 rounded-lg">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-sans font-medium text-foreground mb-1.5">{t('auth_first_name')}</label>
                  <input className="input-field" value={form.firstName} onChange={e => set('firstName', e.target.value)} required placeholder="Fatima" />
                </div>
                <div>
                  <label className="block text-xs font-sans font-medium text-foreground mb-1.5">{t('auth_last_name')}</label>
                  <input className="input-field" value={form.lastName} onChange={e => set('lastName', e.target.value)} required placeholder="Alaoui" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-sans font-medium text-foreground mb-1.5">{t('auth_email')}</label>
                <input type="email" className="input-field" value={form.email} onChange={e => set('email', e.target.value)} required placeholder="fatima@example.com" />
              </div>

              <div>
                <label className="block text-xs font-sans font-medium text-foreground mb-1.5">{t('auth_password')}</label>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} className="input-field pr-10" value={form.password} onChange={e => set('password', e.target.value)} required placeholder="••••••••" minLength={6} />
                  <button type="button" onClick={() => setShowPass(v => !v)} className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground`}>
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-sans font-medium text-foreground mb-1.5">{t('auth_confirm_password')}</label>
                <input type="password" className="input-field" value={form.confirm} onChange={e => set('confirm', e.target.value)} required placeholder="••••••••" />
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full mt-2 disabled:opacity-60">
                {loading ? t('auth_creating') : t('auth_create_btn')}
              </button>
            </form>
          )}

          <p className="text-center text-sm font-sans text-muted-foreground mt-6">
            {t('auth_already_have')}{' '}
            <Link href="/auth/login" className="text-burgundy-700 font-medium hover:underline">{t('auth_sign_in_link')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
