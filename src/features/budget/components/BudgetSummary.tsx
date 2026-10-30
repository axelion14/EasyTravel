import React from 'react';
import { Plane, Hotel, Wallet, ExternalLink } from 'lucide-react';
import { BudgetSummaryData, buildDeepLink } from '../domain/budget';
import { formatCurrency } from '@/shared/lib/utils';

interface BudgetSummaryProps {
  summary: BudgetSummaryData;
  destination: string;
  startDate: string;
  endDate: string;
}

export const BudgetSummary: React.FC<BudgetSummaryProps> = ({
  summary,
  destination,
  startDate,
  endDate,
}) => {
  const flightLink = buildDeepLink('flights', {
    destination,
    startDate,
  });

  const hotelLink = buildDeepLink('hotels', {
    destination,
    startDate,
    endDate,
  });

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Presupuesto Estimado</span>
            <h4 className="text-lg font-bold text-slate-900">
              {formatCurrency(summary.totalEstimatedCents, summary.currency)}
            </h4>
          </div>
        </div>

        {/* Deep links rápidos sin costo de API */}
        <div className="flex gap-2">
          <a
            href={flightLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 text-sky-700 hover:bg-sky-100 rounded-xl text-xs font-semibold transition-colors"
          >
            <Plane className="w-3.5 h-3.5" />
            Vuelos
            <ExternalLink className="w-3 h-3 opacity-60" />
          </a>
          <a
            href={hotelLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-xs font-semibold transition-colors"
          >
            <Hotel className="w-3.5 h-3.5" />
            Hoteles
            <ExternalLink className="w-3 h-3 opacity-60" />
          </a>
        </div>
      </div>

      {/* Desglose por categoría */}
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
        <div className="p-2 bg-slate-50 rounded-lg">
          <p className="text-[10px] text-slate-400 font-semibold uppercase">Actividades</p>
          <p className="text-xs font-bold text-slate-800">
            {formatCurrency(summary.byCategory['activity'] || 0, summary.currency)}
          </p>
        </div>
        <div className="p-2 bg-slate-50 rounded-lg">
          <p className="text-[10px] text-slate-400 font-semibold uppercase">Comida</p>
          <p className="text-xs font-bold text-slate-800">
            {formatCurrency(summary.byCategory['food'] || 0, summary.currency)}
          </p>
        </div>
        <div className="p-2 bg-slate-50 rounded-lg">
          <p className="text-[10px] text-slate-400 font-semibold uppercase">Transporte</p>
          <p className="text-xs font-bold text-slate-800">
            {formatCurrency(summary.byCategory['transport'] || 0, summary.currency)}
          </p>
        </div>
      </div>
    </div>
  );
};
