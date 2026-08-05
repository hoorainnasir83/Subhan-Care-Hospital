import React, { useState } from 'react';
import { Trash2, Plus } from 'lucide-react';

const FREQUENCIES = ['Once daily','Twice daily','Thrice daily','As needed','Every 4 hours','Every 6 hours','Every 8 hours','Every 12 hours'];

const inputCls = 'px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 w-full';

const MedicationRow = ({ med, index, onChange, onRemove, canRemove }) => (
  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-3">
    <div className="flex items-center justify-between">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Medication #{index + 1}</span>
      {canRemove && (
        <button type="button" onClick={onRemove}
          className="p-1 rounded-lg text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 transition-colors">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1 block">Medicine Name *</label>
        <input type="text" value={med.name || ''} onChange={e => onChange(index, 'name', e.target.value)}
          placeholder="e.g. Paracetamol" maxLength={100} required className={inputCls} />
      </div>
      <div>
        <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1 block">Dosage *</label>
        <input type="text" value={med.dosage || ''} onChange={e => onChange(index, 'dosage', e.target.value)}
          placeholder="e.g. 500mg" maxLength={50} required className={inputCls} />
      </div>
    </div>
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1 block">Frequency *</label>
        <select value={med.frequency || ''} onChange={e => onChange(index, 'frequency', e.target.value)} required className={inputCls}>
          <option value="">Select frequency...</option>
          {FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
      </div>
      <div>
        <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1 block">Duration (days) *</label>
        <input type="number" value={med.duration || ''} onChange={e => onChange(index, 'duration', parseInt(e.target.value))}
          placeholder="7" min={1} max={365} required className={inputCls} />
      </div>
    </div>
    <div>
      <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1 block">Instructions</label>
      <input type="text" value={med.instructions || ''} onChange={e => onChange(index, 'instructions', e.target.value)}
        placeholder="e.g. Take with food" maxLength={500} className={inputCls} />
    </div>
  </div>
);

export default MedicationRow;
