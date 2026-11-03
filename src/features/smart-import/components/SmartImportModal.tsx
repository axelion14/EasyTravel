import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Hotel,
  Plane,
  Utensils,
  Calendar,
  Clock,
  MapPin,
  Tag,
  DollarSign,
  FileCheck2,
  AlertCircle,
} from 'lucide-react';
import { parseBookingConfirmation, ParsedBooking } from '../domain/booking-parser';
import { Stop } from '@/features/itinerary/domain/stop';
import { Expense } from '@/features/budget/domain/budget';
import { Coordinates } from '@/core/domain/types';
import { generateUUID, formatCurrency } from '@/shared/lib/utils';
import { PhotonGeocodingAdapter } from '@/features/map/infrastructure/photon-geocoding.adapter';

const geocodingService = new PhotonGeocodingAdapter();

interface SmartImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  defaultDate: string;
  baseCoordinates: Coordinates;
  baseCurrency: string;
  currentDayStopsCount: number;
  onImportSuccess: (data: { stop: Stop; expense?: Expense }) => void;
}

const SAMPLE_HOTEL = `Booking.com - Confirmación de reserva
Hotel Le Marais Boutique Paris
Dirección: 15 Rue des Archives, 75004 Paris
Check-in: 15/11/2026 a las 14:00
Check-out: 18/11/2026 a las 11:00
Número de confirmación: #BK-98234190
Precio total: 320.50 €`;

const SAMPLE_FLIGHT = `Iberia - Tu tarjeta de embarque y confirmación
Vuelo Madrid a París (CDG) - IB3402
Fecha de salida: 2026-11-15
Hora de salida: 09:30 AM
Localizador: PNR-IB482
Total pagado: 145.00 EUR`;

const SAMPLE_ACTIVITY = `Confirmación de mesa en Le Jules Verne
Fecha: 16 de noviembre de 2026
Hora: 20:30
Dirección: Torre Eiffel, Avenue Gustave Eiffel, Paris
Código de reserva: JV-8821
Depósito: 80 EUR`;

