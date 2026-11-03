import { describe, it, expect, beforeEach } from 'vitest';
import { useTripStore } from '@/features/trips/store/tripStore';

describe('Multi-Trip Store Logic', () => {
  beforeEach(() => {
    useTripStore.getState().resetToDemo();
  });

  it('initializes with default demo trips and active trip', () => {
    const state = useTripStore.getState();
    expect(state.trips.length).toBeGreaterThanOrEqual(2);
    const active = state.getActiveTrip();
    expect(active.id).toBe('demo-paris-2026');
  });

  it('switches active trip and resets selected day to start date of selected trip', () => {
    const store = useTripStore.getState();
    store.setActiveTrip('demo-rome-2026');

    const updated = useTripStore.getState();
    expect(updated.activeTripId).toBe('demo-rome-2026');
    expect(updated.selectedDay).toBe('2026-12-05');
  });

  it('creates a new trip and sets it as the active trip', () => {
    const store = useTripStore.getState();
    const newTripId = store.createTrip({
      title: 'Aventura en Tokio 🎌',
      destination: 'Tokio, Japón',
      centerCoordinates: { lat: 35.6762, lng: 139.6503 },
      startDate: '2027-03-10',
      endDate: '2027-03-15',
      baseCurrency: 'JPY',
      travelersCount: 1,
    });

    const state = useTripStore.getState();
    expect(state.activeTripId).toBe(newTripId);
    expect(state.selectedDay).toBe('2027-03-10');
    expect(state.getActiveTrip().title).toBe('Aventura en Tokio 🎌');
    expect(state.getAvailableDays()).toHaveLength(6);
  });

  it('marks trip as deleted (soft delete) and switches active trip gracefully', () => {
    const store = useTripStore.getState();
    store.deleteTrip('demo-paris-2026');

    const state = useTripStore.getState();
    const deleted = state.trips.find((t) => t.id === 'demo-paris-2026');
    expect(deleted?.isDeleted).toBe(true);
    expect(state.activeTripId).not.toBe('demo-paris-2026');
  });

  it('updates all stops for a specific day via setDayStops (used by route optimizer)', () => {
    const store = useTripStore.getState();
    const dayStops = store.stops.filter(
      (s) => s.tripId === 'demo-paris-2026' && s.dayDate === '2026-11-15'
    );
    expect(dayStops.length).toBeGreaterThan(1);

    // Invert order
    const reversed = [...dayStops].reverse().map((s, idx) => ({ ...s, order: idx }));
    store.setDayStops('demo-paris-2026', '2026-11-15', reversed);

    const updated = useTripStore
      .getState()
      .stops.filter((s) => s.tripId === 'demo-paris-2026' && s.dayDate === '2026-11-15')
      .sort((a, b) => a.order - b.order);

    expect(updated[0].id).toBe(reversed[0].id);
    expect(updated[updated.length - 1].id).toBe(reversed[reversed.length - 1].id);
  });
});
