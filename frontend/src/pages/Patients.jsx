import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import AllergyBadge from '../components/AllergyBadge';
import Pagination from '../components/Pagination';
import {
  Plus, Search, Trash2, X, UserPlus,
  Phone, Mail, MapPin, Droplet, AlertCircle, ShieldAlert,
  AlertTriangle, Shield, CheckCircle2, UserCheck
} from 'lucide-react';

const ITEMS_PER_PAGE = 8;

const formatCNIC = (value) => {
  if (!value) return '';
  const digits = value.replace(/\D/g, '').slice(0, 13);
  if (digits.length <= 5) return digits;
  if (digits.length <= 12) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
};

const Patients = () => {
  const { patients, addPatient, deletePatient, canWrite } = useContext(AppContext);
  const writeAllowed = canWrite('patients');

  const [searchTerm,      setSearchTerm]      = useState('');
  const [isModalOpen,     setIsModalOpen]      = useState(false);
  const [patientToDelete, setPatientToDelete]  = useState(null);
  const [patientToView,   setPatientToView]    = useState(null);
  const [formError,       setFormError]        = useState('');
  
  // ✅ Pagination State
  const [currentPage, setCurrentPage] = useState(1);

  // Form State
  const [name,             setName]            = useState('');
  const [dob,              setDob]             = useState('');
  const [gender,           setGender]          = useState('Male');
  const [cnic,             setCnic]            = useState('');
  const [phone,            setPhone]           = useState('');
  const [email,            setEmail]           = useState('');
  const [bloodGroup,       setBloodGroup]      = useState('O+');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [address,          setAddress]         = useState('');
  const [allergies,        setAllergies]       = useState('');
  const [allergySeverity,  setAllergySeverity] = useState('None');

  // ✅ Filtered Patients
  const filteredPatients = patients.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.cnic && p.cnic.includes(searchTerm)) ||
    p.phone.includes(searchTerm) ||
    p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.allergies && p.allergies.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // ✅ Pagination Logic
  const totalPages = Math.ceil(filteredPatients.length / ITEMS_PER_PAGE);
  const paginatedPatients = filteredPatients.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // ✅ Reset page when search changes
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const resetForm = () => {
    setName(''); setDob(''); setGender('Male'); setCnic(''); setPhone('');
    setEmail(''); setBloodGroup('O+'); setEmergencyContact(''); setAddress('');
    setAllergies(''); setAllergySeverity('None');
    setFormError('');
  };

  const handleCnicChange = (e) => {
    const formatted = formatCNIC(e.target.value);
    setCnic(formatted);
    if (formatted && !/^\d{5}-\d{7}-\d{1}$/.test(formatted)) {
      setFormError('CNIC format must be XXXXX-XXXXXXX-X (13 digits)');
    } else {
      setFormError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!name || !dob || !cnic || !phone || !email || !emergencyContact || !address) {
      setFormError('All fields marked * are required.'); return;
    }
    if (!/^\d{5}-\d{7}-\d{1}$/.test(cnic)) {
      setFormError('Invalid CNIC format. CNIC must be 13 digits in XXXXX-XXXXXXX-X format.'); return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setFormError('Please enter a valid email address.'); return;
    }

    const result = await addPatient({
      name, dob, gender, cnic, phone, email, bloodGroup, emergencyContact, address,
      allergies: allergies.trim() || 'None',
      allergySeverity
    });

    if (!result.success) {
      setFormError(result.error || 'Failed to register patient'); return;
    }
    resetForm();
    setIsModalOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (patientToDelete) { deletePatient(patientToDelete); setPatientToDelete(null); }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-xl font-bold font-outfit text-slate-800 dark:text-slate-200">Patients Directory</h2>
          <p className="text-xs text-slate-400 font-medium">
            SRS FR-01 compliant patient registry & allergy tracking
            {/* ✅ Show count */}
            {filteredPatients.length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-bold">
                {filteredPatients.length} patients
              </span>
            )}
          </p>
        </div>
        {writeAllowed && (
          <button
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-bold shadow-md transition-all"
          >
            <UserPlus className="h-4 w-4" />
            Register Patient
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="h-5 w-5 text-slate-400 absolute left-3.5 inset-y-0 my-auto" />
        <input
          type="text" placeholder="Search by name, CNIC, allergies, phone or email..."
          value={searchTerm} onChange={handleSearch}
          className="block w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"
        />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          {filteredPatients.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-base font-bold text-slate-400">No patients found.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-850 border-b border-slate-150 dark:border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <th className="px-4 py-3">Patient ID</th>
                  <th className="px-4 py-3">Name / DOB</th>
                  <th className="px-4 py-3">CNIC</th>
                  <th className="px-4 py-3">Allergy Severity</th>
                  <th className="px-4 py-3">Contact Info</th>
                  <th className="px-4 py-3">Blood / Gender</th>
                  {writeAllowed && <th className="px-4 py-3 text-center">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm font-medium">
                {/* ✅ Use paginatedPatients */}
                {paginatedPatients.map(patient => (
                  <tr
                    key={patient.id}
                    onClick={() => setPatientToView(patient)}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 text-xs font-bold text-brand-600 dark:text-brand-400 whitespace-nowrap">{patient.id}</td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-800 dark:text-slate-200">{patient.name}</div>
                      <div className="text-xs text-slate-400">DOB: {patient.dob || `Age ${patient.age}`}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {patient.cnic || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <AllergyBadge allergies={patient.allergies} severity={patient.allergySeverity || 'None'} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500"><Phone className="h-3 w-3" />{patient.phone}</div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5"><Mail className="h-3 w-3" />{patient.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border border-rose-100 dark:border-rose-900 rounded-full">
                        <Droplet className="h-3 w-3" />{patient.bloodGroup}
                      </span>
                      <div className="text-xs text-slate-400 mt-1">{patient.gender}</div>
                    </td>
                    {writeAllowed && (
                      <td className="px-4 py-3 text-center" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => setPatientToDelete(patient.id)}
                          className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                          title="Delete Patient"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* ✅ Pagination Component */}
        {filteredPatients.length > 0 && (
          <div className="px-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={filteredPatients.length}
              itemsPerPage={ITEMS_PER_PAGE}
            />
          </div>
        )}
      </div>

      {/* Read-only notice */}
      {!writeAllowed && (
        <div className="flex items-center gap-2 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900 rounded-xl text-xs font-semibold text-amber-700 dark:text-amber-400">
          <ShieldAlert className="h-4 w-4 flex-shrink-0" />
          Your role has read-only access to the Patients directory.
        </div>
      )}

      {/* Register Patient Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
              <h3 className="text-lg font-bold font-outfit text-slate-800 dark:text-slate-200">Register New Patient</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><X className="h-5 w-5" /></button>
            </div>

            {formError && (
              <div className="bg-rose-50 dark:bg-rose-950/20 border-l-4 border-rose-500 p-3 rounded-r-lg flex items-center gap-2 text-xs font-semibold text-rose-800 dark:text-rose-300 mb-4">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />{formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Full Name *</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. John Doe"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Date of Birth *</label>
                  <input type="date" value={dob} onChange={e => setDob(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Gender *</label>
                  <select value={gender} onChange={e => setGender(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium">
                    <option>Male</option><option>Female</option><option>Other</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">CNIC / National ID *</label>
                    <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400">Auto-Formats (5-7-1)</span>
                  </div>
                  <input
                    type="text"
                    value={cnic}
                    onChange={handleCnicChange}
                    placeholder="35201-1234567-1"
                    maxLength={15}
                    className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-850 border rounded-lg text-sm focus:outline-none focus:ring-2 font-mono ${
                      cnic && /^\d{5}-\d{7}-\d{1}$/.test(cnic)
                        ? 'border-emerald-400 focus:ring-emerald-500'
                        : 'border-slate-200 dark:border-slate-700 focus:ring-brand-500'
                    }`}
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Format: 5 digits - 7 digits - 1 digit</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Phone Number *</label>
                  <input type="text" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 (555) 012-3456"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Email Address *</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="patient@example.com"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Blood Group *</label>
                  <select value={bloodGroup} onChange={e => setBloodGroup(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium">
                    {['A+','A-','B+','B-','O+','O-','AB+','AB-'].map(g => <option key={g}>{g}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Known Allergies</label>
                  <input type="text" value={allergies} onChange={e => setAllergies(e.target.value)} placeholder="e.g. Penicillin, Latex, Peanuts"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Allergy Severity Level</label>
                  <select value={allergySeverity} onChange={e => setAllergySeverity(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium">
                    <option value="None">None</option>
                    <option value="Mild">Mild (Green)</option>
                    <option value="Moderate">Moderate (Yellow)</option>
                    <option value="Critical">Critical (Red)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Emergency Contact *</label>
                  <input type="text" value={emergencyContact} onChange={e => setEmergencyContact(e.target.value)} placeholder="e.g. Jane Doe (+1 555-001-0000)"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium" />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Home Address *</label>
                  <textarea value={address} onChange={e => setAddress(e.target.value)} rows="2" placeholder="e.g. 123 Main St, City"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium resize-none" />
                </div>

              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-semibold transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-md">Save Record</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Patient View Modal */}
      {patientToView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setPatientToView(null)}></div>
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div>
                <h3 className="text-lg font-bold font-outfit text-slate-800 dark:text-slate-200">{patientToView.name}</h3>
                <p className="text-xs text-brand-600 dark:text-brand-400 font-bold">{patientToView.id}</p>
              </div>
              <button onClick={() => setPatientToView(null)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="h-5 w-5" /></button>
            </div>

            <div className="space-y-4 text-xs font-medium">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Allergy Profile</p>
                <AllergyBadge allergies={patientToView.allergies} severity={patientToView.allergySeverity || 'None'} subtle={false} />
              </div>

              <div className="grid grid-cols-2 gap-3 text-slate-600 dark:text-slate-300">
                <div><span className="text-slate-400 block text-[10px] uppercase font-bold">CNIC:</span> {patientToView.cnic || 'N/A'}</div>
                <div><span className="text-slate-400 block text-[10px] uppercase font-bold">Blood Group:</span> {patientToView.bloodGroup}</div>
                <div><span className="text-slate-400 block text-[10px] uppercase font-bold">DOB:</span> {patientToView.dob}</div>
                <div><span className="text-slate-400 block text-[10px] uppercase font-bold">Gender:</span> {patientToView.gender}</div>
                <div><span className="text-slate-400 block text-[10px] uppercase font-bold">Phone:</span> {patientToView.phone}</div>
                <div><span className="text-slate-400 block text-[10px] uppercase font-bold">Email:</span> {patientToView.email}</div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Emergency Contact</p>
                <p className="text-slate-700 dark:text-slate-200">{patientToView.emergencyContact}</p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Address</p>
                <p className="text-slate-700 dark:text-slate-200">{patientToView.address}</p>
              </div>
            </div>

            <div className="flex justify-end mt-5">
              <button onClick={() => setPatientToView(null)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {patientToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setPatientToDelete(null)}></div>
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold font-outfit text-slate-800 dark:text-slate-200">Confirm Deletion</h3>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">Are you sure? This will also cancel any active appointments for this patient.</p>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button onClick={() => setPatientToDelete(null)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-semibold">No, Keep</button>
              <button onClick={handleDeleteConfirm} className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-semibold">Yes, Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Patients;