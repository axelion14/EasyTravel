import { Coordinates } from '@/core/domain/types';
import { StopCategory } from '@/features/itinerary/domain/stop';
import { GeocodingPort, PlaceResult } from '../ports/geocoding.port';

export class PhotonGeocodingAdapter implements GeocodingPort {
  private baseUrl: string;

  constructor(baseUrl = 'https://photon.komoot.io/api') {
    this.baseUrl = baseUrl;
  }

  async searchPlaces(
    query: string,
    bias?: Coordinates,
    limit = 6
  ): Promise<PlaceResult[]> {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) return [];

    // 1. Intentar con Photon (OSM) sin el parámetro inválido 'lang=es'
    try {
      const params = new URLSearchParams({
        q: trimmed,
        limit: limit.toString(),
      });

      if (bias) {
        params.append('lat', bias.lat.toString());
        params.append('lon', bias.lng.toString());
      }

      const response = await fetch(`${this.baseUrl}/?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        if (data.features && Array.isArray(data.features) && data.features.length > 0) {
          return data.features.map((feature: any, index: number) => {
            const props = feature.properties || {};
            const coords = feature.geometry?.coordinates || [0, 0];
            const lng = coords[0];
            const lat = coords[1];
            const name = props.name || props.street || 'Lugar sin nombre';

            const addressParts = [
              props.street ? `${props.street} ${props.housenumber || ''}`.trim() : null,
              props.district || props.suburb || null,
              props.city || props.town || props.village || null,
              props.state || null,
              props.country || null,
            ].filter(Boolean);

            return {
              id: props.osm_id ? `${props.osm_type || 'N'}_${props.osm_id}` : `photon_${index}`,
              name,
              formattedAddress: addressParts.join(', ') || name,
              coordinates: { lat, lng },
              category: this.mapOsmCategory(props.osm_key, props.osm_value),
              city: props.city || props.town,
              country: props.country,
            };
          });
        }
      }
    } catch (err) {
      console.warn('Photon geocoding error, pasando a fallback Nominatim:', err);
    }

    // 2. Fallback robusto con OpenStreetMap Nominatim
    try {
      const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        trimmed
      )}&limit=${limit}&addressdetails=1`;

      const nomResponse = await fetch(nominatimUrl, {
        headers: {
          'Accept-Language': 'es,en',
        },
      });

      if (nomResponse.ok) {
        const nomData = await nomResponse.json();
        if (Array.isArray(nomData)) {
          return nomData.map((item: any, idx: number) => {
            const lat = parseFloat(item.lat);
            const lng = parseFloat(item.lon);
            const address = item.address || {};
            const name =
              item.name ||
              item.display_name?.split(',')[0] ||
              address.road ||
              trimmed;

            return {
              id: item.place_id ? `nom_${item.place_id}` : `nom_${idx}`,
              name,
              formattedAddress: item.display_name,
              coordinates: { lat, lng },
              category: this.mapOsmCategory(item.class, item.type),
              city: address.city || address.town,
              country: address.country,
            };
          });
        }
      }
    } catch (err) {
      console.warn('Nominatim fallback error:', err);
    }

    return [];
  }

  private mapOsmCategory(key?: string, value?: string): StopCategory {
    if (!key || !value) return 'attraction';

    if (key === 'amenity') {
      if (['restaurant', 'cafe', 'bar', 'fast_food', 'pub', 'bistro', 'food_court'].includes(value)) {
        return 'food';
      }
    }

    if (key === 'tourism') {
      if (['hotel', 'hostel', 'motel', 'guest_house', 'apartment', 'camp_site'].includes(value)) {
        return 'lodging';
      }
      if (['museum', 'attraction', 'artwork', 'gallery', 'viewpoint', 'theme_park'].includes(value)) {
        return 'attraction';
      }
    }

    if (key === 'historic' || key === 'leisure') {
      return 'attraction';
    }

    if (['aeroway', 'railway', 'public_transport'].includes(key)) {
      return 'transit';
    }

    return 'attraction';
  }
}
