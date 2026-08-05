import React, { useEffect, useState } from 'react';
import { RefreshCw, AlertCircle, CheckCircle, X } from 'lucide-react';
import prescriptionStore from '../stores/prescriptionStore';

const RefillDialog = ({ prescriptionId, prescriptionLabel, onClose, onSuccess }) => {
  const [eligibility, setEligibility] = useState(null);
  const [loading,    setLoading]     = useState(true);
  const [submitting, setSubmitting]  = useState(false);
  const [error,      setError]       = useState(null);
  const [done,       setDone]        = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await prescriptionStore.checkRefillEligibility(prescriptionId);
        setEligibility(data);
      } catch (err) {
        setError(err.response?.data?.error || err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [prescriptionId]);

  const handleRefill = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await prescriptionStore.refillPrescription(prescriptionId);
      setDone(true);
      setTimeout(() => { onSuccess?.(); onClose?.(); }, 1800);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl max-w-md w-full space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="font-bold font-outfit text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-emerald-600" /> Request Refill
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          Refill for <span className="font-bold text-slate-700 dark:text-slate-200">{prescriptionLabel}</span>
        </p>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin h-8 w-8 rounded-full border-t-2 border-brand-500 border-b-2" />
          </div>
        ) : done ? (
          <div className="text-center py-8 space-y-2">
            <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto" />
            <p className="font-bold text-emerald-700 dark:text-emerald-400">Refill Successful!</p>
            <p className="text-xs text-slate-500">New prescription has been created.</p>
          </div>
        ) : (
          <>
            {eligibility && (
              <div className={`p-4 rounded-xl border text-sm ${eligibility.canRefill ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900' : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900'}`}>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">Eligibility</span>
                    <span className={`font-bold ${eligibility.canRefill ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                      {eligibility.canRefill ? '✓ Eligible' : '✗ Not Eligible'}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">Refills Remaining</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200">{eligibility.refillsRemaining}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">Days Until Expiry</span>
                    <span className={`font-bold ${eligibility.daysUntilExpiry <= 7 ? 'text-amber-600' : 'text-slate-700 dark:text-slate-200'}`}>
                      {eligibility.daysUntilExpiry}
                    </span>
                  </div>
                  {!eligibility.canRefill && (
                    <p className="text-xs text-rose-600 dark:text-rose-400 mt-2">{eligibility.reason}</p>
                  )}
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl text-xs text-rose-600 font-semibold">
                <AlertCircle className="h-4 w-4" /> {error}
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button onClick={onClose}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800">
                Cancel
              </button>
              <button onClick={handleRefill} disabled={!eligibility?.canRefill || submitting}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md disabled:opacity-50 transition-colors">
                <RefreshCw className={`h-3.5 w-3.5 ${submitting ? 'animate-spin' : ''}`} />
                {submitting ? 'Processing…' : 'Confirm Refill'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RefillDialog;
