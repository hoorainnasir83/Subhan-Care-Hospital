import React, { useEffect, useState } from 'react';
import medicalRecordStore from '../stores/medicalRecordStore';
import { AlertCircle, X, Paperclip, Upload, FileText, Trash2 } from 'lucide-react';

const MedicalRecordForm = ({ recordId = null, patientId, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    patientId: patientId || '',
    recordType: 'Diagnosis',
    recordDate: new Date().toISOString().split('T')[0],
    title: '',
    description: '',
    findings: '',
    recommendations: '',
    severity: 'Medium',
    status: 'Active',
    tags: [],
    followUpDate: '',
    isConfidential: false,
    notes: '',
    attachments: []
  });

  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (recordId) {
      fetchRecord();
    }
  }, [recordId]);

  const fetchRecord = async () => {
    try {
      const record = await medicalRecordStore.fetchMedicalRecordById(recordId);
      if (record) {
        setFormData({
          ...record,
          recordDate: record.recordDate ? record.recordDate.split('T')[0] : new Date().toISOString().split('T')[0],
          attachments: record.attachments || []
        });
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        setError(`File "${file.name}" exceeds maximum allowed size of 5MB.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const fileData = uploadEvent.target.result;
        setFormData(prev => ({
          ...prev,
          attachments: [
            ...prev.attachments,
            {
              fileName: file.name,
              fileType: file.type || 'application/octet-stream',
              fileData: fileData,
              fileSize: file.size,
              uploadedAt: new Date().toISOString()
            }
          ]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeAttachment = (index) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const addTag = () => {
    if (tagInput.trim() && formData.tags.length < 10) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (index) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (recordId) {
        await medicalRecordStore.updateMedicalRecord(recordId, formData);
      } else {
        await medicalRecordStore.createMedicalRecord(formData);
      }
      onSuccess?.();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to save record');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xl max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
        <h2 className="text-xl font-bold font-outfit text-slate-800 dark:text-slate-100">
          {recordId ? 'Edit Medical Record' : 'Create Medical Record'}
        </h2>
        {onCancel && (
          <button onClick={onCancel} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {error && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 p-3.5 rounded-xl flex items-center gap-2 text-xs font-semibold text-rose-700 dark:text-rose-300">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-sm">
        {/* Record Type & Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Record Type *</label>
            <select
              name="recordType"
              value={formData.recordType}
              onChange={handleChange}
              className={inputCls}
            >
              <option value="Diagnosis">Diagnosis</option>
              <option value="Lab Test">Lab Test</option>
              <option value="Scan">Scan</option>
              <option value="Procedure">Procedure</option>
              <option value="Allergy">Allergy</option>
              <option value="Medication History">Medication History</option>
              <option value="Vaccination">Vaccination</option>
              <option value="Surgery">Surgery</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Record Date *</label>
            <input
              type="date"
              name="recordDate"
              value={formData.recordDate}
              onChange={handleChange}
              className={inputCls}
            />
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Title *</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g. Brain MRI Scan / Blood Lipid Panel"
            maxLength={200}
            required
            className={inputCls}
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Description *</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Detailed description of diagnosis, symptoms, or test notes..."
            rows={3}
            maxLength={2000}
            required
            className={`${inputCls} resize-none`}
          />
        </div>

        {/* Findings & Recommendations */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Findings</label>
            <textarea
              name="findings"
              value={formData.findings}
              onChange={handleChange}
              placeholder="Clinical findings..."
              rows={2}
              maxLength={3000}
              className={`${inputCls} resize-none`}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Recommendations</label>
            <textarea
              name="recommendations"
              value={formData.recommendations}
              onChange={handleChange}
              placeholder="Physician recommendations..."
              rows={2}
              maxLength={2000}
              className={`${inputCls} resize-none`}
            />
          </div>
        </div>

        {/* File Attachments Uploader (X-Ray / MRI / Lab Reports) */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
            Document Attachments (Lab Reports, X-Ray, MRI Scans, PDFs)
          </label>

          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl cursor-pointer bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <div className="flex flex-col items-center justify-center pt-2 pb-2">
                <Upload className="w-6 h-6 mb-1 text-slate-400" />
                <p className="text-xs text-slate-500 font-semibold">Click to upload or drag & drop files</p>
                <p className="text-[10px] text-slate-400">PDF, PNG, JPG, WEBP (Max 5MB per file)</p>
              </div>
              <input type="file" multiple onChange={handleFileUpload} accept="image/*,application/pdf" className="hidden" />
            </label>
          </div>

          {/* Render Attached Files */}
          {formData.attachments?.length > 0 && (
            <div className="space-y-1.5 pt-1">
              {formData.attachments.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="h-4 w-4 text-brand-600 flex-shrink-0" />
                    <span className="font-semibold text-slate-700 dark:text-slate-200 truncate">{file.fileName}</span>
                    <span className="text-[10px] text-slate-400">({(file.fileSize / 1024).toFixed(1)} KB)</span>
                  </div>
                  <button type="button" onClick={() => removeAttachment(idx)} className="text-rose-500 hover:text-rose-700 p-1">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Severity & Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Severity *</label>
            <select name="severity" value={formData.severity} onChange={handleChange} className={inputCls}>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Status *</label>
            <select name="status" value={formData.status} onChange={handleChange} className={inputCls}>
              <option value="Active">Active</option>
              <option value="Resolved">Resolved</option>
              <option value="Archived">Archived</option>
              <option value="Follow-up Needed">Follow-up Needed</option>
            </select>
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Tags</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
              placeholder="Add tag (e.g. Lab, Scan)..."
              className={inputCls}
            />
            <button type="button" onClick={addTag} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl font-bold hover:bg-slate-200">
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {formData.tags.map((tag, idx) => (
              <span key={idx} className="bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                #{tag}
                <button type="button" onClick={() => removeTag(idx)} className="hover:text-rose-500">×</button>
              </span>
            ))}
          </div>
        </div>

        {/* Follow-up & Confidential */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Follow-up Date</label>
            <input type="date" name="followUpDate" value={formData.followUpDate} onChange={handleChange} className={inputCls} />
          </div>

          <div className="flex items-center pt-5">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
              <input type="checkbox" name="isConfidential" checked={formData.isConfidential} onChange={handleChange} className="rounded text-brand-600 focus:ring-brand-500" />
              <span>Mark as Confidential Record</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          {onCancel && (
            <button type="button" onClick={onCancel} className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800">
              Cancel
            </button>
          )}
          <button type="submit" disabled={loading} className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-500/20 transition-colors disabled:opacity-50">
            {loading ? 'Saving…' : recordId ? 'Update Record' : 'Create Record'}
          </button>
        </div>
      </form>
    </div>
  );
};

const inputCls = 'px-3 py-2.5 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 w-full transition-colors font-medium';

export default MedicalRecordForm;
