import React, { useEffect, useState } from 'react';
import { FileText, AlertCircle, Search, Filter } from 'lucide-react';
import prescriptionStore from '../stores/prescriptionStore';
import PrescriptionStatusBadge from './PrescriptionStatusBadge';

const PrescriptionList = ({ patientId, doctorId, onViewDetails, compact = false }) => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [filters, setFilters] = useState({ status: '', search: '' });

  useEffect(() => { fetchData(); }, [patientId, doctorId, filters]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await prescriptionStore.fetchPrescriptions({ patientId, doctorId, ...filters });
      setPrescriptions(result.data || []);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
      ))}
    </div>
  );

  return (
    <div className="space-y-4">
      {!compact && (
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input type="text" value={filters.search}
              onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
              placeholder="Search diagnosis or medication..."
              className="pl-9 pr-3 py-2 text-xs w-full border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
            className="px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none">
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Expired">Expired</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl text-xs text-rose-600 dark:text-rose-400 font-semibold border border-rose-200 dark:border-rose-900">
          <AlertCircle className="h-4 w-4 flex-shrink-0" /> {error}
        </div>
      )}

      {prescriptions.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <FileText className="h-10 w-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm font-semibold">No prescriptions found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50">
                {['RX ID','Patient','Doctor','Issued','Expiry','Meds','Status',''].map(h => (
                  <th key={h} className="px-3 py-2.5 text-left font-bold text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {prescriptions.map(rx => (
                <tr key={rx._id || rx.prescriptionId} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                  <td className="px-3 py-3 font-mono font-bold text-brand-600 dark:text-brand-400">{rx.prescriptionId}</td>
                  <td className="px-3 py-3 font-semibold text-slate-700 dark:text-slate-200">{rx.patientName}</td>
                  <td className="px-3 py-3 text-slate-500 dark:text-slate-400">{rx.doctorName}</td>
                  <td className="px-3 py-3 text-slate-500 dark:text-slate-400">{rx.issuedDate}</td>
                  <td className="px-3 py-3 text-slate-500 dark:text-slate-400">{rx.expiryDate}</td>
                  <td className="px-3 py-3 text-center font-bold text-slate-600 dark:text-slate-300">{rx.medications?.length || 0}</td>
                  <td className="px-3 py-3">
                    <PrescriptionStatusBadge status={rx.status} expiryDate={rx.expiryDate} />
                  </td>
                  <td className="px-3 py-3">
                    <button onClick={() => onViewDetails?.(rx)}
                      className="opacity-0 group-hover:opacity-100 px-2.5 py-1 text-[10px] font-bold border border-brand-200 dark:border-brand-800 text-brand-600 dark:text-brand-400 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-950/40 transition-all">
                      View →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PrescriptionList;
