import { Coordinates, Money, UUID } from '@/core/domain/types';
import { generateUUID } from '@/shared/lib/utils';

export type StopCategory = 'attraction' | 'food' | 'lodging' | 'transit' | 'custom';

export interface ChecklistItem {
  id: UUID;
  text: string;
  done: boolean;
}

export interface Stop {
  id: UUID;
  tripId: UUID;
  dayDate: string; // YYYY-MM-DD
  order: number;
  title: string;
  category: StopCategory;
  location: Coordinates;
  address?: string;
  time?: string; // Formato 24h 'HH:mm' ej. '10:30'
  durationMinutes?: number; // Duración estimada de estancia en minutos
  websiteUrl?: string; // Enlace a web oficial, reservas o menú
  notes?: string;
  checklist?: ChecklistItem[];
  estimatedCost?: Money;
  updatedAt: string;
  isDeleted: boolean;
}

export function reorderStops(stops: Stop[], sourceIndex: number, destinationIndex: number): Stop[] {
  const result = Array.from(stops);
  const [removed] = result.splice(sourceIndex, 1);
  result.splice(destinationIndex, 0, removed);
  return result.map((stop, idx) => ({
    ...stop,
    order: idx,
    updatedAt: new Date().toISOString(),
  }));
}

export function formatDuration(minutes?: number): string {
  if (!minutes || minutes <= 0) return '';
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  if (hours > 0 && remainingMins > 0) return `${hours}h ${remainingMins}m`;
  if (hours > 0) return `${hours}h`;
  return `${remainingMins}m`;
}

export function toggleChecklistItem(stop: Stop, itemId: string): Stop {
  if (!stop.checklist) return stop;
  return {
    ...stop,
    checklist: stop.checklist.map((item) =>
      item.id === itemId ? { ...item, done: !item.done } : item
    ),
    updatedAt: new Date().toISOString(),
  };
}

export function addChecklistItem(stop: Stop, text: string): Stop {
  const trimmed = text.trim();
  if (!trimmed) return stop;
  const newItem: ChecklistItem = {
    id: generateUUID(),
    text: trimmed,
    done: false,
  };
  return {
    ...stop,
    checklist: [...(stop.checklist || []), newItem],
    updatedAt: new Date().toISOString(),
  };
}
