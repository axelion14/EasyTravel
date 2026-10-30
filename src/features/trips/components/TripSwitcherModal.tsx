import React from 'react';
import { X, Plus, Calendar, MapPin, Trash2, CheckCircle, Navigation } from 'lucide-react';
import { Trip } from '../domain/trip';

interface TripSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  trips: Trip[];
  activeTripId: string;
  onSelectTrip: (tripId: string) => void;
  onDeleteTrip: (tripId: string) => void;
  onOpenCreateModal: () => void;
}

export const TripSwitcherModal: React.FC<TripSwitcherModalProps> = ({
  isOpen,
  onClose,
  trips,
  activeTripId,
  onSelectTrip,
  onDeleteTrip,
  onOpenCreateModal,
}) => {
  if (!isOpen) return null;

  const nonDeletedTrips = trips.filter((t) => !t.isDeleted);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Mis Viajes</h3>
              <p className="text-[11px] text-slate-400">Selecciona o administra tus planes</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lista de viajes */}
        <div className="space-y-3 pt-4">
          {nonDeletedTrips.map((trip) => {
            const isActive = trip.id === activeTripId;

            return (
              <div
                key={trip.id}
                onClick={() => {
                  onSelectTrip(trip.id);
                  onClose();
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer relative group ${
                  isActive
                    ? 'border-blue-600 bg-blue-50/50 shadow-md ring-2 ring-blue-100'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-blue-600 font-semibold mb-1">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{trip.destination}</span>
                    </div>
                    <h4 className="font-bold text-sm text-slate-900">{trip.title}</h4>
                  </div>

                  {isActive ? (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-blue-600 bg-white px-2.5 py-1 rounded-full shadow-sm border border-blue-100">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Activo
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`¿Eliminar el viaje "${trip.title}"?`)) {
                          onDeleteTrip(trip.id);
                        }
                      }}
                      className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar viaje"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-500 mt-3 pt-2.5 border-t border-slate-100">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {trip.startDate} — {trip.endDate}
                    </span>
                  </div>
                  <span>•</span>
                  <span>{trip.travelersCount} viajeros</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Botón para crear nuevo viaje */}
        <div className="pt-4 border-t border-slate-100 mt-4">
          <button
            onClick={() => {
              onClose();
              onOpenCreateModal();
            }}
            className="w-full py-3 bg-blue-600 text-white rounded-2xl text-xs font-bold shadow-md shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Crear Otro Viaje
          </button>
        </div>
      </div>
    </div>
  );
};
