import { Coordinates } from '@/core/domain/types';
import { RouteSegment, RoutingPort } from '../ports/routing.port';
import { OsrmRoutingAdapter } from './osrm-routing.adapter';

export interface RouteCacheStore {
  get(key: string): Promise<RouteSegment | null> | RouteSegment | null;
  set(key: string, value: RouteSegment): Promise<void> | void;
  clear(): Promise<void> | void;
}

/**
 * Almacén de caché local en localStorage para rutas calculadas.
 * Funciona completamente sin conexión a internet y persiste entre reinicios.
 */
export class LocalStorageRouteCache implements RouteCacheStore {
  private prefix = 'travel_osrm_cache_';

  get(key: string): RouteSegment | null {
    try {
      if (typeof localStorage === 'undefined') return null;
      const raw = localStorage.getItem(this.prefix + key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  set(key: string, value: RouteSegment): void {
    try {
      if (typeof localStorage === 'undefined') return;
      localStorage.setItem(this.prefix + key, JSON.stringify(value));
    } catch {
      // Ignorar si el almacenamiento está lleno o deshabilitado
    }
  }

  clear(): void {
    try {
      if (typeof localStorage === 'undefined') return;
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(this.prefix)) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch {
      // Ignorar
    }
  }
}

/**
 * Adaptador de enrutamiento con caché local-first:
 * 1. Intenta consultar el servicio OSRM en línea.
 * 2. Si tiene éxito y devuelve una ruta válida por calles, la almacena en caché.
 * 3. Si no hay conexión o falla la red, recupera la geometría exacta de la caché.
 * 4. Si nunca antes se había consultado, genera un fallback en línea recta.
 */
export class CachedRoutingAdapter implements RoutingPort {
  private inner: RoutingPort;
  private cache: RouteCacheStore;

  constructor(
    inner: RoutingPort = new OsrmRoutingAdapter(),
    cache: RouteCacheStore = new LocalStorageRouteCache()
  ) {
    this.inner = inner;
    this.cache = cache;
  }

  private generateKey(waypoints: Coordinates[]): string {
    return waypoints
      .map((p) => `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`)
      .join(';');
  }

  async calculateRoute(waypoints: Coordinates[]): Promise<RouteSegment | null> {
    if (waypoints.length < 2) return null;

    const cacheKey = this.generateKey(waypoints);

    try {
      const liveRoute = await this.inner.calculateRoute(waypoints);
      if (liveRoute && liveRoute.distanceMeters > 0) {
        // Almacenar en caché para consultas futuras offline
        await this.cache.set(cacheKey, {
          ...liveRoute,
          isFromCache: false,
        });
        return liveRoute;
      }
    } catch {
      // En caso de fallo de red, recurrir a la caché
    }

    // Comprobar si tenemos la ruta en caché
    const cachedRoute = await this.cache.get(cacheKey);
    if (cachedRoute && cachedRoute.distanceMeters > 0) {
      return {
        ...cachedRoute,
        isFromCache: true,
      };
    }

    // Fallback: Línea recta geométrica entre puntos
    return {
      distanceMeters: 0,
      durationSeconds: 0,
      geometryGeoJSON: {
        type: 'LineString',
        coordinates: waypoints.map((p) => [p.lng, p.lat]),
      },
      isFromCache: false,
    };
  }
}