export const SmartImportModal: React.FC<SmartImportModalProps> = ({
  isOpen,
  onClose,
  tripId,
  defaultDate,
  baseCoordinates,
  baseCurrency,
  currentDayStopsCount,
  onImportSuccess,
}) => {
  const [inputText, setInputText] = useState('');
  const [parsed, setParsed] = useState<ParsedBooking | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleParse = () => {
    if (!inputText.trim()) return;
    const result = parseBookingConfirmation(inputText, defaultDate, baseCurrency);
    setParsed(result);
  };

  const handleLoadSample = (sample: string) => {
    setInputText(sample);
    const result = parseBookingConfirmation(sample, defaultDate, baseCurrency);
    setParsed(result);
  };

  const handleConfirmImport = async () => {
    if (!parsed) return;
    setIsProcessing(true);

    try {
      // Intentar geocodificar la dirección si se detectó una
      let location = {
        lat: baseCoordinates.lat + (Math.random() - 0.5) * 0.015,
        lng: baseCoordinates.lng + (Math.random() - 0.5) * 0.015,
      };

      if (parsed.address || parsed.title) {
        const query = parsed.address || parsed.title;
        const places = await geocodingService.searchPlaces(query, baseCoordinates, 1);
        if (places.length > 0) {
          location = places[0].coordinates;
        }
      }

      // 1. Crear la parada para el itinerario
      const newStop: Stop = {
        id: generateUUID(),
        tripId,
        dayDate: parsed.startDate,
        order: currentDayStopsCount,
        title: parsed.title,
        category: parsed.category,
        address: parsed.address,
        location,
        time: parsed.time,
        durationMinutes: parsed.type === 'lodging' ? 60 : 120,
        notes: parsed.notes,
        estimatedCost: parsed.price,
        updatedAt: new Date().toISOString(),
        isDeleted: false,
      };

      // 2. Si se detectó un precio, crear automáticamente el gasto correspondiente
      let newExpense: Expense | undefined = undefined;
      if (parsed.price) {
        let expenseCategory: Expense['category'] = 'other';
        if (parsed.type === 'lodging') expenseCategory = 'lodging';
        else if (parsed.type === 'flight') expenseCategory = 'flight';
        else if (parsed.category === 'food') expenseCategory = 'food';
        else if (parsed.category === 'attraction') expenseCategory = 'activity';

        newExpense = {
          id: generateUUID(),
          tripId,
          stopId: newStop.id,
          category: expenseCategory,
          title: parsed.title,
          amount: parsed.price,
          date: parsed.startDate,
          bookingReference: parsed.bookingReference,
          updatedAt: new Date().toISOString(),
          isDeleted: false,
        };
      }

      onImportSuccess({ stop: newStop, expense: newExpense });
      handleReset();
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setInputText('');
    setParsed(null);
    setIsProcessing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto">
        {/* Cabecera */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Importar Reserva</h3>
              <p className="text-[11px] text-slate-400">Pega el correo o confirmación de tu viaje</p>
            </div>
          </div>
          <button
            onClick={() => {
              handleReset();
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Ejemplos rápidos */}
        <div className="pt-3">
          <p className="text-[11px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
            Probar con ejemplo:
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleLoadSample(SAMPLE_HOTEL)}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition-colors"
            >
              <Hotel className="w-3.5 h-3.5 text-emerald-600" />
              Hotel
            </button>
            <button
              type="button"
              onClick={() => handleLoadSample(SAMPLE_FLIGHT)}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition-colors"
            >
              <Plane className="w-3.5 h-3.5 text-sky-600" />
              Vuelo
            </button>
            <button
              type="button"
              onClick={() => handleLoadSample(SAMPLE_ACTIVITY)}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition-colors"
            >
              <Utensils className="w-3.5 h-3.5 text-amber-600" />
              Mesa / Cena
            </button>
          </div>
        </div>

        {/* Área de texto */}
        <div className="pt-3 space-y-2">
          <textarea
            rows={4}
            placeholder="Pega aquí el texto completo del correo de confirmación (Booking, Airbnb, Ryanair, Iberia, Uber, etc.)..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="w-full p-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-slate-50/50 resize-none font-mono"
          />

          <button
            type="button"
            onClick={handleParse}
            disabled={!inputText.trim()}
            className="w-full py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            Analizar Texto
          </button>
        </div>

        {/* Vista previa estructurada */}
        {parsed && (
          <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <FileCheck2 className="w-4 h-4 text-emerald-600" />
                Reserva Detectada
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-white border border-slate-200 text-slate-600 rounded-md">
                {parsed.category}
              </span>
            </div>

            <div>
              <p className="text-sm font-bold text-slate-900">{parsed.title}</p>
              {parsed.address && (
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{parsed.address}</span>
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-slate-600">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{parsed.startDate}</span>
              </div>
              {parsed.time && (
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{parsed.time}</span>
                </div>
              )}
              {parsed.bookingReference && (
                <div className="flex items-center gap-1.5 text-slate-600 col-span-2">
                  <Tag className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-mono text-[11px] bg-white px-1.5 py-0.5 rounded border border-slate-200">
                    Ref: {parsed.bookingReference}
                  </span>
                </div>
              )}
            </div>

            {parsed.price && (
              <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                <span className="text-xs font-semibold text-slate-500">Gasto detectado:</span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                  {formatCurrency(parsed.price.amountCents, parsed.price.currency)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex items-center gap-3 pt-4 border-t border-slate-100 mt-4">
          <button
            type="button"
            onClick={() => {
              handleReset();
              onClose();
            }}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirmImport}
            disabled={!parsed || isProcessing}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 shadow-md shadow-blue-200 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            {isProcessing ? 'Importando...' : 'Añadir a mi Viaje'}
          </button>
        </div>
      </div>
    </div>
  );
};
