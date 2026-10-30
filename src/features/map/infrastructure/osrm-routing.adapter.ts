import { Coordinates } from '@/core/domain/types';
import { RouteSegment, RoutingPort } from '../ports/routing.port';

export class OsrmRoutingAdapter implements RoutingPort {
  private baseUrl: string;

  constructor(baseUrl = 'https://router.project-osrm.org/route/v1/driving') {
    this.baseUrl = baseUrl;
  }

  async calculateRoute(waypoints: Coordinates[]): Promise<RouteSegment | null> {
    if (waypoints.length < 2) return null;

    // OSRM espera {lon},{lat};{lon},{lat}...
    const coordString = waypoints
      .map((p) => `${p.lng},${p.lat}`)
      .join(';');

    const url = `${this.baseUrl}/${coordString}?overview=full&geometries=geojson`;

    try {
      const response = await fetch(url);
      if (!response.ok) return null;

      const data = await response.json();
      if (!data.routes || data.routes.length === 0) return null;

      const primaryRoute = data.routes[0];
      return {
        distanceMeters: primaryRoute.distance,
        durationSeconds: primaryRoute.duration,
        geometryGeoJSON: primaryRoute.geometry,
      };
    } catch (err) {
      console.warn('Error fetching OSRM route:', err);
      // Fallback simple: línea recta en GeoJSON
      return {
        distanceMeters: 0,
        durationSeconds: 0,
        geometryGeoJSON: {
          type: 'LineString',
          coordinates: waypoints.map((p) => [p.lng, p.lat]),
        },
      };
    }
  }
}
