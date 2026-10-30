import React, { useState } from 'react';
import { X, Plus, Calendar, MapPin, Users, Coins, Search, Loader2 } from 'lucide-react';
import { Coordinates } from '@/core/domain/types';
import { PhotonGeocodingAdapter } from '@/features/map/infrastructure/photon-geocoding.adapter';
import { PlaceResult } from '@/features/map/ports/geocoding.port';

const geocodingService = new PhotonGeocodingAdapter();

interface CreateTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTrip: (params: {
    title: string;
    destination: string;
    centerCoordinates?: Coordinates;
    startDate: string;
    endDate: string;
    baseCurrency: string;
    travelersCount: number;
  }) => void;
}

export const CreateTripModal: React.FC<CreateTripModalProps> = ({
  isOpen,
  onClose,
  onCreateTrip,
}) => {
  const [title, setTitle] = useState('');
  const [destination, setDestination] = useState('');
  const [centerCoordinates, setCenterCoordinates] = useState<Coordinates | undefined>();
  const [startDate, setStartDate] = useState('2026-12-01');
  const [endDate, setEndDate] = useState('2026-12-05');
  const [baseCurrency, setBaseCurrency] = useState('EUR');
  const [travelersCount, setTravelersCount] = useState(2);

  // Búsqueda de ciudad destino
  const [destinationQuery, setDestinationQuery] = useState('');
  const [suggestions, setSuggestions] = useState<PlaceResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  if (!isOpen) return null;

  const handleSearchCity = async (val: string) => {
    setDestinationQuery(val);
    setDestination(val);
    if (val.trim().length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    setIsSearching(true);
    setShowDropdown(true);

    try {
      const results = await geocodingService.searchPlaces(val, undefined, 5);
      setSuggestions(results);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectCity = (place: PlaceResult) => {
    setDestination(place.formattedAddress);
    setDestinationQuery(place.formattedAddress);
    setCenterCoordinates(place.coordinates);
    if (!title) {
      setTitle(`Viaje a ${place.name}`);
    }
    setShowDropdown(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !destination.trim() || !startDate || !endDate) return;

    onCreateTrip({
      title: title.trim(),
      destination: destination.trim(),
      centerCoordinates,
      startDate,
      endDate: endDate < startDate ? startDate : endDate,
      baseCurrency,
      travelersCount: Math.max(1, travelersCount),
    });

    handleReset();
    onClose();
  };

  const handleReset = () => {
    setTitle('');
    setDestination('');
    setDestinationQuery('');
    setCenterCoordinates(undefined);
    setSuggestions([]);
    setShowDropdown(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto">
        {/* Cabecera */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Crear Nuevo Viaje</h3>
              <p className="text-[11px] text-slate-400">Configura tu próximo destino</p>
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

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {/* Ciudad Destino con autocompletado */}
          <div className="relative">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Destino / Ciudad *
            </label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="Ej. Roma, Tokio, Cancún, Barcelona..."
                value={destinationQuery}
                onChange={(e) => handleSearchCity(e.target.value)}
                onFocus={() => {
                  if (suggestions.length > 0) setShowDropdown(true);
                }}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              {isSearching && (
                <Loader2 className="w-4 h-4 text-blue-600 absolute right-3 top-3 animate-spin" />
              )}
            </div>

            {showDropdown && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 max-h-48 overflow-y-auto divide-y divide-slate-100">
                {suggestions.map((place) => (
                  <button
                    type="button"
                    key={place.id}
                    onClick={() => handleSelectCity(place)}
                    className="w-full text-left p-3 hover:bg-blue-50/70 transition-colors"
                  >
                    <p className="text-xs font-bold text-slate-900">{place.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{place.formattedAddress}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Título del Viaje */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nombre del Viaje *
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Vacaciones de Verano 2026"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Fecha Inicio
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Fecha Fin
              </label>
              <input
                type="date"
                required
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Moneda y Viajeros */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Moneda Base
              </label>
              <div className="relative">
                <select
                  value={baseCurrency}
                  onChange={(e) => setBaseCurrency(e.target.value)}
                  className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="EUR">EUR (€)</option>
                  <option value="USD">USD ($)</option>
                  <option value="MXN">MXN ($)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="JPY">JPY (¥)</option>
                </select>
                <Coins className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Viajeros
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={travelersCount}
                  onChange={(e) => setTravelersCount(parseInt(e.target.value) || 1)}
                  className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Users className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex items-center gap-3 pt-3">
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
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 shadow-md shadow-blue-200 transition-all flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Crear Viaje
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
