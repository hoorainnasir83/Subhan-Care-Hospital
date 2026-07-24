import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Star, 
  Calendar, 
  ArrowUpRight, 
  Activity, 
  Filter,
  DollarSign
} from 'lucide-react';

const Reports = () => {
  const { invoices, appointments, patients, doctors } = useContext(AppContext);
  const [activeSubTab, setActiveSubTab] = useState('revenue'); // 'revenue', 'patients', 'doctors'
  const [dateRange, setDateRange] = useState('7days'); // '7days', '30days'

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

  // Helper: Format date for chart labels
  const formatLabelDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' });
  };

  // 1. REVENUE CALCULATIONS
  const last7Days = getLast7Days();
  const dailyEarnings = last7Days.map(date => {
    // Sum paid invoices on this date
    const invoiceSum = invoices
      .filter(inv => inv.date === date && inv.status === 'Paid')
      .reduce((sum, inv) => sum + inv.totalAmount, 0);

    // Sum scheduled appointments on this date
    const appointmentSum = appointments
      .filter(apt => apt.date === date && apt.status === 'Scheduled')
      .reduce((sum, apt) => sum + apt.fee, 0);

    return {
      date,
      total: invoiceSum + appointmentSum
    };
  });

  // Monthly Revenue (Seeded values for past months + July live value)
  const getMonthlyRevenue = () => {
    const currentMonth = new Date().toLocaleString('default', { month: 'short' }); // e.g. 'Jul'
    
    // Calculate live July/current month sum
    const liveMonthInvoices = invoices
      .filter(inv => inv.status === 'Paid')
      .reduce((sum, inv) => sum + inv.totalAmount, 0);
    
    const liveMonthAppointments = appointments
      .filter(apt => apt.status === 'Scheduled')
      .reduce((sum, apt) => sum + apt.fee, 0);

    const liveTotal = liveMonthInvoices + liveMonthAppointments;

    return [
      { month: 'Apr', revenue: 1420 },
      { month: 'May', revenue: 1980 },
      { month: 'Jun', revenue: 2640 },
      { month: currentMonth, revenue: liveTotal }
    ];
  };

  const monthlyRevenueData = getMonthlyRevenue();

  // 2. PATIENT STATISTICS
  const totalPatients = patients.length;
  // Count new patients registered this month (assume July 2026)
  const currentMonthYear = new Date().toISOString().substring(0, 7); // e.g. "2026-07"
  const newPatientsThisMonth = patients.filter(pat => 
    pat.registeredDate && pat.registeredDate.startsWith(currentMonthYear)
  ).length;

  // Gender demographics
  const malePatients = patients.filter(p => p.gender === 'Male').length;
  const femalePatients = patients.filter(p => p.gender === 'Female').length;
  const otherPatients = patients.filter(p => p.gender !== 'Male' && p.gender !== 'Female').length;

  const malePct = totalPatients ? Math.round((malePatients / totalPatients) * 100) : 0;
  const femalePct = totalPatients ? Math.round((femalePatients / totalPatients) * 100) : 0;
  const otherPct = totalPatients ? Math.round((otherPatients / totalPatients) * 100) : 0;

  // Age demographics
  const pediatricCount = patients.filter(p => p.age < 18).length;
  const adultCount = patients.filter(p => p.age >= 18 && p.age <= 60).length;
  const seniorCount = patients.filter(p => p.age > 60).length;

  // 3. DOCTOR PERFORMANCE
  // For each doctor, find their consult count and total fees generated
  const doctorPerformance = doctors.map(doc => {
    // Count active appointments
    const activeAppts = appointments.filter(apt => apt.doctorId === doc.id && apt.status === 'Scheduled');
    const apptsCount = activeAppts.length;
    // Estimated revenue generated
    const revenueGenerated = activeAppts.reduce((sum, apt) => sum + apt.fee, 0);

    return {
      ...doc,
      apptsCount: doc.consultsCount + apptsCount, // sum original mock counts + new scheduled bookings
      revenueGenerated: (doc.consultsCount * doc.fee) + revenueGenerated
    };
  }).sort((a, b) => b.apptsCount - a.apptsCount); // sort by appointments completed

  // SVG Line Chart Helpers (Daily Revenue)
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

  // SVG Bar Chart Helpers (Monthly Revenue)
  const maxMonthly = Math.max(...monthlyRevenueData.map(m => m.revenue), 1000);
  const barChartWidth = 500;
  const barChartHeight = 150;
  const barGraphWidth = barChartWidth - paddingLeft - paddingRight;
  const barGraphHeight = barChartHeight - paddingTop - paddingBottom;
  const numMonths = monthlyRevenueData.length;
  const barWidth = 35;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Workspace Menu Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-150 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
        <div>
          <h2 className="text-xl font-bold font-outfit text-slate-855 dark:text-slate-200">Reports & Diagnostics</h2>
          <p className="text-xs text-slate-400 dark:text-slate-550 font-medium font-outfit">Statistical overview of hospital analytics, demographics, and reviews</p>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 w-full sm:w-auto">
          <button
            onClick={() => setActiveSubTab('revenue')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'revenue' 
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' 
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            Revenue Analytics
          </button>
          <button
            onClick={() => setActiveSubTab('patients')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'patients' 
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' 
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            Patient Demographics
          </button>
          <button
            onClick={() => setActiveSubTab('doctors')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'doctors' 
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' 
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            Doctor Performance
          </button>
        </div>
      </div>

      {/* RENDER ACTIVE TAB */}
      
      {/* 1. REVENUE TAB */}
      {activeSubTab === 'revenue' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Daily Revenue Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-800 p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold font-outfit text-slate-800 dark:text-slate-200">Daily Revenue Trend</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500">Scheduled consulting fees + settled invoices</p>
              </div>
              
              {/* Date Filters */}
              <div className="flex items-center gap-1.5 text-xs font-bold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-slate-600 dark:text-slate-400">
                <Filter className="h-3.5 w-3.5" />
                <select 
                  value={dateRange} 
                  onChange={(e) => setDateRange(e.target.value)}
                  className="bg-transparent focus:outline-none"
                >
                  <option value="7days">Last 7 Days</option>
                  <option value="30days" disabled>Last 30 Days (Demo)</option>
                </select>
              </div>
            </div>

            {/* Premium custom SVG Line Chart */}
            <div className="relative pt-4">
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto overflow-visible select-none">
                <defs>
                  {/* Blue Area Gradient */}
                  <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Y-Axis Grid Lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((val, idx) => {
                  const y = paddingTop + graphHeight * val;
                  const labelVal = Math.round(maxDaily - (maxDaily * val));
                  return (
                    <g key={idx}>
                      <line 
                        x1={paddingLeft} 
                        y1={y} 
                        x2={chartWidth - paddingRight} 
                        y2={y} 
                        className="stroke-slate-100 dark:stroke-slate-800/80 stroke-1" 
                        strokeDasharray="4 4"
                      />
                      <text 
                        x={paddingLeft - 8} 
                        y={y + 4} 
                        textAnchor="end" 
                        className="fill-slate-400 dark:fill-slate-550 font-bold text-[8px]"
                      >
                        ${labelVal}
                      </text>
                    </g>
                  );
                })}

                {/* Area Gradient Path */}
                {points && (
                  <path
                    d={`M ${paddingLeft},${paddingTop + graphHeight} L ${points} L ${paddingLeft + graphWidth},${paddingTop + graphHeight} Z`}
                    fill="url(#blueGradient)"
                  />
                )}

                {/* Line Path */}
                {points && (
                  <polyline
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="2.5"
                    points={points}
                    className="stroke-brand-500 dark:stroke-brand-400"
                  />
                )}

                {/* Data Points Dot Overlay */}
                {dailyEarnings.map((d, index) => {
                  const x = paddingLeft + (index / (dailyEarnings.length - 1)) * graphWidth;
                  const y = paddingTop + graphHeight - (d.total / maxDaily) * graphHeight;
                  return (
                    <g key={index} className="group cursor-pointer">
                      <circle 
                        cx={x} 
                        cy={y} 
                        r="3.5" 
                        className="fill-brand-600 dark:fill-brand-400 stroke-white dark:stroke-slate-900 stroke-1.5"
                      />
                      {/* Tooltip on Dot */}
                      <text
                        x={x}
                        y={y - 8}
                        textAnchor="middle"
                        className="opacity-0 group-hover:opacity-100 fill-slate-800 dark:fill-slate-200 font-extrabold text-[9px] bg-slate-950 px-1 py-0.5 rounded transition-opacity duration-150"
                      >
                        ${d.total}
                      </text>
                    </g>
                  );
                })}

                {/* X-Axis Labels */}
                {dailyEarnings.map((d, index) => {
                  const x = paddingLeft + (index / (dailyEarnings.length - 1)) * graphWidth;
                  const dayStr = new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' });
                  return (
                    <text 
                      key={index} 
                      x={x} 
                      y={chartHeight - 4} 
                      textAnchor="middle" 
                      className="fill-slate-400 dark:fill-slate-500 font-bold text-[8px]"
                    >
                      {dayStr}
                    </text>
                  );
                })}
              </svg>
            </div>
            
            {/* Live Stats */}
            <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-850 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Rolling Revenue</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    ${dailyEarnings.reduce((sum, d) => sum + d.total, 0).toLocaleString()} (Last 7 Days)
                  </span>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1 rounded-full border border-emerald-100 dark:border-emerald-900">+12.4% vs last wk</span>
            </div>

          </div>

          {/* Monthly Revenue Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-800 p-6 shadow-sm space-y-6">
            <div>
              <h3 className="text-base font-bold font-outfit text-slate-800 dark:text-slate-200">Monthly Earnings Report</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">Gross billing compared across calendar months</p>
            </div>

            {/* Premium custom SVG Bar Chart */}
            <div className="relative pt-4">
              <svg viewBox={`0 0 ${barChartWidth} ${barChartHeight}`} className="w-full h-auto overflow-visible select-none">
                {/* Y-Axis Grid Lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((val, idx) => {
                  const y = paddingTop + barGraphHeight * val;
                  const labelVal = Math.round(maxMonthly - (maxMonthly * val));
                  return (
                    <g key={idx}>
                      <line 
                        x1={paddingLeft} 
                        y1={y} 
                        x2={barChartWidth - paddingRight} 
                        y2={y} 
                        className="stroke-slate-100 dark:stroke-slate-800/80 stroke-1" 
                        strokeDasharray="4 4"
                      />
                      <text 
                        x={paddingLeft - 8} 
                        y={y + 4} 
                        textAnchor="end" 
                        className="fill-slate-400 dark:fill-slate-550 font-bold text-[8px]"
                      >
                        ${labelVal}
                      </text>
                    </g>
                  );
                })}

                {/* Monthly Bars */}
                {monthlyRevenueData.map((m, index) => {
                  const x = paddingLeft + (index / (numMonths - 1)) * barGraphWidth - (barWidth / 2);
                  const barHeight = (m.revenue / maxMonthly) * barGraphHeight;
                  const y = paddingTop + barGraphHeight - barHeight;
                  const isCurrentMonth = index === numMonths - 1;

                  return (
                    <g key={index} className="group cursor-pointer">
                      {/* Bar Rectangle with Rounded top corners (simulated via rx/ry) */}
                      <rect
                        x={x}
                        y={y}
                        width={barWidth}
                        height={barHeight}
                        rx="4"
                        ry="4"
                        className={`${
                          isCurrentMonth 
                            ? 'fill-brand-600 dark:fill-brand-500' 
                            : 'fill-indigo-400 dark:fill-indigo-500/70 hover:fill-indigo-500'
                        } transition-colors duration-150`}
                      />
                      {/* Tooltip Overlay */}
                      <text
                        x={x + (barWidth / 2)}
                        y={y - 6}
                        textAnchor="middle"
                        className="opacity-0 group-hover:opacity-100 fill-slate-800 dark:fill-slate-200 font-extrabold text-[9px]"
                      >
                        ${m.revenue}
                      </text>
                    </g>
                  );
                })}

                {/* X-Axis Labels */}
                {monthlyRevenueData.map((m, index) => {
                  const x = paddingLeft + (index / (numMonths - 1)) * barGraphWidth;
                  return (
                    <text 
                      key={index} 
                      x={x} 
                      y={barChartHeight - 4} 
                      textAnchor="middle" 
                      className="fill-slate-400 dark:fill-slate-500 font-bold text-[8px]"
                    >
                      {m.month}
                    </text>
                  );
                })}
              </svg>
            </div>

            {/* Brief stats */}
            <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-850 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
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

      {/* 2. PATIENT DEMOGRAPHICS TAB */}
      {activeSubTab === 'patients' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* General Demographics Stats */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-800 p-6 shadow-sm space-y-6">
            <h3 className="text-base font-bold font-outfit text-slate-800 dark:text-slate-200">Patient Overview</h3>
            
            <div className="space-y-4">
              {/* Total Patients */}
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 p-4 rounded-xl">
                <span className="text-[10px] font-bold text-blue-500 dark:text-blue-450 uppercase block">Total Registry</span>
                <span className="text-2xl font-black font-outfit text-blue-800 dark:text-blue-300">{totalPatients} Patients</span>
              </div>

              {/* New Patients */}
              <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 p-4 rounded-xl">
                <span className="text-[10px] font-bold text-emerald-500 dark:text-emerald-450 uppercase block">Monthly Enrollments</span>
                <span className="text-2xl font-black font-outfit text-emerald-800 dark:text-emerald-300">+{newPatientsThisMonth} New</span>
              </div>
            </div>
          </div>

          {/* Gender Split Progress Bars */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-800 p-6 shadow-sm space-y-6">
            <h3 className="text-base font-bold font-outfit text-slate-800 dark:text-slate-200">Gender Distribution</h3>

            <div className="space-y-4 pt-2">
              {/* Male progress */}
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-550 dark:text-slate-400 mb-1">
                  <span>Male</span>
                  <span>{malePatients} ({malePct}%)</span>
                </div>
                <div className="w-full bg-slate-150 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-brand-500 h-full rounded-full" style={{ width: `${malePct}%` }}></div>
                </div>
              </div>

              {/* Female progress */}
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-550 dark:text-slate-400 mb-1">
                  <span>Female</span>
                  <span>{femalePatients} ({femalePct}%)</span>
                </div>
                <div className="w-full bg-slate-150 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-pink-500 h-full rounded-full" style={{ width: `${femalePct}%` }}></div>
                </div>
              </div>

              {/* Other progress */}
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-550 dark:text-slate-400 mb-1">
                  <span>Other / Unspecified</span>
                  <span>{otherPatients} ({otherPct}%)</span>
                </div>
                <div className="w-full bg-slate-150 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-slate-400 h-full rounded-full" style={{ width: `${otherPct}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Age Demographics Split */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-800 p-6 shadow-sm space-y-6">
            <h3 className="text-base font-bold font-outfit text-slate-800 dark:text-slate-200">Age Segments</h3>

            <div className="space-y-4 pt-2">
              {/* Pediatric */}
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-550 dark:text-slate-400 mb-1">
                  <span>Pediatrics (under 18 yrs)</span>
                  <span>{pediatricCount} Patients</span>
                </div>
                <div className="w-full bg-slate-150 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: `${totalPatients ? (pediatricCount / totalPatients) * 100 : 0}%` }}></div>
                </div>
              </div>

              {/* Adults */}
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-550 dark:text-slate-400 mb-1">
                  <span>Adults (18 - 60 yrs)</span>
                  <span>{adultCount} Patients</span>
                </div>
                <div className="w-full bg-slate-150 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-brand-500 h-full rounded-full" style={{ width: `${totalPatients ? (adultCount / totalPatients) * 100 : 0}%` }}></div>
                </div>
              </div>

              {/* Seniors */}
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-550 dark:text-slate-400 mb-1">
                  <span>Seniors (over 60 yrs)</span>
                  <span>{seniorCount} Patients</span>
                </div>
                <div className="w-full bg-slate-150 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-teal-500 h-full rounded-full" style={{ width: `${totalPatients ? (seniorCount / totalPatients) * 100 : 0}%` }}></div>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* 3. DOCTOR PERFORMANCE TAB */}
      {activeSubTab === 'doctors' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-800 p-6 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-bold font-outfit text-slate-800 dark:text-slate-200">Physician Performance Indexes</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500">Consultation frequencies, consult ratings, and generated consultation revenue</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-850 border-b border-slate-150 dark:border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-4 font-semibold">Doctor Name</th>
                  <th className="px-6 py-4 font-semibold">Specialty</th>
                  <th className="px-6 py-4 font-semibold text-center">Consultations Completed</th>
                  <th className="px-6 py-4 font-semibold text-center">Consult Rating</th>
                  <th className="px-6 py-4 font-semibold text-right pr-8">Consulting Revenue Generated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm font-medium text-slate-700 dark:text-slate-300">
                {doctorPerformance.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-55/40 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 font-extrabold text-slate-850 dark:text-slate-200">{doc.name}</td>
                    <td className="px-6 py-4">
                      <span className="inline-block text-xs font-bold px-2 py-0.5 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-900 rounded">
                        {doc.specialty}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center font-semibold">{doc.apptsCount} Slots</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-1">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        <span className="font-extrabold text-slate-800 dark:text-slate-250">{doc.rating?.toFixed(1)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right pr-8 font-bold text-brand-700 dark:text-brand-400">
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
