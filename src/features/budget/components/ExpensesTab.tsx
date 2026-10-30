import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Coffee, Landmark, Hotel, Navigation, Plane, Tag, Filter } from 'lucide-react';
import { Expense, BudgetSummaryData } from '../domain/budget';
import { formatCurrency } from '@/shared/lib/utils';
import { ExpenseModal } from './ExpenseModal';

interface ExpensesTabProps {
  expenses: Expense[];
  summary: BudgetSummaryData;
  tripId: string;
  defaultDate: string;
  currency: string;
  onAddExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
}

const CategoryBadgeIcon: React.FC<{ category: Expense['category'] }> = ({ category }) => {
  switch (category) {
    case 'food':
      return <Coffee className="w-4 h-4 text-amber-500" />;
    case 'activity':
      return <Landmark className="w-4 h-4 text-indigo-500" />;
    case 'lodging':
      return <Hotel className="w-4 h-4 text-emerald-500" />;
    case 'flight':
      return <Plane className="w-4 h-4 text-sky-500" />;
    case 'transport':
      return <Navigation className="w-4 h-4 text-blue-500" />;
    default:
      return <Tag className="w-4 h-4 text-slate-500" />;
  }
};

export const ExpensesTab: React.FC<ExpensesTabProps> = ({
  expenses,
  summary,
  tripId,
  defaultDate,
  currency,
  onAddExpense,
  onDeleteExpense,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const activeExpenses = useMemo(() => {
    return expenses
      .filter((e) => !e.isDeleted)
      .filter((e) => (filterCategory === 'all' ? true : e.category === filterCategory))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [expenses, filterCategory]);

  return (
    <div className="space-y-4 pb-20">
      {/* Resumen Superior */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-5 shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-bold">
              Total Acumulado
            </span>
            <span className="text-xs font-semibold px-2.5 py-1 bg-white/10 rounded-full text-slate-300">
              {activeExpenses.length} gastos
            </span>
          </div>

          <div className="text-3xl font-extrabold tracking-tight">
            {formatCurrency(summary.totalActualCents, currency)}
          </div>

          {/* Mini desglose horizontal */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10 text-xs">
            <div>
              <span className="text-slate-400 text-[10px] block">Comida</span>
              <span className="font-bold">
                {formatCurrency(summary.byCategory['food'] || 0, currency)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">Actividades</span>
              <span className="font-bold">
                {formatCurrency(summary.byCategory['activity'] || 0, currency)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">Transporte</span>
              <span className="font-bold">
                {formatCurrency(summary.byCategory['transport'] || 0, currency)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Botón de acción principal */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'food', label: 'Comida' },
            { id: 'activity', label: 'Actividad' },
            { id: 'transport', label: 'Transporte' },
            { id: 'lodging', label: 'Hospedaje' },
            { id: 'flight', label: 'Vuelo' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterCategory(tab.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                filterCategory === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-200 hover:bg-blue-700 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Gasto</span>
        </button>
      </div>

      {/* Lista de Gastos Desglosados */}
      <div className="space-y-2.5">
        {activeExpenses.map((expense) => (
          <div
            key={expense.id}
            className="flex items-center justify-between p-3.5 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-slate-300 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <CategoryBadgeIcon category={expense.category} />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900">{expense.title}</h4>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                  <span>{expense.date}</span>
                  {expense.bookingReference && (
                    <>
                      <span>•</span>
                      <span className="text-slate-500 line-clamp-1">
                        {expense.bookingReference}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="font-extrabold text-sm text-slate-900">
                {formatCurrency(expense.amount.amountCents, expense.amount.currency)}
              </span>
              <button
                onClick={() => onDeleteExpense(expense.id)}
                className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Eliminar gasto"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {activeExpenses.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-3xl bg-white/50">
            <p className="text-sm font-medium text-slate-400">No hay gastos registrados en esta categoría.</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-3 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold hover:bg-blue-100 transition-colors"
            >
              + Agregar primer gasto
            </button>
          </div>
        )}
      </div>

      {/* Modal para nuevo gasto */}
      <ExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        tripId={tripId}
        defaultDate={defaultDate}
        currency={currency}
        onSave={onAddExpense}
      />
    </div>
  );
};
