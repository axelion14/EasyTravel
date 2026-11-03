import React, { useState, useId } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  Users,
  UserPlus,
  Eye,
  Edit3,
  Trash2,
  Download,
  Upload,
  FileJson,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Trip } from '../domain/trip';
import { Stop } from '@/features/itinerary/domain/stop';
import { Expense } from '@/features/budget/domain/budget';
import {
  generateShareLink,
  addCollaborator,
  removeCollaborator,
  exportTripBundle,
  importTripBundle,
} from '../domain/sharing';

interface ShareTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: Trip;
  stops: Stop[];
  expenses: Expense[];
  onUpdateTrip: (tripId: string, updates: Partial<Trip>) => void;
  onImportBundle: (bundle: { trip: Trip; stops: Stop[]; expenses: Expense[] }) => void;
}

export const ShareTripModal: React.FC<ShareTripModalProps> = ({
  isOpen,
  onClose,
  trip,
  stops,
  expenses,
  onUpdateTrip,
  onImportBundle,
}) => {
  const fileInputId = useId();
  const [selectedRole, setSelectedRole] = useState<'editor' | 'viewer'>('editor');
  const [copied, setCopied] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newCollabRole, setNewCollabRole] = useState<'editor' | 'viewer'>('editor');
  const [importStatus, setImportStatus] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const shareLinkResult = generateShareLink(trip, selectedRole);

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareLinkResult.url);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = shareLinkResult.url;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Silenciar error en caso de restricciones de iframe
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Itinerario de viaje: ${trip.title}`,
          text: `¡Únete a planificar nuestro viaje a ${trip.destination}!`,
          url: shareLinkResult.url,
        });
      } catch {
        // Ignorar si el usuario cancela el diálogo nativo
      }
    } else {
      handleCopyLink();
    }
  };

  const handleAddCollaborator = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    const updated = addCollaborator(trip, newEmail.trim(), newCollabRole);
    onUpdateTrip(trip.id, { collaborators: updated.collaborators });
    setNewEmail('');
  };

  const handleRemoveCollaborator = (collabId: string) => {
    const updated = removeCollaborator(trip, collabId);
    onUpdateTrip(trip.id, { collaborators: updated.collaborators });
  };

  const handleExportJson = () => {
    const jsonString = exportTripBundle(trip, stops, expenses);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const cleanDestination = trip.destination.toLowerCase().replace(/[^a-z0-9]/g, '-');
    link.download = `viaje-${cleanDestination}-${trip.startDate}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const bundle = importTripBundle(text, true); // Importar como nueva copia
        onImportBundle(bundle);
        setImportStatus({
          success: true,
          message: `¡Viaje "${bundle.trip.title}" importado con éxito (${bundle.stops.length} paradas)!`,
        });
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Error al procesar el archivo.';
        setImportStatus({
          success: false,
          message: errorMsg,
        });
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  const collaborators = trip.collaborators || [];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto space-y-5">
        {/* Cabecera */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Compartir y Colaborar</h3>
              <p className="text-[11px] text-slate-400 truncate max-w-[220px]">
                {trip.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SECCIÓN 1: Enlace de Invitación */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-slate-700">
            Enlace para invitar amigos o pareja
          </label>

          {/* Selector de rol del enlace */}
          <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setSelectedRole('editor')}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-all ${
                selectedRole === 'editor'
                  ? 'bg-white text-blue-600 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Editor</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedRole('viewer')}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-all ${
                selectedRole === 'viewer'
                  ? 'bg-white text-blue-600 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Solo Lectura</span>
            </button>
          </div>

          {/* Input con URL y botones de acción */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={shareLinkResult.url}
              className="flex-1 bg-slate-50 border border-slate-200 text-slate-700 text-xs px-3 py-2.5 rounded-xl font-mono truncate select-all focus:outline-none"
            />
            <button
              type="button"
              onClick={handleCopyLink}
              className={`px-3 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200'
              }`}
              title="Copiar al portapapeles"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? '¡Copiado!' : 'Copiar'}</span>
            </button>
          </div>

          {'share' in navigator && (
            <button
              type="button"
              onClick={handleNativeShare}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Enviar por WhatsApp / Mensajes</span>
            </button>
          )}
        </div>

        {/* SECCIÓN 2: Lista de Acompañantes */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              Acompañantes asignados ({collaborators.length})
            </span>
          </div>

          {/* Formulario para invitar colaborador */}
          <form onSubmit={handleAddCollaborator} className="flex gap-2">
            <input
              type="email"
              placeholder="correo@amigo.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="flex-1 border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <select
              value={newCollabRole}
              onChange={(e) => setNewCollabRole(e.target.value as 'editor' | 'viewer')}
              aria-label="Rol del colaborador"
              className="bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-xs text-slate-700 font-medium focus:outline-none"
            >
              <option value="editor">Editor</option>
              <option value="viewer">Lector</option>
            </select>
            <button
              type="submit"
              disabled={!newEmail.trim()}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Añadir</span>
            </button>
          </form>

          {/* Lista de colaboradores */}
          {collaborators.length > 0 && (
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {collaborators.map((collab) => (
                <div
                  key={collab.id}
                  className="flex items-center justify-between p-2 bg-slate-50 border border-slate-100 rounded-xl text-xs"
                >
                  <div className="truncate mr-2">
                    <p className="font-semibold text-slate-800 truncate">{collab.email}</p>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                      {collab.role === 'editor' ? '✏️ Editor' : '👁️ Solo Lectura'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveCollaborator(collab.id)}
                    className="p-1 text-slate-400 hover:text-red-500 rounded-lg hover:bg-white transition-colors"
                    title="Eliminar colaborador"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECCIÓN 3: Compartición Offline (JSON / AirDrop / WhatsApp) */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <span className="block text-xs font-bold text-slate-700">
            Respaldo y Compartición Offline
          </span>
          <p className="text-[11px] text-slate-400">
            Comparte el viaje sin conexión enviando un archivo portable .json directamente.
          </p>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={handleExportJson}
              className="p-2.5 border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold text-slate-700 transition-colors"
            >
              <Download className="w-4 h-4 text-blue-600" />
              <span>Descargar .json</span>
            </button>

            <label
              htmlFor={fileInputId}
              className="cursor-pointer p-2.5 border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold text-slate-700 transition-colors"
            >
              <Upload className="w-4 h-4 text-emerald-600" />
              <span>Importar .json</span>
              <input
                id={fileInputId}
                type="file"
                accept=".json,application/json"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>

          {importStatus && (
            <div
              className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                importStatus.success
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}
            >
              {importStatus.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span className="flex-1">{importStatus.message}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
