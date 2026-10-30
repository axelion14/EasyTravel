import React, { useState } from 'react';
import { X, Plus, DollarSign, Calendar, Tag, FileText } from 'lucide-react';
import { Expense } from '../domain/budget';
import { generateUUID } from '@/shared/lib/utils';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  defaultDate: string;
  currency: string;
  onSave: (expense: Expense) => void;
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  tripId,
  defaultDate,
  currency,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [category, setCategory] = useState<Expense['category']>('food');
  const [date, setDate] = useState(defaultDate);
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amountInput);
    if (!title.trim() || isNaN(parsedAmount) || parsedAmount <= 0) return;

    const newExpense: Expense = {
      id: generateUUID(),
      tripId,
      title: title.trim(),
      amount: {
        amountCents: Math.round(parsedAmount * 100),
        currency,
      },
      category,
      date,
      bookingReference: notes.trim() || undefined,
      updatedAt: new Date().toISOString(),
      isDeleted: false,
    };

    onSave(newExpense);
    setTitle('');
    setAmountInput('');
    setNotes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg">Registrar Gasto</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {/* Concepto */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Concepto / Descripción *
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Cena en Bistro, Metro, Souvenirs..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Monto y Moneda */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Monto *
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-sm">
                  {currency === 'EUR' ? '€' : '$'}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Fecha
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
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
                  { id: 'food', label: 'Comida' },
                  { id: 'activity', label: 'Actividad' },
                  { id: 'transport', label: 'Transporte' },
                  { id: 'lodging', label: 'Hospedaje' },
                  { id: 'flight', label: 'Vuelo' },
                  { id: 'other', label: 'Otro' },
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

          {/* Notas / Ref de reserva */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Referencia / Nota (opcional)
            </label>
            <input
              type="text"
              placeholder="Ej. Pagado con tarjeta Visa, Ref: #12345"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Acciones */}
          <div className="flex items-center gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 shadow-md shadow-blue-200 transition-all flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Guardar Gasto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
