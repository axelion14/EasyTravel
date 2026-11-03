import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TileCacheManager } from '@/features/map/infrastructure/tile-cache.manager';

describe('TileCacheManager (Offline Vector & Raster Tile Storage)', () => {
  let mockCacheStore: Map<string, Response>;
  let mockCacheObj: Cache;

  beforeEach(() => {
    mockCacheStore = new Map();
    mockCacheObj = {
      match: vi.fn(async (url: string) => mockCacheStore.get(url) || undefined),
      put: vi.fn(async (url: string, resp: Response) => {
        mockCacheStore.set(url, resp);
      }),
      keys: vi.fn(async () => Array.from(mockCacheStore.keys()).map((k) => new Request(k))),
    } as unknown as Cache;

    vi.stubGlobal('caches', {
      open: vi.fn().mockResolvedValue(mockCacheObj),
      delete: vi.fn().mockResolvedValue(true),
    });
  });

  it('checks support and retrieves cache successfully', async () => {
    const manager = new TileCacheManager();
    expect(manager.isSupported()).toBe(true);

    const cache = await manager.getCache();
    expect(cache).toBe(mockCacheObj);
  });

  it('caches a URL by fetching and storing it in Cache API', async () => {
    const mockResponse = new Response('tile-data-binary', { status: 200 });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse));

    const manager = new TileCacheManager();
    const success = await manager.cacheUrl('https://basemaps.cartocdn.com/style.json');

    expect(success).toBe(true);
    expect(mockCacheObj.put).toHaveBeenCalledTimes(1);
    expect(mockCacheStore.size).toBe(1);

    vi.unstubAllGlobals();
  });

  it('downloads an area grid of tiles with progress tracking', async () => {
    const mockResponse = new Response('tile-image-png', { status: 200 });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse));

    const manager = new TileCacheManager();
    const progressUpdates: any[] = [];

    const result = await manager.downloadAreaTiles(
      { lat: 48.8566, lng: 2.3522 },
      [12],
      1, // 3x3 = 9 tiles + 1 style = 10 requests
      (p) => progressUpdates.push({ ...p })
    );

    expect(result.success).toBe(true);
    expect(result.total).toBe(9);
    expect(result.downloaded).toBe(9);
    expect(progressUpdates.length).toBeGreaterThanOrEqual(2);
    expect(progressUpdates[progressUpdates.length - 1].status).toBe('completed');

    vi.unstubAllGlobals();
  });

  it('counts and clears cached elements', async () => {
    mockCacheStore.set('https://example.com/tile/1.png', new Response('data'));
    mockCacheStore.set('https://example.com/tile/2.png', new Response('data'));

    const manager = new TileCacheManager();
    const count = await manager.getCachedCount();
    expect(count).toBe(2);

    const cleared = await manager.clearCache();
    expect(cleared).toBe(true);
  });
});
