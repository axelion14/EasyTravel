/**
 * Lógica de dominio pura para notificaciones de paradas del itinerario.
 * Genera los `NotificationRequest` correctos; no llama directamente al OS.
 */
import { NotificationRequest } from '../ports/native.port';
import { Stop } from '@/features/itinerary/domain/stop';

/** Límite máximo de recordatorios de anticipación antes de una parada (minutos) */
const DEFAULT_REMINDER_MINUTES = 30;

/** Categoría de icono por tipo de parada */
const CATEGORY_ICON: Record<Stop['category'], string> = {
  attraction: '🏛️',
  food: '🍽️',
  lodging: '🏨',
  transit: '✈️',
  custom: '📍',
};

/**
 * Genera un ID numérico estable y único para la notificación de una parada.
 * Capacitor requiere un entero positivo de 32 bits.
 */
export function stopNotificationId(stopId: string): number {
  let hash = 0;
  for (let i = 0; i < stopId.length; i++) {
    hash = (hash * 31 + stopId.charCodeAt(i)) & 0x7fffffff;
  }
  return Math.max(1, hash);
}

/**
 * Calcula la fecha y hora exacta de la notificación de una parada.
 * Retorna `null` si la parada no tiene hora asignada o ya pasó.
 */
export function buildStopNotification(
  stop: Stop,
  reminderMinutes = DEFAULT_REMINDER_MINUTES
): NotificationRequest | null {
  if (!stop.time || !stop.dayDate) return null;

  const [hours, minutes] = stop.time.split(':').map(Number);
  const stopDateTime = new Date(`${stop.dayDate}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`);

  if (isNaN(stopDateTime.getTime())) return null;

  const notifyAt = new Date(stopDateTime.getTime() - reminderMinutes * 60_000);

  if (notifyAt <= new Date()) return null; // Ya pasó

  const icon = CATEGORY_ICON[stop.category] ?? '📍';

  const durationText = stop.durationMinutes
    ? ` · ${stop.durationMinutes} min`
    : '';

  return {
    id: stopNotificationId(stop.id),
    title: `${icon} ${stop.title}`,
    body: `Llegada a las ${stop.time}${durationText}${stop.address ? ` · ${stop.address}` : ''}`,
    scheduleAt: notifyAt.toISOString(),
    extra: { stopId: stop.id, dayDate: stop.dayDate },
  };
}

/**
 * Genera todas las notificaciones válidas y futuras para una lista de paradas.
 */
export function buildAllStopNotifications(
  stops: Stop[],
  reminderMinutes = DEFAULT_REMINDER_MINUTES
): NotificationRequest[] {
  return stops
    .filter((s) => !s.isDeleted && s.time)
    .map((s) => buildStopNotification(s, reminderMinutes))
    .filter((n): n is NotificationRequest => n !== null);
}
