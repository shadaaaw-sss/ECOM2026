'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useLanguage } from '@/context/LanguageContext';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t, isRTL } = useLanguage();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No token provided.');
      return;
    }

    const verify = async () => {
      try {
        await api.get<{ message: string }>(`/auth/verify-email?token=${token}`);
        setStatus('success');
      } catch (err: any) {
        setStatus('error');
        setMessage(err.message || 'Verification failed.');
      }
    };
    verify();
  }, [token]);

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center py-12 px-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-md w-full text-center">
        {/* Brand Logo Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex flex-col items-center gap-2">
            <div className="w-14 h-14 bg-burgundy-700 rounded-full flex items-center justify-center relative overflow-hidden shadow-md">
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
        </div>

        {/* Verification Status Card */}
        <div className="bg-white rounded-2xl border border-beige-100 shadow-sm p-8">
          {status === 'loading' && (
            <div className="py-6 flex flex-col items-center gap-4">
              <Loader2 size={40} className="text-burgundy-700 animate-spin" />
              <h2 className="font-serif text-xl font-bold text-foreground">
                {t('verify_title' as any) || 'Verifying Email'}
              </h2>
              <p className="text-muted-foreground text-sm font-sans">
                {t('verify_loading' as any) || 'Please wait while we verify your email address...'}
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="py-6 flex flex-col items-center">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 size={36} className="text-green-600" />
              </div>
              <h2 className="font-serif text-2xl font-bold text-foreground mb-2">
                {t('verify_success_title') || 'Email Verified!'}
              </h2>
              <p className="text-muted-foreground text-sm font-sans mb-6">
                {t('verify_success_desc') || 'Your email has been verified successfully. You can now access all store functionalities.'}
              </p>
              <Link href="/auth/login" className="btn-primary w-full inline-block text-center py-2.5 rounded-full font-medium">
                {t('nav_sign_in') || 'Sign In'}
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className="py-6 flex flex-col items-center">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                <XCircle size={36} className="text-red-600" />
              </div>
              <h2 className="font-serif text-2xl font-bold text-foreground mb-2">
                {t('verify_failed_title' as any) || 'Verification Failed'}
              </h2>
              <p className="text-muted-foreground text-sm font-sans mb-6">
                {message || t('verify_failed_desc' as any) || 'The token is invalid or has expired. Please try registering again.'}
              </p>
              <div className="w-full space-y-3">
                <Link href="/auth/register" className="btn-primary w-full block text-center py-2.5 rounded-full font-medium">
                  {t('nav_create_account') || 'Create Account'}
                </Link>
                <Link href="/" className="w-full block text-center py-2.5 border border-beige-200 hover:bg-beige-50 rounded-full text-sm font-medium text-foreground transition-colors">
                  {t('nav_home') || 'Back to Home'}
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
