import React, { useEffect, useState } from 'react';
import medicalRecordStore from '../stores/medicalRecordStore';
import { 
  Activity, Calendar, Clock, Filter, AlertCircle, 
  FileText, Shield, UserCheck, AlertTriangle, Plus,
  CheckCircle, Tag
} from 'lucide-react';

const MedicalTimeline = ({ patientId, onRecordClick, onAddNew }) => {
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ recordType: '', status: '' });

  useEffect(() => {
    fetchTimeline();
  }, [patientId, filters]);

  const fetchTimeline = async () => {
    try {
      setLoading(true);
      const records = await medicalRecordStore.fetchPatientMedicalTimeline(patientId);
      let filtered = records || [];

      if (filters.recordType) {
        filtered = filtered.filter(r => r.recordType === filters.recordType);
      }
      if (filters.status) {
        filtered = filtered.filter(r => r.status === filters.status);
      }

      setTimeline(filtered);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load timeline');
    } finally {
      setLoading(false);
    }
  };

  const getRecordBadge = (type) => {
    switch (type) {
      case 'Diagnosis': return 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300';
      case 'Lab Test': return 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300';
      case 'Scan': return 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300';
      case 'Procedure': return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300';
      case 'Allergy': return 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300';
      case 'Medication History': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300';
      case 'Vaccination': return 'bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300';
      case 'Surgery': return 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'Critical': return 'bg-rose-600 text-white font-black';
      case 'High': return 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300';
      case 'Medium': return 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300';
      default: return 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase">Filter Timeline</span>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={filters.recordType}
            onChange={(e) => setFilters({ ...filters, recordType: e.target.value })}
            className="px-3 py-1.5 text-xs font-semibold border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="">All Record Types</option>
            <option value="Diagnosis">Diagnosis</option>
            <option value="Lab Test">Lab Test</option>
            <option value="Scan">Scan</option>
            <option value="Procedure">Procedure</option>
            <option value="Allergy">Allergy</option>
            <option value="Medication History">Medication History</option>
            <option value="Vaccination">Vaccination</option>
            <option value="Surgery">Surgery</option>
          </select>

          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-3 py-1.5 text-xs font-semibold border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Resolved">Resolved</option>
            <option value="Follow-up Needed">Follow-up Needed</option>
          </select>

          {onAddNew && (
            <button
              onClick={onAddNew}
              className="flex items-center gap-1 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold transition-colors ml-auto"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Record</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-700 dark:text-rose-300 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Timeline List */}
      <div className="relative pl-6 border-l-2 border-slate-200 dark:border-slate-700 space-y-6">
        {timeline.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <FileText className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p className="font-semibold text-sm">No medical records found for this patient.</p>
          </div>
        ) : (
          timeline.map((record) => (
            <div key={record._id || record.recordId} className="relative group">
              {/* Point Indicator */}
              <div className="absolute -left-[31px] top-1.5 h-4 w-4 rounded-full border-2 border-white dark:border-slate-900 bg-brand-500 group-hover:scale-125 transition-transform"></div>

              <div 
                onClick={() => onRecordClick?.(record)}
                className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-150 dark:border-slate-800 hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-md transition-all cursor-pointer space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getRecordBadge(record.recordType)}`}>
                      {record.recordType}
                    </span>
                    {record.isConfidential && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-full border border-rose-200/30">
                        <Shield className="h-3 w-3" /> Confidential
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-400 font-mono">{record.recordDate}</span>
                </div>

                <div>
                  <h4 className="font-extrabold font-outfit text-base text-slate-800 dark:text-slate-100">{record.title}</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-2 leading-relaxed">{record.description}</p>
                </div>

                {record.findings && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-xs text-slate-600 dark:text-slate-300">
                    <strong className="text-slate-800 dark:text-slate-100">Findings:</strong> {record.findings}
                  </div>
                )}

                {record.attachments && record.attachments.length > 0 && (
                  <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl border border-blue-100 dark:border-blue-900/30 space-y-1.5">
                    <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1">
                      <FileText className="h-3 w-3" /> Attached Scans / Reports ({record.attachments.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {record.attachments.map((att, idx) => (
                        <a
                          key={idx}
                          href={att.fileData}
                          download={att.fileName}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 rounded-lg text-xs font-semibold text-blue-700 dark:text-blue-300 hover:bg-blue-50 transition-colors shadow-sm"
                        >
                          <FileText className="h-3.5 w-3.5 text-blue-500" />
                          <span className="truncate max-w-[140px]">{att.fileName}</span>
                          <span className="text-[9px] text-slate-400">({(att.fileSize / 1024).toFixed(0)}KB)</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${getSeverityBadge(record.severity)}`}>
                      {record.severity} Severity
                    </span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${record.status === 'Active' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                      {record.status}
                    </span>
                  </div>
                  {record.tags && record.tags.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap">
                      <Tag className="h-3 w-3 text-slate-400" />
                      {record.tags.map((t, idx) => (
                        <span key={idx} className="text-[10px] text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MedicalTimeline;
