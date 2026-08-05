import React, { useEffect, useState } from 'react';
import medicalRecordStore from '../stores/medicalRecordStore';
import { Activity, FileText, AlertTriangle, Clock, CheckCircle } from 'lucide-react';

const MedicalSummaryCard = ({ patientId }) => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (patientId) fetchSummary();
  }, [patientId]);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const data = await medicalRecordStore.fetchMedicalSummary(patientId);
      setSummary(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-slate-100 dark:bg-slate-800 rounded-xl h-24 animate-pulse"></div>
        ))}
      </div>
    );
  }

  if (error || !summary) return null;

  const stats = [
    { label: 'Total Records', value: summary.totalRecords || 0, color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40' },
    { label: 'Active Conditions', value: summary.activeConditions || 0, color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40' },
    { label: 'Surgeries', value: summary.surgeries || 0, color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40' },
    { label: 'Follow-ups Needed', value: summary.followUpsNeeded || 0, color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40' }
  ];

  return (
    <div className="space-y-4 mb-6">
      <h3 className="text-base font-bold font-outfit text-slate-800 dark:text-slate-200 flex items-center gap-2">
        <Activity className="h-5 w-5 text-brand-600" /> Medical Record Summary
      </h3>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase">{stat.label}</p>
              <p className="text-2xl font-black font-outfit text-slate-800 dark:text-slate-100 mt-1">{stat.value}</p>
            </div>
            <div className={`p-3 rounded-xl ${stat.color}`}>
              <FileText className="h-5 w-5" />
            </div>
          </div>
        ))}
      </div>

      {/* Severity Breakdown */}
      {summary.severityBreakdown && (
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl p-4 flex items-center justify-between gap-4">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Severity Matrix</span>
          <div className="flex gap-4">
            <div className="text-center">
              <span className="text-xs font-bold text-blue-500 block">{summary.severityBreakdown.low || 0}</span>
              <span className="text-[10px] text-slate-400">Low</span>
            </div>
            <div className="text-center">
              <span className="text-xs font-bold text-amber-500 block">{summary.severityBreakdown.medium || 0}</span>
              <span className="text-[10px] text-slate-400">Medium</span>
            </div>
            <div className="text-center">
              <span className="text-xs font-bold text-rose-500 block">{summary.severityBreakdown.high || 0}</span>
              <span className="text-[10px] text-slate-400">High</span>
            </div>
            <div className="text-center">
              <span className="text-xs font-bold text-rose-700 block">{summary.severityBreakdown.critical || 0}</span>
              <span className="text-[10px] text-slate-400">Critical</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicalSummaryCard;
