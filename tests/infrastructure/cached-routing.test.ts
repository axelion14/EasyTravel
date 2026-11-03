import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  CachedRoutingAdapter,
  RouteCacheStore,
} from '@/features/map/infrastructure/cached-routing.adapter';
import { RouteSegment, RoutingPort } from '@/features/map/ports/routing.port';
import { Coordinates } from '@/core/domain/types';

describe('CachedRoutingAdapter (Offline Route Persistence)', () => {
  let memoryCache: Map<string, RouteSegment>;
  let mockCacheStore: RouteCacheStore;
  let mockInnerService: RoutingPort;

  const mockWaypoints: Coordinates[] = [
    { lat: 48.8584, lng: 2.2945 }, // Eiffel
    { lat: 48.8606, lng: 2.3376 }, // Louvre
  ];

  const sampleRoute: RouteSegment = {
    distanceMeters: 4200,
    durationSeconds: 650,
    geometryGeoJSON: {
      type: 'LineString',
      coordinates: [
        [2.2945, 48.8584],
        [2.312, 48.859],
        [2.3376, 48.8606],
      ],
    },
  };

  beforeEach(() => {
    memoryCache = new Map();
    mockCacheStore = {
      get: vi.fn(async (key: string) => memoryCache.get(key) || null),
      set: vi.fn(async (key: string, val: RouteSegment) => {
        memoryCache.set(key, val);
      }),
      clear: vi.fn(async () => {
        memoryCache.clear();
      }),
    };
    mockInnerService = {
      calculateRoute: vi.fn(),
    };
  });

  it('fetches live route and caches it when online', async () => {
    (mockInnerService.calculateRoute as any).mockResolvedValue(sampleRoute);

    const adapter = new CachedRoutingAdapter(mockInnerService, mockCacheStore);
    const result = await adapter.calculateRoute(mockWaypoints);

    expect(result).not.toBeNull();
    expect(result?.distanceMeters).toBe(4200);
    expect(mockInnerService.calculateRoute).toHaveBeenCalledTimes(1);
    expect(mockCacheStore.set).toHaveBeenCalledTimes(1);
    expect(memoryCache.size).toBe(1);
  });

  it('returns cached route with isFromCache=true when network is offline', async () => {
    // Pre-poblar la caché
    const key = `${mockWaypoints[0].lat.toFixed(5)},${mockWaypoints[0].lng.toFixed(5)};${mockWaypoints[1].lat.toFixed(5)},${mockWaypoints[1].lng.toFixed(5)}`;
    memoryCache.set(key, sampleRoute);

    // Simular que el servicio online falla (offline)
    (mockInnerService.calculateRoute as any).mockRejectedValue(new Error('Network error / Offline'));

    const adapter = new CachedRoutingAdapter(mockInnerService, mockCacheStore);
    const result = await adapter.calculateRoute(mockWaypoints);

    expect(result).not.toBeNull();
    expect(result?.distanceMeters).toBe(4200);
    expect(result?.isFromCache).toBe(true);
    expect(result?.geometryGeoJSON.coordinates).toHaveLength(3); // Turn-by-turn geometry preserved!
  });

  it('falls back to straight line when offline and route was never cached', async () => {
    (mockInnerService.calculateRoute as any).mockRejectedValue(new Error('Offline'));

    const adapter = new CachedRoutingAdapter(mockInnerService, mockCacheStore);
    const result = await adapter.calculateRoute(mockWaypoints);

    expect(result).not.toBeNull();
    expect(result?.distanceMeters).toBe(0);
    expect(result?.isFromCache).toBe(false);
    expect(result?.geometryGeoJSON.coordinates).toEqual([
      [mockWaypoints[0].lng, mockWaypoints[0].lat],
      [mockWaypoints[1].lng, mockWaypoints[1].lat],
    ]);
  });
});
