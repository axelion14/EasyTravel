import React from 'react';
import { Calendar, MapPin, Users, ChevronDown, Share2 } from 'lucide-react';
import { Trip } from '../domain/trip';

interface TripHeaderProps {
  trip: Trip;
  availableDays: string[];
  selectedDay: string;
  onSelectDay: (day: string) => void;
  onOpenTripSwitcher: () => void;
  onOpenExport?: () => void;
}

export const TripHeader: React.FC<TripHeaderProps> = ({
  trip,
  availableDays,
  selectedDay,
  onSelectDay,
  onOpenTripSwitcher,
  onOpenExport,
}) => {
  return (
    <header className="space-y-3">
      {/* Barra superior con selector de viajes y exportación */}
      <div className="flex items-start justify-between">
        <button
          type="button"
          onClick={onOpenTripSwitcher}
          className="text-left group flex-1 mr-2"
          title="Cambiar de viaje"
        >
          <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 mb-0.5">
            <MapPin className="w-3.5 h-3.5" />
            <span className="truncate max-w-[180px]">{trip.destination}</span>
            <ChevronDown className="w-3.5 h-3.5 opacity-60 group-hover:translate-y-0.5 transition-transform" />
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors truncate">
            {trip.title}
          </h1>
        </button>

        <div className="flex items-center gap-1.5 shrink-0">
          {onOpenExport && (
            <button
              type="button"
              onClick={onOpenExport}
              className="p-1.5 text-slate-600 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 rounded-full transition-colors"
              title="Exportar a Calendario (.ics) o Imprimir PDF"
            >
              <Share2 className="w-4 h-4" />
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
