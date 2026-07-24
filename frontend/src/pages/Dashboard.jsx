import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { 
  Users, 
  Stethoscope, 
  Calendar, 
  DollarSign, 
  ArrowUpRight, 
  Plus, 
  Activity,
  CheckCircle,
  Clock
} from 'lucide-react';

const Dashboard = ({ setActiveTab }) => {
  const { stats, appointments, user } = useContext(AppContext);

  // Get up to 4 most recent appointments
  const recentAppointments = appointments.slice(0, 4);

  // Cards configuration
  const cardData = [
    {
      title: 'Total Patients',
      value: stats.totalPatients,
      subtext: 'Registered patients',
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Active Doctors',
      value: stats.totalDoctors,
      subtext: 'Specialists active',
      icon: Stethoscope,
      color: 'from-indigo-500 to-indigo-600',
      textColor: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
    {
      title: 'Scheduled Appointments',
      value: stats.totalAppointments,
      subtext: 'Pending consultations',
      icon: Calendar,
      color: 'from-sky-500 to-sky-600',
      textColor: 'text-sky-600',
      bgColor: 'bg-sky-50',
    },
    {
      title: 'Total Revenue',
      value: `$${stats.totalRevenue.toLocaleString()}`,
      subtext: 'Consultation fees collected',
      icon: DollarSign,
      color: 'from-emerald-500 to-emerald-600',
      textColor: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Top Banner Greeting */}
      <div className="bg-gradient-to-r from-brand-800 to-indigo-900 rounded-2xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-white/5 rounded-full blur-2xl pointer-events-none transform translate-x-1/4 -translate-y-1/4"></div>
        <div className="relative z-10 max-w-xl space-y-2">
          <span className="bg-brand-500/30 text-brand-200 text-xs font-semibold px-3 py-1 rounded-full border border-brand-400/25">
            HMS Portal Active
          </span>
          <h1 className="text-2xl md:text-3xl font-bold font-outfit mt-2">
            Welcome back, {user?.name || 'Administrator'}
          </h1>
          <p className="text-slate-350 text-sm md:text-base leading-relaxed">
            Monitor and manage doctors, patient medical files, consultation booking states, and hospital revenue metrics all in one place.
          </p>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cardData.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div 
              key={idx} 
              className="bg-white rounded-2xl border border-slate-150 p-6 flex items-center justify-between transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
            >
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">{card.title}</span>
                <span className="text-2xl md:text-3xl font-extrabold font-outfit text-slate-800 block">{card.value}</span>
                <span className="text-xs text-slate-500 font-medium block">{card.subtext}</span>
              </div>
              <div className={`p-4 rounded-2xl ${card.bgColor} ${card.textColor}`}>
                <Icon className="h-6 w-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Section split: Recent activity & Quick links */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Recent Appointments table-view */}
        <div className="bg-white rounded-2xl border border-slate-150 p-6 xl:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold font-outfit text-slate-800">Recent Appointments</h3>
              <p className="text-xs text-slate-400 font-medium">Timeline of the latest bookings</p>
            </div>
            <button 
              onClick={() => setActiveTab('appointments')}
              className="text-xs font-bold text-brand-600 hover:text-brand-700 hover:underline flex items-center gap-1"
            >
              View All <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            {recentAppointments.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed border-slate-100 rounded-xl">
                <Calendar className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-400">No appointments scheduled.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <th className="pb-3 font-semibold">Patient</th>
                    <th className="pb-3 font-semibold">Doctor</th>
                    <th className="pb-3 font-semibold">Date & Time</th>
                    <th className="pb-3 font-semibold text-right">Fee</th>
                    <th className="pb-3 font-semibold text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-medium">
                  {recentAppointments.map((apt) => (
                    <tr key={apt.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 text-slate-800 font-bold">{apt.patientName}</td>
                      <td className="py-3.5 text-slate-500">{apt.doctorName}</td>
                      <td className="py-3.5 text-slate-500">
                        {apt.date} at {apt.time}
                      </td>
                      <td className="py-3.5 text-slate-800 font-bold text-right">${apt.fee}</td>
                      <td className="py-3.5 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                          apt.status === 'Scheduled' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-250/20' 
                            : 'bg-rose-50 text-rose-700 border border-rose-250/20'
                        }`}>
                          {apt.status === 'Scheduled' ? (
                            <>
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                              Scheduled
                            </>
                          ) : (
                            <>
                              <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
                              Cancelled
                            </>
                          )}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Quick actions panel */}
        <div className="bg-white rounded-2xl border border-slate-150 p-6 space-y-6">
          <div>
            <h3 className="text-lg font-bold font-outfit text-slate-800">Quick Actions</h3>
            <p className="text-xs text-slate-400 font-medium">Frequently used triggers</p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <button
              onClick={() => setActiveTab('patients')}
              className="flex items-center justify-between p-4 bg-blue-50/50 hover:bg-blue-50 border border-blue-100 rounded-xl transition-all duration-200 text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500 text-white rounded-lg group-hover:scale-105 transition-transform">
                  <Plus className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Register Patient</p>
                  <p className="text-[11px] text-slate-400">Add a new patient record</p>
                </div>
              </div>
              <ArrowUpRight className="h-4 w-4 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

            <button
              onClick={() => setActiveTab('doctors')}
              className="flex items-center justify-between p-4 bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100 rounded-xl transition-all duration-200 text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500 text-white rounded-lg group-hover:scale-105 transition-transform">
                  <Plus className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Recruit Doctor</p>
                  <p className="text-[11px] text-slate-400">Add a physician to roster</p>
                </div>
              </div>
              <ArrowUpRight className="h-4 w-4 text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

            <button
              onClick={() => setActiveTab('appointments')}
              className="flex items-center justify-between p-4 bg-sky-50/50 hover:bg-sky-50 border border-sky-100 rounded-xl transition-all duration-200 text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-sky-500 text-white rounded-lg group-hover:scale-105 transition-transform">
                  <Calendar className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Book Appointment</p>
                  <p className="text-[11px] text-slate-400">Schedule patient consultation</p>
                </div>
              </div>
              <ArrowUpRight className="h-4 w-4 text-sky-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>

          {/* Quick Clinic Activity summary widget */}
          <div className="bg-slate-50 rounded-xl border border-slate-100 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase">Hospital Status</span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                <Activity className="h-3 w-3" /> Optimal
              </span>
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                  <span>Occupancy Efficiency</span>
                  <span>78%</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div className="bg-brand-500 h-full rounded-full" style={{ width: '78%' }}></div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                <span>All database states synchronized</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default Dashboard;
