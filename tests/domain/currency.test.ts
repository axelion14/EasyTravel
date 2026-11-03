import { describe, it, expect } from 'vitest';
import { convertMoney, DEFAULT_OFFLINE_RATES } from '@/features/budget/domain/currency';
import { calculateBudgetSummary, Expense } from '@/features/budget/domain/budget';

describe('Multi-Currency Domain Logic & Converter', () => {
  it('converts same currency with zero discrepancy', () => {
    const euro = { amountCents: 10000, currency: 'EUR' }; // 100 EUR
    const result = convertMoney(euro, 'EUR');
    expect(result).toEqual(euro);
  });

  it('converts EUR to USD accurately using cached offline rates', () => {
    // 100 EUR = 108 USD (rate 1.08)
    const euro = { amountCents: 10000, currency: 'EUR' };
    const usd = convertMoney(euro, 'USD');
    expect(usd.currency).toBe('USD');
    expect(usd.amountCents).toBe(10800);
  });

  it('converts USD to EUR accurately using cached offline rates', () => {
    // 108 USD / 1.08 = 100 EUR
    const usd = { amountCents: 10800, currency: 'USD' };
    const euro = convertMoney(usd, 'EUR');
    expect(euro.currency).toBe('EUR');
    expect(euro.amountCents).toBe(10000);
  });

  it('converts cross-currencies correctly (e.g. MXN to JPY)', () => {
    // Rates: EUR: 1, MXN: 21.5, JPY: 165
    // 215 MXN / 21.5 = 10 EUR -> 10 EUR * 165 = 1650 JPY
    const mxn = { amountCents: 21500, currency: 'MXN' };
    const jpy = convertMoney(mxn, 'JPY');
    expect(jpy.currency).toBe('JPY');
    expect(jpy.amountCents).toBe(165000);
  });

  it('aggregates multi-currency expenses into trip base currency seamlessly', () => {
    const multiCurrencyExpenses: Expense[] = [
      {
        id: '1',
        tripId: 'trip-1',
        category: 'lodging',
        title: 'Hotel en París (en Euros)',
        amount: { amountCents: 10000, currency: 'EUR' }, // 100 EUR
        date: '2026-11-15',
        updatedAt: new Date().toISOString(),
        isDeleted: false,
      },
      {
        id: '2',
        tripId: 'trip-1',
        category: 'flight',
        title: 'Vuelo comprado en USD',
        amount: { amountCents: 10800, currency: 'USD' }, // 108 USD = 100 EUR
        date: '2026-11-15',
        updatedAt: new Date().toISOString(),
        isDeleted: false,
      },
    ];

    const summary = calculateBudgetSummary(multiCurrencyExpenses, 'EUR');
    expect(summary.currency).toBe('EUR');
    // 100 EUR + 100 EUR (converted from 108 USD) = 200 EUR = 20000 cents
    expect(summary.totalActualCents).toBe(20000);
    expect(summary.byCategory['lodging']).toBe(10000);
    expect(summary.byCategory['flight']).toBe(10000);
  });
});
