import { Coordinates } from '@/core/domain/types';

export interface RouteSegment {
  distanceMeters: number;
  durationSeconds: number;
  geometryGeoJSON: GeoJSON.LineString;
  isFromCache?: boolean;
}

export interface RoutingPort {
  calculateRoute(waypoints: Coordinates[]): Promise<RouteSegment | null>;
}
