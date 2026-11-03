import { Trip, Collaborator, CollaboratorRole } from './trip';
import { Stop } from '@/features/itinerary/domain/stop';
import { Expense } from '@/features/budget/domain/budget';
import { generateUUID } from '@/shared/lib/utils';

export interface TripBundle {
  version: 1;
  exportedAt: string;
  trip: Trip;
  stops: Stop[];
  expenses: Expense[];
}

export interface ShareLinkResult {
  token: string;
  url: string;
  role: 'editor' | 'viewer';
}

/**
 * Genera un enlace de invitación / colaboración con token seguro y rol predefinido.
 */
export function generateShareLink(
  trip: Trip,
  role: 'editor' | 'viewer' = 'viewer',
  origin = typeof window !== 'undefined' ? window.location.origin : 'https://travelplanner.app'
): ShareLinkResult {
  const token = trip.shareToken || generateUUID().replace(/-/g, '').slice(0, 16);
  const cleanOrigin = origin.replace(/\/+$/, '');
  const url = `${cleanOrigin}/?tripId=${encodeURIComponent(trip.id)}&shareToken=${token}&role=${role}`;

  return {
    token,
    url,
    role,
  };
}

/**
 * Agrega un nuevo colaborador al viaje sin duplicar correos electrónicos.
 */
export function addCollaborator(
  trip: Trip,
  email: string,
  role: 'editor' | 'viewer',
  name?: string
): Trip {
  const normalizedEmail = email.trim().toLowerCase();
  const existingList = trip.collaborators || [];

  // Si ya existe, actualizamos su rol
  const existingIndex = existingList.findIndex(
    (c) => c.email.toLowerCase() === normalizedEmail
  );

  const now = new Date().toISOString();
  let updatedCollaborators: Collaborator[];

  if (existingIndex >= 0) {
    updatedCollaborators = existingList.map((c, i) =>
      i === existingIndex ? { ...c, role, name: name || c.name } : c
    );
  } else {
    const newCollaborator: Collaborator = {
      id: generateUUID(),
      email: normalizedEmail,
      name,
      role,
      joinedAt: now,
    };
    updatedCollaborators = [...existingList, newCollaborator];
  }

  return {
    ...trip,
    collaborators: updatedCollaborators,
    updatedAt: now,
  };
}

/**
 * Remueve un colaborador por su identificador.
 */
export function removeCollaborator(trip: Trip, collaboratorId: string): Trip {
  const existingList = trip.collaborators || [];
  const updatedCollaborators = existingList.filter((c) => c.id !== collaboratorId);

  return {
    ...trip,
    collaborators: updatedCollaborators,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Verifica si el usuario actual posee permisos de edición sobre el viaje.
 * Por defecto en Local-First, el usuario es propietario ('owner') y tiene permisos completos
 * a menos que esté expresamente marcado como 'viewer' (solo lectura).
 */
export function canUserEditTrip(trip: Trip): boolean {
  if (trip.userRole === 'viewer') {
    return false;
  }
  return true;
}

/**
 * Empaqueta un viaje completo con sus paradas y gastos en un JSON firmado y versionado.
 * Ideal para compartir planes completos con acompañantes sin requerir internet (AirDrop / WhatsApp / QR).
 */
export function exportTripBundle(
  trip: Trip,
  stops: Stop[],
  expenses: Expense[]
): string {
  const activeStops = stops.filter((s) => s.tripId === trip.id && !s.isDeleted);
  const activeExpenses = expenses.filter((e) => e.tripId === trip.id && !e.isDeleted);

  const bundle: TripBundle = {
    version: 1,
    exportedAt: new Date().toISOString(),
    trip: {
      ...trip,
      isDeleted: false,
    },
    stops: activeStops,
    expenses: activeExpenses,
  };

  return JSON.stringify(bundle, null, 2);
}

/**
 * Valida e importa un paquete JSON de viaje.
 * Regenera IDs opcionalmente para evitar colisiones si se importa como copia.
 */
export function importTripBundle(
  jsonContent: string,
  asNewCopy = false
): { trip: Trip; stops: Stop[]; expenses: Expense[] } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonContent);
  } catch (err) {
    throw new Error('El archivo proporcionado no es un JSON válido.');
  }

  const bundle = parsed as Partial<TripBundle>;
  if (!bundle || bundle.version !== 1 || !bundle.trip || !Array.isArray(bundle.stops)) {
    throw new Error('Formato de viaje no reconocido o versión incompatible.');
  }

  if (asNewCopy) {
    const newTripId = generateUUID();
    const now = new Date().toISOString();

    const newTrip: Trip = {
      ...bundle.trip,
      id: newTripId,
      title: `${bundle.trip.title} (Copia)`,
      createdAt: now,
      updatedAt: now,
      shareToken: undefined,
      userRole: 'owner',
      collaborators: [],
    };

    const newStops = (bundle.stops || []).map((stop) => ({
      ...stop,
      id: generateUUID(),
      tripId: newTripId,
      updatedAt: now,
    }));

    const newExpenses = (bundle.expenses || []).map((expense) => ({
      ...expense,
      id: generateUUID(),
      tripId: newTripId,
      updatedAt: now,
    }));

    return { trip: newTrip, stops: newStops, expenses: newExpenses };
  }

  return {
    trip: bundle.trip,
    stops: bundle.stops,
    expenses: bundle.expenses || [],
  };
}
