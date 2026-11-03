import { Coordinates } from '@/core/domain/types';
import { getTilesForArea, formatTileUrl } from '../domain/tile-calculator';

export const TILE_CACHE_NAME = 'travel-map-tiles-v1';

// Plantilla de tiles de alta resolución (Carto Voyager)
export const VOYAGER_RASTER_TILE_TEMPLATE =
  'https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png';

// Archivo de estilo principal
export const VOYAGER_STYLE_URL =
  'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json';

export interface CacheProgress {
  downloaded: number;
  total: number;
  status: 'idle' | 'downloading' | 'completed' | 'error';
  errorMessage?: string;
}

export class TileCacheManager {
  private cacheName: string;

  constructor(cacheName = TILE_CACHE_NAME) {
    this.cacheName = cacheName;
  }

  isSupported(): boolean {
    return typeof caches !== 'undefined';
  }

  async getCache(): Promise<Cache | null> {
    if (!this.isSupported()) return null;
    try {
      return await caches.open(this.cacheName);
    } catch {
      return null;
    }
  }

  /**
   * Descarga y guarda en caché un recurso (estilo, tile o imagen).
   */
  async cacheUrl(url: string): Promise<boolean> {
    const cache = await this.getCache();
    if (!cache) return false;

    try {
      const match = await cache.match(url);
      if (match) return true; // Ya estaba en caché

      const response = await fetch(url, { mode: 'cors' });
      if (response.ok) {
        await cache.put(url, response.clone());
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Pre-descarga un lote de tiles de la zona para su uso 100% offline sin conexión a internet.
   */
  async downloadAreaTiles(
    center: Coordinates,
    zoomLevels: number[] = [12, 13, 14],
    radius = 1,
    onProgress?: (progress: CacheProgress) => void
  ): Promise<{ success: boolean; downloaded: number; total: number }> {
    const cache = await this.getCache();
    if (!cache) {
      return { success: false, downloaded: 0, total: 0 };
    }

    // 1. Guardar primero el archivo de estilo
    await this.cacheUrl(VOYAGER_STYLE_URL);

    // 2. Calcular los tiles del área
    const tiles = getTilesForArea(center, zoomLevels, radius);
    const total = tiles.length;
    let downloaded = 0;

    onProgress?.({
      downloaded: 0,
      total,
      status: 'downloading',
    });

    for (const tile of tiles) {
      const tileUrl = formatTileUrl(VOYAGER_RASTER_TILE_TEMPLATE, tile);
      const ok = await this.cacheUrl(tileUrl);
      if (ok) downloaded++;

      onProgress?.({
        downloaded,
        total,
        status: 'downloading',
      });
    }

    const result = {
      success: downloaded > 0,
      downloaded,
      total,
    };

    onProgress?.({
      downloaded,
      total,
      status: 'completed',
    });

    return result;
  }

  /**
   * Retorna el número de elementos guardados en la caché local.
   */
  async getCachedCount(): Promise<number> {
    const cache = await this.getCache();
    if (!cache) return 0;
    try {
      const keys = await cache.keys();
      return keys.length;
    } catch {
      return 0;
    }
  }

  /**
   * Vacía la caché de mapas para liberar espacio en el dispositivo.
   */
  async clearCache(): Promise<boolean> {
    if (!this.isSupported()) return false;
    try {
      return await caches.delete(this.cacheName);
    } catch {
      return false;
    }
  }
}
