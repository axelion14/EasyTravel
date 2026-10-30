import { describe, it, expect } from 'vitest';
import { calculateBudgetSummary, buildDeepLink, Expense } from '@/features/budget/domain/budget';

describe('Budget Domain Logic', () => {
  it('calculates total budget accurately using integer cents to avoid floating point issues', () => {
    const expenses: Expense[] = [
      {
        id: '1',
        tripId: 'trip-1',
        category: 'food',
        title: 'Café',
        amount: { amountCents: 1050, currency: 'EUR' }, // 10.50 €
        date: '2026-11-15',
        updatedAt: '2026-11-15T10:00:00Z',
        isDeleted: false,
      },
      {
        id: '2',
        tripId: 'trip-1',
        category: 'food',
        title: 'Bistro',
        amount: { amountCents: 2025, currency: 'EUR' }, // 20.25 €
        date: '2026-11-15',
        updatedAt: '2026-11-15T13:00:00Z',
        isDeleted: false,
      },
      {
        id: '3',
        tripId: 'trip-1',
        category: 'activity',
        title: 'Museo',
        amount: { amountCents: 1500, currency: 'EUR' }, // 15.00 €
        date: '2026-11-15',
        updatedAt: '2026-11-15T15:00:00Z',
        isDeleted: false,
      },
    ];

    const summary = calculateBudgetSummary(expenses, 'EUR');

    expect(summary.totalActualCents).toBe(4575); // 45.75 €
    expect(summary.byCategory['food']).toBe(3075); // 30.75 €
    expect(summary.byCategory['activity']).toBe(1500); // 15.00 €
    expect(summary.currency).toBe('EUR');
  });

  it('ignores deleted expenses in budget summation', () => {
    const expenses: Expense[] = [
      {
        id: '1',
        tripId: 'trip-1',
        category: 'food',
        title: 'Comida activa',
        amount: { amountCents: 5000, currency: 'EUR' },
        date: '2026-11-15',
        updatedAt: '2026-11-15T10:00:00Z',
        isDeleted: false,
      },
      {
        id: '2',
        tripId: 'trip-1',
        category: 'food',
        title: 'Gasto cancelado',
        amount: { amountCents: 3000, currency: 'EUR' },
        date: '2026-11-15',
        updatedAt: '2026-11-15T11:00:00Z',
        isDeleted: true, // Borrado lógico
      },
    ];

    const summary = calculateBudgetSummary(expenses, 'EUR');
    expect(summary.totalActualCents).toBe(5000);
    expect(summary.byCategory['food']).toBe(5000);
  });

  it('generates valid parametric deep links for flights and hotels', () => {
    const flightLink = buildDeepLink('flights', {
      origin: 'MAD',
      destination: 'París, Francia',
      startDate: '2026-11-15',
    });

    expect(flightLink).toContain('google.com/travel/flights');
    expect(flightLink).toContain('Flights%20to%20Par%C3%ADs%2C%20Francia');
    expect(flightLink).toContain('MAD');
    expect(flightLink).toContain('2026-11-15');

    const hotelLink = buildDeepLink('hotels', {
      destination: 'París',
      startDate: '2026-11-15',
      endDate: '2026-11-17',
    });

    expect(hotelLink).toContain('booking.com/searchresults.html');
    expect(hotelLink).toContain('checkin=2026-11-15');
    expect(hotelLink).toContain('checkout=2026-11-17');
  });
});
