import React, { useState } from 'react';
import { X, Plus, DollarSign, Calendar, Tag, FileText, ArrowRightLeft } from 'lucide-react';
import { Expense } from '../domain/budget';
import { SUPPORTED_CURRENCIES, convertMoney } from '../domain/currency';
import { generateUUID, formatCurrency } from '@/shared/lib/utils';

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
  const [selectedCurrency, setSelectedCurrency] = useState(currency);
  const [category, setCategory] = useState<Expense['category']>('food');
  const [date, setDate] = useState(defaultDate);
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const parsedAmount = parseFloat(amountInput);
  const amountCents = !isNaN(parsedAmount) && parsedAmount > 0 ? Math.round(parsedAmount * 100) : 0;

  // Si la moneda es diferente a la del viaje, calcular equivalencia
  const convertedEquiv =
    amountCents > 0 && selectedCurrency !== currency
      ? convertMoney({ amountCents, currency: selectedCurrency }, currency)
      : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || amountCents <= 0) return;

    const newExpense: Expense = {
      id: generateUUID(),
      tripId,
      title: title.trim(),
      amount: {
        amountCents,
        currency: selectedCurrency,
      },
      category,
      date,
      bookingReference: notes.trim() || undefined,
      updatedAt: new Date().toISOString(),
      isDeleted: false,
    };

    onSave(newExpense);
    handleReset();
    onClose();
  };

  const handleReset = () => {
    setTitle('');
    setAmountInput('');
    setSelectedCurrency(currency);
    setNotes('');
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

          {/* Monto y Moneda con Selector */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Monto *
              </label>
              <div className="flex gap-1.5">
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={selectedCurrency}
                  onChange={(e) => setSelectedCurrency(e.target.value)}
                  className="px-2 py-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {SUPPORTED_CURRENCIES.map((curr) => (
                    <option key={curr.code} value={curr.code}>
                      {curr.code}
                    </option>
                  ))}
                </select>
              </div>

              {/* Conversión en tiempo real a la moneda del viaje */}
              {convertedEquiv && (
                <div className="flex items-center gap-1 mt-1.5 text-[11px] text-blue-600 font-semibold">
                  <ArrowRightLeft className="w-3 h-3" />
                  <span>
                    Equivale a ~{formatCurrency(convertedEquiv.amountCents, currency)}
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Fecha
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
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
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Acciones */}
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
              Guardar Gasto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
