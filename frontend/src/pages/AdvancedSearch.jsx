import React, { useState, useContext, useCallback, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import {
  Search, Download, Calendar, Filter, Users, Stethoscope,
  FileText, CheckCircle, FileDown, Loader2, AlertTriangle,
  BarChart3, RefreshCw, X, ChevronLeft, ChevronRight
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const AdvancedSearch = () => {
  const { patients, doctors, appointments, invoices } = useContext(AppContext);
  const token = localStorage.getItem('hms_token');

  // Search States
  const [searchType, setSearchType] = useState('Patients');
  const [keyword, setKeyword] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [isSearching, setIsSearching] = useState(false);
  const [serverResults, setServerResults] = useState(null);
  const [serverMeta, setServerMeta] = useState(null);
  const [searchError, setSearchError] = useState('');
  const [isPdfLoading, setIsPdfLoading] = useState(false);

  // Debounced server search
  const performServerSearch = useCallback(async (searchKeyword, type, sDate, eDate, status, pg) => {
    setIsSearching(true);
    setSearchError('');
    try {
      const params = new URLSearchParams({
        q: searchKeyword || '',
        type: type.toLowerCase(),
        page: pg.toString(),
        limit: '50'
      });
      if (sDate) params.append('startDate', sDate);
      if (eDate) params.append('endDate', eDate);
      if (status && status !== 'All') params.append('status', status);

      const res = await fetch(`${API_URL}/search?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const json = await res.json();
      if (json.success) {
        setServerResults(json.data);
        setServerMeta({ total: json.total, totalPages: json.totalPages, page: json.page });
      } else {
        setSearchError(json.error || 'Search failed');
        setServerResults(null);
      }
    } catch {
      // Fallback to client-side search
      setServerResults(null);
      setSearchError('');
    } finally {
      setIsSearching(false);
    }
  }, [token]);

  // Debounce effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (keyword.trim().length >= 1 || startDate || endDate || statusFilter !== 'All') {
        performServerSearch(keyword, searchType, startDate, endDate, statusFilter, page);
      } else {
        setServerResults(null);
        setServerMeta(null);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [keyword, searchType, startDate, endDate, statusFilter, page, performServerSearch]);

  // Client-side fallback filter
  const getClientFilteredResults = () => {
    const key = keyword.toLowerCase().trim();
    switch (searchType) {
      case 'Patients':
        return patients.filter(pat => {
          const matchesKeyword =
            pat.name.toLowerCase().includes(key) ||
            pat.email.toLowerCase().includes(key) ||
            pat.phone.includes(key) ||
            pat.id.toLowerCase().includes(key) ||
            (pat.cnic && pat.cnic.includes(key));
          const matchesDate = !startDate || !endDate || (pat.registeredDate >= startDate && pat.registeredDate <= endDate);
          return matchesKeyword && matchesDate;
        });
      case 'Doctors':
        return doctors.filter(doc => {
          return doc.name.toLowerCase().includes(key) ||
            doc.specialty.toLowerCase().includes(key) ||
            doc.email.toLowerCase().includes(key);
        });
      case 'Appointments':
        return appointments.filter(apt => {
          const matchesKeyword =
            apt.patientName.toLowerCase().includes(key) ||
            apt.doctorName.toLowerCase().includes(key) ||
            apt.id.toLowerCase().includes(key);
          const matchesDate = !startDate || !endDate || (apt.date >= startDate && apt.date <= endDate);
          const matchesStatus = statusFilter === 'All' || apt.status === statusFilter;
          return matchesKeyword && matchesDate && matchesStatus;
        });
      case 'Invoices':
        return invoices.filter(inv => {
          const matchesKeyword =
            inv.patientName.toLowerCase().includes(key) ||
            inv.id.toLowerCase().includes(key);
          const matchesDate = !startDate || !endDate || (inv.date >= startDate && inv.date <= endDate);
          const matchesStatus = statusFilter === 'All' || inv.status === statusFilter;
          return matchesKeyword && matchesDate && matchesStatus;
        });
      default:
        return [];
    }
  };

  const results = serverResults || getClientFilteredResults();

  // ── Export to CSV ───────────────────────────────────────────────────────
  const exportToCSV = () => {
    if (results.length === 0) return;
    let csvContent = '';
    let headers = [];

    if (searchType === 'Patients') {
      headers = ['Patient ID', 'Full Name', 'Gender', 'CNIC', 'Phone', 'Email', 'Blood Group', 'Registered Date'];
      csvContent += headers.join(',') + '\n';
      results.forEach(p => {
        csvContent += `"${p.id}","${p.name}","${p.gender}","${p.cnic || 'N/A'}","${p.phone}","${p.email}","${p.bloodGroup}","${p.registeredDate || ''}"\n`;
      });
    } else if (searchType === 'Doctors') {
      headers = ['Doctor ID', 'Name', 'Specialty', 'Phone', 'Email', 'Fee (Rs.)'];
      csvContent += headers.join(',') + '\n';
      results.forEach(d => {
        csvContent += `"${d.id}","${d.name}","${d.specialty}","${d.phone}","${d.email}",${d.fee}\n`;
      });
    } else if (searchType === 'Appointments') {
      headers = ['Appointment ID', 'Patient Name', 'Doctor Name', 'Date', 'Time Slot', 'Fee (Rs.)', 'Status'];
      csvContent += headers.join(',') + '\n';
      results.forEach(a => {
        csvContent += `"${a.id}","${a.patientName}","${a.doctorName}","${a.date}","${a.time}",${a.fee},"${a.status}"\n`;
      });
    } else if (searchType === 'Invoices') {
      headers = ['Invoice ID', 'Patient Name', 'Date Issued', 'Due Date', 'Subtotal', 'Tax Rate (%)', 'Total (Rs.)', 'Status'];
      csvContent += headers.join(',') + '\n';
      results.forEach(i => {
        csvContent += `"${i.id}","${i.patientName}","${i.date}","${i.dueDate}",${i.subtotal},${i.taxRate},${i.totalAmount},"${i.status}"\n`;
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Subhan_Care_${searchType}_Export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ── Export to PDF via Report API ────────────────────────────────────────
  const exportToPDF = async () => {
    if (results.length === 0) return;
    setIsPdfLoading(true);

    try {
      const params = new URLSearchParams({ type: searchType.toLowerCase() });
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (statusFilter !== 'All') params.append('status', statusFilter);

      const res = await fetch(`${API_URL}/reports/generate?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const json = await res.json();

      if (json.success) {
        // Open HTML report in new window for printing/PDF save
        const printWindow = window.open('', '_blank', 'width=1000,height=800');
        printWindow.document.write(json.html);
        printWindow.document.close();

        // Auto-trigger print dialog after content loads
        printWindow.onload = () => {
          setTimeout(() => printWindow.print(), 500);
        };
      } else {
        alert('Failed to generate report: ' + (json.error || 'Unknown error'));
      }
    } catch (err) {
      // Fallback: generate client-side PDF HTML
      generateClientPDF();
    } finally {
      setIsPdfLoading(false);
    }
  };

  // Client-side PDF fallback
  const generateClientPDF = () => {
    const today = new Date().toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    let tableHeaders = '';
    let tableRows = '';

    if (searchType === 'Patients') {
      tableHeaders = '<th>#</th><th>ID</th><th>Name</th><th>Gender</th><th>CNIC</th><th>Phone</th><th>Email</th><th>Blood</th><th>Reg. Date</th>';
      tableRows = results.map((p, i) =>
        `<tr><td>${i + 1}</td><td>${p.id}</td><td>${p.name}</td><td>${p.gender}</td><td>${p.cnic || 'N/A'}</td><td>${p.phone}</td><td>${p.email}</td><td>${p.bloodGroup}</td><td>${p.registeredDate || 'N/A'}</td></tr>`
      ).join('');
    } else if (searchType === 'Doctors') {
      tableHeaders = '<th>#</th><th>ID</th><th>Name</th><th>Specialty</th><th>Phone</th><th>Email</th><th>Fee</th>';
      tableRows = results.map((d, i) =>
        `<tr><td>${i + 1}</td><td>${d.id}</td><td>${d.name}</td><td>${d.specialty}</td><td>${d.phone}</td><td>${d.email}</td><td>Rs. ${d.fee}</td></tr>`
      ).join('');
    } else if (searchType === 'Appointments') {
      tableHeaders = '<th>#</th><th>ID</th><th>Patient</th><th>Doctor</th><th>Date</th><th>Time</th><th>Fee</th><th>Status</th>';
      tableRows = results.map((a, i) =>
        `<tr><td>${i + 1}</td><td>${a.id}</td><td>${a.patientName}</td><td>${a.doctorName}</td><td>${a.date}</td><td>${a.time}</td><td>Rs. ${a.fee}</td><td>${a.status}</td></tr>`
      ).join('');
    } else if (searchType === 'Invoices') {
      tableHeaders = '<th>#</th><th>ID</th><th>Patient</th><th>Date</th><th>Due</th><th>Total</th><th>Status</th>';
      tableRows = results.map((inv, i) =>
        `<tr><td>${i + 1}</td><td>${inv.id}</td><td>${inv.patientName}</td><td>${inv.date}</td><td>${inv.dueDate}</td><td>Rs. ${inv.totalAmount?.toFixed(2)}</td><td>${inv.status}</td></tr>`
      ).join('');
    }

    const html = `<!DOCTYPE html><html><head><title>${searchType} Report - Subhan Care HMS</title>
    <style>
      * { margin:0; padding:0; box-sizing:border-box; }
      body { font-family:'Segoe UI',Tahoma,sans-serif; padding:40px; color:#1e293b; font-size:12px; }
      .header { border-bottom:3px solid #2563eb; padding-bottom:20px; margin-bottom:24px; display:flex; justify-content:space-between; }
      .header h1 { font-size:22px; color:#1e40af; font-weight:800; }
      .header p { font-size:11px; color:#64748b; margin-top:4px; }
      .header-right { text-align:right; font-size:11px; color:#64748b; }
      table { width:100%; border-collapse:collapse; margin-top:16px; }
      th { background:#1e40af; color:white; padding:8px 12px; font-size:10px; text-transform:uppercase; text-align:left; }
      td { padding:8px 12px; border-bottom:1px solid #e2e8f0; }
      tr:nth-child(even) { background:#f8fafc; }
      .footer { margin-top:32px; border-top:2px solid #e2e8f0; padding-top:12px; font-size:10px; color:#94a3b8; display:flex; justify-content:space-between; }
      .footer .conf { color:#ef4444; font-weight:700; }
      @media print { body { padding:20px; } }
    </style></head><body>
    <div class="header">
      <div><h1>🏥 Subhan Care Hospitals Ltd.</h1><p>${searchType} Report — ${results.length} records</p></div>
      <div class="header-right"><strong>${today}</strong><br>Generated by HMS</div>
    </div>
    <table><thead><tr>${tableHeaders}</tr></thead><tbody>${tableRows}</tbody></table>
    <div class="footer"><span class="conf">⚠️ CONFIDENTIAL</span><span>© ${new Date().getFullYear()} Subhan Care Hospitals Ltd.</span></div>
    </body></html>`;

    const printWindow = window.open('', '_blank', 'width=1000,height=800');
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => setTimeout(() => printWindow.print(), 500);
  };

  // ── Clear filters ──────────────────────────────────────────────────────
  const clearFilters = () => {
    setKeyword('');
    setStartDate('');
    setEndDate('');
    setStatusFilter('All');
    setPage(1);
    setServerResults(null);
    setServerMeta(null);
    setSearchError('');
  };

  const hasActiveFilters = keyword || startDate || endDate || statusFilter !== 'All';

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">

      {/* Search Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-xl font-bold font-outfit text-slate-800 dark:text-slate-200">Advanced Query Builder</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
            Full-text search with MongoDB indexes • Filter, export CSV & PDF
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-xl text-xs font-bold transition-colors"
            >
              <X className="h-3.5 w-3.5" /> Clear
            </button>
          )}

          {results.length > 0 && (
            <>
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-500/10 transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>CSV</span>
              </button>

              <button
                onClick={exportToPDF}
                disabled={isPdfLoading}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-500/10 transition-colors"
              >
                {isPdfLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileDown className="h-4 w-4" />
                )}
                <span>PDF</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filter Controls */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm space-y-4">

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* Target Registry */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
              Target Registry
            </label>
            <select
              value={searchType}
              onChange={(e) => {
                setSearchType(e.target.value);
                setKeyword('');
                setStartDate('');
                setEndDate('');
                setStatusFilter('All');
                setPage(1);
                setServerResults(null);
              }}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="Patients">Patients List</option>
              <option value="Doctors">Doctors Roster</option>
              <option value="Appointments">Appointments Book</option>
              <option value="Invoices">Billing Invoices</option>
            </select>
          </div>

          {/* Search Input */}
          <div className="sm:col-span-2 lg:col-span-2">
            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
              Search Keyword
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder={
                  searchType === 'Patients' ? 'Search name, email, phone, CNIC, address...' :
                  searchType === 'Doctors' ? 'Search physician name, specialty...' :
                  searchType === 'Appointments' ? 'Search patient, doctor name...' :
                  'Search patient name, invoice ID...'
                }
                value={keyword}
                onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              {isSearching ? (
                <Loader2 className="h-4 w-4 text-blue-500 absolute left-3 top-3 animate-spin" />
              ) : (
                <Search className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
              )}
            </div>
          </div>

          {/* Status Filter */}
          {(searchType === 'Appointments' || searchType === 'Invoices') && (
            <div>
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                Status Filter
              </label>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="All">All Statuses</option>
                {searchType === 'Appointments' ? (
                  <>
                    <option value="Scheduled">Scheduled</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="Completed">Completed</option>
                  </>
                ) : (
                  <>
                    <option value="Paid">Paid</option>
                    <option value="Unpaid">Unpaid</option>
                  </>
                )}
              </select>
            </div>
          )}
        </div>

        {/* Date Range */}
        {(searchType === 'Patients' || searchType === 'Appointments' || searchType === 'Invoices') && (
          <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 text-xs">
            <span className="font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="h-4 w-4" /> Date Filter:
            </span>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <span className="text-slate-400 font-bold">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
        )}

        {/* Search info bar */}
        <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 pt-2">
          <span className="flex items-center gap-1.5">
            <BarChart3 className="h-3.5 w-3.5" />
            {results.length} result{results.length !== 1 ? 's' : ''} found
            {serverResults && ' (server-side search)'}
          </span>
          {searchError && (
            <span className="text-amber-500 flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5" /> {searchError}
            </span>
          )}
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          {results.length === 0 ? (
            <div className="text-center py-16">
              <Search className="h-12 w-12 text-slate-200 mx-auto mb-3" />
              <p className="text-base font-bold text-slate-550">No matching records found</p>
              <p className="text-xs text-slate-400 mt-1 font-medium">Verify your keywords or check your date range filters.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-850 border-b border-slate-150 dark:border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {searchType === 'Patients' && (
                    <>
                      <th className="px-6 py-4 font-semibold">Patient ID</th>
                      <th className="px-6 py-4 font-semibold">Name & Age</th>
                      <th className="px-6 py-4 font-semibold">CNIC</th>
                      <th className="px-6 py-4 font-semibold">Email</th>
                      <th className="px-6 py-4 font-semibold">Phone</th>
                      <th className="px-6 py-4 font-semibold">Blood Group</th>
                      <th className="px-6 py-4 font-semibold">Reg. Date</th>
                    </>
                  )}
                  {searchType === 'Doctors' && (
                    <>
                      <th className="px-6 py-4 font-semibold">Doctor ID</th>
                      <th className="px-6 py-4 font-semibold">Name</th>
                      <th className="px-6 py-4 font-semibold">Specialty</th>
                      <th className="px-6 py-4 font-semibold">Email</th>
                      <th className="px-6 py-4 font-semibold">Phone</th>
                      <th className="px-6 py-4 font-semibold text-right">Fee</th>
                    </>
                  )}
                  {searchType === 'Appointments' && (
                    <>
                      <th className="px-6 py-4 font-semibold">Appointment ID</th>
                      <th className="px-6 py-4 font-semibold">Patient Name</th>
                      <th className="px-6 py-4 font-semibold">Doctor Assigned</th>
                      <th className="px-6 py-4 font-semibold">Date & Time</th>
                      <th className="px-6 py-4 font-semibold text-right">Consulting Fee</th>
                      <th className="px-6 py-4 font-semibold text-center">Status</th>
                    </>
                  )}
                  {searchType === 'Invoices' && (
                    <>
                      <th className="px-6 py-4 font-semibold">Invoice ID</th>
                      <th className="px-6 py-4 font-semibold">Patient Name</th>
                      <th className="px-6 py-4 font-semibold">Issue Date</th>
                      <th className="px-6 py-4 font-semibold">Due Date</th>
                      <th className="px-6 py-4 font-semibold text-right">Total Amount</th>
                      <th className="px-6 py-4 font-semibold text-center">Status</th>
                    </>
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm font-medium text-slate-700 dark:text-slate-300">
                {searchType === 'Patients' && results.map(p => (
                  <tr key={p.id || p._id} className="hover:bg-slate-55/40 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 text-xs font-bold text-brand-650 dark:text-brand-400 bg-slate-50/20">{p.id}</td>
                    <td className="px-6 py-4">
                      <div className="font-extrabold text-slate-850 dark:text-slate-200">{p.name}</div>
                      <span className="text-xs text-slate-400 font-medium">{p.gender} • {p.age ? `${p.age} yrs` : p.dob}</span>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-slate-500">{p.cnic || 'N/A'}</td>
                    <td className="px-6 py-4 text-slate-500">{p.email}</td>
                    <td className="px-6 py-4 text-slate-500">{p.phone}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs rounded-full font-bold">
                        {p.bloodGroup}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs">{p.registeredDate || 'Seeded'}</td>
                  </tr>
                ))}

                {searchType === 'Doctors' && results.map(d => (
                  <tr key={d.id || d._id} className="hover:bg-slate-55/40 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 text-xs font-bold text-brand-650 dark:text-brand-400 bg-slate-50/20">{d.id}</td>
                    <td className="px-6 py-4 font-extrabold text-slate-850 dark:text-slate-200">{d.name}</td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold px-2 py-0.5 bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-900 rounded">
                        {d.specialty}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{d.email}</td>
                    <td className="px-6 py-4 text-slate-500">{d.phone}</td>
                    <td className="px-6 py-4 text-right font-bold text-slate-850 dark:text-slate-200">Rs.{d.fee}</td>
                  </tr>
                ))}

                {searchType === 'Appointments' && results.map(a => (
                  <tr key={a.id || a._id} className="hover:bg-slate-55/40 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 text-xs font-bold text-brand-650 dark:text-brand-400 bg-slate-50/20">{a.id}</td>
                    <td className="px-6 py-4 font-extrabold text-slate-850 dark:text-slate-200">{a.patientName}</td>
                    <td className="px-6 py-4 text-slate-500">{a.doctorName}</td>
                    <td className="px-6 py-4 text-slate-500 text-xs">{a.date} • {a.time}</td>
                    <td className="px-6 py-4 text-right font-bold text-slate-850 dark:text-slate-200">Rs.{a.fee}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        a.status === 'Scheduled' ? 'bg-emerald-50 text-emerald-700' :
                        a.status === 'Completed' ? 'bg-blue-50 text-blue-700' :
                        'bg-rose-50 text-rose-700'
                      }`}>
                        {a.status}
                      </span>
                    </td>
                  </tr>
                ))}

                {searchType === 'Invoices' && results.map(i => (
                  <tr key={i.id || i._id} className="hover:bg-slate-55/40 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 text-xs font-bold text-brand-650 dark:text-brand-400 bg-slate-50/20">{i.id}</td>
                    <td className="px-6 py-4 font-extrabold text-slate-850 dark:text-slate-200">{i.patientName}</td>
                    <td className="px-6 py-4 text-slate-500">{i.date}</td>
                    <td className="px-6 py-4 text-slate-500">{i.dueDate}</td>
                    <td className="px-6 py-4 text-right font-bold text-slate-850 dark:text-slate-200">Rs.{i.totalAmount?.toFixed(2)}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        i.status === 'Paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                      }`}>
                        {i.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {serverMeta && serverMeta.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900">
            <span className="text-xs font-semibold text-slate-400">
              Page {serverMeta.page} of {serverMeta.totalPages} ({serverMeta.total} total)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(serverMeta.totalPages, p + 1))}
                disabled={page >= serverMeta.totalPages}
                className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default AdvancedSearch;
