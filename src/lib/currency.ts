export type ExchangeRates = Record<string, number>;

let activeCurrency = 'VND';
let activeRates: ExchangeRates = { USD: 1, VND: 1 };

export function updateCurrencyFormatter(
  currency: string,
  rates: ExchangeRates
) {
  activeCurrency = currency;
  activeRates = rates;
}

export function formatCurrency(value?: number | string) {
  const amount = Number(value ?? 0);
  const vndRate = activeRates.VND;
  const targetRate = activeRates[activeCurrency];
  const converted =
    Number.isFinite(amount) && vndRate && targetRate
      ? (amount / vndRate) * targetRate
      : amount;
  return new Intl.NumberFormat(activeCurrency === 'VND' ? 'vi-VN' : undefined, {
    style: 'currency',
    currency: activeCurrency,
    maximumFractionDigits: activeCurrency === 'VND' ? 0 : 2,
  }).format(converted);
}
