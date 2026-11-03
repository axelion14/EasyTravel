import { describe, it, expect } from 'vitest';
import { generateICalendar } from '@/features/itinerary/domain/ical-exporter';
import { Trip } from '@/features/trips/domain/trip';
import { Stop } from '@/features/itinerary/domain/stop';

describe('iCalendar (.ics) Exporter Domain Logic', () => {
  const mockTrip: Trip = {
    id: 'trip-1',
    title: 'Viaje a París',
    destination: 'París, Francia',
    startDate: '2026-11-15',
    endDate: '2026-11-17',
    baseCurrency: 'EUR',
    travelersCount: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isDeleted: false,
  };

  const mockStops: Stop[] = [
    {
      id: 'stop-1',
      tripId: 'trip-1',
      dayDate: '2026-11-15',
      order: 0,
      title: 'Torre Eiffel',
      category: 'attraction',
      time: '10:00',
      durationMinutes: 90,
      address: 'Champ de Mars, Paris',
      websiteUrl: 'https://toureiffel.paris',
      location: { lat: 48.8584, lng: 2.2945 },
      updatedAt: new Date().toISOString(),
      isDeleted: false,
    },
    {
      id: 'stop-2',
      tripId: 'trip-1',
      dayDate: '2026-11-16',
      order: 0,
      title: 'Día libre en Montmartre',
      category: 'custom',
      // Sin hora -> Todo el día
      location: { lat: 48.8867, lng: 2.3431 },
      updatedAt: new Date().toISOString(),
      isDeleted: false,
    },
    {
      id: 'stop-deleted',
      tripId: 'trip-1',
      dayDate: '2026-11-15',
      order: 1,
      title: 'Parada borrada',
      category: 'food',
      location: { lat: 48.85, lng: 2.33 },
      updatedAt: new Date().toISOString(),
      isDeleted: true,
    },
  ];

  it('generates standard VCALENDAR header and footer', () => {
    const ics = generateICalendar(mockTrip, mockStops);

    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('VERSION:2.0');
    expect(ics).toContain('X-WR-CALNAME:Itinerario: Viaje a París');
    expect(ics).toContain('END:VCALENDAR');
  });

  it('creates timed events with start, end and location correctly', () => {
    const ics = generateICalendar(mockTrip, mockStops);

    expect(ics).toContain('SUMMARY:Torre Eiffel (París, Francia)');
    expect(ics).toContain('DTSTART:20261115T100000');
    expect(ics).toContain('DTEND:20261115T113000'); // 10:00 + 90 min = 11:30
    expect(ics).toContain('LOCATION:Champ de Mars, Paris');
    expect(ics).toContain('URL:https://toureiffel.paris');
  });

  it('handles all-day events when no specific time is provided', () => {
    const ics = generateICalendar(mockTrip, mockStops);

    expect(ics).toContain('SUMMARY:Día libre en Montmartre (París, Francia)');
    expect(ics).toContain('DTSTART;VALUE=DATE:20261116');
    expect(ics).toContain('DTEND;VALUE=DATE:20261116');
  });

  it('excludes soft-deleted stops from the exported calendar', () => {
    const ics = generateICalendar(mockTrip, mockStops);

    expect(ics).not.toContain('Parada borrada');
    expect(ics).not.toContain('stop-deleted@travelplanner.app');
  });
});
