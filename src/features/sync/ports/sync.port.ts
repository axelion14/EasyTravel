import { Trip } from '@/features/trips/domain/trip';
import { Stop } from '@/features/itinerary/domain/stop';
import { Expense } from '@/features/budget/domain/budget';

export type SyncStatus = 'synced' | 'syncing' | 'pending' | 'offline' | 'error';

export interface SyncPayload {
  trips: Trip[];
  stops: Stop[];
  expenses: Expense[];
}

export interface SyncResult {
  success: boolean;
  syncedAt: string;
  mergedPayload: SyncPayload;
  error?: string;
}

export interface SyncPort {
  synchronize(localPayload: SyncPayload, lastSyncedAt?: string): Promise<SyncResult>;
}
