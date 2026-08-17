import React, { useContext, useMemo } from 'react';
import { AppContext } from '../../context/AppContext';
import { Calendar, FileText, Activity, Clock, Plus, Heart, CreditCard } from 'lucide-react';

const PatientDashboard = ({ setActiveTab }) => {
  const { user, appointments, invoices } = useContext(AppContext);

  const patientAppointments = useMemo(() => {
    return appointments.filter(apt => apt.patientId === user?.patientId);
  }, [appointments, user]);

  const patientInvoices = useMemo(() => {
    return invoices.filter(inv => inv.patientId === user?.patientId);
  }, [invoices, user]);

  const recentAppointments = patientAppointments.slice(0, 3);
  const recentInvoices = patientInvoices.slice(0, 3);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-2xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-xl space-y-2">
          <span className="bg-blue-500/30 text-blue-200 text-xs font-semibold px-3 py-1 rounded-full border border-blue-400/25 inline-block">
            Patient Portal
          </span>
          <h1 className="text-2xl md:text-3xl font-bold font-outfit mt-2">
            Welcome back, {user?.name || 'Patient'}
          </h1>
          <p className="text-blue-100 text-sm md:text-base leading-relaxed">
            Manage your appointments, view medical records, and stay on top of your health journey.
          </p>
          <div className="pt-4">
            <button
              onClick={() => setActiveTab && setActiveTab('appointments')}
              className="bg-white text-blue-700 hover:bg-blue-50 px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-colors flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Book Appointment
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-800 p-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Upcoming</p>
            <p className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 mt-1">{patientAppointments.filter(a => a.status === 'Scheduled').length}</p>
          </div>
          <div className="p-4 rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
            <Calendar className="h-6 w-6" />
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-800 p-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lab Reports</p>
            <p className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 mt-1">View</p>
          </div>
          <div className="p-4 rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
            <Activity className="h-6 w-6" />
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-800 p-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Unpaid Invoices</p>
            <p className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 mt-1">{patientInvoices.filter(i => i.status === 'Unpaid').length}</p>
          </div>
          <div className="p-4 rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
            <CreditCard className="h-6 w-6" />
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-800 p-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">My Health</p>
            <p className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 mt-1">Profile</p>
          </div>
          <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
            <Heart className="h-6 w-6" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-800 p-6">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-500" />
            Recent Appointments
          </h3>
          <div className="space-y-4">
            {recentAppointments.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">No recent appointments.</p>
            ) : (
              recentAppointments.map(apt => (
                <div key={apt.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                      <Clock className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Dr. {apt.doctorName || 'Assigned Doctor'}</p>
                      <p className="text-xs text-slate-500">{apt.date} • {apt.time}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    apt.status === 'Completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  }`}>
                    {apt.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-800 p-6">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-500" />
            Recent Invoices
          </h3>
          <div className="space-y-4">
            {recentInvoices.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">No recent invoices.</p>
            ) : (
              recentInvoices.map(inv => (
                <div key={inv.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Invoice #{inv.id}</p>
                    <p className="text-xs text-slate-500">{inv.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">${inv.totalAmount}</p>
                    <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                      inv.status === 'Paid' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                      'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                    }`}>
                      {inv.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
