import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import InvoiceDetails from './InvoiceDetails';
import { 
  Plus, 
  Search, 
  Trash2, 
  Receipt, 
  User, 
  PlusCircle, 
  DollarSign, 
  Calendar, 
  Clock, 
  FileText,
  AlertCircle
} from 'lucide-react';

const Billing = () => {
  const { invoices, patients, addInvoice } = useContext(AppContext);
  const [activeSubTab, setActiveSubTab] = useState('list'); // 'list', 'create', 'history'
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('All'); // 'All', 'Paid', 'Unpaid'

  // Invoice Form State
  const [patientId, setPatientId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [taxRate, setTaxRate] = useState(10);
  const [services, setServices] = useState([{ name: '', cost: '' }]);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [formError, setFormError] = useState('');

  // Auto-calculated fields for the form in real-time
  const [subtotal, setSubtotal] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    const calculatedSubtotal = services.reduce((sum, s) => sum + (Number(s.cost) || 0), 0);
    const calculatedTaxAmount = Number((calculatedSubtotal * (Number(taxRate || 0) / 100)).toFixed(2));
    const calculatedTotal = Number((calculatedSubtotal + calculatedTaxAmount).toFixed(2));

    setSubtotal(calculatedSubtotal);
    setTaxAmount(calculatedTaxAmount);
    setTotalAmount(calculatedTotal);
  }, [services, taxRate]);

  // Handle service row updates
  const handleServiceChange = (index, field, value) => {
    const updatedServices = [...services];
    updatedServices[index][field] = value;
    setServices(updatedServices);
  };

  const addServiceRow = () => {
    setServices([...services, { name: '', cost: '' }]);
  };

  const removeServiceRow = (index) => {
    if (services.length > 1) {
      setServices(services.filter((_, idx) => idx !== index));
    }
  };

  // Create Invoice Handler
  const handleCreateInvoiceSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!patientId) {
      setFormError('Please select a patient.');
      return;
    }

    const hasEmptyService = services.some(s => !s.name.trim() || !s.cost);
    if (hasEmptyService) {
      setFormError('Please complete all service names and pricing costs.');
      return;
    }

    const hasInvalidCost = services.some(s => isNaN(s.cost) || Number(s.cost) <= 0);
    if (hasInvalidCost) {
      setFormError('Service costs must be valid numbers greater than 0.');
      return;
    }

    try {
      // Call Context addInvoice
      const createdInvoice = await addInvoice({
        patientId,
        date,
        dueDate,
        taxRate: Number(taxRate),
        paymentMethod,
        services
      });

      // Reset Form
      setPatientId('');
      setDate(new Date().toISOString().split('T')[0]);
      setDueDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
      setTaxRate(10);
      setPaymentMethod('Cash');
      setServices([{ name: '', cost: '' }]);
      
      // Redirect to Invoice details or back to list
      setSelectedInvoiceId(createdInvoice.id);
    } catch (err) {
      setFormError(err.message || 'Failed to create invoice');
    }
  };

  // Search filtering
  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = 
      inv.patientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      inv.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Check if matching search AND subtab filters
    if (activeSubTab === 'history') {
      const matchesFilter = paymentFilter === 'All' || inv.status === paymentFilter;
      return matchesSearch && matchesFilter;
    }
    
    return matchesSearch;
  });

  // Calculate payment stats
  const paidRevenue = invoices.filter(i => i.status === 'Paid').reduce((sum, i) => sum + i.totalAmount, 0);
  const unpaidRevenue = invoices.filter(i => i.status === 'Unpaid').reduce((sum, i) => sum + i.totalAmount, 0);

  // If viewing details of a single invoice, swap components
  if (selectedInvoiceId) {
    return (
      <InvoiceDetails 
        invoiceId={selectedInvoiceId} 
        onClose={() => setSelectedInvoiceId(null)} 
      />
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Page Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-150 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
        <div>
          <h2 className="text-xl font-bold font-outfit text-slate-800">Billing & Invoicing Workspace</h2>
          <p className="text-xs text-slate-400 font-medium">Issue invoices, record payments, and track receivables</p>
        </div>

        {/* Workspace Subtabs */}
        <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200 w-full sm:w-auto">
          <button
            onClick={() => { setActiveSubTab('list'); setSearchTerm(''); }}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'list' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            All Invoices
          </button>
          <button
            onClick={() => setActiveSubTab('create')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'create' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Create Invoice
          </button>
          <button
            onClick={() => { setActiveSubTab('history'); setSearchTerm(''); }}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'history' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Payment History
          </button>
        </div>
      </div>

      {/* RENDER ACTIVE TAB */}
      {activeSubTab === 'list' && (
        <div className="space-y-6">
          {/* Search bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="h-5 w-5" />
            </div>
            <input
              type="text"
              placeholder="Search invoices by patient name or invoice ID (e.g. INV-1001)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all font-medium text-sm shadow-sm"
            />
          </div>

          {/* Invoices List Table */}
          <div className="bg-white rounded-2xl border border-slate-150 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              {filteredInvoices.length === 0 ? (
                <div className="text-center py-16">
                  <Receipt className="h-12 w-12 text-slate-200 mx-auto mb-3" />
                  <p className="text-base font-bold text-slate-500">No invoices found</p>
                  <p className="text-xs text-slate-400 mt-1 font-medium">Try typing a different name or issue a new bill.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-150 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      <th className="px-6 py-4 font-semibold">Invoice ID</th>
                      <th className="px-6 py-4 font-semibold">Patient Name</th>
                      <th className="px-6 py-4 font-semibold">Date Issued</th>
                      <th className="px-6 py-4 font-semibold">Due Date</th>
                      <th className="px-6 py-4 font-semibold text-right">Amount</th>
                      <th className="px-6 py-4 font-semibold text-center">Status</th>
                      <th className="px-6 py-4 font-semibold text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                    {filteredInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-55/40 transition-colors">
                        <td className="px-6 py-4 text-xs font-bold text-brand-600 bg-slate-50/20">{inv.id}</td>
                        <td className="px-6 py-4">
                          <span className="font-extrabold text-slate-800">{inv.patientName}</span>
                          <span className="text-[10px] text-slate-400 font-semibold block uppercase">{inv.patientId}</span>
                        </td>
                        <td className="px-6 py-4 text-slate-500">{inv.date}</td>
                        <td className="px-6 py-4 text-slate-500">{inv.dueDate}</td>
                        <td className="px-6 py-4 text-right font-bold text-slate-800">${inv.totalAmount.toFixed(2)}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                            inv.status === 'Paid' 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/20' 
                              : 'bg-rose-50 text-rose-700 border border-rose-200/20'
                          }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${inv.status === 'Paid' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                            {inv.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => setSelectedInvoiceId(inv.id)}
                            className="text-xs font-bold text-brand-600 hover:text-brand-700 hover:underline bg-brand-50/50 hover:bg-brand-50 px-3 py-1.5 rounded-lg border border-brand-100/30 transition-colors"
                          >
                            View & Print
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'create' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create Invoice Form (Col-span 2) */}
          <div className="bg-white rounded-2xl border border-slate-150 p-6 shadow-sm lg:col-span-2 space-y-6">
            <div>
              <h3 className="text-lg font-bold font-outfit text-slate-800">Generate Patient Bill</h3>
              <p className="text-xs text-slate-400 font-medium">Record consulting services and generate printable bill sheets</p>
            </div>

            {formError && (
              <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-xl flex items-center gap-2 text-sm font-semibold text-rose-800">
                <AlertCircle className="h-5 w-5 text-rose-500 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateInvoiceSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Select Patient */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Select Patient *
                  </label>
                  <select
                    value={patientId}
                    onChange={(e) => setPatientId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                  >
                    <option value="">-- Choose registered patient --</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
                    ))}
                  </select>
                </div>

                {/* Dates */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Invoice Date
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                  />
                </div>
              </div>

              {/* Dynamic Service Rows */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-bold text-slate-550 uppercase tracking-wider">
                    Service Items List *
                  </label>
                  <button
                    type="button"
                    onClick={addServiceRow}
                    className="flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100/50 px-2 py-1 rounded"
                  >
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span>Add Service Row</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {services.map((item, idx) => (
                    <div key={idx} className="flex gap-2 items-center animate-in slide-in-from-top-1 duration-100">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => handleServiceChange(idx, 'name', e.target.value)}
                          placeholder="e.g. Lab Consultation Fee / Tooth Extraction"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                        />
                      </div>
                      
                      <div className="w-24 relative">
                        <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400 text-xs font-bold">$</span>
                        <input
                          type="number"
                          value={item.cost}
                          onChange={(e) => handleServiceChange(idx, 'cost', e.target.value)}
                          placeholder="Cost"
                          className="w-full pl-6 pr-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-semibold text-right"
                        />
                      </div>

                      {services.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeServiceRow(idx)}
                          className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors flex-shrink-0"
                          title="Remove item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Tax Rate & Payment Method */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Tax Rate (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={taxRate}
                      onChange={(e) => setTaxRate(Math.max(0, Number(e.target.value)))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-semibold"
                    />
                    <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 text-sm font-semibold pointer-events-none">%</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Payment Method *
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Card">Card</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
              </div>

              {/* Form buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={patients.length === 0}
                  className="px-5 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-brand-500/10 active:scale-98 disabled:opacity-50"
                >
                  Generate Invoice
                </button>
              </div>
            </form>
          </div>

          {/* Real-time Summary Card (Col-span 1) */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-800 space-y-6 h-fit self-start sticky top-24">
            <div>
              <span className="text-xs font-bold text-brand-400 uppercase tracking-wider block">Live Invoice Summary</span>
              <h3 className="text-xl font-bold font-outfit text-white mt-1">Calculations Breakdown</h3>
            </div>

            <div className="divide-y divide-slate-800 text-xs font-medium space-y-4">
              
              {/* Itemized Services live list */}
              <div className="space-y-2 pt-2">
                <p className="font-bold text-slate-450 uppercase text-[10px] tracking-wider mb-2">Itemized Fees</p>
                {services.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-slate-300">
                    <span className="truncate max-w-[140px]">{item.name || `Service Item #${idx + 1}`}</span>
                    <span className="font-semibold">${Number(item.cost || 0).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-2.5 pt-4">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-slate-200">${subtotal.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between text-slate-400">
                  <span>Tax ({taxRate}%):</span>
                  <span className="font-semibold text-slate-200">${taxAmount.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-sm font-extrabold text-white pt-2 border-t border-slate-800">
                  <span className="font-outfit">Total Amount:</span>
                  <span className="text-brand-400 font-outfit">${totalAmount.toFixed(2)}</span>
                </div>
              </div>

            </div>

            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-850 flex items-start gap-2.5 text-[11px] text-slate-400">
              <FileText className="h-4 w-4 text-brand-500 flex-shrink-0 mt-0.5" />
              <span>Invoices will generate automatically in an <b>Unpaid</b> state. You can print them or register payment receipt details under 'Invoice Details'.</span>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'history' && (
        <div className="space-y-6">
          {/* Finance Analytics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Card 1: Received */}
            <div className="bg-white rounded-2xl border border-slate-150 p-6 flex items-center justify-between shadow-sm">
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Accounts Received</span>
                <span className="text-2xl font-black font-outfit text-slate-800 block">${paidRevenue.toLocaleString()}</span>
                <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 font-bold inline-block">Paid Invoices</span>
              </div>
              <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl">
                <DollarSign className="h-6 w-6" />
              </div>
            </div>

            {/* Card 2: Outstanding */}
            <div className="bg-white rounded-2xl border border-slate-150 p-6 flex items-center justify-between shadow-sm">
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Outstanding Receivables</span>
                <span className="text-2xl font-black font-outfit text-slate-800 block">${unpaidRevenue.toLocaleString()}</span>
                <span className="text-[10px] text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100 font-bold inline-block">Unpaid Invoices</span>
              </div>
              <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl">
                <Clock className="h-6 w-6" />
              </div>
            </div>
          </div>

          {/* Table filters */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="relative w-full sm:w-80">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="h-5 w-5" />
              </div>
              <input
                type="text"
                placeholder="Search history by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all font-semibold text-xs shadow-sm"
              />
            </div>

            {/* Paid / Unpaid buttons filter */}
            <div className="flex bg-slate-150 p-1 rounded-xl border border-slate-200">
              {['All', 'Paid', 'Unpaid'].map((status) => (
                <button
                  key={status}
                  onClick={() => setPaymentFilter(status)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    paymentFilter === status 
                      ? 'bg-white text-slate-900 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-850'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Filtered History table */}
          <div className="bg-white rounded-2xl border border-slate-150 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              {filteredInvoices.length === 0 ? (
                <div className="text-center py-16">
                  <Receipt className="h-12 w-12 text-slate-200 mx-auto mb-3" />
                  <p className="text-base font-bold text-slate-500">No matching items</p>
                  <p className="text-xs text-slate-400 mt-1 font-medium">Verify filter criteria or search keyword.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-150 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      <th className="px-6 py-4 font-semibold">Invoice ID</th>
                      <th className="px-6 py-4 font-semibold">Patient Name</th>
                      <th className="px-6 py-4 font-semibold">Date Issued</th>
                      <th className="px-6 py-4 font-semibold">Due Date</th>
                      <th className="px-6 py-4 font-semibold text-right">Amount Due</th>
                      <th className="px-6 py-4 font-semibold text-center">Status</th>
                      <th className="px-6 py-4 font-semibold text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                    {filteredInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-55/40 transition-colors">
                        <td className="px-6 py-4 text-xs font-bold text-brand-600 bg-slate-50/20">{inv.id}</td>
                        <td className="px-6 py-4">
                          <span className="font-extrabold text-slate-800">{inv.patientName}</span>
                          <span className="text-[10px] text-slate-400 font-semibold block uppercase">{inv.patientId}</span>
                        </td>
                        <td className="px-6 py-4 text-slate-500">{inv.date}</td>
                        <td className="px-6 py-4 text-slate-500">{inv.dueDate}</td>
                        <td className="px-6 py-4 text-right font-bold text-slate-800">${inv.totalAmount.toFixed(2)}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                            inv.status === 'Paid' 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/20' 
                              : 'bg-rose-50 text-rose-700 border border-rose-200/20'
                          }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${inv.status === 'Paid' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                            {inv.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => setSelectedInvoiceId(inv.id)}
                            className="text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100/50 px-3 py-1.5 rounded-lg border border-slate-150/30 transition-colors"
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Billing;
