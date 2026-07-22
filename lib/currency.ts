const CACHE_KEY = 'makhmal_rates';
const CACHE_TTL = 30 * 60 * 1000;

interface RateData {
  base: string;
  rates: Record<string, number>;
  updatedAt: string;
}

const SUPPORTED = ['QAR', 'USD', 'EUR', 'SAR', 'AED', 'KWD', 'OMR', 'BHD'] as const;
export type CurrencyCode = (typeof SUPPORTED)[number];

const LOCALE_MAP: Record<string, string> = {
  en: 'en-US', fr: 'fr-FR', ar: 'ar-QA',
};

// Full currency names localized per interface language, keyed by ISO 4217 code.
// Used in place of ambiguous native symbols (QAR/SAR/OMR all share the same glyph, '﷼').
const CURRENCY_NAMES: Record<string, Record<CurrencyCode, string>> = {
  en: {
    QAR: 'Qatari Riyal', USD: 'US Dollar', EUR: 'Euro', SAR: 'Saudi Riyal',
    AED: 'UAE Dirham', KWD: 'Kuwaiti Dinar', OMR: 'Omani Rial', BHD: 'Bahraini Dinar',
  },
  fr: {
    QAR: 'Riyal Qatari', USD: 'Dollar Américain', EUR: 'Euro', SAR: 'Riyal Saoudien',
    AED: 'Dirham des Émirats', KWD: 'Dinar Koweïtien', OMR: 'Rial Omanais', BHD: 'Dinar Bahreïni',
  },
  ar: {
    QAR: 'ريال قطري', USD: 'دولار أمريكي', EUR: 'يورو', SAR: 'ريال سعودي',
    AED: 'درهم إماراتي', KWD: 'دينار كويتي', OMR: 'ريال عماني', BHD: 'دينار بحريني',
  },
};

const getCachedRates = (): RateData | null => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as RateData & { _cachedAt: number };
    if (Date.now() - data._cachedAt > CACHE_TTL) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return data;
  } catch { return null; }
};

const setCachedRates = (data: RateData) => {
  localStorage.setItem(CACHE_KEY, JSON.stringify({ ...data, _cachedAt: Date.now() }));
};

let fetchPromise: Promise<RateData> | null = null;

export const fetchRates = async (force = false): Promise<RateData> => {
  if (!force) {
    const cached = getCachedRates();
    if (cached) return cached;
  }
  if (fetchPromise) return fetchPromise;

  fetchPromise = (async () => {
    const base = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api').replace(/\/$/, '');
    const res = await fetch(`${base}/rates`);
    if (!res.ok) throw new Error('Failed to fetch rates');
    const data: RateData = await res.json();
    setCachedRates(data);
    return data;
  })();

  try {
    return await fetchPromise;
  } finally {
    fetchPromise = null;
  }
};

// Pure, synchronous conversion of a raw QAR amount using already-fetched rates.
// Used by CurrencyContext so components can convert-and-render in a single call,
// without awaiting a fetch on every price displayed.
export const convertAmount = (amountQAR: number, to: CurrencyCode, rates: Record<string, number>): number => {
  if (to === 'QAR') return amountQAR;
  const rate = rates[to];
  if (!rate) return amountQAR;
  return Math.round(amountQAR * rate * 100) / 100;
};

export const convertPrice = async (amountQAR: number, to: CurrencyCode): Promise<number> => {
  const { rates } = await fetchRates();
  return convertAmount(amountQAR, to, rates);
};

// Renders as "1,234.00 QAR" — the standardized ISO 4217 code, never a native symbol,
// since QAR/SAR/OMR all share the same raw glyph ('﷼') and would otherwise be ambiguous.
export const formatPrice = (amount: number, code: CurrencyCode, locale = 'en'): string => {
  const localeStr = LOCALE_MAP[locale] || 'en-US';
  const formatted = new Intl.NumberFormat(localeStr, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
  return `${formatted} ${code}`;
};

export const getCurrencyName = (code: CurrencyCode, locale = 'en'): string =>
  (CURRENCY_NAMES[locale] || CURRENCY_NAMES.en)[code] || code;

export const SUPPORTED_CURRENCIES = SUPPORTED;

export const getCurrencyOptions = (locale = 'en'): { code: CurrencyCode; label: string }[] =>
  SUPPORTED.map(code => ({ code, label: getCurrencyName(code, locale) }));
