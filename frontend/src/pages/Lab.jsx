import React, { useState, useContext, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import {
  Plus, Search, X, Edit3, Trash2, FlaskConical,
  Clock, CheckCircle2, XCircle, FileText
} from 'lucide-react';

const CATEGORIES = ['Blood', 'Urine', 'Radiology', 'Pathology', 'Other'];

const Lab = () => {
  const {
    labTests, addLabTest, updateLabTest, deleteLabTest,
    patients, doctors, canWrite
  } = useContext(AppContext);

  const writeAllowed = canWrite('lab');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showForm, setShowForm] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [resultText, setResultText] = useState('');

  const [formData, setFormData] = useState({
    patientId: '', patientName: '', doctorId: '', doctorName: '',
    testName: '', category: 'Blood', cost: ''
  });

  const filtered = useMemo(() => {
    return (labTests || []).filter(t => {
      const matchSearch = t.testName.toLowerCase().includes(search.toLowerCase()) ||
        t.patientName.toLowerCase().includes(search.toLowerCase()) ||
        t.testId.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'All' || t.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [labTests, search, statusFilter]);

  const stats = useMemo(() => ({
    total: (labTests || []).length,
    pending: (labTests || []).filter(t => t.status === 'Pending').length,
    completed: (labTests || []).filter(t => t.status === 'Completed').length,
    cancelled: (labTests || []).filter(t => t.status === 'Cancelled').length,
  }), [labTests]);

  const resetForm = () => {
    setFormData({ patientId: '', patientName: '', doctorId: '', doctorName: '', testName: '', category: 'Blood', cost: '' });
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.patientId || !formData.doctorId || !formData.testName || !formData.cost) return;
    await addLabTest(formData);
    resetForm();
  };

  const handleResultSubmit = async () => {
    if (!selectedTest) return;
    await updateLabTest(selectedTest.testId, { status: 'Completed', result: resultText });
    setShowResultModal(false);
    setSelectedTest(null);
    setResultText('');
  };

  const openResultModal = (test) => {
    setSelectedTest(test);
    setResultText(test.result || '');
    setShowResultModal(true);
  };

  const getStatusBadge = (status) => {
    const styles = {
      Pending: 'bg-yellow-100 text-yellow-700',
      Completed: 'bg-green-100 text-green-700',
      Cancelled: 'bg-red-100 text-red-700'
    };
    const icons = {
      Pending: <Clock size={12} />,
      Completed: <CheckCircle2 size={12} />,
      Cancelled: <XCircle size={12} />
    };
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${styles[status]}`}>
        {icons[status]} {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            <FlaskConical className="text-purple-600" /> Lab & Diagnostics
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage laboratory tests and diagnostic reports</p>
        </div>
        {writeAllowed && (
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold px-5 py-2.5 rounded-xl transition-colors shadow-md">
            <Plus size={18} /> New Test
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Tests', value: stats.total, color: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300', icon: FlaskConical },
          { label: 'Pending', value: stats.pending, color: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300', icon: Clock },
          { label: 'Completed', value: stats.completed, color: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300', icon: CheckCircle2 },
          { label: 'Cancelled', value: stats.cancelled, color: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300', icon: XCircle },
        ].map(s => (
          <div key={s.label} className={`${s.color} p-4 rounded-2xl`}>
            <div className="flex items-center gap-2 mb-1"><s.icon size={16} /> <span className="text-xs font-bold uppercase tracking-wider">{s.label}</span></div>
            <div className="text-3xl font-black">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by test name, patient, or ID..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm outline-none focus:ring-2 focus:ring-purple-500 dark:text-white" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium outline-none focus:ring-2 focus:ring-purple-500 dark:text-white">
          <option value="All">All Status</option>
          <option value="Pending">Pending</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                {['Test ID', 'Patient', 'Test Name', 'Category', 'Doctor', 'Cost', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-bold text-gray-500 dark:text-gray-400 uppercase text-xs tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filtered.length === 0 ? (
                <tr><td colSpan="8" className="text-center py-12 text-gray-400">No lab tests found.</td></tr>
              ) : filtered.map(test => (
                <tr key={test.testId} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-purple-600 font-bold">{test.testId}</td>
                  <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">{test.patientName}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{test.testName}</td>
                  <td className="px-4 py-3"><span className="px-2 py-1 rounded-lg bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-bold">{test.category}</span></td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{test.doctorName}</td>
                  <td className="px-4 py-3 font-bold text-gray-800 dark:text-gray-200">Rs. {test.cost}</td>
                  <td className="px-4 py-3">{getStatusBadge(test.status)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {test.status === 'Pending' && writeAllowed && (
                        <button onClick={() => openResultModal(test)} title="Add Result" className="p-1.5 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/30 text-green-600 transition-colors">
                          <FileText size={16} />
                        </button>
                      )}
                      {test.status === 'Completed' && (
                        <button onClick={() => openResultModal(test)} title="View Result" className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 transition-colors">
                          <FileText size={16} />
                        </button>
                      )}
                      {writeAllowed && (
                        <button onClick={() => deleteLabTest(test.testId)} title="Delete" className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Test Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2"><FlaskConical size={20} className="text-purple-600" /> New Lab Test</h3>
              <button onClick={resetForm} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Patient</label>
                <select required value={formData.patientId} onChange={handlePatientSelect}
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 bg-white dark:bg-gray-700 text-sm outline-none focus:ring-2 focus:ring-purple-500 dark:text-white">
                  <option value="">Select Patient</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.id})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Doctor</label>
                <select required value={formData.doctorId} onChange={handleDoctorSelect}
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 bg-white dark:bg-gray-700 text-sm outline-none focus:ring-2 focus:ring-purple-500 dark:text-white">
                  <option value="">Select Doctor</option>
                  {doctors.map(d => <option key={d.id} value={d.id}>{d.name} — {d.specialty}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Test Name</label>
                  <input required value={formData.testName} onChange={e => setFormData(p => ({ ...p, testName: e.target.value }))}
                    placeholder="e.g. Complete Blood Count"
                    className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 bg-white dark:bg-gray-700 text-sm outline-none focus:ring-2 focus:ring-purple-500 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                  <select value={formData.category} onChange={e => setFormData(p => ({ ...p, category: e.target.value }))}
                    className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 bg-white dark:bg-gray-700 text-sm outline-none focus:ring-2 focus:ring-purple-500 dark:text-white">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cost (Rs.)</label>
                <input required type="number" min="0" value={formData.cost} onChange={e => setFormData(p => ({ ...p, cost: e.target.value }))}
                  placeholder="e.g. 1500"
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 bg-white dark:bg-gray-700 text-sm outline-none focus:ring-2 focus:ring-purple-500 dark:text-white" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={resetForm} className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</button>
                <button type="submit" className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm transition-colors shadow">Create Test</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Result Modal */}
      {showResultModal && selectedTest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <FileText size={20} className="text-green-600" />
                {selectedTest.status === 'Completed' ? 'View Result' : 'Add Result'}
              </h3>
              <button onClick={() => { setShowResultModal(false); setSelectedTest(null); }} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-500 dark:text-gray-400">Test ID:</span> <span className="font-bold text-purple-600">{selectedTest.testId}</span></div>
                <div><span className="text-gray-500 dark:text-gray-400">Patient:</span> <span className="font-medium dark:text-white">{selectedTest.patientName}</span></div>
                <div><span className="text-gray-500 dark:text-gray-400">Test:</span> <span className="font-medium dark:text-white">{selectedTest.testName}</span></div>
                <div><span className="text-gray-500 dark:text-gray-400">Category:</span> <span className="font-medium dark:text-white">{selectedTest.category}</span></div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Result / Findings</label>
                <textarea
                  rows={5}
                  value={resultText}
                  onChange={e => setResultText(e.target.value)}
                  readOnly={selectedTest.status === 'Completed'}
                  placeholder="Enter the lab test findings here..."
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 bg-white dark:bg-gray-700 text-sm outline-none focus:ring-2 focus:ring-purple-500 dark:text-white resize-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => { setShowResultModal(false); setSelectedTest(null); }} className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-700">
                  {selectedTest.status === 'Completed' ? 'Close' : 'Cancel'}
                </button>
                {selectedTest.status === 'Pending' && writeAllowed && (
                  <button onClick={handleResultSubmit} className="px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-sm transition-colors shadow">
                    Mark Completed
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Lab;
