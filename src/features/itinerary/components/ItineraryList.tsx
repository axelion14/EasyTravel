import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical,
  MapPin,
  Trash2,
  Coffee,
  Landmark,
  Hotel,
  Navigation,
  Clock,
  Globe,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronUp,
  Plus,
  Sparkles,
  Zap,
} from 'lucide-react';
import { Stop, StopCategory, formatDuration } from '../domain/stop';
import { optimizeRoute2Opt } from '@/features/map/domain/route-optimizer';
import { formatCurrency } from '@/shared/lib/utils';

interface ItineraryListProps {
  stops: Stop[];
  activeStopId?: string | null;
  onSelectStop: (id: string) => void;
  onReorder: (sourceIndex: number, destinationIndex: number) => void;
  onDeleteStop: (id: string) => void;
  onAddStop: () => void;
  onToggleChecklist?: (stopId: string, itemId: string) => void;
  onAddChecklistItem?: (stopId: string, text: string) => void;
  onOptimizeRoute?: (stops: Stop[]) => void;
}

const CategoryIcon: React.FC<{ category: StopCategory }> = ({ category }) => {
  switch (category) {
    case 'food':
      return <Coffee className="w-4 h-4 text-amber-500" />;
    case 'attraction':
      return <Landmark className="w-4 h-4 text-indigo-500" />;
    case 'lodging':
      return <Hotel className="w-4 h-4 text-emerald-500" />;
    case 'transit':
      return <Navigation className="w-4 h-4 text-blue-500" />;
    default:
      return <MapPin className="w-4 h-4 text-slate-500" />;
  }
};

