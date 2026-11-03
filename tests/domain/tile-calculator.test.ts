import { describe, it, expect } from 'vitest';
import {
  latLngToTile,
  getTileGrid,
  getTilesForArea,
  formatTileUrl,
} from '@/features/map/domain/tile-calculator';

describe('Tile Calculator Domain (Web Mercator Slippy Map)', () => {
  it('correctly calculates tile coordinates for known city coordinates', () => {
    // París (48.8566 N, 2.3522 E) en zoom 12
    const parisTile = latLngToTile(48.8566, 2.3522, 12);
    expect(parisTile.z).toBe(12);
    expect(parisTile.x).toBe(2074);
    expect(parisTile.y).toBe(1409);

    // Zoom 0 (todo el mundo es un único tile 0,0,0)
    const worldTile = latLngToTile(0, 0, 0);
    expect(worldTile).toEqual({ z: 0, x: 0, y: 0 });
  });

  it('generates a 3x3 tile grid (radius=1) around a center point', () => {
    const grid = getTileGrid({ lat: 48.8566, lng: 2.3522 }, 12, 1);
    expect(grid).toHaveLength(9);

    // Debe contener el tile central
    expect(grid.some((t) => t.x === 2074 && t.y === 1409)).toBe(true);
    // Debe contener los adyacentes
    expect(grid.some((t) => t.x === 2073 && t.y === 1409)).toBe(true);
    expect(grid.some((t) => t.x === 2075 && t.y === 1409)).toBe(true);
  });

  it('aggregates tiles across multiple zoom levels', () => {
    const tiles = getTilesForArea({ lat: 48.8566, lng: 2.3522 }, [12, 13], 1);
    // 9 tiles en zoom 12 + 9 tiles en zoom 13 = 18 tiles
    expect(tiles).toHaveLength(18);
    expect(tiles.filter((t) => t.z === 12)).toHaveLength(9);
    expect(tiles.filter((t) => t.z === 13)).toHaveLength(9);
  });

  it('correctly formats tile URL template', () => {
    const template = 'https://tiles.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png';
    const formatted = formatTileUrl(template, { z: 12, x: 2074, y: 1409 });
    expect(formatted).toBe('https://tiles.basemaps.cartocdn.com/rastertiles/voyager/12/2074/1409.png');
  });
});
