import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Trip, createNewTrip } from '../domain/trip';
import {
  Stop,
  reorderStops,
  toggleChecklistItem,
  addChecklistItem,
} from '@/features/itinerary/domain/stop';
import { Expense } from '@/features/budget/domain/budget';
import { generateUUID } from '@/shared/lib/utils';
import { generateDateRange } from '@/core/domain/dates';
import { Coordinates } from '@/core/domain/types';

interface CreateTripInput {
  title: string;
  destination: string;
  centerCoordinates?: Coordinates;
  startDate: string;
  endDate: string;
  baseCurrency: string;
  travelersCount: number;
}

interface TripState {
  trips: Trip[];
  activeTripId: string;
  selectedDay: string;
  activeStopId: string | null;
  stops: Stop[];
  expenses: Expense[];

  // Selectores calculados
  getActiveTrip: () => Trip;
  getAvailableDays: () => string[];

  // Acciones de Viajes
  createTrip: (input: CreateTripInput) => string;
  setActiveTrip: (tripId: string) => void;
  deleteTrip: (tripId: string) => void;

  // Acciones de UI
  setSelectedDay: (day: string) => void;
  setActiveStopId: (id: string | null) => void;

  // Acciones de Paradas
  addStop: (stop: Stop) => void;
  updateStop: (stopId: string, updates: Partial<Stop>) => void;
  setDayStops: (tripId: string, dayDate: string, newStops: Stop[]) => void;
  reorderCurrentDayStops: (sourceIndex: number, destinationIndex: number) => void;
  deleteStop: (id: string) => void;
  toggleStopChecklist: (stopId: string, itemId: string) => void;
  addStopChecklistItem: (stopId: string, text: string) => void;

  // Acciones de Gastos
  addExpense: (expense: Expense) => void;
  deleteExpense: (id: string) => void;

  // Reset a datos de demostración
  resetToDemo: () => void;
}

const demoTrip1 = createNewTrip({
  id: 'demo-paris-2026',
  title: 'Escapada a París 🗼',
  destination: 'París, Francia',
  centerCoordinates: { lat: 48.8566, lng: 2.3522 },
  startDate: '2026-11-15',
  endDate: '2026-11-17',
  baseCurrency: 'EUR',
  travelersCount: 2,
});

const demoTrip2 = createNewTrip({
  id: 'demo-rome-2026',
  title: 'Ruta Imperial por Roma 🏛️',
  destination: 'Roma, Italia',
  centerCoordinates: { lat: 41.9028, lng: 12.4964 },
  startDate: '2026-12-05',
  endDate: '2026-12-08',
  baseCurrency: 'EUR',
  travelersCount: 2,
});

