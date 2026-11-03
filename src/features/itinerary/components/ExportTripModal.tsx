import React from 'react';
import { X, Calendar, Printer, Download, Share2, Check, FileText } from 'lucide-react';
import { Trip } from '@/features/trips/domain/trip';
import { Stop } from '@/features/itinerary/domain/stop';
import { BudgetSummaryData } from '@/features/budget/domain/budget';
import { downloadICalendarFile } from '../domain/ical-exporter';
import { formatCurrency } from '@/shared/lib/utils';

interface ExportTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: Trip;
  stops: Stop[];
  budgetSummary: BudgetSummaryData;
}

export const ExportTripModal: React.FC<ExportTripModalProps> = ({
  isOpen,
  onClose,
  trip,
  stops,
  budgetSummary,
}) => {
  if (!isOpen) return null;

  const tripStops = stops
    .filter((s) => s.tripId === trip.id && !s.isDeleted)
    .sort((a, b) => a.dayDate.localeCompare(b.dayDate) || a.order - b.order);

  const handleDownloadIcs = () => {
    downloadICalendarFile(trip, stops);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto print:max-h-none print:shadow-none print:border-none print:p-0">
        {/* Cabecera modal (oculta en impresión) */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 print:hidden">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Exportar Viaje</h3>
              <p className="text-[11px] text-slate-400">Descarga a calendario o imprime en PDF</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Opciones de exportación rápida (oculta en impresión) */}
        <div className="pt-4 space-y-3 print:hidden">
          {/* Opción 1: iCalendar (.ics) */}
          <button
            type="button"
            onClick={handleDownloadIcs}
            className="w-full flex items-center justify-between p-3.5 bg-blue-50/50 hover:bg-blue-50 border border-blue-200 rounded-2xl transition-all group text-left"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-sm">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-900 group-hover:text-blue-600 transition-colors">
                  Descargar Calendario (.ics)
                </h4>
                <p className="text-[11px] text-slate-500">
                  Importa a Google Calendar, Apple Calendar o Outlook
                </p>
              </div>
            </div>
            <Download className="w-4 h-4 text-blue-600 shrink-0" />
          </button>

          {/* Opción 2: Imprimir / PDF */}
          <button
            type="button"
            onClick={handlePrint}
            className="w-full flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl transition-all group text-left"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-slate-800 text-white rounded-xl shadow-sm">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-900 group-hover:text-slate-800 transition-colors">
                  Imprimir / Guardar PDF
                </h4>
                <p className="text-[11px] text-slate-500">
                  Hoja de ruta física con direcciones, horarios y costos
                </p>
              </div>
            </div>
            <FileText className="w-4 h-4 text-slate-400 group-hover:text-slate-600 shrink-0" />
          </button>
        </div>

        {/* Resumen imprimible (visible en pantalla pequeña y en la hoja de impresión) */}
        <div className="mt-5 pt-4 border-t border-slate-100 space-y-4 print:mt-0 print:pt-0 print:border-none">
          <div className="bg-slate-50 print:bg-white p-4 rounded-2xl border border-slate-200 print:border-slate-300 space-y-2">
            <h2 className="text-base font-extrabold text-slate-900">{trip.title}</h2>
            <p className="text-xs text-slate-600">
              📍 Destino: <strong>{trip.destination}</strong> ({trip.startDate} al {trip.endDate})
            </p>
            <p className="text-xs text-slate-600">
              💰 Presupuesto estimado: <strong>{formatCurrency(budgetSummary.totalEstimatedCents, trip.baseCurrency)}</strong>
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 print:text-black">
              Itinerario Completo ({tripStops.length} paradas)
            </h4>

            <div className="space-y-2 max-h-60 overflow-y-auto print:max-h-none print:overflow-visible">
              {tripStops.map((stop, idx) => (
                <div
                  key={stop.id}
                  className="p-2.5 bg-white border border-slate-200 rounded-xl text-xs flex items-start justify-between gap-2"
                >
                  <div>
                    <div className="flex items-center gap-1.5 font-bold text-slate-900">
                      <span className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center text-[10px]">
                        {idx + 1}
                      </span>
                      <span>{stop.title}</span>
                      {stop.time && (
                        <span className="text-blue-600 text-[11px] font-semibold">
                          ({stop.time})
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {stop.dayDate} {stop.address ? `• ${stop.address}` : ''}
                    </p>
                  </div>
                  {stop.estimatedCost && (
                    <span className="text-[11px] font-bold text-slate-700 shrink-0">
                      {formatCurrency(stop.estimatedCost.amountCents, stop.estimatedCost.currency)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
