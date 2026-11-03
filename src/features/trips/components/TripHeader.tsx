import React from 'react';
import { Calendar, MapPin, Users, ChevronDown, Download, Cloud } from 'lucide-react';
import { Trip } from '../domain/trip';
import { SyncStatus } from '@/features/sync/ports/sync.port';

interface TripHeaderProps {
  trip: Trip;
  availableDays: string[];
  selectedDay: string;
  onSelectDay: (day: string) => void;
  onOpenTripSwitcher: () => void;
  onOpenExport?: () => void;
  onOpenShare?: () => void;
  onOpenAccount?: () => void;
  isUserLoggedIn?: boolean;
  syncStatus?: SyncStatus;
}

export const TripHeader: React.FC<TripHeaderProps> = ({
  trip,
  availableDays,
  selectedDay,
  onSelectDay,
  onOpenTripSwitcher,
  onOpenExport,
  onOpenShare,
  onOpenAccount,
  isUserLoggedIn = false,
  syncStatus = 'synced',
}) => {
  return (
    <header className="space-y-3">
      {/* Barra superior con selector de viajes, exportación y cuenta */}
      <div className="flex items-start justify-between">
        <button
          type="button"
          onClick={onOpenTripSwitcher}
          className="text-left group flex-1 mr-2"
          title="Cambiar de viaje"
        >
          <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 mb-0.5">
            <MapPin className="w-3.5 h-3.5" />
            <span className="truncate max-w-[170px]">{trip.destination}</span>
            <ChevronDown className="w-3.5 h-3.5 opacity-60 group-hover:translate-y-0.5 transition-transform" />
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors truncate">
            {trip.title}
          </h1>
        </button>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Botón de Sincronización en la Nube */}
          {onOpenAccount && (
            <button
              type="button"
              onClick={onOpenAccount}
              className={`p-1.5 rounded-full transition-colors flex items-center justify-center relative ${
                isUserLoggedIn
                  ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
                  : 'text-slate-500 bg-slate-100 hover:bg-slate-200'
              }`}
              title={isUserLoggedIn ? 'Nube Conectada' : 'Conectar con la Nube'}
            >
              <Cloud className={`w-4 h-4 ${syncStatus === 'syncing' ? 'animate-pulse text-amber-500' : ''}`} />
              {isUserLoggedIn && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full ring-1 ring-white" />
              )}
            </button>
          )}

          {/* Botón de Compartir y Colaborar */}
          {onOpenShare && (
            <button
              type="button"
              onClick={onOpenShare}
              className="p-1.5 text-slate-600 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 rounded-full transition-colors relative"
              title="Compartir y Colaborar con Acompañantes"
            >
              <Users className="w-4 h-4" />
              {trip.collaborators && trip.collaborators.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[9px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-bold">
                  {trip.collaborators.length}
                </span>
              )}
            </button>
          )}

          {/* Botón de Exportar (.ics / PDF) */}
          {onOpenExport && (
            <button
              type="button"
              onClick={onOpenExport}
              className="p-1.5 text-slate-600 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 rounded-full transition-colors"
              title="Exportar a Calendario (.ics) o Imprimir PDF"
            >
              <Download className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={onOpenTripSwitcher}
            className="flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-full transition-colors"
          >
            Mis Viajes
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>
            {trip.startDate} — {trip.endDate}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-400">
          <Users className="w-3.5 h-3.5" />
          <span>{trip.travelersCount} viajeros</span>
        </div>
      </div>

      {/* Selector horizontal de días */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {availableDays.map((day, idx) => {
          const isSelected = day === selectedDay;
          return (
            <button
              key={day}
              onClick={() => onSelectDay(day)}
              className={`flex flex-col items-center min-w-[70px] py-1.5 px-3 rounded-xl border text-xs font-medium transition-all ${
                isSelected
                  ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className="text-[10px] opacity-80">Día {idx + 1}</span>
              <span className="font-bold">{day.slice(5)}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
