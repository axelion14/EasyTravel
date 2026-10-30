import { describe, it, expect, vi } from 'vitest';
import { OsrmRoutingAdapter } from '@/features/map/infrastructure/osrm-routing.adapter';

describe('OsrmRoutingAdapter', () => {
  it('returns null when less than 2 waypoints are provided', async () => {
    const adapter = new OsrmRoutingAdapter();
    const result = await adapter.calculateRoute([{ lat: 48.85, lng: 2.35 }]);
    expect(result).toBeNull();
  });

  it('correctly parses OSRM route response geometry, distance, and duration', async () => {
    const adapter = new OsrmRoutingAdapter();

    const mockOsrmResponse = {
      routes: [
        {
          distance: 4250.8, // metros
          duration: 720.5,  // segundos (~12 min)
          geometry: {
            type: 'LineString',
            coordinates: [
              [2.2945, 48.8584],
              [2.3376, 48.8606],
            ],
          },
        },
      ],
    };

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockOsrmResponse,
    }));

    const route = await adapter.calculateRoute([
      { lat: 48.8584, lng: 2.2945 },
      { lat: 48.8606, lng: 2.3376 },
    ]);

    expect(route).not.toBeNull();
    expect(route?.distanceMeters).toBe(4250.8);
    expect(route?.durationSeconds).toBe(720.5);
    expect(route?.geometryGeoJSON.type).toBe('LineString');
    expect(route?.geometryGeoJSON.coordinates).toHaveLength(2);

    vi.unstubAllGlobals();
  });
});
