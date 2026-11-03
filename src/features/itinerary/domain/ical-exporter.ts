import { Trip } from '@/features/trips/domain/trip';
import { Stop } from '@/features/itinerary/domain/stop';

/**
 * Formatea una fecha y hora local a formato iCalendar (YYYYMMDDTHHmmss).
 */
function formatICalDateTime(dateStr: string, timeStr?: string): string {
  const cleanDate = dateStr.replace(/-/g, '');
  if (!timeStr) {
    // Evento de día completo si no hay hora específica
    return cleanDate;
  }
  const cleanTime = timeStr.replace(/:/g, '').padEnd(4, '0') + '00';
  return `${cleanDate}T${cleanTime}`;
}

/**
 * Calcula la fecha y hora de finalización del evento sumando la duración en minutos.
 */
function calculateEndTime(dateStr: string, timeStr?: string, durationMinutes = 60): string {
  if (!timeStr) {
    return dateStr.replace(/-/g, '');
  }

  const [hours, minutes] = timeStr.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + durationMinutes;

  const endHours = Math.floor(totalMinutes / 60) % 24;
  const endMins = totalMinutes % 60;

  const endHStr = String(endHours).padStart(2, '0');
  const endMStr = String(endMins).padStart(2, '0');

  return formatICalDateTime(dateStr, `${endHStr}:${endMStr}`);
}

/**
 * Genera el archivo .ics (iCalendar) estándar compatible con Google Calendar, Apple Calendar y Outlook.
 */
export function generateICalendar(trip: Trip, stops: Stop[]): string {
  const nowStamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const nonDeletedStops = stops.filter((s) => s.tripId === trip.id && !s.isDeleted);

  const events = nonDeletedStops.map((stop) => {
    const isAllDay = !stop.time;
    const dtStart = isAllDay
      ? `DTSTART;VALUE=DATE:${formatICalDateTime(stop.dayDate)}`
      : `DTSTART:${formatICalDateTime(stop.dayDate, stop.time)}`;

    const dtEnd = isAllDay
      ? `DTEND;VALUE=DATE:${formatICalDateTime(stop.dayDate)}`
      : `DTEND:${calculateEndTime(stop.dayDate, stop.time, stop.durationMinutes || 60)}`;

    const descriptionParts = [
      `Categoría: ${stop.category.toUpperCase()}`,
      stop.notes ? `Notas: ${stop.notes}` : null,
      stop.estimatedCost ? `Costo estimado: ${(stop.estimatedCost.amountCents / 100).toFixed(2)} ${stop.estimatedCost.currency}` : null,
      stop.websiteUrl ? `Web: ${stop.websiteUrl}` : null,
    ].filter(Boolean);

    const description = descriptionParts.join('\\n');
    const location = stop.address || `${stop.location.lat}, ${stop.location.lng}`;

    return [
      'BEGIN:VEVENT',
      `UID:${stop.id}@travelplanner.app`,
      `DTSTAMP:${nowStamp}`,
      dtStart,
      dtEnd,
      `SUMMARY:${stop.title} (${trip.destination})`,
      `DESCRIPTION:${description}`,
      `LOCATION:${location}`,
      stop.websiteUrl ? `URL:${stop.websiteUrl}` : null,
      'STATUS:CONFIRMED',
      'END:VEVENT',
    ]
      .filter(Boolean)
      .join('\r\n');
  });

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Travel Planner App//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:Itinerario: ${trip.title}`,
    `X-WR-TIMEZONE:UTC`,
    ...events,
    'END:VCALENDAR',
  ].join('\r\n');
}

/**
 * Dispara la descarga del archivo .ics en el navegador del usuario.
 */
export function downloadICalendarFile(trip: Trip, stops: Stop[]): void {
  const icsContent = generateICalendar(trip, stops);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  const safeTitle = trip.title.replace(/[^a-zA-Z0-9_-]/g, '_');
  a.download = `${safeTitle || 'itinerario'}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
