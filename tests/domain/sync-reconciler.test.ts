import { describe, it, expect } from 'vitest';
import { reconcileEntities, reconcilePayloads } from '@/features/sync/domain/reconciler';
import { Trip } from '@/features/trips/domain/trip';

describe('Last-Write-Wins (LWW) Sync Reconciler', () => {
  const createMockTrip = (
    id: string,
    title: string,
    updatedAt: string,
    isDeleted = false
  ): Trip => ({
    id,
    title,
    destination: 'París',
    startDate: '2026-11-15',
    endDate: '2026-11-17',
    baseCurrency: 'EUR',
    travelersCount: 2,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt,
    isDeleted,
  });

  it('keeps local entities that do not exist remotely (new local records)', () => {
    const local = [createMockTrip('1', 'Viaje Nuevo Local', '2026-11-01T10:00:00Z')];
    const remote: Trip[] = [];

    const merged = reconcileEntities(local, remote);
    expect(merged).toHaveLength(1);
    expect(merged[0].id).toBe('1');
    expect(merged[0].title).toBe('Viaje Nuevo Local');
  });

  it('keeps remote entities that do not exist locally (new remote records)', () => {
    const local: Trip[] = [];
    const remote = [createMockTrip('2', 'Viaje Remoto', '2026-11-01T12:00:00Z')];

    const merged = reconcileEntities(local, remote);
    expect(merged).toHaveLength(1);
    expect(merged[0].id).toBe('2');
    expect(merged[0].title).toBe('Viaje Remoto');
  });

  it('chooses the local entity when local updatedAt is newer than remote', () => {
    const local = [createMockTrip('1', 'Título Local Actualizado', '2026-11-02T15:00:00Z')];
    const remote = [createMockTrip('1', 'Título Remoto Viejo', '2026-11-01T10:00:00Z')];

    const merged = reconcileEntities(local, remote);
    expect(merged).toHaveLength(1);
    expect(merged[0].title).toBe('Título Local Actualizado');
  });

  it('chooses the remote entity when remote updatedAt is newer than local', () => {
    const local = [createMockTrip('1', 'Título Local Viejo', '2026-11-01T10:00:00Z')];
    const remote = [createMockTrip('1', 'Título Remoto Modificado en Otro Dispositivo', '2026-11-02T16:00:00Z')];

    const merged = reconcileEntities(local, remote);
    expect(merged).toHaveLength(1);
    expect(merged[0].title).toBe('Título Remoto Modificado en Otro Dispositivo');
  });

  it('correctly propagates soft deletes if the deletion timestamp is newer', () => {
    const local = [createMockTrip('1', 'Viaje Activo', '2026-11-01T10:00:00Z', false)];
    const remote = [createMockTrip('1', 'Viaje Borrado Remotamente', '2026-11-02T12:00:00Z', true)];

    const merged = reconcileEntities(local, remote);
    expect(merged).toHaveLength(1);
    expect(merged[0].isDeleted).toBe(true);
  });

  it('reconciles entire payloads across trips, stops and expenses', () => {
    const localPayload = {
      trips: [createMockTrip('T1', 'Local Trip', '2026-11-01T10:00:00Z')],
      stops: [],
      expenses: [],
    };

    const remotePayload = {
      trips: [createMockTrip('T2', 'Remote Trip', '2026-11-01T11:00:00Z')],
      stops: [],
      expenses: [],
    };

    const merged = reconcilePayloads(localPayload, remotePayload);
    expect(merged.trips).toHaveLength(2);
    expect(merged.trips.map((t) => t.id).sort()).toEqual(['T1', 'T2']);
  });
});
