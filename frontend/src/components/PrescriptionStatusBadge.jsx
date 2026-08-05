import React from 'react';
import { Clock, CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';

const STATUS_CONFIG = {
  Active:    { label: 'Active',    cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300', icon: CheckCircle },
  Expired:   { label: 'Expired',   cls: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400', icon: Clock },
  Completed: { label: 'Completed', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300', icon: CheckCircle },
  Cancelled: { label: 'Cancelled', cls: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300', icon: XCircle },
  'Expiring Soon': { label: 'Expiring Soon', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300', icon: AlertTriangle }
};

const PrescriptionStatusBadge = ({ status, expiryDate, size = 'sm' }) => {
  let effectiveStatus = status;

  // Upgrade to "Expiring Soon" if active and within 7 days
  if (status === 'Active' && expiryDate) {
    const daysLeft = Math.ceil((new Date(expiryDate) - new Date()) / 86400000);
    if (daysLeft <= 7 && daysLeft >= 0) effectiveStatus = 'Expiring Soon';
  }

  const cfg  = STATUS_CONFIG[effectiveStatus] || STATUS_CONFIG['Active'];
  const Icon = cfg.icon;
  const sizeCls = size === 'lg' ? 'px-3 py-1.5 text-xs' : 'px-2 py-0.5 text-[10px]';

  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-bold ${sizeCls} ${cfg.cls}`}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
};

export default PrescriptionStatusBadge;
