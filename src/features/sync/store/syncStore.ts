import { create } from 'zustand';
import { User } from '../ports/auth.port';
import { SyncStatus } from '../ports/sync.port';
import { SupabaseSyncAdapter } from '../infrastructure/supabase-sync.adapter';
import { useTripStore } from '@/features/trips/store/tripStore';

const syncAdapter = new SupabaseSyncAdapter();

interface SyncState {
  user: User | null;
  syncStatus: SyncStatus;
  lastSyncedAt: string | null;
  isCloudConfigured: boolean;

  // Acciones
  initAuth: () => Promise<void>;
  login: (email: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  syncWithCloud: () => Promise<boolean>;
}

export const useSyncStore = create<SyncState>((set, get) => ({
  user: null,
  syncStatus: 'synced',
  lastSyncedAt: null,
  isCloudConfigured: syncAdapter.isConfigured(),

  initAuth: async () => {
    const user = await syncAdapter.getCurrentUser();
    set({ user });

    syncAdapter.onAuthStateChange((updatedUser) => {
      set({ user: updatedUser });
      if (updatedUser) {
        // Al iniciar sesión, sincronizar automáticamente
        get().syncWithCloud();
      }
    });
  },

  login: async (email: string) => {
    const result = await syncAdapter.signInWithEmail(email);
    if (result.user) {
      set({ user: result.user });
      await get().syncWithCloud();
      return { success: true };
    }
    return { success: false, error: result.error };
  },

  logout: async () => {
    await syncAdapter.signOut();
    set({ user: null, lastSyncedAt: null });
  },

  syncWithCloud: async () => {
    set({ syncStatus: 'syncing' });

    const tripState = useTripStore.getState();
    const localPayload = {
      trips: tripState.trips,
      stops: tripState.stops,
      expenses: tripState.expenses,
    };

    const result = await syncAdapter.synchronize(localPayload, get().lastSyncedAt || undefined);

    if (result.success) {
      // Actualizar el estado de la aplicación con los datos reconciliados
      useTripStore.setState({
        trips: result.mergedPayload.trips,
        stops: result.mergedPayload.stops,
        expenses: result.mergedPayload.expenses,
      });

      set({
        syncStatus: 'synced',
        lastSyncedAt: result.syncedAt,
      });
      return true;
    } else {
      set({ syncStatus: 'error' });
      return false;
    }
  },
}));
