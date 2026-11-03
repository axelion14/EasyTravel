import { describe, it, expect } from 'vitest';
import {
  stopNotificationId,
  buildStopNotification,
  buildAllStopNotifications,
} from '@/features/native/domain/stop-notifications';
import { Stop } from '@/features/itinerary/domain/stop';

describe('Stop Notification Domain', () => {
  const futureDate = '2099-06-15';

  const baseStop: Stop = {
    id: 'stop-abc-123',
    tripId: 'trip-1',
    dayDate: futureDate,
    order: 0,
    title: 'Museo del Prado',
    category: 'attraction',
    time: '10:00',
    durationMinutes: 120,
    address: 'Calle Ruiz de Alarcón 23, Madrid',
    location: { lat: 40.4138, lng: -3.6922 },
    updatedAt: '2026-01-01T00:00:00Z',
    isDeleted: false,
  };

  it('generates a stable, positive 32-bit integer ID for a stop', () => {
    const id = stopNotificationId('stop-abc-123');
    expect(id).toBeGreaterThan(0);
    expect(Number.isInteger(id)).toBe(true);
    // Determinista — same input → same output
    expect(id).toBe(stopNotificationId('stop-abc-123'));
    // Different stop → different ID (highly probable)
    expect(id).not.toBe(stopNotificationId('stop-xyz-999'));
  });

  it('builds a valid notification request for a future stop with time', () => {
    const req = buildStopNotification(baseStop, 30);

    expect(req).not.toBeNull();
    expect(req!.title).toBe('🏛️ Museo del Prado');
    expect(req!.body).toContain('10:00');
    expect(req!.body).toContain('120 min');
    expect(req!.body).toContain('Calle Ruiz de Alarcón 23');
    // Should fire 30 minutes before the scheduled time
    const notifyAt = new Date(req!.scheduleAt);
    const stopAt = new Date(`${futureDate}T10:00:00`);
    expect(stopAt.getTime() - notifyAt.getTime()).toBe(30 * 60_000);
  });

  it('returns null for a stop without a scheduled time', () => {
    const noTimeStop = { ...baseStop, time: undefined };
    expect(buildStopNotification(noTimeStop)).toBeNull();
  });

  it('returns null when the notification time is already in the past', () => {
    const pastStop = {
      ...baseStop,
      dayDate: '2020-01-01',
      time: '09:00',
    };
    expect(buildStopNotification(pastStop, 30)).toBeNull();
  });

  it('filters deleted and timeless stops when building bulk notifications', () => {
    const stops: Stop[] = [
      baseStop,
      { ...baseStop, id: 'stop-2', time: undefined },        // no time → skip
      { ...baseStop, id: 'stop-3', isDeleted: true },         // deleted → skip
      { ...baseStop, id: 'stop-4', time: '14:30' },           // valid → include
    ];

    const notifications = buildAllStopNotifications(stops, 30);
    expect(notifications).toHaveLength(2);
    expect(notifications.map((n) => n.extra?.stopId)).toEqual(
      expect.arrayContaining(['stop-abc-123', 'stop-4'])
    );
  });
});
