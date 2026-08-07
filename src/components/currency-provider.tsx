'use client';

import {
  createContext,
  Fragment,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { Spin } from 'antd';
import { updateCurrencyFormatter, type ExchangeRates } from '@/lib/currency';

type CurrencyContextValue = {
  currency: string;
  rates: ExchangeRates;
  loading: boolean;
  setCurrency: (currency: string) => void;
};
type RatesResponse = { rates: ExchangeRates };
const storageKey = 'apibank_currency',
  fallbackRates: ExchangeRates = { USD: 1, VND: 1 };
const CurrencyContext = createContext<CurrencyContextValue | undefined>(
  undefined
);

export default function CurrencyProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [currency, setCurrencyState] = useState('VND'),
    [rates, setRates] = useState<ExchangeRates>(fallbackRates),
    [loading, setLoading] = useState(true);
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) queueMicrotask(() => setCurrencyState(saved));
    fetch('/api/exchange-rates')
      .then((response) => {
        if (!response.ok) throw new Error('Không tải được tỷ giá');
        return response.json() as Promise<RatesResponse>;
      })
      .then((data) => {
        if (data.rates?.VND) setRates(data.rates);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  updateCurrencyFormatter(currency, rates);
  const setCurrency = (value: string) => {
    updateCurrencyFormatter(value, rates);
    localStorage.setItem(storageKey, value);
    setCurrencyState(value);
    window.dispatchEvent(
      new CustomEvent('apibank:currency-change', {
        detail: { currency: value },
      })
    );
  };
  const value = useMemo(
    () => ({ currency, rates, loading, setCurrency }),
    [currency, rates, loading]
  );
  return (
    <CurrencyContext.Provider value={value}>
      {loading ? (
        <div className="currency-initializing">
          <Spin size="large" />
          <span></span>
        </div>
      ) : (
        <Fragment key={`${currency}-${rates.VND}`}>{children}</Fragment>
      )}
    </CurrencyContext.Provider>
  );
}
export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context)
    throw new Error('useCurrency phải được dùng trong CurrencyProvider');
  return context;
}
