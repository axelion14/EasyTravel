import { Money, UUID } from '@/core/domain/types';

export interface Expense {
  id: UUID;
  tripId: UUID;
  stopId?: UUID;
  category: 'flight' | 'lodging' | 'activity' | 'food' | 'transport' | 'other';
  title: string;
  amount: Money;
  date: string; // YYYY-MM-DD
  bookingReference?: string;
  deepLinkUrl?: string;
  updatedAt: string;
  isDeleted: boolean;
}

export interface BudgetSummaryData {
  totalEstimatedCents: number;
  totalActualCents: number;
  byCategory: Record<string, number>;
  currency: string;
}

export function calculateBudgetSummary(
  expenses: Expense[],
  baseCurrency = 'EUR'
): BudgetSummaryData {
  let totalActualCents = 0;
  const byCategory: Record<string, number> = {};

  for (const exp of expenses) {
    if (exp.isDeleted) continue;
    // En el MVP asumimos misma moneda o conversión 1:1 si no hay cotizaciones
    totalActualCents += exp.amount.amountCents;
    byCategory[exp.category] = (byCategory[exp.category] || 0) + exp.amount.amountCents;
  }

  return {
    totalEstimatedCents: totalActualCents,
    totalActualCents,
    byCategory,
    currency: baseCurrency,
  };
}

export function buildDeepLink(type: 'flights' | 'hotels', params: {
  origin?: string;
  destination: string;
  startDate: string;
  endDate?: string;
}): string {
  if (type === 'flights') {
    const orig = encodeURIComponent(params.origin || 'MAD');
    const dest = encodeURIComponent(params.destination);
    return `https://www.google.com/travel/flights?q=Flights%20to%20${dest}%20from%20${orig}%20on%20${params.startDate}`;
  }
  const dest = encodeURIComponent(params.destination);
  return `https://www.booking.com/searchresults.html?ss=${dest}&checkin=${params.startDate}&checkout=${params.endDate || params.startDate}`;
}