const SortableStopItem: React.FC<{
  stop: Stop;
  index: number;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onToggleChecklist?: (itemId: string) => void;
  onAddChecklistItem?: (text: string) => void;
}> = ({
  stop,
  index,
  isActive,
  onSelect,
  onDelete,
  onToggleChecklist,
  onAddChecklistItem,
}) => {
  const [isChecklistExpanded, setIsChecklistExpanded] = useState(false);
  const [newChecklistText, setNewChecklistText] = useState('');

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stop.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const checklist = stop.checklist || [];
  const completedChecklistCount = checklist.filter((i) => i.done).length;

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!newChecklistText.trim()) return;
    onAddChecklistItem?.(newChecklistText.trim());
    setNewChecklistText('');
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex flex-col p-3.5 rounded-2xl border transition-all ${
        isDragging
          ? 'opacity-50 border-blue-500 bg-blue-50 shadow-lg scale-[1.02] z-30'
          : isActive
          ? 'border-blue-400 bg-blue-50/50 shadow-sm'
          : 'border-slate-200 bg-white hover:border-slate-300'
      }`}
      onClick={onSelect}
    >
      {/* Fila principal */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3 min-w-0">
          {/* Handle de arrastre */}
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 text-slate-300 hover:text-slate-600 touch-none mt-0.5"
            title="Arrastrar para reordenar"
          >
            <GripVertical className="w-4 h-4" />
          </button>

          {/* Badge de número */}
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700 mt-0.5">
            {index + 1}
          </div>

          {/* Info principal de la parada */}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <CategoryIcon category={stop.category} />
              <span className="font-bold text-sm text-slate-900 truncate">
                {stop.title}
              </span>
            </div>

            {/* Horario y Duración */}
            {(stop.time || stop.durationMinutes) && (
              <div className="flex items-center gap-1.5 text-xs text-blue-600 font-semibold mt-0.5">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  {stop.time && `${stop.time}`}
                  {stop.time && stop.durationMinutes && ' · '}
                  {stop.durationMinutes && `${formatDuration(stop.durationMinutes)}`}
                </span>
              </div>
            )}

            {stop.address && (
              <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                {stop.address}
              </p>
            )}
          </div>
        </div>

        {/* Acciones y Costo a la derecha */}
        <div className="flex items-center gap-2 shrink-0">
          {stop.websiteUrl && (
            <a
              href={stop.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Abrir web oficial o reserva"
            >
              <Globe className="w-3.5 h-3.5" />
            </a>
          )}

          {stop.estimatedCost && (
            <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg">
              {formatCurrency(stop.estimatedCost.amountCents, stop.estimatedCost.currency)}
            </span>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Eliminar parada"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Fila secundaria: Badge de checklist */}
      {checklist.length > 0 && (
        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsChecklistExpanded((prev) => !prev);
            }}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
            <span>
              Tareas ({completedChecklistCount}/{checklist.length})
            </span>
            {isChecklistExpanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      )}

      {/* Checklist desplegable interactivo */}
      {isChecklistExpanded && (
        <div
          className="mt-2 space-y-1.5 pl-6 animate-in fade-in duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          {checklist.map((item) => (
            <div
              key={item.id}
              onClick={() => onToggleChecklist?.(item.id)}
              className="flex items-center gap-2 cursor-pointer py-0.5 group/item text-xs"
            >
              {item.done ? (
                <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <Square className="w-4 h-4 text-slate-300 group-hover/item:text-slate-500 shrink-0" />
              )}
              <span
                className={`transition-colors ${
                  item.done ? 'line-through text-slate-400' : 'text-slate-700 font-medium'
                }`}
              >
                {item.text}
              </span>
            </div>
          ))}

          {/* Formulario rápido para añadir tarea */}
          <form onSubmit={handleAddTodo} className="flex gap-2 pt-1">
            <input
              type="text"
              placeholder="+ Añadir tarea..."
              value={newChecklistText}
              onChange={(e) => setNewChecklistText(e.target.value)}
              className="flex-1 px-2.5 py-1 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
            />
            <button
              type="submit"
              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export const ItineraryList: React.FC<ItineraryListProps> = ({
  stops,
  activeStopId,
  onSelectStop,
  onReorder,
  onDeleteStop,
  onAddStop,
  onToggleChecklist,
  onAddChecklistItem,
  onOptimizeRoute,
}) => {
  const [feedback, setFeedback] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = stops.findIndex((s) => s.id === active.id);
      const newIndex = stops.findIndex((s) => s.id === over.id);
      onReorder(oldIndex, newIndex);
    }
  };

  const handleOptimize = () => {
    if (stops.length < 3) return;
    const result = optimizeRoute2Opt(stops, true);

    if (result.savedPercentage > 0) {
      onOptimizeRoute?.(result.optimizedStops);
      setFeedback(
        `¡Ruta optimizada! Ahorraste ${(result.savedMeters / 1000).toFixed(1)} km (~${result.savedPercentage}%) en desplazamientos.`
      );
    } else {
      setFeedback('La ruta actual ya está en el orden más óptimo.');
    }

    setTimeout(() => {
      setFeedback(null);
    }, 4500);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Cabecera de paradas con botón de optimización inteligente */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
          Paradas del Día ({stops.length})
        </h3>

        <div className="flex items-center gap-2">
          {stops.length >= 3 && (
            <button
              type="button"
              onClick={handleOptimize}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 rounded-xl text-xs font-bold transition-all shadow-xs"
              title="Reordenar paradas con algoritmo 2-Opt para minimizar distancia y tiempo"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
              <span>Optimizar</span>
            </button>
          )}

          <button
            onClick={onAddStop}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
          >
            + Agregar Parada
          </button>
        </div>
      </div>

      {/* Banner de feedback tras optimizar */}
      {feedback && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold animate-in fade-in">
          <Zap className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={stops.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2.5">
            {stops.map((stop, index) => (
              <SortableStopItem
                key={stop.id}
                stop={stop}
                index={index}
                isActive={stop.id === activeStopId}
                onSelect={() => onSelectStop(stop.id)}
                onDelete={() => onDeleteStop(stop.id)}
                onToggleChecklist={(itemId) => onToggleChecklist?.(stop.id, itemId)}
                onAddChecklistItem={(text) => onAddChecklistItem?.(stop.id, text)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {stops.length === 0 && (
        <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl">
          <p className="text-sm text-slate-400">No hay paradas para este día.</p>
          <button
            onClick={onAddStop}
            className="mt-2 text-xs font-semibold text-blue-600 hover:underline"
          >
            Agregar primera parada
          </button>
        </div>
      )}
    </div>
  );
};
