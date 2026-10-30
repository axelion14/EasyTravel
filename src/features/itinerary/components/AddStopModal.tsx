import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Plus,
  MapPin,
  Search,
  Loader2,
  CheckCircle2,
  Coffee,
  Landmark,
  Hotel,
  Navigation,
  Clock,
  Globe,
  FileText,
  ListTodo,
} from 'lucide-react';
import { Stop, StopCategory, ChecklistItem } from '../domain/stop';
import { generateUUID } from '@/shared/lib/utils';
import { Coordinates } from '@/core/domain/types';
import { PhotonGeocodingAdapter } from '@/features/map/infrastructure/photon-geocoding.adapter';
import { PlaceResult } from '@/features/map/ports/geocoding.port';

const geocodingService = new PhotonGeocodingAdapter();

interface AddStopModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  selectedDay: string;
  currentStopsCount: number;
  baseCoordinates: Coordinates;
  currency: string;
  onSave: (stop: Stop) => void;
}

const CategoryIcon: React.FC<{ category: StopCategory }> = ({ category }) => {
  switch (category) {
    case 'food':
      return <Coffee className="w-3.5 h-3.5 text-amber-500" />;
    case 'attraction':
      return <Landmark className="w-3.5 h-3.5 text-indigo-500" />;
    case 'lodging':
      return <Hotel className="w-3.5 h-3.5 text-emerald-500" />;
    case 'transit':
      return <Navigation className="w-3.5 h-3.5 text-blue-500" />;
    default:
      return <MapPin className="w-3.5 h-3.5 text-slate-500" />;
  }
};

