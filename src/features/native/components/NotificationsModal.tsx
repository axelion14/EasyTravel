import React, { useState, useEffect } from 'react';
import {
  X,
  Bell,
  BellOff,
  CheckCircle2,
  AlertCircle,
  Clock,
  Zap,
} from 'lucide-react';
import { Stop } from '@/features/itinerary/domain/stop';
import {
  buildAllStopNotifications,
  buildStopNotification,
} from '@/features/native/domain/stop-notifications';
import { nativeService } from '@/features/native/infrastructure/capacitor-native.adapter';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stops: Stop[];
  tripTitle: string;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  stops,
  tripTitle,
}) => {
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [reminderMinutes, setReminderMinutes] = useState(30);
  const [status, setStatus] = useState<'idle' | 'scheduling' | 'done' | 'cancelled' | 'error'>('idle');

  // Paradas con hora asignada (candidatas a notificación)
  const schedulableStops = stops.filter((s) => !s.isDeleted && s.time);
  const notifications = buildAllStopNotifications(schedulableStops, reminderMinutes);

  useEffect(() => {
    if (!isOpen) {
      setStatus('idle');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    const granted = await nativeService.requestNotificationPermission();
    setPermissionGranted(granted);
    if (!granted) {
      nativeService.haptic('warning');
    }
  };

  const handleScheduleAll = async () => {
    setStatus('scheduling');
    try {
      for (const notif of notifications) {
        await nativeService.scheduleNotification(notif);
      }
      setStatus('done');
      nativeService.haptic('success');
    } catch {
      setStatus('error');
      nativeService.haptic('error');
    }
  };

  const handleCancelAll = async () => {
    await nativeService.cancelAllNotifications();
    setStatus('cancelled');
    nativeService.haptic('medium');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-5">
        {/* Cabecera */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Recordatorios de Paradas</h3>
              <p className="text-[11px] text-slate-400 truncate max-w-[220px]">{tripTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Resumen de paradas con hora */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
          <p className="text-xs text-slate-600">
            <span className="font-bold text-slate-800">{schedulableStops.length}</span> paradas con hora asignada ·{' '}
            <span className="font-bold text-purple-700">{notifications.length}</span> recordatorios posibles{' '}
            <span className="text-slate-400">(excluyendo las que ya pasaron)</span>
          </p>
        </div>

        {/* Selector de anticipación */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700">
            Avisar con cuánta antelación
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[15, 30, 60, 120].map((min) => (
              <button
                key={min}
                type="button"
                onClick={() => setReminderMinutes(min)}
                className={`py-2 rounded-xl text-xs font-bold transition-all ${
                  reminderMinutes === min
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-200'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {min < 60 ? `${min} min` : `${min / 60} h`}
              </button>
            ))}
          </div>
        </div>

        {/* Lista de paradas con hora */}
        {schedulableStops.length > 0 && (
          <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
            {schedulableStops.map((stop) => {
              const notif = buildStopNotification(stop, reminderMinutes);
              const isPast = notif === null;
              return (
                <div
                  key={stop.id}
                  className={`flex items-center gap-2.5 p-2 rounded-xl text-xs border ${
                    isPast
                      ? 'bg-slate-50 border-slate-100 opacity-50'
                      : 'bg-purple-50/50 border-purple-100'
                  }`}
                >
                  <Clock className={`w-3.5 h-3.5 shrink-0 ${isPast ? 'text-slate-400' : 'text-purple-500'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 truncate">{stop.title}</p>
                    <p className="text-slate-500 text-[10px]">
                      {stop.dayDate} · {stop.time}
                      {isPast ? ' · Ya pasó' : notif ? ` · Aviso a las ${new Date(notif.scheduleAt).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}` : ''}
                    </p>
                  </div>
                  {!isPast && (
                    <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded-lg shrink-0">
                      -{reminderMinutes}m
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Estado de resultado */}
        {status === 'done' && (
          <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>¡{notifications.length} recordatorio{notifications.length !== 1 ? 's' : ''} programado{notifications.length !== 1 ? 's' : ''}!</span>
          </div>
        )}
        {status === 'cancelled' && (
          <div className="flex items-center gap-2 p-3 bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold">
            <BellOff className="w-4 h-4 shrink-0" />
            <span>Todos los recordatorios cancelados.</span>
          </div>
        )}
        {status === 'error' && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Error al programar notificaciones. Verifica los permisos de la app.</span>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex flex-col gap-2.5 pt-1">
          {permissionGranted === null && (
            <button
              type="button"
              onClick={handleRequestPermission}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs shadow-md shadow-purple-200 transition-all flex items-center justify-center gap-2"
            >
              <Bell className="w-4 h-4" />
              <span>Permitir Notificaciones</span>
            </button>
          )}

          {permissionGranted === false && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Permiso denegado. Actívalo en Configuración › Notificaciones de la app.</span>
            </div>
          )}

          {(permissionGranted === true || permissionGranted === null) && notifications.length > 0 && (
            <button
              type="button"
              onClick={handleScheduleAll}
              disabled={status === 'scheduling'}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white font-bold rounded-xl text-xs shadow-md shadow-purple-200 transition-all flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4" />
              <span>
                {status === 'scheduling'
                  ? 'Programando…'
                  : `Programar ${notifications.length} recordatorio${notifications.length !== 1 ? 's' : ''}`}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCancelAll}
            className="w-full py-2 text-slate-500 hover:text-red-500 bg-slate-100 hover:bg-red-50 font-semibold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5"
          >
            <BellOff className="w-3.5 h-3.5" />
            <span>Cancelar Todos los Recordatorios</span>
          </button>
        </div>
      </div>
    </div>
  );
};