const initialStops: Stop[] = [
  {
    id: generateUUID(),
    tripId: demoTrip1.id,
    dayDate: '2026-11-15',
    order: 0,
    title: 'Torre Eiffel',
    category: 'attraction',
    time: '10:00',
    durationMinutes: 90,
    websiteUrl: 'https://www.toureiffel.paris',
    location: { lat: 48.8584, lng: 2.2945 },
    address: 'Champ de Mars, 5 Av. Anatole France',
    estimatedCost: { amountCents: 3600, currency: 'EUR' },
    checklist: [
      { id: generateUUID(), text: 'Subir hasta la cima en ascensor', done: false },
      { id: generateUUID(), text: 'Foto desde Trocadero', done: true },
    ],
    updatedAt: new Date().toISOString(),
    isDeleted: false,
  },
  {
    id: generateUUID(),
    tripId: demoTrip1.id,
    dayDate: '2026-11-15',
    order: 1,
    title: 'Café de Flore',
    category: 'food',
    time: '12:30',
    durationMinutes: 60,
    websiteUrl: 'https://cafedeflore.fr',
    location: { lat: 48.8542, lng: 2.3325 },
    address: '172 Bd Saint-Germain',
    estimatedCost: { amountCents: 2400, currency: 'EUR' },
    checklist: [
      { id: generateUUID(), text: 'Pedir el chocolate caliente especial', done: true },
    ],
    updatedAt: new Date().toISOString(),
    isDeleted: false,
  },
  {
    id: generateUUID(),
    tripId: demoTrip1.id,
    dayDate: '2026-11-15',
    order: 2,
    title: 'Museo del Louvre',
    category: 'attraction',
    time: '14:30',
    durationMinutes: 180,
    websiteUrl: 'https://www.louvre.fr',
    location: { lat: 48.8606, lng: 2.3376 },
    address: 'Rue de Rivoli, 75001 Paris',
    estimatedCost: { amountCents: 4400, currency: 'EUR' },
    checklist: [
      { id: generateUUID(), text: 'Ver la Gioconda (Mona Lisa)', done: false },
      { id: generateUUID(), text: 'Ala Denon: Victoria de Samotracia', done: false },
    ],
    updatedAt: new Date().toISOString(),
    isDeleted: false,
  },
  {
    id: generateUUID(),
    tripId: demoTrip2.id,
    dayDate: '2026-12-05',
    order: 0,
    title: 'Coliseo Romano',
    category: 'attraction',
    time: '09:30',
    durationMinutes: 120,
    websiteUrl: 'https://colosseo.it',
    location: { lat: 41.8902, lng: 12.4922 },
    address: 'Piazza del Colosseo, 1, Roma',
    estimatedCost: { amountCents: 1800, currency: 'EUR' },
    checklist: [
      { id: generateUUID(), text: 'Pase prioritario con acceso a la arena subterránea', done: false },
    ],
    updatedAt: new Date().toISOString(),
    isDeleted: false,
  },
];

const initialExpenses: Expense[] = [
  {
    id: generateUUID(),
    tripId: demoTrip1.id,
    category: 'activity',
    title: 'Entradas Museo del Louvre',
    amount: { amountCents: 4400, currency: 'EUR' },
    date: '2026-11-15',
    bookingReference: 'Ref: LOUVRE-9921',
    updatedAt: new Date().toISOString(),
    isDeleted: false,
  },
  {
    id: generateUUID(),
    tripId: demoTrip1.id,
    category: 'activity',
    title: 'Acceso Torre Eiffel',
    amount: { amountCents: 3600, currency: 'EUR' },
    date: '2026-11-15',
    bookingReference: 'Reserva online',
    updatedAt: new Date().toISOString(),
    isDeleted: false,
  },
  {
    id: generateUUID(),
    tripId: demoTrip1.id,
    category: 'food',
    title: 'Almuerzo Café de Flore',
    amount: { amountCents: 2400, currency: 'EUR' },
    date: '2026-11-15',
    updatedAt: new Date().toISOString(),
    isDeleted: false,
  },
];

