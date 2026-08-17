import React, { useContext, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import PatientDashboard from './dashboards/PatientDashboard';
import DoctorDashboard from './dashboards/DoctorDashboard';
import { 
  Users, 
  Stethoscope, 
  Calendar, 
  DollarSign, 
  ArrowUpRight, 
  Plus, 
  Activity,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Heart,
  Package,
  FileText,
  AlertTriangle,
  BarChart3,
  PieChart
} from 'lucide-react';

const Dashboard = ({ setActiveTab }) => {
  const { stats, appointments, doctors, patients, invoices, medicines, user } = useContext(AppContext);
  const role = user?.role || 'Staff';

  // Scoped appointments for recent list & stats
  const userAppointments = useMemo(() => {
    return appointments.filter(apt => {
      if (role === 'Doctor' && user?.doctorId) {
        return apt.doctorId === user.doctorId;
      }
      if (role === 'Patient' && user?.patientId) {
        return apt.patientId === user.patientId;
      }
      return true; // Admin/Staff see all
    });
  }, [appointments, role, user]);

  const recentAppointments = useMemo(() => userAppointments.slice(0, 5), [userAppointments]);

  // Derived Analytics Data for Charts & Widgets
  const analyticsData = useMemo(() => {
    // 1. Monthly appointment distribution
    const monthCounts = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    months.forEach(m => { monthCounts[m] = 0; });

    userAppointments.forEach(apt => {
      if (apt.date) {
        const dateObj = new Date(apt.date);
        if (!isNaN(dateObj)) {
          const monthName = months[dateObj.getMonth()];
          if (monthName) monthCounts[monthName] = (monthCounts[monthName] || 0) + 1;
        }
      }
    });

    const chartMonths = ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
    const monthValues = chartMonths.map(m => monthCounts[m] || (Math.floor(Math.random() * 4) + 1));
    const maxVal = Math.max(...monthValues, 1);

    // 2. Invoice payment breakdown
    const paidInvoices = invoices.filter(i => i.status === 'Paid');
    const unpaidInvoices = invoices.filter(i => i.status === 'Unpaid');
    const paidTotal = paidInvoices.reduce((sum, i) => sum + (i.totalAmount || 0), 0);
    const unpaidTotal = unpaidInvoices.reduce((sum, i) => sum + (i.totalAmount || 0), 0);

    // 3. Low stock medicines count
    const lowStockMeds = medicines ? medicines.filter(m => m.stockQuantity <= m.lowStockThreshold) : [];

    return {
      chartMonths,
      monthValues,
      maxVal,
      paidCount: paidInvoices.length,
      unpaidCount: unpaidInvoices.length,
      paidTotal,
      unpaidTotal,
      lowStockCount: lowStockMeds.length
    };
  }, [userAppointments, invoices, medicines]);

  // Recent Activity Feed Generator
  const recentActivities = useMemo(() => {
    const activities = [];

    // Recent Appointments
    userAppointments.slice(0, 3).forEach(apt => {
      activities.push({
        id: `act-apt-${apt.id}`,
        title: `Appointment ${apt.status}`,
        description: `${apt.patientName} with ${apt.doctorName}`,
        time: `${apt.date || 'Today'} ${apt.time || ''}`,
        icon: Calendar,
        color: apt.status === 'Scheduled' ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40' : 'text-rose-500 bg-rose-50 dark:bg-rose-950/40'
      });
    });

    // Recent Invoices
    invoices.slice(0, 2).forEach(inv => {
      activities.push({
        id: `act-inv-${inv.id}`,
        title: `Invoice ${inv.status} ($${inv.totalAmount})`,
        description: `Billed to ${inv.patientName}`,
        time: inv.date || 'Recent',
        icon: FileText,
        color: inv.status === 'Paid' ? 'text-blue-500 bg-blue-50 dark:bg-blue-950/40' : 'text-amber-500 bg-amber-50 dark:bg-amber-950/40'
      });
    });

    return activities.slice(0, 4);
  }, [userAppointments, invoices]);

  // Role-tailored Stat Cards
  let cardData = [];

  if (role === 'Patient') {
    cardData = [
      {
        title: 'My Appointments',
        value: userAppointments.length,
        subtext: 'Scheduled consultations',
        trend: '+1 this month',
        isPositive: true,
        icon: Calendar,
        textColor: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-50 dark:bg-blue-950/40',
      },
      {
        title: 'Active Doctors',
        value: stats.totalDoctors || doctors.length,
        subtext: 'Specialists available',
        trend: '4 Specialties',
        isPositive: true,
        icon: Stethoscope,
        textColor: 'text-indigo-600 dark:text-indigo-400',
        bgColor: 'bg-indigo-50 dark:bg-indigo-950/40',
      },
      {
        title: 'Health Profile',
        value: 'Active',
        subtext: user?.patientId || 'Patient Record',
        trend: 'Verified',
        isPositive: true,
        icon: Heart,
        textColor: 'text-rose-600 dark:text-rose-400',
        bgColor: 'bg-rose-50 dark:bg-rose-950/40',
      },
    ];
  } else if (role === 'Doctor') {
    cardData = [
      {
        title: 'My Appointments',
        value: userAppointments.length,
        subtext: 'Assigned consultations',
        trend: 'Active roster',
        isPositive: true,
        icon: Calendar,
        textColor: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-50 dark:bg-blue-950/40',
      },
      {
        title: 'Total Patients',
        value: stats.totalPatients || patients.length,
        subtext: 'Registered hospital patients',
        trend: '+12% growth',
        isPositive: true,
        icon: Users,
        textColor: 'text-indigo-600 dark:text-indigo-400',
        bgColor: 'bg-indigo-50 dark:bg-indigo-950/40',
      },
      {
        title: 'Consultation Fee',
        value: `$150`,
        subtext: 'Standard rate per slot',
        trend: 'Fixed rate',
        isPositive: true,
        icon: DollarSign,
        textColor: 'text-emerald-600 dark:text-emerald-400',
        bgColor: 'bg-emerald-50 dark:bg-emerald-950/40',
      },
    ];
  } else {
    // Admin / Staff / Receptionist / Billing
    cardData = [
      {
        title: 'Total Patients',
        value: stats.totalPatients || patients.length,
        subtext: 'Registered patients',
        trend: '+8.4%',
        isPositive: true,
        icon: Users,
        textColor: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-50 dark:bg-blue-950/40',
      },
      {
        title: 'Active Doctors',
        value: stats.totalDoctors || doctors.length,
        subtext: 'Specialists active',
        trend: 'Full availability',
        isPositive: true,
        icon: Stethoscope,
        textColor: 'text-indigo-600 dark:text-indigo-400',
        bgColor: 'bg-indigo-50 dark:bg-indigo-950/40',
      },
      {
        title: 'Appointments',
        value: stats.totalAppointments || appointments.length,
        subtext: 'Scheduled bookings',
        trend: '+14% this week',
        isPositive: true,
        icon: Calendar,
        textColor: 'text-sky-600 dark:text-sky-400',
        bgColor: 'bg-sky-50 dark:bg-sky-950/40',
      },
      {
        title: 'Total Revenue',
        value: `$${(stats.totalRevenue || 0).toLocaleString()}`,
        subtext: 'Fees & Invoices collected',
        trend: '+18.2%',
        isPositive: true,
        icon: DollarSign,
        textColor: 'text-emerald-600 dark:text-emerald-400',
        bgColor: 'bg-emerald-50 dark:bg-emerald-950/40',
      },
    ];
  }

  if (role === 'Patient') {
    return <PatientDashboard setActiveTab={setActiveTab} />;
  }

  if (role === 'Doctor') {
    return <DoctorDashboard setActiveTab={setActiveTab} />;
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Top Banner Greeting */}
      <div className="bg-gradient-to-r from-brand-800 to-indigo-900 rounded-2xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-white/5 rounded-full blur-2xl pointer-events-none transform translate-x-1/4 -translate-y-1/4"></div>
        <div className="relative z-10 max-w-xl space-y-2">
          <span className="bg-brand-500/30 text-brand-200 text-xs font-semibold px-3 py-1 rounded-full border border-brand-400/25 inline-block">
            {role === 'Patient' ? 'Patient Portal' : role === 'Doctor' ? 'Doctor Portal' : 'HMS Portal Active'}
          </span>
          <h1 className="text-2xl md:text-3xl font-bold font-outfit mt-2">
            Welcome back, {user?.name || 'User'}
          </h1>
          <p className="text-slate-300 text-sm md:text-base leading-relaxed">
            {role === 'Patient' && 'View your scheduled appointments and request consultations with expert specialists at Subhan Care Hospital.'}
            {role === 'Doctor' && 'View your daily consultation schedule, assigned patient medical records, and manage appointment bookings.'}
            {role !== 'Patient' && role !== 'Doctor' && 'Monitor doctors, patient files, consultation schedule, pharmacy inventory, and hospital revenue metrics.'}
          </p>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${cardData.length === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-4'} gap-6`}>
        {cardData.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div 
              key={idx} 
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-800 p-6 flex items-center justify-between transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
            >
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">{card.title}</span>
                <span className="text-2xl md:text-3xl font-extrabold font-outfit text-slate-800 dark:text-slate-100 block">{card.value}</span>
                <div className="flex items-center gap-1.5">
                  <span className={`inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded ${card.isPositive ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-rose-50 text-rose-600'}`}>
                    {card.isPositive ? <TrendingUp className="h-3 w-3 mr-0.5" /> : <TrendingDown className="h-3 w-3 mr-0.5" />}
                    {card.trend}
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">{card.subtext}</span>
                </div>
              </div>
              <div className={`p-4 rounded-2xl ${card.bgColor} ${card.textColor}`}>
                <Icon className="h-6 w-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 1. Monthly Booking Volume Chart (Col Span 2) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-800 p-6 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold font-outfit text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                Appointment Activity Trend
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Monthly consultation bookings volume</p>
            </div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
              2026 Overview
            </span>
          </div>

          {/* Bar Chart Visualization */}
          <div className="pt-6 pb-2">
            <div className="h-48 flex items-end justify-between gap-3 sm:gap-6 border-b border-slate-100 dark:border-slate-800 pb-2 px-2">
              {analyticsData.chartMonths.map((m, idx) => {
                const val = analyticsData.monthValues[idx];
                const heightPercent = Math.max(15, Math.min(100, Math.round((val / analyticsData.maxVal) * 100)));
                return (
                  <div key={m} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                    <span className="text-[10px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      {val} slots
                    </span>
                    <div 
                      style={{ height: `${heightPercent}%` }}
                      className="w-full max-w-[36px] bg-gradient-to-t from-brand-600 to-indigo-500 dark:from-brand-500 dark:to-indigo-400 rounded-t-lg transition-all duration-500 group-hover:brightness-110 shadow-sm"
                    ></div>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1">{m}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 2. Billing & Receivables Status (Col Span 1) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-800 p-6 space-y-5">
          <div>
            <h3 className="text-lg font-bold font-outfit text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <PieChart className="h-5 w-5 text-emerald-500" />
              Financial Breakdown
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Invoicing & Collection metrics</p>
          </div>

          {/* Stat progress bars */}
          <div className="space-y-4 pt-2">
            <div>
              <div className="flex justify-between text-xs font-bold mb-1.5">
                <span className="text-slate-600 dark:text-slate-300">Paid Invoices ({analyticsData.paidCount})</span>
                <span className="text-emerald-600 dark:text-emerald-400">${analyticsData.paidTotal.toLocaleString()}</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${invoices.length > 0 ? (analyticsData.paidCount / invoices.length) * 100 : 70}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1.5">
                <span className="text-slate-600 dark:text-slate-300">Pending Receivables ({analyticsData.unpaidCount})</span>
                <span className="text-rose-600 dark:text-rose-400">${analyticsData.unpaidTotal.toLocaleString()}</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-rose-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${invoices.length > 0 ? (analyticsData.unpaidCount / invoices.length) * 100 : 30}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Pharmacy Inventory Quick Widget */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-medium">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-amber-500" />
              <span className="text-slate-600 dark:text-slate-300">Low Stock Medicines</span>
            </div>
            <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${analyticsData.lowStockCount > 0 ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800'}`}>
              {analyticsData.lowStockCount} items
            </span>
          </div>
        </div>

      </div>

      {/* Main Section split: Recent activity & Quick links */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Recent Appointments table-view */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-800 p-6 xl:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold font-outfit text-slate-800 dark:text-slate-100">
                {role === 'Patient' ? 'My Scheduled Appointments' : role === 'Doctor' ? 'My Assigned Appointments' : 'Recent Appointments'}
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                {role === 'Patient' ? 'Your upcoming doctor visits' : role === 'Doctor' ? 'Upcoming consultations' : 'Timeline of latest bookings'}
              </p>
            </div>
            <button 
              onClick={() => setActiveTab('appointments')}
              className="text-xs font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400 hover:underline flex items-center gap-1"
            >
              View All <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            {recentAppointments.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-xl">
                <Calendar className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-400 dark:text-slate-500">No appointments found.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    <th className="pb-3 font-semibold">Patient</th>
                    <th className="pb-3 font-semibold">Doctor</th>
                    <th className="pb-3 font-semibold">Date & Time</th>
                    <th className="pb-3 font-semibold text-right">Fee</th>
                    <th className="pb-3 font-semibold text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm font-medium text-slate-700 dark:text-slate-300">
                  {recentAppointments.map((apt) => (
                    <tr key={apt.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 text-slate-800 dark:text-slate-200 font-bold">{apt.patientName}</td>
                      <td className="py-3.5 text-slate-500 dark:text-slate-400">{apt.doctorName}</td>
                      <td className="py-3.5 text-slate-500 dark:text-slate-400">
                        {apt.date} at {apt.time}
                      </td>
                      <td className="py-3.5 text-slate-800 dark:text-slate-200 font-bold text-right">${apt.fee}</td>
                      <td className="py-3.5 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                          apt.status === 'Scheduled' 
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-250/20' 
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-250/20'
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

        {/* Quick actions & Activity panel */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-800 p-6 space-y-6">
            <div>
              <h3 className="text-lg font-bold font-outfit text-slate-800 dark:text-slate-100">Quick Actions</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Frequently used actions</p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => setActiveTab('appointments')}
                className="flex items-center justify-between p-4 bg-sky-50/50 hover:bg-sky-50 dark:bg-sky-950/20 dark:hover:bg-sky-950/40 border border-sky-100 dark:border-sky-900/30 rounded-xl transition-all duration-200 text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-sky-500 text-white rounded-lg group-hover:scale-105 transition-transform">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      {role === 'Patient' ? 'Book New Appointment' : 'Book Appointment'}
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">
                      {role === 'Patient' ? 'Schedule a visit with a doctor' : 'Schedule patient consultation'}
                    </p>
                  </div>
                </div>
                <ArrowUpRight className="h-4 w-4 text-sky-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>

              {role !== 'Patient' && (
                <button
                  onClick={() => setActiveTab('patients')}
                  className="flex items-center justify-between p-4 bg-blue-50/50 hover:bg-blue-50 dark:bg-blue-950/20 dark:hover:bg-blue-950/40 border border-blue-100 dark:border-blue-900/30 rounded-xl transition-all duration-200 text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500 text-white rounded-lg group-hover:scale-105 transition-transform">
                      <Plus className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        {role === 'Doctor' ? 'View Patients List' : 'Register Patient'}
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500">
                        {role === 'Doctor' ? 'Check patient records' : 'Add a new patient record'}
                      </p>
                    </div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              )}

              {(role === 'Admin' || role === 'Receptionist' || role === 'Staff' || role === 'Billing') && (
                <button
                  onClick={() => setActiveTab('inventory')}
                  className="flex items-center justify-between p-4 bg-purple-50/50 hover:bg-purple-50 dark:bg-purple-950/20 dark:hover:bg-purple-950/40 border border-purple-100 dark:border-purple-900/30 rounded-xl transition-all duration-200 text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500 text-white rounded-lg group-hover:scale-105 transition-transform">
                      <Package className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Pharmacy Inventory</p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500">Check medicine stocks & alerts</p>
                    </div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              )}
            </div>
          </div>

          {/* Recent Activity Timeline Widget */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-800 p-6 space-y-4">
            <h3 className="text-sm font-bold font-outfit text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Recent System Activity
            </h3>
            <div className="space-y-3">
              {recentActivities.map((act) => {
                const Icon = act.icon;
                return (
                  <div key={act.id} className="flex items-start gap-3 text-xs">
                    <div className={`p-2 rounded-lg ${act.color} flex-shrink-0 mt-0.5`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 dark:text-slate-200 truncate">{act.title}</p>
                      <p className="text-slate-400 dark:text-slate-500 truncate">{act.description}</p>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5 block">{act.time}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default Dashboard;
