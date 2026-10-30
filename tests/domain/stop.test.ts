import { describe, it, expect } from 'vitest';
import {
  reorderStops,
  formatDuration,
  toggleChecklistItem,
  addChecklistItem,
  Stop,
} from '@/features/itinerary/domain/stop';

describe('Stop & Itinerary Domain Logic', () => {
  const createMockStop = (id: string, order: number, title: string): Stop => ({
    id,
    tripId: 'trip-1',
    dayDate: '2026-11-15',
    order,
    title,
    category: 'attraction',
    location: { lat: 48.85, lng: 2.35 },
    updatedAt: '2026-01-01T00:00:00.000Z',
    isDeleted: false,
  });

  it('reorders stops and re-indexes the order field sequentially', () => {
    const stops: Stop[] = [
      createMockStop('A', 0, 'Torre Eiffel'),
      createMockStop('B', 1, 'Museo Louvre'),
      createMockStop('C', 2, 'Catedral Notre Dame'),
    ];

    const reordered = reorderStops(stops, 2, 0);

    expect(reordered.map((s) => s.id)).toEqual(['C', 'A', 'B']);
    expect(reordered[0].order).toBe(0);
    expect(reordered[1].order).toBe(1);
    expect(reordered[2].order).toBe(2);

    expect(stops[0].id).toBe('A');
  });

  it('updates the updatedAt timestamp of all reordered elements', () => {
    const stops: Stop[] = [
      createMockStop('A', 0, 'Lugar 1'),
      createMockStop('B', 1, 'Lugar 2'),
    ];

    const reordered = reorderStops(stops, 0, 1);
    expect(new Date(reordered[0].updatedAt).getTime()).toBeGreaterThan(
      new Date('2026-01-01T00:00:00.000Z').getTime()
    );
  });

  it('formats visit duration into readable hour/minute strings', () => {
    expect(formatDuration(90)).toBe('1h 30m');
    expect(formatDuration(60)).toBe('1h');
    expect(formatDuration(45)).toBe('45m');
    expect(formatDuration(125)).toBe('2h 5m');
    expect(formatDuration(0)).toBe('');
    expect(formatDuration(undefined)).toBe('');
  });

  it('adds and toggles checklist items cleanly without mutating input', () => {
    const stop = createMockStop('A', 0, 'Museo Louvre');
    expect(stop.checklist).toBeUndefined();

    // Agregar item
    const withItem = addChecklistItem(stop, 'Comprar entradas online');
    expect(withItem.checklist).toHaveLength(1);
    expect(withItem.checklist?.[0].text).toBe('Comprar entradas online');
    expect(withItem.checklist?.[0].done).toBe(false);

    // Toggle item
    const itemId = withItem.checklist![0].id;
    const toggled = toggleChecklistItem(withItem, itemId);
    expect(toggled.checklist?.[0].done).toBe(true);

    // Toggle de nuevo a false
    const toggledBack = toggleChecklistItem(toggled, itemId);
    expect(toggledBack.checklist?.[0].done).toBe(false);

    // Verificar inmutabilidad del stop original
    expect(stop.checklist).toBeUndefined();
  });
});
