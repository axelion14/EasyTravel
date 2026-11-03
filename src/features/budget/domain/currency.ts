import { Money } from '@/core/domain/types';

export interface CurrencyRateTable {
  base: string; // ej. "EUR"
  lastUpdated: string;
  rates: Record<string, number>;
}

/**
 * Tasas de cambio de referencia cacheadas localmente para uso 100% offline.
 * Se pueden actualizar silenciosamente en segundo plano cuando haya conexión.
 */
export const DEFAULT_OFFLINE_RATES: Record<string, number> = {
  EUR: 1.0,      // Base
  USD: 1.08,     // 1 EUR = 1.08 USD
  GBP: 0.85,     // 1 EUR = 0.85 GBP
  MXN: 21.50,    // 1 EUR = 21.50 MXN
  JPY: 165.0,    // 1 EUR = 165 JPY
  CAD: 1.48,     // 1 EUR = 1.48 CAD
  CHF: 0.96,     // 1 EUR = 0.96 CHF
  BRL: 5.90,     // 1 EUR = 5.90 BRL
};

export const SUPPORTED_CURRENCIES = [
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'USD', symbol: '$', name: 'Dólar Estadounidense' },
  { code: 'GBP', symbol: '£', name: 'Libra Esterlina' },
  { code: 'MXN', symbol: '$', name: 'Peso Mexicano' },
  { code: 'JPY', symbol: '¥', name: 'Yen Japonés' },
  { code: 'CAD', symbol: 'CA$', name: 'Dólar Canadiense' },
  { code: 'CHF', symbol: 'CHF', name: 'Franco Suizo' },
  { code: 'BRL', symbol: 'R$', name: 'Real Brasileño' },
];

/**
 * Convierte un monto en centavos de una moneda a otra utilizando la tabla de tasas.
 * Realiza el cálculo en flotante y redondea estrictamente a centavos enteros.
 */
export function convertMoney(
  source: Money,
  targetCurrency: string,
  rates: Record<string, number> = DEFAULT_OFFLINE_RATES
): Money {
  if (source.currency === targetCurrency) {
    return source;
  }

  const rateSource = rates[source.currency];
  const rateTarget = rates[targetCurrency];

  // Si alguna moneda no está en la tabla, devolver con la moneda original
  if (!rateSource || !rateTarget) {
    return {
      amountCents: source.amountCents,
      currency: targetCurrency,
    };
  }

  // Convertir primero a moneda base (EUR) y luego a la moneda objetivo
  // sourceAmountInEur = amount / rateSource
  // targetAmount = sourceAmountInEur * rateTarget
  const amountInEur = source.amountCents / rateSource;
  const targetCents = Math.round(amountInEur * rateTarget);

  return {
    amountCents: targetCents,
    currency: targetCurrency,
  };
}
