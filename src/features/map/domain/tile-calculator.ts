import { Coordinates } from '@/core/domain/types';

export interface TileCoord {
  z: number;
  x: number;
  y: number;
}

/**
 * Convierte coordenadas geográficas (lat, lng) y nivel de zoom a coordenadas de tile (x, y)
 * según el estándar Slippy Map / Web Mercator (EPSG:3857).
 */
export function latLngToTile(lat: number, lng: number, zoom: number): TileCoord {
  const z = Math.floor(zoom);
  const n = Math.pow(2, z);

  // Normalizar longitud a [-180, 180]
  const clampedLng = Math.max(-180, Math.min(180, lng));
  const x = Math.floor(((clampedLng + 180) / 360) * n);

  // Proyección Web Mercator para latitud
  const clampedLat = Math.max(-85.05112878, Math.min(85.05112878, lat));
  const latRad = (clampedLat * Math.PI) / 180;
  const y = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n
  );

  return { z, x, y };
}

/**
 * Genera la cuadrícula de tiles adyacentes alrededor de un punto central para un nivel de zoom dado.
 * radius=1 produce un bloque de 3x3 tiles (9 tiles).
 */
export function getTileGrid(
  center: Coordinates,
  zoom: number,
  radius = 1
): TileCoord[] {
  const centerTile = latLngToTile(center.lat, center.lng, zoom);
  const maxTileIndex = Math.pow(2, centerTile.z) - 1;
  const tiles: TileCoord[] = [];

  for (let dx = -radius; dx <= radius; dx++) {
    for (let dy = -radius; dy <= radius; dy++) {
      const x = centerTile.x + dx;
      const y = centerTile.y + dy;

      // Asegurar que no se excedan los límites del mundo
      if (x >= 0 && x <= maxTileIndex && y >= 0 && y <= maxTileIndex) {
        tiles.push({ z: centerTile.z, x, y });
      }
    }
  }

  return tiles;
}

/**
 * Genera una lista completa de tiles para un rango de niveles de zoom.
 */
export function getTilesForArea(
  center: Coordinates,
  zoomLevels: number[] = [12, 13, 14],
  radius = 1
): TileCoord[] {
  const allTiles: TileCoord[] = [];
  for (const zoom of zoomLevels) {
    const grid = getTileGrid(center, zoom, radius);
    allTiles.push(...grid);
  }
  return allTiles;
}

/**
 * Formatea una plantilla de URL de tiles reemplazando `{z}`, `{x}`, `{y}` (y opcionalmente `{s}`).
 */
export function formatTileUrl(
  template: string,
  tile: TileCoord,
  subdomain = 'a'
): string {
  return template
    .replace('{z}', tile.z.toString())
    .replace('{x}', tile.x.toString())
    .replace('{y}', tile.y.toString())
    .replace('{s}', subdomain);
}
