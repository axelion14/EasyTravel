import { describe, it, expect } from 'vitest';
import {
  generateShareLink,
  addCollaborator,
  removeCollaborator,
  canUserEditTrip,
  exportTripBundle,
  importTripBundle,
} from '@/features/trips/domain/sharing';
import { createNewTrip } from '@/features/trips/domain/trip';
import { Stop } from '@/features/itinerary/domain/stop';
import { Expense } from '@/features/budget/domain/budget';

describe('Trip Sharing & Collaboration Domain', () => {
  const mockTrip = createNewTrip({
    id: 'trip-share-123',
    title: 'Viaje a Tokio 🇯🇵',
    destination: 'Tokio, Japón',
    startDate: '2026-10-01',
    endDate: '2026-10-10',
    baseCurrency: 'JPY',
    travelersCount: 2,
  });

  const mockStops: Stop[] = [
    {
      id: 'stop-1',
      tripId: mockTrip.id,
      dayDate: '2026-10-01',
      order: 0,
      title: 'Shinjuku Gyoen',
      category: 'attraction',
      location: { lat: 35.6852, lng: 139.71 },
      updatedAt: '2026-09-01T10:00:00Z',
      isDeleted: false,
    },
    {
      id: 'stop-deleted',
      tripId: mockTrip.id,
      dayDate: '2026-10-01',
      order: 1,
      title: 'Old Stop',
      category: 'other',
      location: { lat: 35.0, lng: 139.0 },
      updatedAt: '2026-09-01T10:00:00Z',
      isDeleted: true,
    },
  ];

  const mockExpenses: Expense[] = [
    {
      id: 'exp-1',
      tripId: mockTrip.id,
      description: 'Cena Ramen',
      category: 'food',
      amount: { amountCents: 150000, currency: 'JPY' },
      date: '2026-10-01',
      createdAt: '2026-09-01T10:00:00Z',
      updatedAt: '2026-09-01T10:00:00Z',
      isDeleted: false,
    },
  ];

  it('generates a valid share link with token and role', () => {
    const link = generateShareLink(mockTrip, 'editor', 'https://mytravel.app');

    expect(link.token).toBeDefined();
    expect(link.role).toBe('editor');
    expect(link.url).toContain('https://mytravel.app/?tripId=trip-share-123');
    expect(link.url).toContain('role=editor');
    expect(link.url).toContain(`shareToken=${link.token}`);
  });

  it('adds and updates collaborators without duplicating email', () => {
    // Agregar primer colaborador
    const withCollab = addCollaborator(mockTrip, 'ana@travel.com', 'viewer', 'Ana');
    expect(withCollab.collaborators).toHaveLength(1);
    expect(withCollab.collaborators![0].email).toBe('ana@travel.com');
    expect(withCollab.collaborators![0].role).toBe('viewer');

    // Cambiar rol del mismo colaborador a 'editor'
    const updated = addCollaborator(withCollab, 'ANA@TRAVEL.COM', 'editor', 'Ana Gomez');
    expect(updated.collaborators).toHaveLength(1);
    expect(updated.collaborators![0].role).toBe('editor');
    expect(updated.collaborators![0].name).toBe('Ana Gomez');
  });

  it('removes a collaborator by id', () => {
    const withCollab = addCollaborator(mockTrip, 'carlos@travel.com', 'editor');
    const collabId = withCollab.collaborators![0].id;

    const removed = removeCollaborator(withCollab, collabId);
    expect(removed.collaborators).toHaveLength(0);
  });

  it('evaluates edit permissions according to role', () => {
    expect(canUserEditTrip(mockTrip)).toBe(true);

    const viewerTrip = { ...mockTrip, userRole: 'viewer' as const };
    expect(canUserEditTrip(viewerTrip)).toBe(false);

    const editorTrip = { ...mockTrip, userRole: 'editor' as const };
    expect(canUserEditTrip(editorTrip)).toBe(true);
  });

  it('exports and imports a complete portable trip bundle omitting deleted items', () => {
    const json = exportTripBundle(mockTrip, mockStops, mockExpenses);
    expect(typeof json).toBe('string');

    const imported = importTripBundle(json);
    expect(imported.trip.id).toBe(mockTrip.id);
    expect(imported.stops).toHaveLength(1); // Deleted stop excluded
    expect(imported.stops[0].title).toBe('Shinjuku Gyoen');
    expect(imported.expenses).toHaveLength(1);
    expect(imported.expenses[0].description).toBe('Cena Ramen');
  });

  it('imports a trip bundle as a clean new copy with new UUIDs and owner role', () => {
    const json = exportTripBundle(mockTrip, mockStops, mockExpenses);
    const copy = importTripBundle(json, true);

    expect(copy.trip.id).not.toBe(mockTrip.id);
    expect(copy.trip.title).toContain('(Copia)');
    expect(copy.trip.userRole).toBe('owner');
    expect(copy.stops[0].tripId).toBe(copy.trip.id);
    expect(copy.stops[0].id).not.toBe(mockStops[0].id);
    expect(copy.expenses[0].tripId).toBe(copy.trip.id);
    expect(copy.expenses[0].id).not.toBe(mockExpenses[0].id);
  });

  it('throws descriptive error on malformed JSON or invalid schema', () => {
    expect(() => importTripBundle('not-a-json')).toThrow('El archivo proporcionado no es un JSON válido.');
    expect(() => importTripBundle('{"version": 99}')).toThrow('Formato de viaje no reconocido o versión incompatible.');
  });
});