export const AddStopModal: React.FC<AddStopModalProps> = ({
  isOpen,
  onClose,
  tripId,
  selectedDay,
  currentStopsCount,
  baseCoordinates,
  currency,
  onSave,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PlaceResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Datos base
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<StopCategory>('attraction');
  const [address, setAddress] = useState('');
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [estimatedCostInput, setEstimatedCostInput] = useState('');
  const [hasSelectedRealPlace, setHasSelectedRealPlace] = useState(false);

  // Enriquecimiento de paradas (Subfase 1.3)
  const [time, setTime] = useState('');
  const [durationMinutes, setDurationMinutes] = useState<number | undefined>(60);
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [checklistItemInput, setChecklistItemInput] = useState('');
  const [checklistItems, setChecklistItems] = useState<string[]>([]);

  const searchTimeoutRef = useRef<number | null>(null);

  // Búsqueda en tiempo real con debounce
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      setShowDropdown(false);
      return;
    }

    if (searchTimeoutRef.current) {
      window.clearTimeout(searchTimeoutRef.current);
    }

    setIsSearching(true);
    setShowDropdown(true);

    searchTimeoutRef.current = window.setTimeout(async () => {
      const results = await geocodingService.searchPlaces(
        searchQuery,
        baseCoordinates,
        6
      );
      setSearchResults(results);
      setIsSearching(false);
    }, 350);

    return () => {
      if (searchTimeoutRef.current) {
        window.clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, baseCoordinates]);

  if (!isOpen) return null;

  const handleSelectPlace = (place: PlaceResult) => {
    setTitle(place.name);
    setAddress(place.formattedAddress);
    setCoordinates(place.coordinates);
    setCategory(place.category);
    setSearchQuery(place.name);
    setHasSelectedRealPlace(true);
    setShowDropdown(false);
  };

  const handleAddChecklistItem = () => {
    const trimmed = checklistItemInput.trim();
    if (!trimmed) return;
    setChecklistItems((prev) => [...prev, trimmed]);
    setChecklistItemInput('');
  };

  const handleRemoveChecklistItem = (idx: number) => {
    setChecklistItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const finalCoords = coordinates || {
      lat: baseCoordinates.lat + (Math.random() - 0.5) * 0.015,
      lng: baseCoordinates.lng + (Math.random() - 0.5) * 0.015,
    };

    const parsedCost = parseFloat(estimatedCostInput);
    const estimatedCost =
      !isNaN(parsedCost) && parsedCost > 0
        ? { amountCents: Math.round(parsedCost * 100), currency }
        : undefined;

    const finalChecklist: ChecklistItem[] | undefined =
      checklistItems.length > 0
        ? checklistItems.map((text) => ({
            id: generateUUID(),
            text,
            done: false,
          }))
        : undefined;

    const newStop: Stop = {
      id: generateUUID(),
      tripId,
      dayDate: selectedDay,
      order: currentStopsCount,
      title: title.trim(),
      category,
      address: address.trim() || undefined,
      location: finalCoords,
      time: time || undefined,
      durationMinutes: durationMinutes && durationMinutes > 0 ? durationMinutes : undefined,
      websiteUrl: websiteUrl.trim() || undefined,
      notes: notes.trim() || undefined,
      checklist: finalChecklist,
      estimatedCost,
      updatedAt: new Date().toISOString(),
      isDeleted: false,
    };

    onSave(newStop);
    handleReset();
    onClose();
  };

  const handleReset = () => {
    setSearchQuery('');
    setSearchResults([]);
    setTitle('');
    setAddress('');
    setCoordinates(null);
    setEstimatedCostInput('');
    setHasSelectedRealPlace(false);
    setShowDropdown(false);
    setTime('');
    setDurationMinutes(60);
    setWebsiteUrl('');
    setNotes('');
    setChecklistItemInput('');
    setChecklistItems([]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto">
        {/* Cabecera */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Nueva Parada</h3>
              <p className="text-[11px] text-slate-400">Busca en el mapa o ingresa detalles</p>
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

        {/* Buscador de Lugares */}
        <div className="pt-4 relative">
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Buscar Lugar en el Mapa 🔍
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Ej. Museo de Orsay, Café de Flore, Notre Dame..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setHasSelectedRealPlace(false);
              }}
              onFocus={() => {
                if (searchResults.length > 0) setShowDropdown(true);
              }}
              className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            {isSearching && (
              <Loader2 className="w-4 h-4 text-blue-600 absolute right-3 top-3 animate-spin" />
            )}
            {!isSearching && searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                  setShowDropdown(false);
                }}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Menú flotante de resultados */}
          {showDropdown && searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-2xl z-30 max-h-56 overflow-y-auto divide-y divide-slate-100">
              {searchResults.map((result) => (
                <button
                  type="button"
                  key={result.id}
                  onClick={() => handleSelectPlace(result)}
                  className="w-full text-left p-3 hover:bg-blue-50/70 transition-colors flex items-start gap-2.5"
                >
                  <div className="p-1.5 bg-slate-50 rounded-lg mt-0.5 border border-slate-100">
                    <CategoryIcon category={result.category} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-900 truncate">{result.name}</p>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">
                        {result.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-1">{result.formattedAddress}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {hasSelectedRealPlace && coordinates && (
            <div className="mt-2 flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="truncate">
                Ubicación real fijada ({coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)})
              </span>
            </div>
          )}
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nombre de la Parada *
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Museo de Orsay"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Dirección
            </label>
            <input
              type="text"
              placeholder="Ej. 1 Rue de la Légion d'Honneur, 75007 Paris"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Horario y Duración estimada (Subfase 1.3) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Hora de Llegada
              </label>
              <div className="relative">
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full pl-8 pr-2 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Clock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Estancia Estimada
              </label>
              <select
                value={durationMinutes || ''}
                onChange={(e) => setDurationMinutes(e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Sin definir</option>
                <option value="30">30 minutos</option>
                <option value="45">45 minutos</option>
                <option value="60">1 hora</option>
                <option value="90">1h 30m</option>
                <option value="120">2 horas</option>
                <option value="180">3 horas</option>
                <option value="240">4 horas</option>
              </select>
            </div>
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Categoría
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: 'attraction', label: 'Atracción' },
                  { id: 'food', label: 'Comida' },
                  { id: 'lodging', label: 'Hospedaje' },
                  { id: 'transit', label: 'Transporte' },
                  { id: 'custom', label: 'Otro' },
                ] as const
              ).map((cat) => (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all ${
                    category === cat.id
                      ? 'border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-200'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Enlace Web y Costo */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Costo Estimado
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={estimatedCostInput}
                  onChange={(e) => setEstimatedCostInput(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="absolute left-3 top-2 text-slate-400 font-bold text-xs">
                  {currency === 'EUR' ? '€' : '$'}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Enlace Web / Reserva
              </label>
              <div className="relative">
                <input
                  type="url"
                  placeholder="https://..."
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  className="w-full pl-8 pr-2 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Globe className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>
          </div>

          {/* Checklist / Recordatorios de la parada (Subfase 1.3) */}
          <div className="space-y-1.5 pt-1">
            <label className="block text-xs font-semibold text-slate-700">
              Checklist / Cosas por hacer en esta parada
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ej. Comprar entradas online, Llevar pasaporte..."
                value={checklistItemInput}
                onChange={(e) => setChecklistItemInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddChecklistItem();
                  }
                }}
                className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleAddChecklistItem}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
              >
                + Añadir
              </button>
            </div>

            {checklistItems.length > 0 && (
              <div className="space-y-1 pt-1.5">
                {checklistItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    <span className="text-slate-700">• {item}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveChecklistItem(idx)}
                      className="text-slate-400 hover:text-red-500"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

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
              Guardar Parada
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
