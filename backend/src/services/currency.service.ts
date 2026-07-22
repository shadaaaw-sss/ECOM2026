import { config } from '../config/index.js';

const CACHE_TTL = 24 * 60 * 60 * 1000; // 24h — rates are cached and refreshed once a day
const BASE_CURRENCY = 'QAR';

export const TARGET_CURRENCIES = ['USD', 'EUR', 'SAR', 'AED', 'KWD', 'OMR', 'BHD'] as const;
export type TargetCurrency = (typeof TARGET_CURRENCIES)[number];

interface RateCache {
  base: string;
  rates: Record<string, number>;
  fetchedAt: number;
}

let cache: RateCache | null = null;

const fetchRates = async (base: string = BASE_CURRENCY): Promise<Record<string, number>> => {
  if (cache && cache.base === base && Date.now() - cache.fetchedAt < CACHE_TTL) {
    return cache.rates;
  }

  // Priority: 1) ExchangeRate-API (if key set), 2) open.er-api.com (free, no key)
  let rates: Record<string, number> | null = null;

  try {
    if (config.currency.apiKey) {
      const res = await fetch(`https://v6.exchangerate-api.com/v6/${config.currency.apiKey}/latest/${base}`);
      if (res.ok) {
        const data = await res.json();
        rates = data.conversion_rates;
      }
    }
  } catch { /* fallthrough */ }

  if (!rates) {
    try {
      const res = await fetch(`https://open.er-api.com/v6/latest/${base}`);
      if (res.ok) {
        const data = await res.json();
        rates = data.rates;
      }
    } catch { /* fallthrough */ }
  }

  if (!rates) {
    rates = {
      QAR: 1, USD: 0.2747, EUR: 0.2523, SAR: 1.0308,
      AED: 1.0095, KWD: 0.0844, OMR: 0.1058, BHD: 0.1035,
    };
  }

  cache = { base, rates, fetchedAt: Date.now() };
  return rates;
};

export const convertPrice = async (amountQAR: number, to: string): Promise<number> => {
  const rates = await fetchRates();
  const rate = rates[to.toUpperCase()];
  if (!rate) throw new Error(`Unsupported currency: ${to}`);
  return Math.round(amountQAR * rate * 100) / 100;
};

export const getRates = async (base?: string): Promise<Record<string, number>> => {
  return fetchRates(base);
};

export const clearCache = () => { cache = null; };

// Keep the QAR -> {USD,EUR,SAR,AED,KWD,OMR,BHD} cache warm with a daily refresh
// so requests never wait on the upstream API and rates stay at most 24h old.
let dailyRefreshTimer: NodeJS.Timeout | null = null;
export const startDailyRateRefresh = () => {
  if (dailyRefreshTimer) return;
  fetchRates().catch(() => { /* fallback rates already cover this */ });
  dailyRefreshTimer = setInterval(() => {
    fetchRates().catch(() => {});
  }, CACHE_TTL);
  dailyRefreshTimer.unref?.();
};

startDailyRateRefresh();
