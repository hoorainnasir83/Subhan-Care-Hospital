import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { Search, Download, Calendar, Filter, Users, Stethoscope, FileText, CheckCircle } from 'lucide-react';

const AdvancedSearch = () => {
  const { patients, doctors, appointments, invoices } = useContext(AppContext);

  // Search States
  const [searchType, setSearchType] = useState('Patients'); // 'Patients', 'Doctors', 'Appointments', 'Invoices'
  const [keyword, setKeyword] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Filter Logic
  const getFilteredResults = () => {
    const key = keyword.toLowerCase().trim();
    
    switch (searchType) {
      case 'Patients':
        return patients.filter(pat => {
          const matchesKeyword = 
            pat.name.toLowerCase().includes(key) ||
            pat.email.toLowerCase().includes(key) ||
            pat.phone.includes(key) ||
            pat.id.toLowerCase().includes(key);
          const matchesDate = !startDate || !endDate || (pat.registeredDate >= startDate && pat.registeredDate <= endDate);
          return matchesKeyword && matchesDate;
        });

      case 'Doctors':
        return doctors.filter(doc => {
          const matchesKeyword = 
            doc.name.toLowerCase().includes(key) ||
            doc.specialty.toLowerCase().includes(key) ||
            doc.email.toLowerCase().includes(key);
          return matchesKeyword;
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

  const results = getFilteredResults();

  // Export to CSV Function
  const exportToCSV = () => {
    if (results.length === 0) return;

    let csvContent = '';
    let headers = [];

    // Formulate CSV header rows based on entity
    if (searchType === 'Patients') {
      headers = ['Patient ID', 'Full Name', 'Age', 'Gender', 'Phone', 'Email', 'Blood Group', 'Registered Date'];
      csvContent += headers.join(',') + '\n';
      results.forEach(p => {
        csvContent += `"${p.id}","${p.name}",${p.age},"${p.gender}","${p.phone}","${p.email}","${p.bloodGroup}","${p.registeredDate || ''}"\n`;
      });
    } else if (searchType === 'Doctors') {
      headers = ['Doctor ID', 'Name', 'Specialty', 'Phone', 'Email', 'Availability', 'Consultation Fee ($)'];
      csvContent += headers.join(',') + '\n';
      results.forEach(d => {
        csvContent += `"${d.id}","${d.name}","${d.specialty}","${d.phone}","${d.email}","${d.availability}",${d.fee}\n`;
      });
    } else if (searchType === 'Appointments') {
      headers = ['Appointment ID', 'Patient Name', 'Doctor Name', 'Date', 'Time Slot', 'Fee ($)', 'Status'];
      csvContent += headers.join(',') + '\n';
      results.forEach(a => {
        csvContent += `"${a.id}","${a.patientName}","${a.doctorName}","${a.date}","${a.time}",${a.fee},"${a.status}"\n`;
      });
    } else if (searchType === 'Invoices') {
      headers = ['Invoice ID', 'Patient Name', 'Date Issued', 'Due Date', 'Subtotal ($)', 'Tax Rate (%)', 'Total Billed ($)', 'Status'];
      csvContent += headers.join(',') + '\n';
      results.forEach(i => {
        csvContent += `"${i.id}","${i.patientName}","${i.date}","${i.dueDate}",${i.subtotal},${i.taxRate},${i.totalAmount},"${i.status}"\n`;
      });
    }

    // Create Download Trigger
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

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Search Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-xl font-bold font-outfit text-slate-800 dark:text-slate-200">Advanced Query Builder</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Filter hospital registries and compile database records</p>
        </div>

        {results.length > 0 && (
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-500/10 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
        )}
      </div>

      {/* Advanced Filter Inputs Container */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm space-y-4">
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Target Registry Category */}
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
              }}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="Patients">Patients List</option>
              <option value="Doctors">Doctors Roster</option>
              <option value="Appointments">Appointments Book</option>
              <option value="Invoices">Billing Invoices</option>
            </select>
          </div>

          {/* Text Keyword Search */}
          <div className="sm:col-span-2 lg:col-span-2">
            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
              Search Keyword
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder={
                  searchType === 'Patients' ? 'Search patient name, email, phone...' :
                  searchType === 'Doctors' ? 'Search physician name, specialty...' :
                  searchType === 'Appointments' ? 'Search patient, doctor name...' :
                  'Search patient name, invoice ID...'
                }
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <Search className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          {/* Optional Status filter */}
          {(searchType === 'Appointments' || searchType === 'Invoices') && (
            <div>
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                Status Filter
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="All">All Statuses</option>
                {searchType === 'Appointments' ? (
                  <>
                    <option value="Scheduled">Scheduled</option>
                    <option value="Cancelled">Cancelled</option>
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

        {/* Date Ranges (optional and only shows when dates apply) */}
        {(searchType === 'Patients' || searchType === 'Appointments' || searchType === 'Invoices') && (
          <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 text-xs">
            <span className="font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="h-4 w-4" /> Date Filter:
            </span>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <span className="text-slate-400 font-bold">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
        )}

      </div>

      {/* Query Results Table */}
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
              {/* Dynamic Headers */}
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-850 border-b border-slate-150 dark:border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {searchType === 'Patients' && (
                    <>
                      <th className="px-6 py-4 font-semibold">Patient ID</th>
                      <th className="px-6 py-4 font-semibold">Name & Age</th>
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
              
              {/* Dynamic Body */}
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm font-medium text-slate-700 dark:text-slate-300">
                {searchType === 'Patients' && results.map(p => (
                  <tr key={p.id} className="hover:bg-slate-55/40 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 text-xs font-bold text-brand-650 dark:text-brand-400 bg-slate-50/20">{p.id}</td>
                    <td className="px-6 py-4">
                      <div className="font-extrabold text-slate-850 dark:text-slate-200">{p.name}</div>
                      <span className="text-xs text-slate-400 font-medium">{p.gender} • {p.age} yrs</span>
                    </td>
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
                  <tr key={d.id} className="hover:bg-slate-55/40 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 text-xs font-bold text-brand-650 dark:text-brand-400 bg-slate-50/20">{d.id}</td>
                    <td className="px-6 py-4 font-extrabold text-slate-850 dark:text-slate-200">{d.name}</td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold px-2 py-0.5 bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-900 rounded">
                        {d.specialty}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{d.email}</td>
                    <td className="px-6 py-4 text-slate-500">{d.phone}</td>
                    <td className="px-6 py-4 text-right font-bold text-slate-850 dark:text-slate-200">${d.fee}</td>
                  </tr>
                ))}

                {searchType === 'Appointments' && results.map(a => (
                  <tr key={a.id} className="hover:bg-slate-55/40 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 text-xs font-bold text-brand-650 dark:text-brand-400 bg-slate-50/20">{a.id}</td>
                    <td className="px-6 py-4 font-extrabold text-slate-850 dark:text-slate-200">{a.patientName}</td>
                    <td className="px-6 py-4 text-slate-500">{a.doctorName}</td>
                    <td className="px-6 py-4 text-slate-500 text-xs">
                      {a.date} • {a.time}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-slate-850 dark:text-slate-200">${a.fee}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        a.status === 'Scheduled' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                      }`}>
                        {a.status}
                      </span>
                    </td>
                  </tr>
                ))}

                {searchType === 'Invoices' && results.map(i => (
                  <tr key={i.id} className="hover:bg-slate-55/40 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 text-xs font-bold text-brand-650 dark:text-brand-400 bg-slate-50/20">{i.id}</td>
                    <td className="px-6 py-4 font-extrabold text-slate-850 dark:text-slate-200">{i.patientName}</td>
                    <td className="px-6 py-4 text-slate-500">{i.date}</td>
                    <td className="px-6 py-4 text-slate-500">{i.dueDate}</td>
                    <td className="px-6 py-4 text-right font-bold text-slate-850 dark:text-slate-200">${i.totalAmount.toFixed(2)}</td>
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
      </div>

    </div>
  );
};

export default AdvancedSearch;
