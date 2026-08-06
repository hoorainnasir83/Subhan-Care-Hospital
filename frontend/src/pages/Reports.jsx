import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  BarChart3, Users, Stethoscope, Calendar, Activity, Filter, DollarSign, Loader2, FileText, Package, AlertTriangle, FileSpreadsheet, Printer
} from 'lucide-react';
import toast from 'react-hot-toast';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell 
} from 'recharts';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { subDays, format, startOfMonth } from 'date-fns';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const COLORS = ['#2563eb', '#16a34a', '#ca8a04', '#dc2626', '#9333ea', '#0891b2'];

const Reports = () => {
  const token = localStorage.getItem('hms_token');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  
  // Filters
  const [dateRange, setDateRange] = useState('all');
  const [doctorFilter, setDoctorFilter] = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'revenue', label: 'Revenue', icon: DollarSign },
    { id: 'patients', label: 'Patients', icon: Users },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'doctors', label: 'Doctors', icon: Stethoscope },
    { id: 'pharmacy', label: 'Pharmacy', icon: Package },
  ];

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    // Compute date ranges
    let startDate = '';
    let endDate = format(new Date(), 'yyyy-MM-dd');
    if (dateRange === '7days') {
      startDate = format(subDays(new Date(), 7), 'yyyy-MM-dd');
    } else if (dateRange === '30days') {
      startDate = format(subDays(new Date(), 30), 'yyyy-MM-dd');
    } else if (dateRange === 'thisMonth') {
      startDate = format(startOfMonth(new Date()), 'yyyy-MM-dd');
    }

    try {
      const res = await axios.get(`${API_URL}/reports/${activeTab}`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          startDate: startDate || undefined,
          endDate: startDate ? endDate : undefined,
          doctorId: doctorFilter !== 'All' ? doctorFilter : undefined,
          department: departmentFilter !== 'All' ? departmentFilter : undefined,
          status: statusFilter !== 'All' ? statusFilter : undefined
        }
      });
      if (res.data.success) {
        setData(res.data.data);
      } else {
        setError('Failed to fetch data');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'An error occurred while fetching reports');
      toast.error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, dateRange, doctorFilter, departmentFilter, statusFilter]);

  // Export PDF
  const exportPDF = () => {
    if (!data) return toast.error('No data to export');
    const doc = new jsPDF();
    doc.text(`${activeTab.toUpperCase()} REPORT`, 14, 15);
    
    if (activeTab === 'appointments' && data.list) {
      doc.autoTable({
        head: [['Appt ID', 'Patient', 'Doctor', 'Date', 'Time', 'Fee', 'Status']],
        body: data.list.map(a => [a.id, a.patientName, a.doctorName, a.date, a.time, `$${a.fee}`, a.status]),
        startY: 20
      });
    } else if (activeTab === 'patients' && data.list) {
      doc.autoTable({
        head: [['Patient ID', 'Name', 'Gender', 'Phone', 'Email', 'Registered Date']],
        body: data.list.map(p => [p.id, p.name, p.gender, p.phone, p.email, p.registeredDate]),
        startY: 20
      });
    } else if (activeTab === 'revenue' && data.list) {
      doc.autoTable({
        head: [['Invoice ID', 'Patient', 'Date', 'Total Amount', 'Status']],
        body: data.list.map(i => [i.id, i.patientName, i.date, `$${i.totalAmount}`, i.status]),
        startY: 20
      });
    } else if (activeTab === 'pharmacy' && data.list) {
      doc.autoTable({
        head: [['Medicine ID', 'Name', 'Category', 'Stock', 'Threshold', 'Selling Price']],
        body: data.list.map(m => [m.id, m.name, m.category, m.stockQuantity, m.lowStockThreshold, `$${m.sellingPrice}`]),
        startY: 20
      });
    } else if (activeTab === 'doctors' && data.list) {
      doc.autoTable({
        head: [['Doctor ID', 'Name', 'Specialty', 'Phone', 'Fee', 'Consults', 'Rating']],
        body: data.list.map(d => [d.id, d.name, d.specialty, d.phone, `$${d.fee}`, d.consultsCount, d.rating]),
        startY: 20
      });
    } else {
      doc.text('Detailed list export not supported for Dashboard overview.', 14, 30);
    }
    
    doc.save(`subhancare-${activeTab}-report.pdf`);
    toast.success('PDF Exported Successfully');
  };

  // Export Excel
  const exportExcel = () => {
    if (!data) return toast.error('No data to export');
    let exportData = [];
    
    if (activeTab === 'appointments' && data.list) {
      exportData = data.list.map(a => ({ ID: a.id, Patient: a.patientName, Doctor: a.doctorName, Date: a.date, Time: a.time, Fee: a.fee, Status: a.status }));
    } else if (activeTab === 'patients' && data.list) {
      exportData = data.list.map(p => ({ ID: p.id, Name: p.name, Gender: p.gender, Phone: p.phone, Email: p.email, Registered: p.registeredDate }));
    } else if (activeTab === 'revenue' && data.list) {
      exportData = data.list.map(i => ({ ID: i.id, Patient: i.patientName, Date: i.date, Total: i.totalAmount, Status: i.status }));
    } else if (activeTab === 'pharmacy' && data.list) {
      exportData = data.list.map(m => ({ ID: m.id, Name: m.name, Category: m.category, Stock: m.stockQuantity, Threshold: m.lowStockThreshold, Price: m.sellingPrice }));
    } else if (activeTab === 'doctors' && data.list) {
      exportData = data.list.map(d => ({ ID: d.id, Name: d.name, Specialty: d.specialty, Phone: d.phone, Fee: d.fee, Consults: d.consultsCount, Rating: d.rating }));
    } else {
      return toast.error('No detailed list available to export to Excel.');
    }

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
    XLSX.writeFile(workbook, `subhancare-${activeTab}-report.xlsx`);
    toast.success('Excel Exported Successfully');
  };

  const handlePrint = () => {
    window.print();
  };

  // --- Renderers ---
  const renderDashboard = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Patients</p>
            <h3 className="text-3xl font-bold font-outfit text-slate-800 dark:text-slate-200">{data?.totalPatients || 0}</h3>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-full"><Users className="h-8 w-8 text-blue-600" /></div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Today's Revenue</p>
            <h3 className="text-3xl font-bold font-outfit text-emerald-600">${data?.todayRevenue || 0}</h3>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-900/30 p-4 rounded-full"><DollarSign className="h-8 w-8 text-emerald-600" /></div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Pending Bills</p>
            <h3 className="text-3xl font-bold font-outfit text-rose-600">${data?.pendingBills || 0}</h3>
          </div>
          <div className="bg-rose-50 dark:bg-rose-900/30 p-4 rounded-full"><AlertTriangle className="h-8 w-8 text-rose-600" /></div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Doctors</p>
            <h3 className="text-3xl font-bold font-outfit text-slate-800 dark:text-slate-200">{data?.totalDoctors || 0}</h3>
          </div>
          <div className="bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-full"><Stethoscope className="h-8 w-8 text-indigo-600" /></div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Today's Appointments</p>
            <h3 className="text-3xl font-bold font-outfit text-slate-800 dark:text-slate-200">{data?.todayAppointments || 0}</h3>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/30 p-4 rounded-full"><Calendar className="h-8 w-8 text-amber-600" /></div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Low Stock Medicines</p>
            <h3 className="text-3xl font-bold font-outfit text-rose-600">{data?.lowStockMedicines || 0}</h3>
          </div>
          <div className="bg-rose-50 dark:bg-rose-900/30 p-4 rounded-full"><Package className="h-8 w-8 text-rose-600" /></div>
        </div>
      </div>
    </div>
  );

  const renderRevenue = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
        <h3 className="text-lg font-bold font-outfit text-slate-800 dark:text-slate-200 mb-6">Monthly Revenue Breakdown (Current Year)</h3>
        {data?.monthlyRevenue?.length === 0 ? (
          <div className="flex flex-col items-center py-10"><AlertTriangle className="h-10 w-10 text-slate-300 mb-2" /><p className="text-slate-500">No revenue data available</p></div>
        ) : (
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.monthlyRevenue || []} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" tickFormatter={(value) => `$${value}`} />
                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'}} formatter={(value) => `$${value}`} />
                <Legend />
                <Bar dataKey="invoices" name="Invoice Revenue" stackId="a" fill="#2563eb" radius={[0,0,4,4]} />
                <Bar dataKey="appointments" name="Appointment Fees" stackId="a" fill="#10b981" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );

  const renderPatients = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
          <h3 className="text-lg font-bold font-outfit text-slate-800 dark:text-slate-200 mb-6">Monthly Registrations (Current Year)</h3>
          {data?.monthlyRegistrations?.length === 0 ? (
            <div className="flex flex-col items-center py-10"><AlertTriangle className="h-10 w-10 text-slate-300 mb-2" /><p className="text-slate-500">No patient registrations</p></div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data?.monthlyRegistrations || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'}} />
                  <Line type="monotone" dataKey="patients" name="New Patients" stroke="#2563eb" strokeWidth={3} dot={{r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 6}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
          <h3 className="text-lg font-bold font-outfit text-slate-800 dark:text-slate-200 mb-6">Demographics</h3>
          {data?.genderDistribution?.length === 0 ? (
            <div className="flex flex-col items-center py-10"><AlertTriangle className="h-10 w-10 text-slate-300 mb-2" /><p className="text-slate-500">No demographics data</p></div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data?.genderDistribution || []} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {(data?.genderDistribution || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'}} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderAppointments = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
        <h3 className="text-lg font-bold font-outfit text-slate-800 dark:text-slate-200 mb-6">Appointment Status Distribution</h3>
        {data?.statusDistribution?.length === 0 ? (
          <div className="flex flex-col items-center py-10"><AlertTriangle className="h-10 w-10 text-slate-300 mb-2" /><p className="text-slate-500">No appointments found</p></div>
        ) : (
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.statusDistribution || []} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" stroke="#94a3b8" />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" width={100} />
                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'}} />
                <Bar dataKey="value" name="Appointments" fill="#6366f1" radius={[0,4,4,0]}>
                  {(data?.statusDistribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );

  const renderDoctors = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
        <h3 className="text-lg font-bold font-outfit text-slate-800 dark:text-slate-200 mb-6">Top Doctors by Consultations</h3>
        {data?.topDoctors?.length === 0 ? (
          <div className="flex flex-col items-center py-10"><AlertTriangle className="h-10 w-10 text-slate-300 mb-2" /><p className="text-slate-500">No doctors data found</p></div>
        ) : (
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.topDoctors || []} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{fontSize: 12}} />
                <YAxis stroke="#94a3b8" />
                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'}} />
                <Bar dataKey="appointments" name="Consultations" fill="#3b82f6" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );

  const renderPharmacy = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-center">
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Total Inventory Value</p>
          <h3 className="text-4xl font-bold font-outfit text-emerald-600">${data?.stats?.totalValue?.toLocaleString() || 0}</h3>
          <p className="text-xs text-slate-400 mt-2">Across {data?.stats?.totalItems || 0} unique medicine variations</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
          <h3 className="text-lg font-bold font-outfit text-slate-800 dark:text-slate-200 mb-6">Inventory by Category</h3>
          {data?.categories?.length === 0 ? (
            <div className="flex flex-col items-center py-10"><AlertTriangle className="h-10 w-10 text-slate-300 mb-2" /><p className="text-slate-500">No inventory data found</p></div>
          ) : (
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data?.categories || []} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value">
                    {(data?.categories || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'}} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 theme-transition print-area">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-outfit text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-brand-600" />
            Reports & Analytics
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Data-driven insights for Subhan Care Hospital</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="pl-9 pr-8 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 shadow-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
            >
              <option value="all">All Time</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="thisMonth">This Month</option>
            </select>
          </div>
          <button onClick={exportPDF} disabled={loading} className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-100 disabled:opacity-50 dark:bg-rose-900/30 dark:hover:bg-rose-900/50 rounded-lg shadow-sm border border-rose-200 dark:border-rose-800 transition-colors" title="Export as PDF">
            <FileText className="h-5 w-5" />
          </button>
          <button onClick={exportExcel} disabled={loading} className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 disabled:opacity-50 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 rounded-lg shadow-sm border border-emerald-200 dark:border-emerald-800 transition-colors" title="Export as Excel">
            <FileSpreadsheet className="h-5 w-5" />
          </button>
          <button onClick={handlePrint} className="p-2 bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 transition-colors" title="Print">
            <Printer className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto hide-scrollbar gap-2 p-1 bg-slate-100/50 dark:bg-slate-900/50 rounded-xl border border-slate-200/50 dark:border-slate-800/50 no-print">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all duration-200
                ${isActive ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-sm border border-slate-200 dark:border-slate-700' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'}`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400'}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Dynamic Filters Area */}
      <div className="no-print">
        {activeTab === 'appointments' && (
          <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
            <span className="text-sm font-semibold text-slate-500">Refine by:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        )}
        
        {activeTab === 'doctors' && (
          <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
            <span className="text-sm font-semibold text-slate-500">Refine by:</span>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 outline-none"
            >
              <option value="All">All Departments</option>
              <option value="Cardiology">Cardiology</option>
              <option value="Neurology">Neurology</option>
              <option value="Orthopedics">Orthopedics</option>
              <option value="Pediatrics">Pediatrics</option>
              <option value="General">General</option>
            </select>
          </div>
        )}
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-10 w-10 text-brand-500 animate-spin mb-4" />
          <p className="text-slate-500 font-medium">Generating Report Data...</p>
        </div>
      ) : error ? (
        <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl p-6 text-center">
          <AlertTriangle className="h-10 w-10 text-rose-500 mx-auto mb-3" />
          <h3 className="text-rose-800 dark:text-rose-400 font-bold mb-1">Failed to Load</h3>
          <p className="text-sm text-rose-600/80 dark:text-rose-400/80">{error}</p>
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'revenue' && renderRevenue()}
          {activeTab === 'patients' && renderPatients()}
          {activeTab === 'appointments' && renderAppointments()}
          {activeTab === 'doctors' && renderDoctors()}
          {activeTab === 'pharmacy' && renderPharmacy()}
        </div>
      )}

    </div>
  );
};

export default Reports;
