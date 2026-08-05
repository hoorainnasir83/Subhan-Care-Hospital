import React, { useState, useContext } from 'react';
import { AlertCircle, Plus, Save, X } from 'lucide-react';
import prescriptionStore from '../stores/prescriptionStore';
import MedicationRow from './MedicationRow';
import { AppContext } from '../context/AppContext';

const inputCls = 'px-3 py-2.5 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 w-full transition-colors font-medium';

const emptyMed = () => ({ name: '', dosage: '', frequency: '', duration: '', instructions: '' });

const PrescriptionForm = ({ prescriptionId = null, patientId = '', patientName = '', onSuccess, onCancel }) => {
  const { patients, doctors, user } = useContext(AppContext);

  const [form, setForm] = useState({
    patientId:      patientId || '',
    patientName:    patientName || '',
    doctorId:       user?.doctorId || '',
    doctorName:     user?.name || '',
    appointmentId:  '',
    diagnosis:      '',
    notes:          '',
    issuedDate:     new Date().toISOString().split('T')[0],
    expiryDate:     new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    followUpDate:   '',
    refillsAllowed: 0,
    medications:    [emptyMed()]
  });

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    if (name === 'patientId') {
      const pat = patients?.find(p => p.id === value || p._id === value);
      if (pat) setForm(f => ({ ...f, patientId: value, patientName: pat.name }));
    }
  };

  const handleMedChange = (idx, field, value) => {
    setForm(f => {
      const meds = [...f.medications];
      meds[idx] = { ...meds[idx], [field]: value };
      return { ...f, medications: meds };
    });
  };

  const addMed = () => {
    if (form.medications.length < 20)
      setForm(f => ({ ...f, medications: [...f.medications, emptyMed()] }));
  };

  const removeMed = idx => {
    if (form.medications.length > 1)
      setForm(f => ({ ...f, medications: f.medications.filter((_, i) => i !== idx) }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (prescriptionId) {
        await prescriptionStore.updatePrescription(prescriptionId, form);
      } else {
        await prescriptionStore.createPrescription(form);
      }
      onSuccess?.();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to save prescription');
    } finally {
      setLoading(false);
    }
  };

  const diagLen = form.diagnosis.length;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-6 shadow-xl max-w-3xl mx-auto">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
        <h2 className="text-lg font-bold font-outfit text-slate-800 dark:text-slate-100">
          {prescriptionId ? 'Edit Prescription' : 'New Prescription'}
        </h2>
        {onCancel && (
          <button onClick={onCancel} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl p-3 text-xs font-semibold text-rose-700 dark:text-rose-300">
          <AlertCircle className="h-4 w-4 flex-shrink-0" /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 text-sm">
        {/* Patient & Doctor */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Patient *</label>
            {patients?.length > 0 ? (
              <select name="patientId" value={form.patientId} onChange={handleChange} required className={inputCls}>
                <option value="">Select patient...</option>
                {patients.map(p => <option key={p.id || p._id} value={p.id || p._id}>{p.name}</option>)}
              </select>
            ) : (
              <input type="text" name="patientName" value={form.patientName} onChange={e => setForm(f => ({ ...f, patientName: e.target.value }))}
                placeholder="Patient name" required className={inputCls} />
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Doctor *</label>
            <input type="text" name="doctorName" value={form.doctorName} readOnly
              className={`${inputCls} opacity-70 cursor-not-allowed`} />
          </div>
        </div>

        {/* Diagnosis */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">
            Diagnosis * <span className={`font-normal text-[10px] ${diagLen > 450 ? 'text-rose-500' : 'text-slate-400'}`}>({diagLen}/500)</span>
          </label>
          <textarea name="diagnosis" value={form.diagnosis} onChange={handleChange}
            placeholder="Enter clinical diagnosis..." rows={3} maxLength={500} required
            className={`${inputCls} resize-none`} />
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Issued Date *</label>
            <input type="date" name="issuedDate" value={form.issuedDate} onChange={handleChange} required className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Expiry Date *</label>
            <input type="date" name="expiryDate" value={form.expiryDate} onChange={handleChange} required className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Follow-up Date</label>
            <input type="date" name="followUpDate" value={form.followUpDate} onChange={handleChange} className={inputCls} />
          </div>
        </div>

        {/* Refills Allowed */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Refills Allowed</label>
            <input type="number" name="refillsAllowed" value={form.refillsAllowed} onChange={handleChange} min={0} max={10} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Appointment ID (optional)</label>
            <input type="text" name="appointmentId" value={form.appointmentId} onChange={handleChange}
              placeholder="apt-1" className={inputCls} />
          </div>
        </div>

        {/* Medications */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
              Medications * <span className="font-normal text-slate-400">({form.medications.length}/20)</span>
            </label>
            <button type="button" onClick={addMed} disabled={form.medications.length >= 20}
              className="flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700 disabled:opacity-40">
              <Plus className="h-3.5 w-3.5" /> Add Medication
            </button>
          </div>
          <div className="space-y-3">
            {form.medications.map((med, idx) => (
              <MedicationRow key={idx} med={med} index={idx}
                onChange={handleMedChange} onRemove={() => removeMed(idx)}
                canRemove={form.medications.length > 1} />
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Additional Notes</label>
          <textarea name="notes" value={form.notes} onChange={handleChange}
            placeholder="Optional notes for patient or pharmacy..." rows={2} maxLength={1000}
            className={`${inputCls} resize-none`} />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          {onCancel && (
            <button type="button" onClick={onCancel}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800">
              Cancel
            </button>
          )}
          <button type="submit" disabled={loading}
            className="flex items-center gap-2 px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-500/20 disabled:opacity-50 transition-colors">
            <Save className="h-3.5 w-3.5" />
            {loading ? 'Saving…' : prescriptionId ? 'Update' : 'Create Prescription'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PrescriptionForm;
