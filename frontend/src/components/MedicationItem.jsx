import React from 'react';
import { Pill, Clock, Calendar, Info } from 'lucide-react';

const MedicationItem = ({ med, index }) => (
  <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
    <div className="h-8 w-8 rounded-lg bg-brand-100 dark:bg-brand-950/40 flex items-center justify-center flex-shrink-0 text-brand-600 dark:text-brand-400">
      <Pill className="h-4 w-4" />
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-bold text-sm text-slate-800 dark:text-slate-100">{med.name}</span>
        <span className="px-2 py-0.5 bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 text-[10px] font-bold rounded-full">
          {med.dosage}
        </span>
      </div>
      <div className="flex items-center gap-3 mt-1 flex-wrap">
        <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
          <Clock className="h-3 w-3" /> {med.frequency}
        </span>
        <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
          <Calendar className="h-3 w-3" /> {med.duration} day{med.duration !== 1 ? 's' : ''}
        </span>
      </div>
      {med.instructions && (
        <p className="flex items-start gap-1 text-[10px] text-slate-400 dark:text-slate-500 mt-1 italic">
          <Info className="h-3 w-3 mt-0.5 flex-shrink-0" /> {med.instructions}
        </p>
      )}
    </div>
    <span className="text-[10px] font-bold text-slate-300 dark:text-slate-600 flex-shrink-0">#{index + 1}</span>
  </div>
);

export default MedicationItem;
