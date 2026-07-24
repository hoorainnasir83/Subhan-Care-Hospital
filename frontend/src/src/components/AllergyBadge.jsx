import React from 'react';
import { AlertTriangle, ShieldAlert, CheckCircle, Info } from 'lucide-react';

export const ALLERGY_SEVERITY_STYLES = {
  Critical: {
    badgeClass: 'bg-red-500 text-white border-red-600 shadow-sm',
    badgeSubtle: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800',
    dotColor: '#EF4444',
    bgHex: '#EF4444',
    label: 'Critical',
    icon: ShieldAlert
  },
  Moderate: {
    badgeClass: 'bg-amber-400 text-slate-900 border-amber-500 shadow-sm font-bold',
    badgeSubtle: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
    dotColor: '#FBBF24',
    bgHex: '#FBBF24',
    label: 'Moderate',
    icon: AlertTriangle
  },
  Mild: {
    badgeClass: 'bg-emerald-500 text-white border-emerald-600 shadow-sm',
    badgeSubtle: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
    dotColor: '#22C55E',
    bgHex: '#22C55E',
    label: 'Mild',
    icon: CheckCircle
  },
  None: {
    badgeClass: 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
    badgeSubtle: 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
    dotColor: '#94A3B8',
    bgHex: '#94A3B8',
    label: 'No Known Allergies',
    icon: Info
  }
};

const AllergyBadge = ({ allergies, severity = 'None', showDetails = true, subtle = false }) => {
  const conf = ALLERGY_SEVERITY_STYLES[severity] || ALLERGY_SEVERITY_STYLES.None;
  const Icon = conf.icon;
  const allergyText = allergies && allergies.trim() !== '' ? allergies : 'None';

  return (
    <div className="inline-flex items-center gap-1.5">
      <span
        style={{ backgroundColor: subtle ? undefined : conf.bgHex }}
        className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full border transition-all ${
          subtle ? conf.badgeSubtle : 'text-white border-transparent'
        }`}
      >
        <Icon className="h-3 w-3 flex-shrink-0" />
        <span>{conf.label}</span>
      </span>
      {showDetails && allergyText !== 'None' && (
        <span className="text-xs text-slate-600 dark:text-slate-400 font-medium truncate max-w-[150px]" title={allergyText}>
          ({allergyText})
        </span>
      )}
    </div>
  );
};

export default AllergyBadge;
