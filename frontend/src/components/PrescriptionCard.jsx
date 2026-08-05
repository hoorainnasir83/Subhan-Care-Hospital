import React from 'react';
import { User, Stethoscope, Calendar, FileText, RefreshCw, Pill } from 'lucide-react';
import PrescriptionStatusBadge from './PrescriptionStatusBadge';
import MedicationItem from './MedicationItem';

const PrescriptionCard = ({ prescription: rx, onEdit, onDelete, onRefill, onPrint, compact = false }) => {
  if (!rx) return null;

  const refillsLeft = (rx.refillsAllowed || 0) - (rx.refillsUsed || 0);
  const canRefill   = rx.status === 'Active' && refillsLeft > 0;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 bg-gradient-to-r from-brand-600 to-indigo-600 text-white flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold opacity-70 uppercase tracking-wider">Prescription</p>
          <p className="font-black font-outfit text-lg">{rx.prescriptionId}</p>
        </div>
        <PrescriptionStatusBadge status={rx.status} expiryDate={rx.expiryDate} size="lg" />
      </div>

      <div className="p-5 space-y-4">
        {/* Patient & Doctor */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-slate-400 flex-shrink-0" />
            <div>
              <p className="text-[10px] text-slate-400 font-semibold uppercase">Patient</p>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{rx.patientName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Stethoscope className="h-4 w-4 text-slate-400 flex-shrink-0" />
            <div>
              <p className="text-[10px] text-slate-400 font-semibold uppercase">Doctor</p>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{rx.doctorName}</p>
            </div>
          </div>
        </div>

        {/* Dates */}
        <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
          <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Issued: <strong>{rx.issuedDate}</strong></span>
          <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Expires: <strong>{rx.expiryDate}</strong></span>
          {refillsLeft > 0 && (
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <RefreshCw className="h-3.5 w-3.5" /> {refillsLeft} refill{refillsLeft !== 1 ? 's' : ''} remaining
            </span>
          )}
        </div>

        {/* Diagnosis */}
        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-100 dark:border-blue-900/30">
          <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase mb-1 flex items-center gap-1">
            <FileText className="h-3 w-3" /> Diagnosis
          </p>
          <p className="text-xs text-slate-700 dark:text-slate-200 font-medium">{rx.diagnosis}</p>
        </div>

        {/* Medications */}
        {!compact && (
          <div>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 flex items-center gap-1">
              <Pill className="h-3 w-3" /> Medications ({rx.medications?.length || 0})
            </p>
            <div className="space-y-2">
              {rx.medications?.map((med, idx) => (
                <MedicationItem key={idx} med={med} index={idx} />
              ))}
            </div>
          </div>
        )}

        {rx.notes && (
          <p className="text-[10px] italic text-slate-400 dark:text-slate-500 border-l-2 border-slate-200 dark:border-slate-700 pl-3">
            {rx.notes}
          </p>
        )}

        {/* Action Buttons */}
        {(onEdit || onDelete || onRefill || onPrint) && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            {onPrint && (
              <button onClick={() => onPrint(rx)}
                className="px-3 py-1.5 text-[10px] font-bold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                🖨 Print
              </button>
            )}
            {onEdit && rx.status === 'Active' && (
              <button onClick={() => onEdit(rx)}
                className="px-3 py-1.5 text-[10px] font-bold border border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-950/40 transition-colors">
                ✏️ Edit
              </button>
            )}
            {onRefill && canRefill && (
              <button onClick={() => onRefill(rx)}
                className="px-3 py-1.5 text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition-colors">
                ♻️ Refill
              </button>
            )}
            {onDelete && rx.status !== 'Cancelled' && (
              <button onClick={() => onDelete(rx)}
                className="px-3 py-1.5 text-[10px] font-bold border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors ml-auto">
                ✕ Cancel
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PrescriptionCard;
