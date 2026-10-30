import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PhotonGeocodingAdapter } from '@/features/map/infrastructure/photon-geocoding.adapter';

describe('PhotonGeocodingAdapter', () => {
  let adapter: PhotonGeocodingAdapter;

  beforeEach(() => {
    adapter = new PhotonGeocodingAdapter();
  });

  it('returns an empty array when query is too short', async () => {
    const results = await adapter.searchPlaces('a');
    expect(results).toEqual([]);
  });

  it('correctly maps Photon GeoJSON feature to PlaceResult', async () => {
    const mockApiResponse = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [2.3376, 48.8606], // [lon, lat]
          },
          properties: {
            osm_id: 123456,
            osm_type: 'W',
            osm_key: 'tourism',
            osm_value: 'museum',
            name: 'Musée du Louvre',
            street: 'Rue de Rivoli',
            housenumber: '99',
            city: 'Paris',
            country: 'France',
          },
        },
      ],
    };

    // Mock global fetch
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockApiResponse,
    });
    vi.stubGlobal('fetch', fetchMock);

    const results = await adapter.searchPlaces('Louvre', { lat: 48.85, lng: 2.35 });

    expect(results).toHaveLength(1);
    const place = results[0];
    expect(place.name).toBe('Musée du Louvre');
    expect(place.coordinates).toEqual({ lat: 48.8606, lng: 2.3376 });
    expect(place.category).toBe('attraction');
    expect(place.city).toBe('Paris');
    expect(place.formattedAddress).toContain('Rue de Rivoli 99');

    vi.unstubAllGlobals();
  });

  it('maps restaurant and cafe tags to food category', async () => {
    const mockApiResponse = {
      features: [
        {
          geometry: { coordinates: [2.33, 48.85] },
          properties: {
            name: 'Café de Flore',
            osm_key: 'amenity',
            osm_value: 'cafe',
          },
        },
      ],
    };

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockApiResponse,
    }));

    const results = await adapter.searchPlaces('Flore');
    expect(results[0].category).toBe('food');

    vi.unstubAllGlobals();
  });
});
