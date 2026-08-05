import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import AllergyBadge from '../components/AllergyBadge';
import {
  Plus, Search, X, CalendarCheck, AlertCircle, ShieldAlert,
  User, Stethoscope, Clock, CheckCircle2, XCircle, Calendar, RefreshCw, Check, Info
} from 'lucide-react';

const STATUS_STYLES = {
  Scheduled: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  Cancelled: 'bg-rose-50 text-rose-700 border-rose-100',
  Completed: 'bg-slate-50 text-slate-600 border-slate-200',
};

const DEFAULT_TIME_SLOTS = [
  '09:00', '09:15', '09:30', '09:45',
  '10:00', '10:15', '10:30', '10:45',
  '11:00', '11:15', '11:30', '11:45',
  '12:00', '12:15', '12:30', '12:45',
  '13:00', '13:15', '13:30', '13:45',
  '14:00', '14:15', '14:30', '14:45',
  '15:00', '15:15', '15:30', '15:45',
  '16:00', '16:15', '16:30', '16:45',
  '17:00'
];

const Appointments = () => {
  const {
    appointments, patients, doctors,
    bookAppointment, cancelAppointment, rescheduleAppointment, getAvailableSlots,
    canWrite, user
  } = useContext(AppContext);

  const writeAllowed = canWrite('appointments');

  // Doctor scope: if logged in as Doctor, only show their own appointments
  const isDoctorRole = user?.role === 'Doctor' && user?.doctorId;
  const visibleAppointments = isDoctorRole
    ? appointments.filter(a => a.doctorId === user.doctorId)
    : appointments;

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  // Modal States
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [aptToCancel, setAptToCancel] = useState(null);
  const [aptToReschedule, setAptToReschedule] = useState(null);

  const [formError, setFormError] = useState('');
  const [successNotice, setSuccessNotice] = useState('');

  // Booking Form State
  const [patientId, setPatientId] = useState('');
  const [doctorId,  setDoctorId]  = useState('');
  const [date,      setDate]       = useState('');
  const [time,      setTime]       = useState('09:00');

  // Available slots state for booking
  const [bookedSlots, setBookedSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Reschedule Form State
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [rescheduleBookedSlots, setRescheduleBookedSlots] = useState([]);
  const [loadingRescheduleSlots, setLoadingRescheduleSlots] = useState(false);
  const [rescheduleError, setRescheduleError] = useState('');

  // Fetch available slots when Doctor or Date changes in Book form
  useEffect(() => {
    if (doctorId && date) {
      setLoadingSlots(true);
      getAvailableSlots(doctorId, date).then(res => {
        setBookedSlots(res.bookedSlots || []);
        setLoadingSlots(false);
      }).catch(() => setLoadingSlots(false));
    } else {
      setBookedSlots([]);
    }
  }, [doctorId, date]);

  // Fetch available slots when Date changes in Reschedule form
  useEffect(() => {
    if (aptToReschedule && rescheduleDate) {
      setLoadingRescheduleSlots(true);
      getAvailableSlots(aptToReschedule.doctorId, rescheduleDate).then(res => {
        // Exclude current appointment time if date hasn't changed
        let slots = res.bookedSlots || [];
        if (rescheduleDate === aptToReschedule.date) {
          slots = slots.filter(s => s !== aptToReschedule.time);
        }
        setRescheduleBookedSlots(slots);
        setLoadingRescheduleSlots(false);
      }).catch(() => setLoadingRescheduleSlots(false));
    }
  }, [aptToReschedule, rescheduleDate]);

  const filtered = visibleAppointments.filter(a => {
    const matchSearch =
      a.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.doctorName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'All' || a.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const resetBookForm = () => {
    setPatientId(''); setDoctorId(''); setDate(''); setTime('09:00');
    setFormError(''); setBookedSlots([]);
  };

  const handleBook = async (e) => {
    e.preventDefault();
    setFormError('');
    setSuccessNotice('');

    if (!patientId || !doctorId || !date || !time) {
      setFormError('All fields are required.'); return;
    }
    const today = new Date().toISOString().split('T')[0];
    if (date < today) {
      setFormError('Appointment date cannot be in the past.'); return;
    }

    if (bookedSlots.includes(time)) {
      setFormError(`Slot Conflict: ${time} is already booked for this doctor. Please choose a different time slot.`);
      return;
    }

    const result = await bookAppointment({ patientId, doctorId, date, time });
    if (!result.success) { setFormError(result.error || 'Failed to book appointment'); return; }

    setSuccessNotice(`Appointment successfully booked for ${date} at ${time}`);
    resetBookForm();
    setIsBookModalOpen(false);
    setTimeout(() => setSuccessNotice(''), 4000);
  };

  const openRescheduleModal = (apt) => {
    setAptToReschedule(apt);
    setRescheduleDate(apt.date);
    setRescheduleTime(apt.time);
    setRescheduleError('');
  };

  const handleReschedule = async (e) => {
    e.preventDefault();
    setRescheduleError('');
    if (!rescheduleDate || !rescheduleTime) {
      setRescheduleError('Please select both a date and a time slot.'); return;
    }
    const today = new Date().toISOString().split('T')[0];
    if (rescheduleDate < today) {
      setRescheduleError('Reschedule date cannot be in the past.'); return;
    }

    if (rescheduleBookedSlots.includes(rescheduleTime)) {
      setRescheduleError(`Slot Conflict: Time slot ${rescheduleTime} is already booked for ${aptToReschedule.doctorName}. Please select another time.`);
      return;
    }

    const result = await rescheduleAppointment(aptToReschedule.id, rescheduleDate, rescheduleTime);
    if (!result.success) {
      setRescheduleError(result.error || 'Failed to reschedule appointment');
      return;
    }

    setSuccessNotice(result.message || `Appointment rescheduled to ${rescheduleDate} at ${rescheduleTime}`);
    setAptToReschedule(null);
    setTimeout(() => setSuccessNotice(''), 4000);
  };

  // Map patient dictionary for fast allergy lookup
  const patientMap = patients.reduce((acc, p) => { acc[p.id] = p; return acc; }, {});

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-xl font-bold font-outfit text-slate-800 dark:text-slate-200">
            {isDoctorRole ? `My Appointments — ${user.name}` : 'Appointments Schedule'}
          </h2>
          <p className="text-xs text-slate-400 font-medium">
            {isDoctorRole ? 'Viewing your scheduled consultations & patient allergies' : 'Conflict prevention, live slot availability & rescheduling'}
          </p>
        </div>
        {writeAllowed && (
          <button onClick={() => { resetBookForm(); setIsBookModalOpen(true); }} className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-bold shadow-md transition-all">
            <Plus className="h-4 w-4" />Book Appointment
          </button>
        )}
      </div>

      {/* Success Notification Banner */}
      {successNotice && (
        <div className="flex items-center gap-2 p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl text-sm font-bold text-emerald-800 dark:text-emerald-300 animate-in fade-in duration-200">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="h-5 w-5 text-slate-400 absolute left-3.5 inset-y-0 my-auto" />
          <input type="text" placeholder="Search patient or doctor..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="block w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm">
          <option>All</option><option>Scheduled</option><option>Cancelled</option><option>Completed</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <CalendarCheck className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-base font-bold text-slate-400">No appointments found.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-850 border-b border-slate-150 dark:border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <th className="px-4 py-3">Patient</th>
                  <th className="px-4 py-3">Allergy Severity</th>
                  <th className="px-4 py-3">Doctor</th>
                  <th className="px-4 py-3">Date & Time</th>
                  <th className="px-4 py-3">Fee</th>
                  <th className="px-4 py-3">Status</th>
                  {writeAllowed && <th className="px-4 py-3 text-center">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm font-medium">
                {filtered.map(apt => {
                  const patientObj = patientMap[apt.patientId];
                  return (
                    <tr key={apt.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-lg bg-brand-100 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                            {apt.patientName[0]}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 dark:text-slate-200">{apt.patientName}</p>
                            <p className="text-[10px] text-slate-400">{apt.patientId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <AllergyBadge
                          allergies={patientObj?.allergies}
                          severity={patientObj?.allergySeverity || 'None'}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                          <Stethoscope className="h-3.5 w-3.5 text-indigo-400" />
                          <span className="text-xs font-semibold">{apt.doctorName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />{apt.date}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                          <Clock className="h-3.5 w-3.5" />{apt.time}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-bold text-brand-600 dark:text-brand-400 text-xs">${apt.fee}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${STATUS_STYLES[apt.status] || STATUS_STYLES.Scheduled}`}>
                          {apt.status === 'Scheduled' && <CheckCircle2 className="h-3 w-3" />}
                          {apt.status === 'Cancelled'  && <XCircle className="h-3 w-3" />}
                          {apt.status}
                        </span>
                      </td>
                      {writeAllowed && (
                        <td className="px-4 py-3 text-center">
                          {apt.status === 'Scheduled' ? (
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Reschedule Button */}
                              <button
                                onClick={() => openRescheduleModal(apt)}
                                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold bg-indigo-50 dark:bg-indigo-950/30 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 rounded-lg border border-indigo-200 dark:border-indigo-800 transition-colors"
                                title="Reschedule Appointment"
                              >
                                <RefreshCw className="h-3 w-3" /> Reschedule
                              </button>

                              {/* Cancel Button */}
                              <button
                                onClick={() => setAptToCancel(apt.id)}
                                className="px-2.5 py-1.5 text-xs font-bold bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 text-rose-600 dark:text-rose-400 rounded-lg border border-rose-100 dark:border-rose-900 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-300 font-medium">—</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Read-only notice for Doctor/Billing */}
      {!writeAllowed && (
        <div className="flex items-center gap-2 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900 rounded-xl text-xs font-semibold text-amber-700 dark:text-amber-400">
          <ShieldAlert className="h-4 w-4 flex-shrink-0" />
          {isDoctorRole
            ? 'You are viewing your own appointments in read-only mode.'
            : 'Your role has read-only access to appointments.'}
        </div>
      )}

      {/* Book Appointment Modal with Slot Conflict Prevention */}
      {isBookModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsBookModalOpen(false)}></div>
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
              <h3 className="text-lg font-bold font-outfit text-slate-800 dark:text-slate-200">Book New Appointment</h3>
              <button onClick={() => setIsBookModalOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"><X className="h-5 w-5" /></button>
            </div>

            {formError && (
              <div className="bg-rose-50 dark:bg-rose-950/20 border-l-4 border-rose-500 p-3 rounded-r-lg flex items-start gap-2 text-xs font-semibold text-rose-800 dark:text-rose-300 mb-4">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleBook} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Patient *</label>
                <select value={patientId} onChange={e => setPatientId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium">
                  <option value="">-- Select Patient --</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.id}) {p.allergySeverity && p.allergySeverity !== 'None' ? `[⚠️ Allergy: ${p.allergySeverity}]` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Doctor *</label>
                <select value={doctorId} onChange={e => setDoctorId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium">
                  <option value="">-- Select Doctor --</option>
                  {doctors.map(d => <option key={d.id} value={d.id}>{d.name} — {d.specialty} (${d.fee})</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Appointment Date *</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium" />
              </div>

              {/* Time Slots Grid with Conflict Indicators */}
              {doctorId && date ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Select Available Time Slot *</label>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {loadingSlots ? 'Checking slots...' : `${DEFAULT_TIME_SLOTS.length - bookedSlots.length} Slots Available`}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                    <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500 inline-block"></span> Available (15 min)</span>
                    <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-700 inline-block"></span> Booked (Disabled)</span>
                  </div>

                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 max-h-48 overflow-y-auto p-1 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-850">
                    {DEFAULT_TIME_SLOTS.map(t => {
                      const isBooked = bookedSlots.includes(t);
                      const isSelected = time === t;
                      return (
                        <button
                          key={t}
                          type="button"
                          disabled={isBooked}
                          onClick={() => setTime(t)}
                          className={`px-1.5 py-2 rounded-lg text-xs font-bold transition-all border text-center flex flex-col items-center justify-center ${
                            isBooked
                              ? 'bg-slate-100 dark:bg-slate-800/80 text-slate-400 dark:text-slate-600 border-slate-200 dark:border-slate-800 cursor-not-allowed opacity-60 line-through'
                              : isSelected
                              ? 'bg-brand-600 text-white border-brand-700 shadow-md ring-2 ring-brand-400'
                              : 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/40 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                          }`}
                        >
                          <span className="font-mono">{t}</span>
                          <span className="text-[8px] font-normal leading-none mt-0.5 opacity-80">
                            {isBooked ? 'Booked' : 'Free'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs text-slate-400 font-medium flex items-center gap-2">
                  <Info className="h-4 w-4 text-slate-400" />
                  Select Doctor and Date to view live available time slots.
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setIsBookModalOpen(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-semibold">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-semibold shadow-md">Confirm Booking</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reschedule Appointment Modal */}
      {aptToReschedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setAptToReschedule(null)}></div>
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div>
                <h3 className="text-lg font-bold font-outfit text-slate-800 dark:text-slate-200">Reschedule Appointment</h3>
                <p className="text-xs text-slate-400">Patient: <span className="font-bold text-slate-700 dark:text-slate-300">{aptToReschedule.patientName}</span></p>
              </div>
              <button onClick={() => setAptToReschedule(null)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"><X className="h-5 w-5" /></button>
            </div>

            {/* Current Details Summary */}
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900 rounded-xl mb-4 text-xs space-y-1">
              <div className="flex justify-between text-indigo-900 dark:text-indigo-300 font-bold">
                <span>Doctor: {aptToReschedule.doctorName}</span>
                <span>ID: {aptToReschedule.id}</span>
              </div>
              <div className="text-indigo-700 dark:text-indigo-400 font-medium">
                Current Time: <span className="font-bold">{aptToReschedule.date} at {aptToReschedule.time}</span>
              </div>
            </div>

            {rescheduleError && (
              <div className="bg-rose-50 dark:bg-rose-950/20 border-l-4 border-rose-500 p-3 rounded-r-lg flex items-start gap-2 text-xs font-semibold text-rose-800 dark:text-rose-300 mb-4">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>{rescheduleError}</span>
              </div>
            )}

            <form onSubmit={handleReschedule} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">New Date *</label>
                <input
                  type="date"
                  value={rescheduleDate}
                  onChange={e => setRescheduleDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                />
              </div>

              {/* Reschedule Available Time Slots */}
              {rescheduleDate && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Select New Time Slot *</label>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {loadingRescheduleSlots ? 'Checking availability...' : `${DEFAULT_TIME_SLOTS.length - rescheduleBookedSlots.length} Slots Available`}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {DEFAULT_TIME_SLOTS.map(t => {
                      const isBooked = rescheduleBookedSlots.includes(t);
                      const isSelected = rescheduleTime === t;
                      return (
                        <button
                          key={t}
                          type="button"
                          disabled={isBooked}
                          onClick={() => setRescheduleTime(t)}
                          className={`px-2 py-2 rounded-lg text-xs font-bold transition-all border text-center flex flex-col items-center justify-center ${
                            isBooked
                              ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-400 border-rose-200 cursor-not-allowed line-through'
                              : isSelected
                              ? 'bg-indigo-600 text-white border-indigo-700 shadow-md ring-2 ring-indigo-400'
                              : 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          }`}
                        >
                          <span>{t}</span>
                          <span className="text-[9px] font-normal leading-tight mt-0.5">
                            {isBooked ? 'Already Booked' : 'Slot Available'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setAptToReschedule(null)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-semibold">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-md flex items-center gap-1.5">
                  <RefreshCw className="h-4 w-4" /> Confirm Reschedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Confirmation */}
      {aptToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setAptToCancel(null)}></div>
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold font-outfit text-slate-800">Cancel Appointment?</h3>
            <p className="text-sm text-slate-500 mt-2">This appointment will be marked as Cancelled and cannot be undone.</p>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button onClick={() => setAptToCancel(null)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold">Keep</button>
              <button onClick={() => { cancelAppointment(aptToCancel); setAptToCancel(null); }} className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-semibold">Yes, Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Appointments;
