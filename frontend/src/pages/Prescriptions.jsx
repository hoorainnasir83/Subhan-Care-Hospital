import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import prescriptionStore from '../stores/prescriptionStore';
import PrescriptionCard from '../components/PrescriptionCard';
import PrescriptionForm from '../components/PrescriptionForm';
import RefillDialog from '../components/RefillDialog';
import PrescriptionStatusBadge from '../components/PrescriptionStatusBadge';
import { Plus, ArrowLeft, Printer, AlertCircle, RefreshCw, FileText, Search, Share2, MessageSquare, Download } from 'lucide-react';

const Prescriptions = () => {
  const { user, settings, patients } = useContext(AppContext);
  const role = user?.role || 'Staff';

  const [view, setView] = useState('list'); // 'list' | 'detail' | 'create' | 'edit'
  const [selected, setSelected] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ status: '', search: '' });
  const [refillTarget, setRefillTarget] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => { if (view === 'list') fetchData(); }, [view, filters]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await prescriptionStore.fetchPrescriptions(filters);
      setPrescriptions(result.data || []);
      setTotalCount(result.total || 0);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (rx) => { setSelected(rx); setView('detail'); };
  const handleEdit = (rx) => { setSelected(rx); setView('edit'); };
  const handleDelete = async (rx) => {
    try {
      await prescriptionStore.deletePrescription(rx._id || rx.prescriptionId);
      setDeleteConfirm(null);
      setView('list');
    } catch (err) { setError(err.response?.data?.error || err.message); }
  };

  // 🖨️ Official Letterhead Print Template
  const handlePrint = (rx) => {
    const hospitalName = settings?.hospitalName || 'Subhan Care Hospital';
    const hospitalAddr = settings?.hospitalAddress || '123 Medical Avenue, Healthcare City';
    const hospitalPhone = settings?.hospitalPhone || '+92 300 1234567';

    const w = window.open('', '_blank');
    w.document.write(`<!DOCTYPE html>
    <html>
    <head>
      <title>Prescription — ${rx.prescriptionId}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; max-width: 800px; margin: auto; line-height: 1.5; }
        .header { display: flex; justify-content: space-between; align-items: center; border-b: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 24px; }
        .logo-box { background: #2563eb; color: white; width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 24px; }
        .h-title { font-size: 24px; font-weight: 800; color: #0f172a; margin: 0; }
        .h-sub { font-size: 11px; color: #64748b; margin-top: 4px; }
        .rx-badge { background: #eff6ff; color: #2563eb; padding: 6px 14px; border-radius: 8px; font-weight: 700; font-size: 14px; border: 1px solid #bfdbfe; }
        .meta-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; background: #f8fafc; padding: 16px; border-radius: 12px; margin-bottom: 24px; border: 1px solid #e2e8f0; font-size: 13px; }
        .meta-item label { font-size: 10px; text-transform: uppercase; font-weight: 700; color: #64748b; display: block; margin-bottom: 2px; }
        .meta-item span { font-weight: 700; color: #0f172a; }
        .section-title { font-size: 12px; text-transform: uppercase; font-weight: 800; color: #2563eb; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 12px; letter-spacing: 0.5px; }
        .diag-box { background: #f0fdf4; border-left: 4px solid #16a34a; padding: 12px 16px; border-radius: 0 8px 8px 0; margin-bottom: 24px; font-size: 14px; font-weight: 600; color: #14532d; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 12px; }
        th { background: #f1f5f9; text-align: left; padding: 10px 12px; font-weight: 700; color: #475569; border-bottom: 2px solid #cbd5e1; text-transform: uppercase; font-size: 10px; }
        td { padding: 12px; border-bottom: 1px solid #e2e8f0; font-weight: 500; }
        .sig-section { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 60px; pt: 20px; }
        .sig-box { text-align: center; border-t: 2px solid #0f172a; width: 200px; padding-top: 8px; font-size: 12px; font-weight: 700; }
        .footer { text-align: center; margin-top: 40px; font-size: 10px; color: #94a3b8; border-t: 1px dashed #cbd5e1; padding-top: 16px; }
        @media print { body { padding: 0; } }
      </style>
    </head>
    <body>
      <div class="header">
        <div style="display:flex; align-items:center; gap:16px;">
          <div class="logo-box">S</div>
          <div>
            <h1 class="h-title">${hospitalName}</h1>
            <div class="h-sub">${hospitalAddr} | Tel: ${hospitalPhone}</div>
          </div>
        </div>
        <div class="rx-badge">Rx #${rx.prescriptionId}</div>
      </div>

      <div class="meta-grid">
        <div class="meta-item"><label>Patient Name</label><span>${rx.patientName}</span></div>
        <div class="meta-item"><label>Attending Doctor</label><span>${rx.doctorName}</span></div>
        <div class="meta-item"><label>Issued Date</label><span>${rx.issuedDate}</span></div>
        <div class="meta-item"><label>Expiry Date</label><span>${rx.expiryDate}</span></div>
      </div>

      <div class="section-title">Clinical Diagnosis</div>
      <div class="diag-box">${rx.diagnosis}</div>

      <div class="section-title">Prescribed Medications</div>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Medication Name</th>
            <th>Dosage</th>
            <th>Frequency</th>
            <th>Duration</th>
            <th>Special Instructions</th>
          </tr>
        </thead>
        <tbody>
          ${rx.medications?.map((m, i) => `
            <tr>
              <td><b>${i + 1}</b></td>
              <td style="font-weight:700; color:#2563eb;">${m.name}</td>
              <td><span style="background:#f1f5f9; padding:3px 8px; border-radius:4px; font-weight:700;">${m.dosage}</span></td>
              <td>${m.frequency}</td>
              <td>${m.duration} Days</td>
              <td style="color:#64748b;">${m.instructions || 'Take as directed'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      ${rx.notes ? `
        <div class="section-title">Doctor's Advice / Notes</div>
        <p style="font-size:12px; color:#475569; background:#fffbeb; padding:12px; border-radius:8px; border:1px solid #fef3c7;">${rx.notes}</p>
      ` : ''}

      <div class="sig-section">
        <div style="font-size:10px; color:#94a3b8;">
          Refills Allowed: <b>${rx.refillsAllowed}</b> | Refills Remaining: <b>${Math.max(0, rx.refillsAllowed - rx.refillsUsed)}</b>
        </div>
        <div class="sig-box">
          <p style="margin:0; font-size:13px; color:#0f172a;">${rx.doctorName}</p>
          <span style="font-size:10px; font-weight:400; color:#64748b;">Authorized Medical Signature</span>
        </div>
      </div>

      <div class="footer">
        This is an official computer-generated medical prescription issued by ${hospitalName}. Generated on ${new Date().toLocaleString()}.
      </div>

      <script>
        window.onload = function() { window.print(); }
      </script>
    </body>
    </html>`);
    w.document.close();
  };

  // 📱 WhatsApp Direct Share
  const handleWhatsAppShare = (rx) => {
    const patientObj = patients?.find(p => p.id === rx.patientId || p._id === rx.patientId);
    const phone = patientObj?.phone ? patientObj.phone.replace(/\D/g, '') : '';

    const medsList = rx.medications?.map((m, i) => `${i + 1}. *${m.name}* (${m.dosage}) - ${m.frequency} for ${m.duration} days`).join('%0A');
    
    const message = `🏥 *Subhan Care Hospital - Prescription Summary*%0A%0A` +
      `📋 *Rx ID:* ${rx.prescriptionId}%0A` +
      `👤 *Patient:* ${rx.patientName}%0A` +
      `👨‍⚕️ *Doctor:* ${rx.doctorName}%0A` +
      `📅 *Date:* ${rx.issuedDate}%0A%0A` +
      `🩺 *Diagnosis:* ${rx.diagnosis}%0A%0A` +
      `💊 *Medications:*%0A${medsList}%0A%0A` +
      `📝 *Notes:* ${rx.notes || 'None'}%0A%0A` +
      `Thank you for choosing Subhan Care Hospital!`;

    const url = phone ? `https://wa.me/${phone}?text=${message}` : `https://wa.me/?text=${message}`;
    window.open(url, '_blank');
  };

  // ─── List View ───────────────────────────────────────────────────────────────
  if (view === 'list') return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black font-outfit text-slate-800 dark:text-slate-100">Prescriptions</h1>
          <p className="text-xs text-slate-400 mt-0.5">{totalCount} total prescription{totalCount !== 1 ? 's' : ''}</p>
        </div>
        {(role === 'Admin' || role === 'Doctor') && (
          <button onClick={() => setView('create')}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-500/20 transition-colors">
            <Plus className="h-4 w-4" /> New Prescription
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input type="text" value={filters.search}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
            placeholder="Search by diagnosis or medication name…"
            className="pl-9 pr-3 py-2 text-xs w-full border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
          className="px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none">
          <option value="">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Expired">Expired</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-rose-50 dark:bg-rose-950/40 rounded-xl text-xs text-rose-600 font-semibold border border-rose-200 dark:border-rose-900">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />)}
        </div>
      ) : prescriptions.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <FileText className="h-12 w-12 mx-auto mb-3 opacity-25" />
          <p className="font-bold text-sm text-slate-500">No prescriptions found</p>
          <p className="text-xs mt-1">
            {role === 'Doctor' ? 'Create a new prescription to get started.' : 'No prescriptions match your filters.'}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                  {['RX ID', 'Patient', 'Doctor', 'Issued', 'Expires', 'Medications', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-bold text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {prescriptions.map(rx => (
                  <tr key={rx._id || rx.prescriptionId} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                    <td className="px-4 py-3 font-mono font-bold text-brand-600 dark:text-brand-400 cursor-pointer" onClick={() => handleViewDetail(rx)}>{rx.prescriptionId}</td>
                    <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">{rx.patientName}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{rx.doctorName}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{rx.issuedDate}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{rx.expiryDate}</td>
                    <td className="px-4 py-3 font-bold text-center text-slate-600 dark:text-slate-300">{rx.medications?.length || 0}</td>
                    <td className="px-4 py-3"><PrescriptionStatusBadge status={rx.status} expiryDate={rx.expiryDate} /></td>
                    <td className="px-4 py-3 flex items-center gap-2">
                      <button onClick={() => handlePrint(rx)} title="Print Prescription Letterhead"
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <Printer className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => handleWhatsAppShare(rx)} title="Share via WhatsApp"
                        className="p-1.5 rounded-lg border border-emerald-200 dark:border-emerald-900 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors">
                        <MessageSquare className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => handleViewDetail(rx)}
                        className="px-2.5 py-1 text-[10px] font-bold border border-brand-200 dark:border-brand-800 text-brand-600 dark:text-brand-400 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-950/40 transition-all">
                        View →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  // ─── Create / Edit View ───────────────────────────────────────────────────────
  if (view === 'create' || view === 'edit') return (
    <div className="space-y-4">
      <button onClick={() => setView('list')}
        className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-brand-600 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Prescriptions
      </button>
      <PrescriptionForm
        prescriptionId={view === 'edit' ? (selected?._id || selected?.prescriptionId) : null}
        patientId={selected?.patientId || ''}
        patientName={selected?.patientName || ''}
        onSuccess={() => { setView('list'); setSelected(null); }}
        onCancel={() => { setView('list'); setSelected(null); }}
      />
    </div>
  );

  // ─── Detail View ──────────────────────────────────────────────────────────────
  if (view === 'detail' && selected) return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <button onClick={() => setView('list')}
          className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-brand-600 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Prescriptions
        </button>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => handleWhatsAppShare(selected)}
            className="px-3 py-1.5 text-[10px] font-bold border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg hover:bg-emerald-100 transition-colors flex items-center gap-1.5">
            <MessageSquare className="h-3.5 w-3.5 text-emerald-600" /> Share on WhatsApp
          </button>
          <button onClick={() => handlePrint(selected)}
            className="px-3 py-1.5 text-[10px] font-bold bg-brand-600 hover:bg-brand-700 text-white rounded-lg shadow-sm transition-colors flex items-center gap-1.5">
            <Printer className="h-3.5 w-3.5" /> Print Letterhead PDF
          </button>
          {(role === 'Admin' || role === 'Doctor') && selected.status === 'Active' && (
            <button onClick={() => handleEdit(selected)}
              className="px-3 py-1.5 text-[10px] font-bold border border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-950/40">
              Edit
            </button>
          )}
          {(role === 'Admin' || role === 'Doctor') && selected.status === 'Active' &&
            (selected.refillsAllowed - selected.refillsUsed) > 0 && (
            <button onClick={() => setRefillTarget(selected)}
              className="px-3 py-1.5 text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition-colors">
              ♻️ Refill
            </button>
          )}
          {(role === 'Admin' || role === 'Doctor') && selected.status !== 'Cancelled' && (
            <button onClick={() => setDeleteConfirm(selected)}
              className="px-3 py-1.5 text-[10px] font-bold border border-rose-200 dark:border-rose-900 text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40">
              Cancel Rx
            </button>
          )}
        </div>
      </div>

      <PrescriptionCard prescription={selected} />

      {/* Confirm Cancel Dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-sm w-full shadow-2xl space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-slate-100">Cancel Prescription?</h3>
            <p className="text-xs text-slate-500">This will mark <strong>{deleteConfirm.prescriptionId}</strong> as Cancelled. This cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">Keep</button>
              <button onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors">Confirm Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Refill Dialog */}
      {refillTarget && (
        <RefillDialog
          prescriptionId={refillTarget._id || refillTarget.prescriptionId}
          prescriptionLabel={refillTarget.prescriptionId}
          onClose={() => setRefillTarget(null)}
          onSuccess={() => { setRefillTarget(null); setView('list'); }}
        />
      )}
    </div>
  );

  return null;
};

export default Prescriptions;
