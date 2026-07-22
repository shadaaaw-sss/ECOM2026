'use client';

import { useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';

export default function DirectionWrapper({ children }: { children: React.ReactNode }) {
  const { isRTL, locale } = useLanguage();

  useEffect(() => {
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = locale;
  }, [isRTL, locale]);

  return <>{children}</>;
}
