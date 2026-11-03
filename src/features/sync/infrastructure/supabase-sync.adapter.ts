import { SyncPort, SyncPayload, SyncResult } from '../ports/sync.port';
import { AuthPort, User, AuthStateChangeCallback } from '../ports/auth.port';
import { reconcilePayloads } from '../domain/reconciler';
import { generateUUID } from '@/shared/lib/utils';

const MOCK_CLOUD_STORAGE_KEY = 'travel_planner_mock_cloud_db';
const MOCK_AUTH_STORAGE_KEY = 'travel_planner_auth_user';

export class SupabaseSyncAdapter implements SyncPort, AuthPort {
  private supabaseUrl?: string;
  private supabaseKey?: string;
  private authListeners: AuthStateChangeCallback[] = [];

  constructor() {
    this.supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    this.supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  }

  isConfigured(): boolean {
    return Boolean(this.supabaseUrl && this.supabaseKey);
  }

  // --- AuthPort Implementation ---

  async getCurrentUser(): Promise<User | null> {
    try {
      const stored = localStorage.getItem(MOCK_AUTH_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // fallback
    }
    return null;
  }

  async signInWithEmail(email: string, _password?: string): Promise<{ user: User | null; error?: string }> {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@')) {
      return { user: null, error: 'Por favor ingresa un correo electrónico válido.' };
    }

    const user: User = {
      id: generateUUID(),
      email: trimmed,
      name: trimmed.split('@')[0],
    };

    localStorage.setItem(MOCK_AUTH_STORAGE_KEY, JSON.stringify(user));
    this.notifyAuthListeners(user);
    return { user };
  }

  async signUpWithEmail(email: string, password?: string): Promise<{ user: User | null; error?: string }> {
    return this.signInWithEmail(email, password);
  }

  async signOut(): Promise<void> {
    localStorage.removeItem(MOCK_AUTH_STORAGE_KEY);
    this.notifyAuthListeners(null);
  }

  onAuthStateChange(callback: AuthStateChangeCallback): () => void {
    this.authListeners.push(callback);
    return () => {
      this.authListeners = this.authListeners.filter((cb) => cb !== callback);
    };
  }

  private notifyAuthListeners(user: User | null) {
    this.authListeners.forEach((cb) => cb(user));
  }

  // --- SyncPort Implementation (Last-Write-Wins Reconciliation) ---

  async synchronize(localPayload: SyncPayload, _lastSyncedAt?: string): Promise<SyncResult> {
    // Simular latencia de red realista
    await new Promise((resolve) => setTimeout(resolve, 600));

    try {
      // 1. Obtener estado en la "nube"
      let remotePayload: SyncPayload = { trips: [], stops: [], expenses: [] };
      const remoteRaw = localStorage.getItem(MOCK_CLOUD_STORAGE_KEY);
      if (remoteRaw) {
        remotePayload = JSON.parse(remoteRaw);
      }

      // 2. Reconciliar cliente y nube mediante algoritmo determinista LWW
      const mergedPayload = reconcilePayloads(localPayload, remotePayload);

      // 3. Guardar el estado fusionado en la nube
      localStorage.setItem(MOCK_CLOUD_STORAGE_KEY, JSON.stringify(mergedPayload));

      const syncedAt = new Date().toISOString();

      return {
        success: true,
        syncedAt,
        mergedPayload,
      };
    } catch (err: any) {
      return {
        success: false,
        syncedAt: new Date().toISOString(),
        mergedPayload: localPayload,
        error: err?.message || 'Error al sincronizar con la nube',
      };
    }
  }
}
