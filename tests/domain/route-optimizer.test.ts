import { describe, it, expect } from 'vitest';
import {
  haversineDistance,
  calculateTotalPathDistance,
  optimizeRoute2Opt,
} from '@/features/map/domain/route-optimizer';
import { Stop } from '@/features/itinerary/domain/stop';

describe('Route Optimizer Domain Logic (2-Opt & Haversine)', () => {
  const createStop = (id: string, lat: number, lng: number, title: string): Stop => ({
    id,
    tripId: 'trip-test',
    dayDate: '2026-11-15',
    order: 0,
    title,
    category: 'attraction',
    location: { lat, lng },
    updatedAt: new Date().toISOString(),
    isDeleted: false,
  });

  it('calculates Haversine distance with geographic precision', () => {
    // Torre Eiffel a Museo del Louvre (~3.5 km)
    const eiffel = { lat: 48.8584, lng: 2.2945 };
    const louvre = { lat: 48.8606, lng: 2.3376 };

    const distance = haversineDistance(eiffel, louvre);
    // Debe estar entre 3100m y 3300m en línea recta
    expect(distance).toBeGreaterThan(3000);
    expect(distance).toBeLessThan(3500);
  });

  it('returns 0 distance for identical coordinates or less than 2 stops', () => {
    const point = { lat: 48.8584, lng: 2.2945 };
    expect(haversineDistance(point, point)).toBe(0);
    expect(calculateTotalPathDistance([])).toBe(0);
    expect(calculateTotalPathDistance([createStop('1', 48.8, 2.3, 'A')])).toBe(0);
  });

  it('untangles an intentionally crisscrossed route and significantly reduces travel distance', () => {
    // 4 paradas alineadas de oeste a este
    const stopA = createStop('A', 48.850, 2.300, 'Parada Oeste 1');
    const stopB = createStop('B', 48.850, 2.320, 'Parada Oeste 2');
    const stopC = createStop('C', 48.850, 2.340, 'Parada Este 1');
    const stopD = createStop('D', 48.850, 2.360, 'Parada Este 2');

    // Orden desastroso: A -> D -> B -> C (cruza toda la ciudad dos veces)
    const chaoticStops = [stopA, stopD, stopB, stopC];
    const initialDistance = calculateTotalPathDistance(chaoticStops);

    const result = optimizeRoute2Opt(chaoticStops, true);

    // Debe mantener A al inicio y ordenar secuencialmente: A -> B -> C -> D
    expect(result.optimizedStops.map((s) => s.id)).toEqual(['A', 'B', 'C', 'D']);
    expect(result.optimizedDistanceMeters).toBeLessThan(initialDistance);
    expect(result.savedPercentage).toBeGreaterThan(25);
    expect(result.optimizedStops[0].order).toBe(0);
    expect(result.optimizedStops[3].order).toBe(3);
  });

  it('handles 2 stops gracefully without error', () => {
    const stop1 = createStop('1', 48.85, 2.30, 'Inicio');
    const stop2 = createStop('2', 48.86, 2.31, 'Fin');

    const result = optimizeRoute2Opt([stop1, stop2]);
    expect(result.optimizedStops).toHaveLength(2);
    expect(result.savedMeters).toBe(0);
  });
});
