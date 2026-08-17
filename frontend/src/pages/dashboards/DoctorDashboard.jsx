import React, { useContext, useMemo } from 'react';
import { AppContext } from '../../context/AppContext';
import { Calendar, Users, Stethoscope, Activity, Clock, Edit } from 'lucide-react';

const DoctorDashboard = ({ setActiveTab }) => {
  const { user, appointments, patients } = useContext(AppContext);

  const doctorAppointments = useMemo(() => {
    return appointments.filter(apt => apt.doctorId === user?.doctorId);
  }, [appointments, user]);

  const todayAppointments = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return doctorAppointments.filter(apt => apt.date === today || apt.status === 'Scheduled');
  }, [doctorAppointments]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="bg-gradient-to-r from-indigo-700 to-purple-800 rounded-2xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-xl space-y-2">
          <span className="bg-indigo-500/30 text-indigo-200 text-xs font-semibold px-3 py-1 rounded-full border border-indigo-400/25 inline-block">
            Doctor Portal
          </span>
          <h1 className="text-2xl md:text-3xl font-bold font-outfit mt-2">
            Welcome back, Dr. {user?.name || 'Doctor'}
          </h1>
          <p className="text-indigo-100 text-sm md:text-base leading-relaxed">
            Manage your daily schedule, consult patients, and prescribe treatments.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-800 p-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Today's Schedule</p>
            <p className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 mt-1">{todayAppointments.length}</p>
          </div>
          <div className="p-4 rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
            <Calendar className="h-6 w-6" />
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-800 p-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">My Patients</p>
            <p className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 mt-1">{patients.length}</p>
          </div>
          <div className="p-4 rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
            <Users className="h-6 w-6" />
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-800 p-6 flex gap-4">
          <button 
            onClick={() => setActiveTab && setActiveTab('prescriptions')}
            className="flex-1 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 p-3 rounded-xl flex flex-col items-center justify-center transition-colors"
          >
            <Edit className="h-5 w-5 mb-1" />
            <span className="text-xs font-bold">Write Rx</span>
          </button>
          <button 
            onClick={() => setActiveTab && setActiveTab('lab')}
            className="flex-1 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/40 text-purple-600 dark:text-purple-400 p-3 rounded-xl flex flex-col items-center justify-center transition-colors"
          >
            <Activity className="h-5 w-5 mb-1" />
            <span className="text-xs font-bold">Order Lab</span>
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-800 p-6">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-indigo-500" />
          Today's Appointments
        </h3>
        <div className="space-y-3">
          {todayAppointments.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">No appointments scheduled for today.</p>
          ) : (
            todayAppointments.map(apt => (
              <div key={apt.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-4">
                  <div className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 p-3 rounded-lg text-center min-w-[70px]">
                    <p className="text-xs font-bold">{apt.time || 'TBD'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{apt.patientName}</p>
                    <p className="text-xs text-slate-500 capitalize">{apt.type || 'Consultation'}</p>
                  </div>
                </div>
                <button className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                  View File
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
