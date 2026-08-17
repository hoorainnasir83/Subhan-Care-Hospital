import React, { useState, useContext, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import {
  Plus, Search, X, Edit3, Trash2, ClipboardList,
  Activity, Clock, Calendar, HeartPulse, FileText, Printer, Stethoscope, ArrowRight
} from 'lucide-react';

const RECORD_TYPES = ['Visit', 'Emergency', 'Surgery', 'Checkup', 'Lab'];

const MedicalRecords = () => {
  const {
    medicalRecords, addMedicalRecord, updateMedicalRecord, deleteMedicalRecord,
    patients, doctors, canWrite
  } = useContext(AppContext);

  const writeAllowed = canWrite('medical-records');

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'timeline'
  const [showForm, setShowForm] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    patientId: '', patientName: '', doctorId: '', doctorName: '',
    visitDate: new Date().toISOString().split('T')[0],
    recordType: 'Visit', chiefComplaint: '', diagnosis: '', treatment: '', notes: '',
    symptoms: '', // Comma separated string for simplicity in form
    bloodPressure: '', temperature: '', pulse: '', weight: '', height: '', oxygenSaturation: ''
  });

  const filtered = useMemo(() => {
    return (medicalRecords || []).filter(r => {
      const pName = r.patientName || '';
      const rId = r.recordId || '';
      const diag = r.diagnosis || '';
      
      const matchSearch = pName.toLowerCase().includes(search.toLowerCase()) ||
        rId.toLowerCase().includes(search.toLowerCase()) ||
        diag.toLowerCase().includes(search.toLowerCase());
        
      const matchType = typeFilter === 'All' || r.recordType === typeFilter;
      return matchSearch && matchType;
    });
  }, [medicalRecords, search, typeFilter]);

  const stats = useMemo(() => ({
    total: (medicalRecords || []).length,
    thisMonth: (medicalRecords || []).filter(r => new Date(r.visitDate).getMonth() === new Date().getMonth()).length,
    emergencies: (medicalRecords || []).filter(r => r.recordType === 'Emergency').length,
    followUps: (medicalRecords || []).filter(r => r.followUpDate && new Date(r.followUpDate) >= new Date()).length,
  }), [medicalRecords]);

  const resetForm = () => {
    setFormData({
      patientId: '', patientName: '', doctorId: '', doctorName: '',
      visitDate: new Date().toISOString().split('T')[0],
      recordType: 'Visit', chiefComplaint: '', diagnosis: '', treatment: '', notes: '',
      symptoms: '',
      bloodPressure: '', temperature: '', pulse: '', weight: '', height: '', oxygenSaturation: ''
    });
    setSelectedRecord(null);
    setShowForm(false);
  };

  const handlePatientSelect = (e) => {
    const p = patients.find(p => p.id === e.target.value);
    if (p) setFormData(prev => ({ ...prev, patientId: p.id, patientName: p.name }));
  };

  const handleDoctorSelect = (e) => {
    const d = doctors.find(d => d.id === e.target.value);
    if (d) setFormData(prev => ({ ...prev, doctorId: d.id, doctorName: d.name }));
  };

  const getPatientName = (idOrName) => {
    const p = patients.find(pat => pat.id === idOrName);
    return p ? p.name : idOrName;
  };

  const getDoctorName = (idOrName) => {
    const d = doctors.find(doc => doc.id === idOrName);
    return d ? d.name : idOrName;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.patientId || !formData.doctorId || !formData.diagnosis) return;

    const recordPayload = {
      ...formData,
      symptoms: formData.symptoms.split(',').map(s => s.trim()).filter(s => s),
      vitalSigns: {
        bloodPressure: formData.bloodPressure,
        temperature: formData.temperature,
        pulse: formData.pulse,
        weight: formData.weight,
        height: formData.height,
        oxygenSaturation: formData.oxygenSaturation
      }
    };

    if (selectedRecord) {
      await updateMedicalRecord(selectedRecord.recordId, recordPayload);
    } else {
      await addMedicalRecord(recordPayload);
    }
    resetForm();
  };

  const handleEdit = (record) => {
    setSelectedRecord(record);
    setFormData({
      patientId: record.patientId, patientName: record.patientName || record.patientId,
      doctorId: record.doctorId, doctorName: record.doctorName || record.doctorId,
      visitDate: new Date(record.visitDate || record.recordDate).toISOString().split('T')[0],
      recordType: record.recordType,
      chiefComplaint: record.chiefComplaint || record.description || '',
      diagnosis: record.diagnosis || record.title || '',
      treatment: record.treatment,
      notes: record.notes || '',
      symptoms: Array.isArray(record.symptoms) ? record.symptoms.join(', ') : (record.symptoms || ''),
      bloodPressure: record.vitalSigns?.bloodPressure || '',
      temperature: record.vitalSigns?.temperature || '',
      pulse: record.vitalSigns?.pulse || '',
      weight: record.vitalSigns?.weight || '',
      height: record.vitalSigns?.height || '',
      oxygenSaturation: record.vitalSigns?.oxygenSaturation || ''
    });
    setShowForm(true);
  };

  const handlePrint = (record) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Medical Record - ${record.patientName || 'Unknown'}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; color: #333; line-height: 1.6; }
            h1 { color: #2563eb; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; }
            .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
            .section { margin-bottom: 25px; }
            .label { font-weight: bold; color: #6b7280; font-size: 12px; text-transform: uppercase; }
            .value { font-size: 16px; margin-bottom: 10px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
          </style>
        </head>
        <body>
          <h1>Subhan Care Hospital - Medical Record</h1>
          <div class="header">
            <div>
              <div class="label">Patient Name</div>
              <div class="value">${getPatientName(record.patientName || record.patientId) || 'N/A'}</div>
            </div>
            <div>
              <div class="label">Record ID</div>
              <div class="value">${record.recordId || 'N/A'}</div>
            </div>
            <div>
              <div class="label">Visit Date</div>
              <div class="value">${(record.visitDate || record.recordDate) && !isNaN(new Date(record.visitDate || record.recordDate)) ? new Date(record.visitDate || record.recordDate).toLocaleDateString() : 'N/A'}</div>
            </div>
          </div>
          
          <div class="grid">
            <div class="section">
              <div class="label">Doctor</div>
              <div class="value">${getDoctorName(record.doctorName || record.doctorId) || 'N/A'}</div>
            </div>
            <div class="section">
              <div class="label">Record Type</div>
              <div class="value">${record.recordType || 'N/A'}</div>
            </div>
          </div>

          <div class="section">
            <div class="label">Chief Complaint</div>
            <div class="value">${record.chiefComplaint || record.description || 'N/A'}</div>
          </div>
          
          <div class="section">
            <div class="label">Diagnosis</div>
            <div class="value">${record.diagnosis || record.title || 'N/A'}</div>
          </div>

          <div class="section">
            <div class="label">Treatment Plan</div>
            <div class="value">${record.treatment || 'N/A'}</div>
          </div>

          <div class="section" style="margin-top: 50px;">
            <div class="label">Doctor's Signature</div>
            <div style="border-bottom: 1px solid #000; width: 200px; margin-top: 40px;"></div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const getTypeColor = (type) => {
    const colors = {
      Visit: 'bg-blue-100 text-blue-700',
      Emergency: 'bg-red-100 text-red-700',
      Surgery: 'bg-purple-100 text-purple-700',
      Checkup: 'bg-green-100 text-green-700',
      Lab: 'bg-yellow-100 text-yellow-700'
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            <ClipboardList className="text-blue-600" /> Medical Records
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage patient history, diagnoses, and treatments</p>
        </div>
        {writeAllowed && (
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl transition-colors shadow-md">
            <Plus size={18} /> New Record
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Records', value: stats.total, color: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', icon: FileText },
          { label: 'This Month', value: stats.thisMonth, color: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300', icon: Calendar },
          { label: 'Emergencies', value: stats.emergencies, color: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300', icon: Activity },
          { label: 'Follow-ups Due', value: stats.followUps, color: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300', icon: Clock },
        ].map(s => (
          <div key={s.label} className={`${s.color} p-4 rounded-2xl`}>
            <div className="flex items-center gap-2 mb-1"><s.icon size={16} /> <span className="text-xs font-bold uppercase tracking-wider">{s.label}</span></div>
            <div className="text-3xl font-black">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <div className="flex gap-2">
          <div className="relative w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search records..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" />
          </div>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 dark:text-white">
            <option value="All">All Types</option>
            {RECORD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-xl">
          <button onClick={() => setViewMode('table')} className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-colors ${viewMode === 'table' ? 'bg-white dark:bg-gray-800 shadow text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}>Table</button>
          <button onClick={() => setViewMode('timeline')} className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-colors ${viewMode === 'timeline' ? 'bg-white dark:bg-gray-800 shadow text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}>Timeline</button>
        </div>
      </div>

      {/* Content Area */}
      {viewMode === 'table' ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  {['Date', 'Patient', 'Doctor', 'Type', 'Diagnosis', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-bold text-gray-500 dark:text-gray-400 uppercase text-xs tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filtered.length === 0 ? (
                  <tr><td colSpan="6" className="text-center py-12 text-gray-400">No medical records found.</td></tr>
                ) : filtered.map(record => (
                  <tr key={record.recordId || Math.random()} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">
                      {(record.visitDate || record.recordDate) && !isNaN(new Date(record.visitDate || record.recordDate)) ? new Date(record.visitDate || record.recordDate).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-4 py-3 font-bold text-blue-600">{getPatientName(record.patientName || record.patientId) || 'Unknown'}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      <div className="flex items-center gap-1"><Stethoscope size={14} className="text-gray-400" /> {getDoctorName(record.doctorName || record.doctorId) || 'N/A'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-lg text-xs font-bold ${getTypeColor(record.recordType)}`}>
                        {record.recordType || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300 truncate max-w-[200px]">{record.diagnosis || record.title || 'N/A'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {writeAllowed && (
                          <>
                            <button onClick={() => handleEdit(record)} title="Edit" className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 transition-colors">
                              <Edit3 size={16} />
                            </button>
                            <button onClick={() => deleteMedicalRecord(record.recordId)} title="Delete" className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500 transition-colors">
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                        <button onClick={() => handlePrint(record)} title="Print Record" className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors">
                          <Printer size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Timeline View */
        <div className="relative border-l-2 border-blue-100 dark:border-blue-900 ml-4 space-y-8 py-4">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-400">No medical timeline available.</div>
          ) : filtered.map(record => (
            <div key={record.recordId} className="relative pl-8">
              <div className="absolute -left-2.5 top-1.5 w-5 h-5 rounded-full border-4 border-white dark:border-gray-900 bg-blue-500"></div>
              <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${getTypeColor(record.recordType)}`}>{record.recordType}</span>
                      <span className="text-sm font-bold text-gray-800 dark:text-white">{new Date(record.visitDate).toLocaleDateString()}</span>
                    </div>
                    <h3 className="text-lg font-black text-blue-600">{record.patientName}</h3>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center justify-end gap-1"><Stethoscope size={14} /> {record.doctorName}</div>
                    <div className="text-xs text-gray-400 font-mono mt-1">{record.recordId}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Chief Complaint</h4>
                      <p className="text-sm text-gray-800 dark:text-gray-200">{record.chiefComplaint || 'N/A'}</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Diagnosis</h4>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{record.diagnosis}</p>
                    </div>
                    {record.symptoms && record.symptoms.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Symptoms</h4>
                        <div className="flex flex-wrap gap-1">
                          {record.symptoms.map((s, i) => <span key={i} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-full">{s}</span>)}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl border border-gray-100 dark:border-gray-600">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1 mb-3"><HeartPulse size={14} /> Vitals</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div><span className="text-gray-500">BP:</span> <span className="font-bold dark:text-white">{record.vitalSigns?.bloodPressure || '--'}</span></div>
                      <div><span className="text-gray-500">Temp:</span> <span className="font-bold dark:text-white">{record.vitalSigns?.temperature || '--'}</span></div>
                      <div><span className="text-gray-500">Pulse:</span> <span className="font-bold dark:text-white">{record.vitalSigns?.pulse || '--'}</span></div>
                      <div><span className="text-gray-500">SpO2:</span> <span className="font-bold dark:text-white">{record.vitalSigns?.oxygenSaturation || '--'}</span></div>
                      <div><span className="text-gray-500">Weight:</span> <span className="font-bold dark:text-white">{record.vitalSigns?.weight || '--'}</span></div>
                      <div><span className="text-gray-500">Height:</span> <span className="font-bold dark:text-white">{record.vitalSigns?.height || '--'}</span></div>
                    </div>
                  </div>
                </div>

                {record.treatment && (
                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Treatment Plan</h4>
                    <p className="text-sm text-gray-800 dark:text-gray-200">{record.treatment}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-4xl my-8">
            <div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-t-2xl">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <ClipboardList className="text-blue-600" />
                {selectedRecord ? 'Edit Medical Record' : 'New Medical Record'}
              </h3>
              <button onClick={resetForm} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Top Row: Patient, Doctor, Date, Type */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Patient *</label>
                  <select required value={formData.patientId} onChange={handlePatientSelect}
                    className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 bg-gray-50 dark:bg-gray-700 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-white">
                    <option value="">Select Patient</option>
                    {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.id})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Doctor *</label>
                  <select required value={formData.doctorId} onChange={handleDoctorSelect}
                    className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 bg-gray-50 dark:bg-gray-700 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-white">
                    <option value="">Select Doctor</option>
                    {doctors.map(d => <option key={d.id} value={d.id}>{d.name} — {d.specialty}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Visit Date *</label>
                  <input required type="date" value={formData.visitDate} onChange={e => setFormData(p => ({ ...p, visitDate: e.target.value }))}
                    className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 bg-gray-50 dark:bg-gray-700 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Record Type</label>
                  <select value={formData.recordType} onChange={e => setFormData(p => ({ ...p, recordType: e.target.value }))}
                    className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 bg-gray-50 dark:bg-gray-700 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-white">
                    {RECORD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              {/* Vitals */}
              <div className="bg-blue-50 dark:bg-gray-700/50 p-4 rounded-2xl border border-blue-100 dark:border-gray-600">
                <h4 className="text-sm font-bold text-blue-800 dark:text-blue-300 mb-3 flex items-center gap-2"><HeartPulse size={16} /> Vital Signs</h4>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                  {Object.entries({
                    bloodPressure: 'BP (mmHg)', temperature: 'Temp (°F)', pulse: 'Pulse (bpm)', 
                    oxygenSaturation: 'SpO2 (%)', weight: 'Weight (kg)', height: 'Height (cm)'
                  }).map(([key, label]) => (
                    <div key={key}>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{label}</label>
                      <input value={formData[key]} onChange={e => setFormData(p => ({ ...p, [key]: e.target.value }))} placeholder="-"
                        className="w-full border border-white dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Clinical Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Chief Complaint</label>
                    <input required value={formData.chiefComplaint} onChange={e => setFormData(p => ({ ...p, chiefComplaint: e.target.value }))}
                      placeholder="Primary reason for visit"
                      className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 bg-gray-50 dark:bg-gray-700 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Symptoms (comma separated)</label>
                    <input value={formData.symptoms} onChange={e => setFormData(p => ({ ...p, symptoms: e.target.value }))}
                      placeholder="Fever, Cough, Headache..."
                      className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 bg-gray-50 dark:bg-gray-700 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Diagnosis *</label>
                    <textarea required rows={3} value={formData.diagnosis} onChange={e => setFormData(p => ({ ...p, diagnosis: e.target.value }))}
                      placeholder="Confirmed or differential diagnosis"
                      className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2 bg-gray-50 dark:bg-gray-700 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-white resize-none" />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Treatment Plan</label>
                    <textarea rows={3} value={formData.treatment} onChange={e => setFormData(p => ({ ...p, treatment: e.target.value }))}
                      placeholder="Prescribed treatment, advice..."
                      className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2 bg-gray-50 dark:bg-gray-700 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-white resize-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Doctor's Notes</label>
                    <textarea rows={3} value={formData.notes} onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))}
                      placeholder="Additional clinical notes..."
                      className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2 bg-gray-50 dark:bg-gray-700 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-white resize-none" />
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                <button type="button" onClick={resetForm} className="px-6 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-bold text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Cancel</button>
                <button type="submit" className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-colors shadow-md flex items-center gap-2">
                  {selectedRecord ? 'Update Record' : 'Save Record'} <ArrowRight size={16} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicalRecords;
