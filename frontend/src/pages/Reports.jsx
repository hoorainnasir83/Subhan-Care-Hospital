import React, { useState, useContext, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Star, 
  Calendar, 
  Activity, 
  Filter,
  DollarSign,
  FileDown,
  Download,
  Loader2,
  FileText,
  Stethoscope,
  Package,
  Clock,
  CheckCircle,
  AlertTriangle,
  FileSpreadsheet
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Reports = () => {
  const { invoices, appointments, patients, doctors, medicines } = useContext(AppContext);
  const token = localStorage.getItem('hms_token');

  // Active subtab: 'revenue' | 'patients' | 'appointments' | 'doctors'
  const [activeSubTab, setActiveSubTab] = useState('revenue');
  const [dateRange, setDateRange] = useState('7days');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isPdfLoading, setIsPdfLoading] = useState('');

  // Helper: Get dates for last 7 days
  const getLast7Days = () => {
    const dates = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  };

  // 1. REVENUE CALCULATIONS
  const last7Days = getLast7Days();
  const dailyEarnings = useMemo(() => {
    return last7Days.map(date => {
      const invoiceSum = invoices
        .filter(inv => inv.date === date && inv.status === 'Paid')
        .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
      const appointmentSum = appointments
        .filter(apt => apt.date === date && apt.status === 'Scheduled')
        .reduce((sum, apt) => sum + (apt.fee || 0), 0);
      return { date, total: invoiceSum + appointmentSum };
    });
  }, [invoices, appointments]);

  // Monthly Revenue
  const monthlyRevenueData = useMemo(() => {
    const currentMonth = new Date().toLocaleString('default', { month: 'short' });
    const liveMonthInvoices = invoices
      .filter(inv => inv.status === 'Paid')
      .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
    const liveMonthAppointments = appointments
      .filter(apt => apt.status === 'Scheduled')
      .reduce((sum, apt) => sum + (apt.fee || 0), 0);
    const liveTotal = liveMonthInvoices + liveMonthAppointments;
    return [
      { month: 'Apr', revenue: 1420 },
      { month: 'May', revenue: 1980 },
      { month: 'Jun', revenue: 2640 },
      { month: currentMonth, revenue: liveTotal }
    ];
  }, [invoices, appointments]);

  // 2. PATIENT STATISTICS
  const totalPatients = patients.length;
  const currentMonthYear = new Date().toISOString().substring(0, 7);
  const newPatientsThisMonth = patients.filter(pat => 
    pat.registeredDate && pat.registeredDate.startsWith(currentMonthYear)
  ).length;

  const malePatients = patients.filter(p => p.gender === 'Male').length;
  const femalePatients = patients.filter(p => p.gender === 'Female').length;
  const otherPatients = patients.filter(p => p.gender !== 'Male' && p.gender !== 'Female').length;
  const malePct = totalPatients ? Math.round((malePatients / totalPatients) * 100) : 0;
  const femalePct = totalPatients ? Math.round((femalePatients / totalPatients) * 100) : 0;
  const otherPct = totalPatients ? Math.round((otherPatients / totalPatients) * 100) : 0;

  // 3. APPOINTMENT STATISTICS
  const filteredAppointments = useMemo(() => {
    if (statusFilter === 'All') return appointments;
    return appointments.filter(a => a.status === statusFilter);
  }, [appointments, statusFilter]);

  const scheduledApptsCount = appointments.filter(a => a.status === 'Scheduled').length;
  const cancelledApptsCount = appointments.filter(a => a.status === 'Cancelled').length;
  const totalFeesScheduled = appointments.filter(a => a.status === 'Scheduled').reduce((s, a) => s + (a.fee || 0), 0);

  // 4. DOCTOR PERFORMANCE
  const doctorPerformance = useMemo(() => {
    return doctors.map(doc => {
      const activeAppts = appointments.filter(apt => apt.doctorId === doc.id && apt.status === 'Scheduled');
      const apptsCount = activeAppts.length;
      const revenueGenerated = activeAppts.reduce((sum, apt) => sum + (apt.fee || 0), 0);
      return {
        ...doc,
        apptsCount: (doc.consultsCount || 0) + apptsCount,
        revenueGenerated: ((doc.consultsCount || 0) * (doc.fee || 0)) + revenueGenerated
      };
    }).sort((a, b) => b.apptsCount - a.apptsCount);
  }, [doctors, appointments]);

  // ── SVG Chart Calculations ──────────────────────────────────────────────
  const maxDaily = Math.max(...dailyEarnings.map(d => d.total), 500);
  const chartHeight = 150;
  const chartWidth = 500;
  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 20;
  const graphWidth = chartWidth - paddingLeft - paddingRight;
  const graphHeight = chartHeight - paddingTop - paddingBottom;

  const points = dailyEarnings.map((d, index) => {
    const x = paddingLeft + (index / (dailyEarnings.length - 1)) * graphWidth;
    const y = paddingTop + graphHeight - (d.total / maxDaily) * graphHeight;
    return `${x},${y}`;
  }).join(' ');

  const maxMonthly = Math.max(...monthlyRevenueData.map(m => m.revenue), 1000);
  const barChartWidth = 500;
  const barChartHeight = 150;
  const barGraphWidth = barChartWidth - paddingLeft - paddingRight;
  const barGraphHeight = barChartHeight - paddingTop - paddingBottom;
  const numMonths = monthlyRevenueData.length;
  const barWidth = 35;

  // ── PDF Export Functions ─────────────────────────────────────────────────
  const exportReportPDF = async (reportType) => {
    setIsPdfLoading(reportType);
    try {
      const res = await fetch(`${API_URL}/reports/generate?type=${reportType}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const json = await res.json();

      if (json.success) {
        const printWindow = window.open('', '_blank', 'width=1000,height=800');
        printWindow.document.write(json.html);
        printWindow.document.close();
        printWindow.onload = () => setTimeout(() => printWindow.print(), 500);
      } else {
        generateClientPDF(reportType);
      }
    } catch {
      // Fallback: client-side PDF
      generateClientPDF(reportType);
    } finally {
      setIsPdfLoading('');
    }
  };

  // Client-side PDF fallback
  const generateClientPDF = (reportType) => {
    const today = new Date().toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    let title = '';
    let tableHeaders = '';
    let tableRows = '';
    let summaryHTML = '';

    switch (reportType) {
      case 'revenue': {
        title = 'Revenue Analytics Report';
        const invoiceRevenue = invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + i.totalAmount, 0);
        const apptRevenue = appointments.filter(a => a.status === 'Scheduled').reduce((s, a) => s + a.fee, 0);
        summaryHTML = `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:24px;">
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:14px;">
            <div style="font-size:10px;color:#16a34a;font-weight:700;text-transform:uppercase;">Total Revenue</div>
            <div style="font-size:20px;font-weight:800;color:#166534;margin-top:4px;">$${(invoiceRevenue + apptRevenue).toLocaleString()}</div>
          </div>
          <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:14px;">
            <div style="font-size:10px;color:#2563eb;font-weight:700;text-transform:uppercase;">Invoice Revenue</div>
            <div style="font-size:20px;font-weight:800;color:#1e40af;margin-top:4px;">$${invoiceRevenue.toLocaleString()}</div>
          </div>
          <div style="background:#fefce8;border:1px solid #fde68a;border-radius:8px;padding:14px;">
            <div style="font-size:10px;color:#ca8a04;font-weight:700;text-transform:uppercase;">Appointment Revenue</div>
            <div style="font-size:20px;font-weight:800;color:#854d0e;margin-top:4px;">$${apptRevenue.toLocaleString()}</div>
          </div>
        </div>`;
        tableHeaders = '<th>Month</th><th>Revenue ($)</th>';
        tableRows = monthlyRevenueData.map(m => `<tr><td>${m.month}</td><td style="font-weight:700;">$${m.revenue.toLocaleString()}</td></tr>`).join('');
        break;
      }
      case 'patients': {
        title = 'Patient Registry Report';
        summaryHTML = `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:24px;">
          <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:14px;">
            <div style="font-size:10px;color:#2563eb;font-weight:700;text-transform:uppercase;">Total Patients</div>
            <div style="font-size:20px;font-weight:800;color:#1e40af;margin-top:4px;">${totalPatients}</div>
          </div>
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:14px;">
            <div style="font-size:10px;color:#16a34a;font-weight:700;text-transform:uppercase;">New This Month</div>
            <div style="font-size:20px;font-weight:800;color:#166534;margin-top:4px;">+${newPatientsThisMonth}</div>
          </div>
          <div style="background:#faf5ff;border:1px solid #e9d5ff;border-radius:8px;padding:14px;">
            <div style="font-size:10px;color:#9333ea;font-weight:700;text-transform:uppercase;">Male / Female</div>
            <div style="font-size:20px;font-weight:800;color:#6b21a8;margin-top:4px;">${malePct}% / ${femalePct}%</div>
          </div>
        </div>`;
        tableHeaders = '<th>#</th><th>ID</th><th>Name</th><th>Gender</th><th>Phone</th><th>Blood Group</th><th>Registered</th>';
        tableRows = patients.map((p, i) =>
          `<tr><td>${i+1}</td><td>${p.id}</td><td>${p.name}</td><td>${p.gender}</td><td>${p.phone}</td><td>${p.bloodGroup}</td><td>${p.registeredDate || 'N/A'}</td></tr>`
        ).join('');
        break;
      }
      case 'appointments': {
        title = 'Appointments Schedule Report';
        summaryHTML = `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:24px;">
          <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:14px;">
            <div style="font-size:10px;color:#2563eb;font-weight:700;text-transform:uppercase;">Total Scheduled</div>
            <div style="font-size:20px;font-weight:800;color:#1e40af;margin-top:4px;">${scheduledApptsCount}</div>
          </div>
          <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:14px;">
            <div style="font-size:10px;color:#dc2626;font-weight:700;text-transform:uppercase;">Cancelled</div>
            <div style="font-size:20px;font-weight:800;color:#991b1b;margin-top:4px;">${cancelledApptsCount}</div>
          </div>
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:14px;">
            <div style="font-size:10px;color:#16a34a;font-weight:700;text-transform:uppercase;">Total Fees</div>
            <div style="font-size:20px;font-weight:800;color:#166534;margin-top:4px;">$${totalFeesScheduled.toLocaleString()}</div>
          </div>
        </div>`;
        tableHeaders = '<th>#</th><th>Appt ID</th><th>Patient</th><th>Doctor</th><th>Date</th><th>Time</th><th>Fee ($)</th><th>Status</th>';
        tableRows = filteredAppointments.map((a, i) =>
          `<tr><td>${i+1}</td><td>${a.id}</td><td>${a.patientName}</td><td>${a.doctorName}</td><td>${a.date}</td><td>${a.time}</td><td>$${a.fee}</td><td>${a.status}</td></tr>`
        ).join('');
        break;
      }
      case 'doctors': {
        title = 'Doctor Performance Report';
        tableHeaders = '<th>#</th><th>Name</th><th>Specialty</th><th>Consults</th><th>Rating</th><th>Revenue ($)</th>';
        tableRows = doctorPerformance.map((d, i) =>
          `<tr><td>${i+1}</td><td style="font-weight:700;">${d.name}</td><td>${d.specialty}</td><td>${d.apptsCount}</td><td>⭐ ${(d.rating||5).toFixed(1)}</td><td style="font-weight:700;">$${d.revenueGenerated.toLocaleString()}</td></tr>`
        ).join('');
        break;
      }
      default:
        title = 'Hospital Report';
    }

    const html = `<!DOCTYPE html><html><head><title>${title} - Subhan Care HMS</title>
    <style>
      * { margin:0; padding:0; box-sizing:border-box; }
      body { font-family:'Segoe UI',Tahoma,sans-serif; padding:40px; color:#1e293b; font-size:12px; }
      .header { border-bottom:3px solid #2563eb; padding-bottom:20px; margin-bottom:24px; display:flex; justify-content:space-between; }
      .header h1 { font-size:22px; color:#1e40af; font-weight:800; }
      .header p { font-size:11px; color:#64748b; margin-top:4px; }
      .header-right { text-align:right; font-size:11px; color:#64748b; }
      .report-title { background:linear-gradient(135deg,#eff6ff,#dbeafe); border:1px solid #bfdbfe; border-radius:8px; padding:16px 20px; margin-bottom:24px; }
      .report-title h2 { font-size:16px; font-weight:700; color:#1e40af; }
      table { width:100%; border-collapse:collapse; margin-top:16px; }
      th { background:#1e40af; color:white; padding:8px 12px; font-size:10px; text-transform:uppercase; text-align:left; }
      td { padding:8px 12px; border-bottom:1px solid #e2e8f0; }
      tr:nth-child(even) { background:#f8fafc; }
      .footer { margin-top:32px; border-top:2px solid #e2e8f0; padding-top:12px; font-size:10px; color:#94a3b8; display:flex; justify-content:space-between; }
      .footer .conf { color:#ef4444; font-weight:700; }
      @media print { body { padding:20px; } }
    </style></head><body>
    <div class="header">
      <div><h1>🏥 Subhan Care Hospitals Ltd.</h1><p>Hospital Management System — Official Report</p></div>
      <div class="header-right"><strong>${today}</strong><br>Generated by HMS<br>Report ID: RPT-${Date.now().toString(36).toUpperCase()}</div>
    </div>
    <div class="report-title"><h2>${title}</h2></div>
    ${summaryHTML}
    <table><thead><tr>${tableHeaders}</tr></thead><tbody>${tableRows}</tbody></table>
    <div class="footer"><span class="conf">⚠️ CONFIDENTIAL — For authorized personnel only</span><span>© ${new Date().getFullYear()} Subhan Care Hospitals Ltd.</span></div>
    </body></html>`;

    const printWindow = window.open('', '_blank', 'width=1000,height=800');
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => setTimeout(() => printWindow.print(), 500);
  };

  // ── CSV / Excel Export Function ──────────────────────────────────────────
  const exportToExcelCSV = (reportType) => {
    let csvContent = '';
    let fileName = `Subhan_Care_${reportType}_Report_${new Date().toISOString().split('T')[0]}.csv`;

    if (reportType === 'revenue') {
      csvContent += 'Month,Revenue ($)\n';
      monthlyRevenueData.forEach(m => {
        csvContent += `"${m.month}",${m.revenue}\n`;
      });
    } else if (reportType === 'patients') {
      csvContent += 'Patient ID,Full Name,Gender,CNIC,Phone,Email,Blood Group,Registered Date\n';
      patients.forEach(p => {
        csvContent += `"${p.id}","${p.name}","${p.gender}","${p.cnic || ''}","${p.phone}","${p.email}","${p.bloodGroup}","${p.registeredDate || ''}"\n`;
      });
    } else if (reportType === 'appointments') {
      csvContent += 'Appointment ID,Patient Name,Doctor Name,Date,Time Slot,Fee ($),Status\n';
      filteredAppointments.forEach(a => {
        csvContent += `"${a.id}","${a.patientName}","${a.doctorName}","${a.date}","${a.time}",${a.fee},"${a.status}"\n`;
      });
    } else if (reportType === 'doctors') {
      csvContent += 'Doctor ID,Name,Specialty,Consultations Count,Rating,Fee ($),Total Revenue ($)\n';
      doctorPerformance.forEach(d => {
        csvContent += `"${d.id}","${d.name}","${d.specialty}",${d.apptsCount},${(d.rating || 5).toFixed(1)},${d.fee},${d.revenueGenerated}\n`;
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Workspace Menu Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-150 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
        <div>
          <h2 className="text-xl font-bold font-outfit text-slate-800 dark:text-slate-100">Reports & Analytics</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium font-outfit">Detailed analytics with PDF & Excel export features</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Tab Controls */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            {[
              { id: 'revenue', label: 'Revenue' },
              { id: 'patients', label: 'Patients' },
              { id: 'appointments', label: 'Appointments' },
              { id: 'doctors', label: 'Doctors' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeSubTab === tab.id 
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' 
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Export Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => exportReportPDF(activeSubTab)}
              disabled={isPdfLoading === activeSubTab}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-500/10 transition-colors"
            >
              {isPdfLoading === activeSubTab ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
              <span>Export PDF</span>
            </button>
            <button
              onClick={() => exportToExcelCSV(activeSubTab)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/10 transition-colors"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>Export Excel</span>
            </button>
          </div>
        </div>
      </div>

      {/* RENDER ACTIVE SUBTAB */}

      {/* 1. REVENUE REPORTS */}
      {activeSubTab === 'revenue' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Daily Revenue Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-800 p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold font-outfit text-slate-800 dark:text-slate-100">Daily Revenue Trend</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500">Scheduled consulting fees + settled invoices</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-slate-600 dark:text-slate-400">
                <Filter className="h-3.5 w-3.5" />
                <select 
                  value={dateRange} 
                  onChange={(e) => setDateRange(e.target.value)}
                  className="bg-transparent focus:outline-none cursor-pointer"
                >
                  <option value="7days">Last 7 Days</option>
                  <option value="30days" disabled>Last 30 Days (Demo)</option>
                </select>
              </div>
            </div>

            {/* SVG Line Chart */}
            <div className="relative pt-4">
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto overflow-visible select-none">
                <defs>
                  <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {[0, 0.25, 0.5, 0.75, 1].map((val, idx) => {
                  const y = paddingTop + graphHeight * val;
                  const labelVal = Math.round(maxDaily - (maxDaily * val));
                  return (
                    <g key={idx}>
                      <line x1={paddingLeft} y1={y} x2={chartWidth - paddingRight} y2={y} className="stroke-slate-100 dark:stroke-slate-800/80 stroke-1" strokeDasharray="4 4" />
                      <text x={paddingLeft - 8} y={y + 4} textAnchor="end" className="fill-slate-400 dark:fill-slate-500 font-bold text-[8px]">${labelVal}</text>
                    </g>
                  );
                })}

                {points && (
                  <path d={`M ${paddingLeft},${paddingTop + graphHeight} L ${points} L ${paddingLeft + graphWidth},${paddingTop + graphHeight} Z`} fill="url(#blueGradient)" />
                )}
                {points && (
                  <polyline fill="none" stroke="#2563eb" strokeWidth="2.5" points={points} className="stroke-brand-500 dark:stroke-brand-400" />
                )}

                {dailyEarnings.map((d, index) => {
                  const x = paddingLeft + (index / (dailyEarnings.length - 1)) * graphWidth;
                  const y = paddingTop + graphHeight - (d.total / maxDaily) * graphHeight;
                  return (
                    <g key={index} className="group cursor-pointer">
                      <circle cx={x} cy={y} r="3.5" className="fill-brand-600 dark:fill-brand-400 stroke-white dark:stroke-slate-900 stroke-1.5" />
                      <text x={x} y={y - 8} textAnchor="middle" className="opacity-0 group-hover:opacity-100 fill-slate-800 dark:fill-slate-200 font-extrabold text-[9px] transition-opacity duration-150">${d.total}</text>
                    </g>
                  );
                })}

                {dailyEarnings.map((d, index) => {
                  const x = paddingLeft + (index / (dailyEarnings.length - 1)) * graphWidth;
                  const dayStr = new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' });
                  return (
                    <text key={index} x={x} y={chartHeight - 4} textAnchor="middle" className="fill-slate-400 dark:fill-slate-500 font-bold text-[8px]">{dayStr}</text>
                  );
                })}
              </svg>
            </div>
            
            <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Rolling Revenue</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    ${dailyEarnings.reduce((sum, d) => sum + d.total, 0).toLocaleString()} (Last 7 Days)
                  </span>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1 rounded-full border border-emerald-100 dark:border-emerald-900">+12.4% vs last wk</span>
            </div>
          </div>

          {/* Monthly Revenue Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-800 p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold font-outfit text-slate-800 dark:text-slate-100">Monthly Earnings Report</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500">Gross billing compared across calendar months</p>
              </div>
            </div>

            <div className="relative pt-4">
              <svg viewBox={`0 0 ${barChartWidth} ${barChartHeight}`} className="w-full h-auto overflow-visible select-none">
                {[0, 0.25, 0.5, 0.75, 1].map((val, idx) => {
                  const y = paddingTop + barGraphHeight * val;
                  const labelVal = Math.round(maxMonthly - (maxMonthly * val));
                  return (
                    <g key={idx}>
                      <line x1={paddingLeft} y1={y} x2={barChartWidth - paddingRight} y2={y} className="stroke-slate-100 dark:stroke-slate-800/80 stroke-1" strokeDasharray="4 4" />
                      <text x={paddingLeft - 8} y={y + 4} textAnchor="end" className="fill-slate-400 dark:fill-slate-500 font-bold text-[8px]">${labelVal}</text>
                    </g>
                  );
                })}

                {monthlyRevenueData.map((m, index) => {
                  const x = paddingLeft + (index / (numMonths - 1)) * barGraphWidth - (barWidth / 2);
                  const barHeight = (m.revenue / maxMonthly) * barGraphHeight;
                  const y = paddingTop + barGraphHeight - barHeight;
                  const isCurrentMonth = index === numMonths - 1;
                  return (
                    <g key={index} className="group cursor-pointer">
                      <rect x={x} y={y} width={barWidth} height={barHeight} rx="4" ry="4"
                        className={`${isCurrentMonth ? 'fill-brand-600 dark:fill-brand-500' : 'fill-indigo-400 dark:fill-indigo-500/70 hover:fill-indigo-500'} transition-colors duration-150`}
                      />
                      <text x={x + (barWidth / 2)} y={y - 6} textAnchor="middle" className="opacity-0 group-hover:opacity-100 fill-slate-800 dark:fill-slate-200 font-extrabold text-[9px]">${m.revenue}</text>
                    </g>
                  );
                })}

                {monthlyRevenueData.map((m, index) => {
                  const x = paddingLeft + (index / (numMonths - 1)) * barGraphWidth;
                  return (
                    <text key={index} x={x} y={barChartHeight - 4} textAnchor="middle" className="fill-slate-400 dark:fill-slate-500 font-bold text-[8px]">{m.month}</text>
                  );
                })}
              </svg>
            </div>

            <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Average Monthly Bill</span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  ${Math.round(monthlyRevenueData.reduce((sum, m) => sum + m.revenue, 0) / numMonths).toLocaleString()} / month
                </span>
              </div>
              <span className="text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900 px-3 py-1 rounded-xl font-bold flex items-center gap-1">
                <Activity className="h-3.5 w-3.5" /> High Margin
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 2. PATIENT REPORTS */}
      {activeSubTab === 'patients' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-800 p-6 shadow-sm space-y-6">
              <h3 className="text-base font-bold font-outfit text-slate-800 dark:text-slate-100">Patient Overview</h3>
              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 p-4 rounded-xl">
                  <span className="text-[10px] font-bold text-blue-500 dark:text-blue-400 uppercase block">Total Registry</span>
                  <span className="text-2xl font-black font-outfit text-blue-800 dark:text-blue-300">{totalPatients} Patients</span>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 p-4 rounded-xl">
                  <span className="text-[10px] font-bold text-emerald-500 dark:text-emerald-400 uppercase block">Monthly Enrollments</span>
                  <span className="text-2xl font-black font-outfit text-emerald-800 dark:text-emerald-300">+{newPatientsThisMonth} New</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-800 p-6 shadow-sm space-y-6">
              <h3 className="text-base font-bold font-outfit text-slate-800 dark:text-slate-100">Gender Distribution</h3>
              <div className="space-y-4 pt-2">
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                    <span>Male</span><span>{malePatients} ({malePct}%)</span>
                  </div>
                  <div className="w-full bg-slate-150 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-brand-500 h-full rounded-full" style={{ width: `${malePct}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                    <span>Female</span><span>{femalePatients} ({femalePct}%)</span>
                  </div>
                  <div className="w-full bg-slate-150 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-pink-500 h-full rounded-full" style={{ width: `${femalePct}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                    <span>Other / Unspecified</span><span>{otherPatients} ({otherPct}%)</span>
                  </div>
                  <div className="w-full bg-slate-150 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-slate-400 h-full rounded-full" style={{ width: `${otherPct}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-800 p-6 shadow-sm space-y-6">
              <h3 className="text-base font-bold font-outfit text-slate-800 dark:text-slate-100">Registered Patient List</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">Download active registry files for offline documentation.</p>
              <div className="pt-2 flex flex-col gap-3">
                <button
                  onClick={() => exportReportPDF('patients')}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  <FileDown className="h-4 w-4" /> Download PDF Report
                </button>
                <button
                  onClick={() => exportToExcelCSV('patients')}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  <FileSpreadsheet className="h-4 w-4" /> Download Excel CSV
                </button>
              </div>
            </div>
          </div>

          {/* Patients Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 font-bold text-slate-800 dark:text-slate-100 text-sm">
              Patient Registry Listing ({patients.length} Records)
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-150 dark:border-slate-800 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    <th className="px-6 py-3">Patient ID</th>
                    <th className="px-6 py-3">Name</th>
                    <th className="px-6 py-3">Gender</th>
                    <th className="px-6 py-3">Phone</th>
                    <th className="px-6 py-3">Blood Group</th>
                    <th className="px-6 py-3">Registered Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm text-slate-700 dark:text-slate-300">
                  {patients.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="px-6 py-3 font-bold text-brand-600 dark:text-brand-400">{p.id}</td>
                      <td className="px-6 py-3 font-semibold">{p.name}</td>
                      <td className="px-6 py-3">{p.gender}</td>
                      <td className="px-6 py-3">{p.phone}</td>
                      <td className="px-6 py-3 font-bold">{p.bloodGroup}</td>
                      <td className="px-6 py-3 text-slate-500 dark:text-slate-400">{p.registeredDate || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. APPOINTMENT REPORTS */}
      {activeSubTab === 'appointments' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-800 p-6 shadow-sm space-y-2">
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Total Scheduled</span>
              <p className="text-2xl font-black font-outfit text-brand-600 dark:text-brand-400">{scheduledApptsCount}</p>
              <span className="text-xs text-slate-400">Active consultations</span>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-800 p-6 shadow-sm space-y-2">
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Total Cancelled</span>
              <p className="text-2xl font-black font-outfit text-rose-600 dark:text-rose-400">{cancelledApptsCount}</p>
              <span className="text-xs text-slate-400">Voided bookings</span>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-800 p-6 shadow-sm space-y-2">
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Scheduled Fees</span>
              <p className="text-2xl font-black font-outfit text-emerald-600 dark:text-emerald-400">${totalFeesScheduled.toLocaleString()}</p>
              <span className="text-xs text-slate-400">Expected consultation revenue</span>
            </div>
          </div>

          {/* Filter Bar & Appointments Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">Appointment Log</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Filter Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs font-bold border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="All">All Statuses</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-150 dark:border-slate-800 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    <th className="px-6 py-3">Appt ID</th>
                    <th className="px-6 py-3">Patient</th>
                    <th className="px-6 py-3">Doctor</th>
                    <th className="px-6 py-3">Date & Time</th>
                    <th className="px-6 py-3 text-right">Fee</th>
                    <th className="px-6 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm text-slate-700 dark:text-slate-300">
                  {filteredAppointments.map(a => (
                    <tr key={a.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="px-6 py-3 font-bold text-brand-600 dark:text-brand-400">{a.id}</td>
                      <td className="px-6 py-3 font-bold text-slate-800 dark:text-slate-200">{a.patientName}</td>
                      <td className="px-6 py-3 text-slate-500 dark:text-slate-400">{a.doctorName}</td>
                      <td className="px-6 py-3 text-slate-500 dark:text-slate-400">{a.date} at {a.time}</td>
                      <td className="px-6 py-3 text-right font-bold text-slate-800 dark:text-slate-200">${a.fee}</td>
                      <td className="px-6 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                          a.status === 'Scheduled' 
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' 
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                        }`}>
                          {a.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. DOCTOR PERFORMANCE REPORTS */}
      {activeSubTab === 'doctors' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-800 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold font-outfit text-slate-800 dark:text-slate-100">Physician Performance Indexes</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">Consultation frequencies, ratings, and generated revenue</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-150 dark:border-slate-800 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-4 font-semibold">Doctor Name</th>
                  <th className="px-6 py-4 font-semibold">Specialty</th>
                  <th className="px-6 py-4 font-semibold text-center">Consultations Completed</th>
                  <th className="px-6 py-4 font-semibold text-center">Consult Rating</th>
                  <th className="px-6 py-4 font-semibold text-right pr-8">Consulting Revenue Generated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm font-medium text-slate-700 dark:text-slate-300">
                {doctorPerformance.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 font-extrabold text-slate-800 dark:text-slate-200">{doc.name}</td>
                    <td className="px-6 py-4">
                      <span className="inline-block text-xs font-bold px-2 py-0.5 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-900 rounded">
                        {doc.specialty}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center font-semibold">{doc.apptsCount} Slots</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-1">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        <span className="font-extrabold text-slate-800 dark:text-slate-200">{doc.rating?.toFixed(1)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right pr-8 font-bold text-brand-600 dark:text-brand-400">
                      ${doc.revenueGenerated.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};

export default Reports;
