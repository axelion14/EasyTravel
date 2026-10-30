import { Coordinates, UUID } from '@/core/domain/types';

export interface Trip {
  id: UUID;
  title: string;
  destination: string;
  centerCoordinates?: Coordinates;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  baseCurrency: string;
  travelersCount: number;
  totalBudgetLimitCents?: number;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
}

export function createNewTrip(params: {
  id: string;
  title: string;
  destination: string;
  centerCoordinates?: Coordinates;
  startDate: string;
  endDate: string;
  baseCurrency?: string;
  travelersCount?: number;
}): Trip {
  const now = new Date().toISOString();
  return {
    id: params.id,
    title: params.title,
    destination: params.destination,
    centerCoordinates: params.centerCoordinates,
    startDate: params.startDate,
    endDate: params.endDate,
    baseCurrency: params.baseCurrency || 'EUR',
    travelersCount: params.travelersCount || 1,
    createdAt: now,
    updatedAt: now,
    isDeleted: false,
  };
}
