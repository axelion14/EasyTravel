import React, { useState } from 'react';
import {
  X,
  Cloud,
  RefreshCw,
  LogOut,
  Mail,
  ShieldCheck,
  Smartphone,
  Laptop,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useSyncStore } from '../store/syncStore';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({ isOpen, onClose }) => {
  const {
    user,
    syncStatus,
    lastSyncedAt,
    isCloudConfigured,
    login,
    logout,
    syncWithCloud,
  } = useSyncStore();

  const [emailInput, setEmailInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await login(emailInput.trim());
      if (!res.success) {
        setErrorMessage(res.error || 'No se pudo iniciar sesión.');
      } else {
        setEmailInput('');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualSync = async () => {
    await syncWithCloud();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto">
        {/* Cabecera */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Sincronización en la Nube</h3>
              <p className="text-[11px] text-slate-400">Accede a tus planes desde cualquier dispositivo</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido según estado de autenticación */}
        {!user ? (
          /* Formulario de Login / Registro */
          <div className="pt-4 space-y-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Migración Transparente Local-First</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Tus viajes creados en este dispositivo se subirán y vincularán automáticamente a tu cuenta sin perder ninguna parada ni gasto.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="tu-correo@ejemplo.com"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              {errorMessage && (
                <div className="flex items-center gap-1.5 p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-200 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Cloud className="w-4 h-4" />
                )}
                <span>{isSubmitting ? 'Conectando...' : 'Conectar y Sincronizar'}</span>
              </button>
            </form>

            <div className="flex items-center justify-around text-slate-400 text-[11px] pt-2">
              <div className="flex items-center gap-1">
                <Laptop className="w-3.5 h-3.5" />
                <span>Web PC</span>
              </div>
              <span>⇄</span>
              <div className="flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5" />
                <span>Móvil iOS/Android</span>
              </div>
            </div>
          </div>
        ) : (
          /* Estado de Usuario Conectado */
          <div className="pt-4 space-y-4">
            <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                  {user.email.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-slate-900">{user.email}</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <p className="text-[11px] text-emerald-700 font-medium">Cuenta Activa</p>
                </div>
              </div>

              <button
                type="button"
                onClick={logout}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-white rounded-xl transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            {/* Estado de sincronización */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cloud className={`w-4 h-4 ${syncStatus === 'syncing' ? 'text-amber-500 animate-pulse' : 'text-emerald-600'}`} />
                  <span className="text-xs font-bold text-slate-800">
                    {syncStatus === 'syncing'
                      ? 'Sincronizando con la nube...'
                      : syncStatus === 'error'
                      ? 'Error de sincronización'
                      : 'Datos sincronizados'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleManualSync}
                  disabled={syncStatus === 'syncing'}
                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold disabled:opacity-50"
                  title="Forzar sincronización"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                  <span>Sincronizar</span>
                </button>
              </div>

              <div className="text-[11px] text-slate-500 flex justify-between pt-1 border-t border-slate-200">
                <span>Modo de sincronización:</span>
                <span className="font-semibold text-slate-700">
                  {isCloudConfigured ? 'Supabase Postgres' : 'Nube Reconciliada (LWW)'}
                </span>
              </div>

              {lastSyncedAt && (
                <div className="text-[11px] text-slate-400 flex justify-between">
                  <span>Última vez:</span>
                  <span>{new Date(lastSyncedAt).toLocaleTimeString()}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
