'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Package, Heart, LogOut, Key, Save } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { api } from '@/lib/api';

export default function ProfilePage() {
  const { user, signOut, loading: authLoading } = useAuth();
  const { t, isRTL } = useLanguage();
  const router = useRouter();
  const [tab, setTab] = useState<'info' | 'password'>('info');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [pwError, setPwError] = useState('');
  const [pwSaved, setPwSaved] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
    }
  }, [user, authLoading]);

  const saveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch('/auth/me', { firstName, lastName });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    if (pwForm.next !== pwForm.confirm) { setPwError('Passwords do not match'); return; }
    if (pwForm.next.length < 6) { setPwError('Must be at least 6 characters'); return; }
    try {
      await api.patch('/auth/me', { password: pwForm.next });
      setPwSaved(true);
      setPwForm({ current: '', next: '', confirm: '' });
      setTimeout(() => setPwSaved(false), 2000);
    } catch (err: any) {
      setPwError(err.message || 'Unable to update password');
    }
  };

  if (authLoading || !user) return null;

  return (
    <div className="min-h-screen bg-cream py-8" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="font-serif text-3xl font-bold text-foreground mb-8">{t('profile_title')}</h1>

        <div className={`grid grid-cols-1 md:grid-cols-4 gap-6 ${isRTL ? 'direction-rtl' : ''}`}>
          {/* Sidebar */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-xl border border-beige-100 p-4">
              <div className="text-center mb-4 pb-4 border-b border-beige-100">
                <div className="w-14 h-14 bg-burgundy-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="font-serif font-bold text-xl text-burgundy-700">
                    {firstName ? firstName[0] : user.email?.[0]?.toUpperCase()}
                  </span>
                </div>
                <p className="font-sans font-semibold text-sm text-foreground">{firstName} {lastName}</p>
                <p className="text-xs text-muted-foreground font-sans truncate">{user.email}</p>
              </div>
              <nav className="space-y-1">
                {[
                  { icon: User, label: t('profile_personal'), tab: 'info' as const },
                  { icon: Key, label: t('profile_password'), tab: 'password' as const },
                ].map(({ icon: Icon, label, tab: tabVal }) => (
                  <button
                    key={tabVal}
                    onClick={() => setTab(tabVal)}
                    className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-sans transition-colors ${isRTL ? 'flex-row-reverse' : ''} ${tab === tabVal ? 'bg-burgundy-50 text-burgundy-700 font-medium' : 'text-muted-foreground hover:bg-beige-50'}`}
                  >
                    <Icon size={15} /> {label}
                  </button>
                ))}
                <Link href="/orders" className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-sans text-muted-foreground hover:bg-beige-50 transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Package size={15} /> {t('profile_my_orders')}
                </Link>
                <Link href="/wishlist" className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-sans text-muted-foreground hover:bg-beige-50 transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Heart size={15} /> {t('profile_wishlist')}
                </Link>
                <button
                  onClick={() => { signOut(); router.push('/'); }}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-sans text-red-600 hover:bg-red-50 transition-colors mt-2 border-t border-beige-100 pt-3 ${isRTL ? 'flex-row-reverse' : ''}`}
                >
                  <LogOut size={15} /> {t('profile_sign_out')}
                </button>
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="md:col-span-3">
            <div className="bg-white rounded-xl border border-beige-100 p-6">
              {tab === 'info' ? (
                <>
                  <h2 className="font-serif text-xl font-semibold mb-5">{t('profile_personal')}</h2>
                  <form onSubmit={saveInfo} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-sans font-medium text-foreground mb-1.5">{t('auth_first_name')}</label>
                        <input className="input-field" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Fatima" />
                      </div>
                      <div>
                        <label className="block text-xs font-sans font-medium text-foreground mb-1.5">{t('auth_last_name')}</label>
                        <input className="input-field" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Alaoui" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-sans font-medium text-foreground mb-1.5">{t('auth_email')}</label>
                      <input className="input-field bg-beige-50" value={user.email || ''} readOnly disabled />
                      <p className="text-xs text-muted-foreground font-sans mt-1">{t('profile_email_note')}</p>
                    </div>
                    <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
                      <Save size={14} /> {saving ? t('profile_saving') : saved ? t('profile_saved') : t('profile_save')}
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <h2 className="font-serif text-xl font-semibold mb-5">{t('profile_change_password')}</h2>
                  <form onSubmit={changePassword} className="space-y-4 max-w-sm">
                    {pwError && <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-sans p-3 rounded-lg">{pwError}</div>}
                    {pwSaved && <div className="bg-green-50 border border-green-200 text-green-700 text-sm font-sans p-3 rounded-lg">{t('profile_password_updated')}</div>}
                    <div>
                      <label className="block text-xs font-sans font-medium text-foreground mb-1.5">{t('profile_new_password')}</label>
                      <input type="password" className="input-field" value={pwForm.next} onChange={e => setPwForm(f => ({ ...f, next: e.target.value }))} required minLength={6} placeholder="••••••••" />
                    </div>
                    <div>
                      <label className="block text-xs font-sans font-medium text-foreground mb-1.5">{t('profile_confirm_new')}</label>
                      <input type="password" className="input-field" value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} required placeholder="••••••••" />
                    </div>
                    <button type="submit" className="btn-primary flex items-center gap-2">
                      <Key size={14} /> {t('profile_update_password')}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
