'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { CurrencyCode, fetchRates, convertAmount, formatPrice, SUPPORTED_CURRENCIES, getCurrencyOptions } from '@/lib/currency';
import { useLanguage } from './LanguageContext';

interface CurrencyContextType {
  currency: CurrencyCode;
  setCurrency: (code: CurrencyCode) => void;
  /** Converts a raw QAR amount (as stored in the database) into the selected currency. */
  convert: (amountQAR: number) => number;
  /** Converts a raw QAR amount into the selected currency AND formats it for display. */
  format: (amountQAR: number) => string;
  loading: boolean;
  options: ReturnType<typeof getCurrencyOptions>;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const { locale } = useLanguage();
  const [currency, setCurrencyState] = useState<CurrencyCode>('QAR');
  const [rates, setRates] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('makhmal_currency') as CurrencyCode;
    if (stored && SUPPORTED_CURRENCIES.includes(stored)) {
      setCurrencyState(stored);
    }
    fetchRates()
      .then(data => setRates(data.rates))
      .finally(() => setLoading(false));
  }, []);

  const setCurrency = (code: CurrencyCode) => {
    setCurrencyState(code);
    localStorage.setItem('makhmal_currency', code);
  };

  // Real-time, synchronous conversion: rates are already loaded in state, so every
  // raw QAR price coming from the database is intercepted and converted on render
  // as soon as the user switches currency — no per-price fetch or await needed.
  const convert = (amountQAR: number): number => convertAmount(amountQAR, currency, rates);

  const format = (amountQAR: number) => formatPrice(convert(amountQAR), currency, locale);
  const options = getCurrencyOptions(locale);

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, convert, format, loading, options }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider');
  return ctx;
}
