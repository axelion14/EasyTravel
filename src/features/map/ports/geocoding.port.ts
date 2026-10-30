import { Coordinates } from '@/core/domain/types';
import { StopCategory } from '@/features/itinerary/domain/stop';

export interface PlaceResult {
  id: string;
  name: string;
  formattedAddress: string;
  coordinates: Coordinates;
  category: StopCategory;
  city?: string;
  country?: string;
}

export interface GeocodingPort {
  searchPlaces(query: string, bias?: Coordinates, limit?: number): Promise<PlaceResult[]>;
}
