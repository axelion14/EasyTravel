import { Trip } from '@/features/trips/domain/trip';
import { Stop } from '@/features/itinerary/domain/stop';
import { Expense } from '@/features/budget/domain/budget';
import { SyncPayload } from '../ports/sync.port';

interface SyncableEntity {
  id: string;
  updatedAt: string;
  isDeleted: boolean;
}

/**
 * Reconciliador determinista Last-Write-Wins (LWW).
 * Compara entidades por ID y marca de tiempo updatedAt UTC.
 * Si una entidad fue eliminada lógicamente (isDeleted: true) más recientemente,
 * se respeta el borrado sin pérdida de datos ni conflictos de concurrencia.
 */
export function reconcileEntities<T extends SyncableEntity>(
  localEntities: T[],
  remoteEntities: T[]
): T[] {
  const map = new Map<string, T>();

  // 1. Cargar entidades remotas
  for (const remote of remoteEntities) {
    map.set(remote.id, remote);
  }

  // 2. Fusionar con entidades locales
  for (const local of localEntities) {
    const existing = map.get(local.id);

    if (!existing) {
      // Registro nuevo creado en el cliente
      map.set(local.id, local);
    } else {
      const localTime = new Date(local.updatedAt).getTime();
      const remoteTime = new Date(existing.updatedAt).getTime();

      // Gana la versión más reciente
      if (localTime >= remoteTime) {
        map.set(local.id, local);
      }
    }
  }

  return Array.from(map.values());
}

/**
 * Reconcilia de forma completa dos conjuntos de datos (Local y Remoto).
 */
export function reconcilePayloads(
  local: SyncPayload,
  remote: SyncPayload
): SyncPayload {
  return {
    trips: reconcileEntities<Trip>(local.trips, remote.trips),
    stops: reconcileEntities<Stop>(local.stops, remote.stops),
    expenses: reconcileEntities<Expense>(local.expenses, remote.expenses),
  };
}