export const useTripStore = create<TripState>()(
  persist(
    (set, get) => ({
      trips: [demoTrip1, demoTrip2],
      activeTripId: demoTrip1.id,
      selectedDay: demoTrip1.startDate,
      activeStopId: null,
      stops: initialStops,
      expenses: initialExpenses,

      getActiveTrip: () => {
        const { trips, activeTripId } = get();
        const found = trips.find((t) => t.id === activeTripId && !t.isDeleted);
        return found || trips.find((t) => !t.isDeleted) || demoTrip1;
      },

      getAvailableDays: () => {
        const active = get().getActiveTrip();
        return generateDateRange(active.startDate, active.endDate);
      },

      createTrip: (input) => {
        const id = generateUUID();
        const newTrip = createNewTrip({
          id,
          title: input.title,
          destination: input.destination,
          centerCoordinates: input.centerCoordinates,
          startDate: input.startDate,
          endDate: input.endDate,
          baseCurrency: input.baseCurrency,
          travelersCount: input.travelersCount,
        });

        set((state) => ({
          trips: [newTrip, ...state.trips],
          activeTripId: newTrip.id,
          selectedDay: newTrip.startDate,
          activeStopId: null,
        }));

        return id;
      },

      setActiveTrip: (tripId) => {
        const trip = get().trips.find((t) => t.id === tripId && !t.isDeleted);
        if (trip) {
          set({
            activeTripId: trip.id,
            selectedDay: trip.startDate,
            activeStopId: null,
          });
        }
      },

      deleteTrip: (tripId) => {
        const { trips, activeTripId } = get();
        const updatedTrips = trips.map((t) =>
          t.id === tripId ? { ...t, isDeleted: true, updatedAt: new Date().toISOString() } : t
        );

        let nextActiveId = activeTripId;
        if (activeTripId === tripId) {
          const next = updatedTrips.find((t) => !t.isDeleted);
          nextActiveId = next ? next.id : demoTrip1.id;
        }

        const nextTrip = updatedTrips.find((t) => t.id === nextActiveId) || demoTrip1;

        set({
          trips: updatedTrips,
          activeTripId: nextActiveId,
          selectedDay: nextTrip.startDate,
          activeStopId: null,
        });
      },

      setSelectedDay: (day) => set({ selectedDay: day, activeStopId: null }),
      setActiveStopId: (id) => set({ activeStopId: id }),

      addStop: (stop) => set((state) => ({ stops: [...state.stops, stop] })),

      updateStop: (stopId, updates) =>
        set((state) => ({
          stops: state.stops.map((s) =>
            s.id === stopId
              ? { ...s, ...updates, updatedAt: new Date().toISOString() }
              : s
          ),
        })),

      setDayStops: (tripId, dayDate, newStops) => {
        const { stops } = get();
        const otherStops = stops.filter(
          (s) => s.tripId !== tripId || s.dayDate !== dayDate || s.isDeleted
        );
        set({ stops: [...otherStops, ...newStops] });
      },

      toggleStopChecklist: (stopId, itemId) =>
        set((state) => ({
          stops: state.stops.map((s) =>
            s.id === stopId ? toggleChecklistItem(s, itemId) : s
          ),
        })),

      addStopChecklistItem: (stopId, text) =>
        set((state) => ({
          stops: state.stops.map((s) =>
            s.id === stopId ? addChecklistItem(s, text) : s
          ),
        })),

      reorderCurrentDayStops: (sourceIndex, destinationIndex) => {
        const { stops, selectedDay, activeTripId } = get();
        const currentDayStops = stops
          .filter((s) => s.tripId === activeTripId && s.dayDate === selectedDay && !s.isDeleted)
          .sort((a, b) => a.order - b.order);

        const reordered = reorderStops(currentDayStops, sourceIndex, destinationIndex);
        const otherStops = stops.filter(
          (s) => s.tripId !== activeTripId || s.dayDate !== selectedDay || s.isDeleted
        );

        set({ stops: [...otherStops, ...reordered] });
      },

      deleteStop: (id) =>
        set((state) => ({
          stops: state.stops.map((s) =>
            s.id === id ? { ...s, isDeleted: true, updatedAt: new Date().toISOString() } : s
          ),
        })),

      addExpense: (expense) =>
        set((state) => ({
          expenses: [expense, ...state.expenses],
        })),

      deleteExpense: (id) =>
        set((state) => ({
          expenses: state.expenses.map((e) =>
            e.id === id ? { ...e, isDeleted: true, updatedAt: new Date().toISOString() } : e
          ),
        })),

      resetToDemo: () =>
        set({
          trips: [demoTrip1, demoTrip2],
          activeTripId: demoTrip1.id,
          selectedDay: demoTrip1.startDate,
          activeStopId: null,
          stops: initialStops,
          expenses: initialExpenses,
        }),
    }),
    {
      name: 'travel-planner-multitrip-v2',
    }
  )
);
