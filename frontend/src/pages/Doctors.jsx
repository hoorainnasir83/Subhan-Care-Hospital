import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import AllergyBadge from '../components/AllergyBadge';
import Pagination from '../components/Pagination';
import {
  Plus, Search, Trash2, X, Star, Stethoscope,
  Phone, Mail, Clock, AlertCircle, ShieldAlert, UserCheck, Calendar
} from 'lucide-react';

const SPECIALTIES = ['Cardiology','Pediatrics','Neurology','General Medicine','Orthopedics','Dermatology','Ophthalmology','Oncology','Psychiatry','Surgery'];

const ITEMS_PER_PAGE = 1;

const Doctors = () => {
  const { doctors, patients, appointments, addDoctor, deleteDoctor, canWrite } = useContext(AppContext);
  const writeAllowed = canWrite('doctors');

  const [searchTerm,     setSearchTerm]     = useState('');
  const [isModalOpen,    setIsModalOpen]     = useState(false);
  const [doctorToDelete, setDoctorToDelete]  = useState(null);
  const [doctorToView,   setDoctorToView]   = useState(null);
  const [formError,      setFormError]      = useState('');
  const [currentPage,    setCurrentPage]    = useState(1);

  const [name,         setName]         = useState('');
  const [specialty,    setSpecialty]    = useState('Cardiology');
  const [phone,        setPhone]        = useState('');
  const [email,        setEmail]        = useState('');
  const [availability, setAvailability] = useState('');
  const [fee,          setFee]          = useState('');

  const filtered = doctors.filter(d =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.specialty.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedDoctors = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const resetForm = () => {
    setName(''); setSpecialty('Cardiology'); setPhone(''); setEmail('');
    setAvailability(''); setFee(''); setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!name || !specialty || !phone || !email || !availability || !fee) {
      setFormError('All fields are required.'); return;
    }
    if (Number(fee) < 0) { setFormError('Consultation fee must be a positive number.'); return; }

    const result = await addDoctor({ name, specialty, phone, email, availability, fee });
    if (!result.success) {
      setFormError(result.error || 'Failed to add doctor'); return;
    }
    resetForm();
    setIsModalOpen(false);
  };

  const getDoctorAssignedPatients = (docId) => {
    const docApts = appointments.filter(a => a.doctorId === docId && a.status === 'Scheduled');
    const patIds = [...new Set(docApts.map(a => a.patientId))];
    return patients.filter(p => patIds.includes(p.id));
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-xl font-bold font-outfit text-slate-800 dark:text-slate-200">Medical Staff Directory</h2>
          <p className="text-xs text-slate-400 font-medium">
            Manage doctors, consultation fees & patient allergy lists
            {filtered.length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-bold">
                {filtered.length} doctors
              </span>
            )}
          </p>
        </div>
        {writeAllowed && (
          <button
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-bold shadow-md transition-all"
          >
            <Plus className="h-4 w-4" />Recruit Doctor
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="h-5 w-5 text-slate-400 absolute left-3.5 inset-y-0 my-auto" />
        <input
          type="text"
          placeholder="Search by name or specialty..."
          value={searchTerm}
          onChange={handleSearch}
          className="block w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"
        />
      </div>

      {/* Pagination Info */}
      {filtered.length > 0 && (
        <div className="text-xs text-slate-400 font-medium">
          Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} doctors
        </div>
      )}

      {/* Card Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-150">
          <p className="text-base font-bold text-slate-400">No doctors found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {paginatedDoctors.map(doc => {
            const assignedPatients = getDoctorAssignedPatients(doc.id);
            return (
              <div
                key={doc.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-shadow group relative"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center text-white font-extrabold text-lg shadow-md">
                      {doc.name.split(' ').map(n => n[0]).join('').slice(0,2)}
                    </div>
                    <div>
                      {/* ✅ Doctor name - Black color forced */}
                      <p style={{ color: '#000000', fontWeight: 'bold', lineHeight: '1.25', fontSize: '14px' }}>{doc.name}</p>
                      <span className="text-xs bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 font-semibold px-2 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-900">
                        {doc.specialty}
                      </span>
                    </div>
                  </div>
                  {writeAllowed && (
                    <button
                      onClick={() => setDoctorToDelete(doc.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="space-y-1.5 text-xs text-slate-500 font-medium mt-4">
                  <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-slate-400" />{doc.phone}</div>
                  <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-slate-400" />{doc.email}</div>
                  <div className="flex items-center gap-2"><Clock className="h-3.5 w-3.5 text-slate-400" />{doc.availability}</div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <span className="font-bold text-brand-600 dark:text-brand-400">${doc.fee} / consult</span>
                  <button
                    onClick={() => setDoctorToView(doc)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-brand-50 hover:text-brand-600 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-lg transition-colors"
                  >
                    <UserCheck className="h-3.5 w-3.5 text-brand-500" />
                    Patient List ({assignedPatients.length})
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {filtered.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={filtered.length}
          itemsPerPage={ITEMS_PER_PAGE}
        />
      )}

      {/* Read-only notice */}
      {!writeAllowed && (
        <div className="flex items-center gap-2 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900 rounded-xl text-xs font-semibold text-amber-700 dark:text-amber-400">
          <ShieldAlert className="h-4 w-4 flex-shrink-0" />
          Your role has read-only access to the Doctors directory.
        </div>
      )}

      {/* Doctor Patient List Modal */}
      {doctorToView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setDoctorToView(null)}></div>
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-150 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div>
                <h3 className="text-lg font-bold font-outfit text-slate-800 dark:text-slate-200">{doctorToView.name}</h3>
                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">{doctorToView.specialty} — Assigned Patients & Allergy Alerts</p>
              </div>
              <button onClick={() => setDoctorToView(null)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>

            {getDoctorAssignedPatients(doctorToView.id).length === 0 ? (
              <div className="text-center py-8 text-xs font-semibold text-slate-400">
                No active scheduled appointments for this doctor right now.
              </div>
            ) : (
              <div className="space-y-3">
                {getDoctorAssignedPatients(doctorToView.id).map(p => (
                  <div key={p.id} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-xs text-slate-800 dark:text-slate-200">{p.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{p.id} | {p.gender} | {p.bloodGroup}</p>
                    </div>
                    <AllergyBadge allergies={p.allergies} severity={p.allergySeverity || 'None'} />
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end mt-5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button onClick={() => setDoctorToView(null)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Doctor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
              <h3 className="text-lg font-bold font-outfit text-slate-800 dark:text-slate-200">Recruit New Doctor</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"><X className="h-5 w-5" /></button>
            </div>
            {formError && (
              <div className="bg-rose-50 border-l-4 border-rose-500 p-3 rounded-r-lg flex items-center gap-2 text-xs font-semibold text-rose-800 mb-4">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />{formError}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Full Name *</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Dr. John Doe"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Specialty *</label>
                  <select value={specialty} onChange={e => setSpecialty(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium">
                    {SPECIALTIES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Fee ($) *</label>
                  <input type="number" min="0" value={fee} onChange={e => setFee(e.target.value)} placeholder="120"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Phone *</label>
                  <input type="text" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 (555) 000-0000"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Email *</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="doctor@subhancare.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Availability Schedule *</label>
                  <input type="text" value={availability} onChange={e => setAvailability(e.target.value)} placeholder="Mon - Fri (9 AM - 5 PM)"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium" />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-md">Add to Staff</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {doctorToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setDoctorToDelete(null)}></div>
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold font-outfit text-slate-800">Confirm Removal</h3>
            <p className="text-sm text-slate-500 mt-2">This will remove the doctor and cancel their scheduled appointments.</p>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button onClick={() => setDoctorToDelete(null)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold">Keep</button>
              <button onClick={() => { deleteDoctor(doctorToDelete); setDoctorToDelete(null); }} className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-semibold">Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Doctors;