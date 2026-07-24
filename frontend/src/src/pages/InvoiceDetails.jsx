import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { Printer, Check, ArrowLeft, Activity, Mail, Phone, MapPin } from 'lucide-react';

const InvoiceDetails = ({ invoiceId, onClose }) => {
  const { invoices, markInvoicePaid } = useContext(AppContext);
  const invoice = invoices.find(inv => inv.id === invoiceId);

  if (!invoice) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-150 text-center space-y-4">
        <p className="text-slate-500 font-bold">Invoice not found.</p>
        <button onClick={onClose} className="px-4 py-2 bg-slate-100 rounded-lg text-sm font-semibold">
          Go Back
        </button>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Detail Actions (hidden when printing) */}
      <div className="flex items-center justify-between no-print bg-white p-4 rounded-xl border border-slate-150 shadow-sm">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Invoices</span>
        </button>

        <div className="flex gap-3">
          {invoice.status === 'Unpaid' && (
            <button
              onClick={() => markInvoicePaid(invoice.id)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-md shadow-emerald-500/10 transition-colors"
            >
              <Check className="h-4 w-4" />
              <span>Mark as Paid</span>
            </button>
          )}
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold shadow-md shadow-brand-500/10 transition-colors"
          >
            <Printer className="h-4 w-4" />
            <span>Print Invoice</span>
          </button>
        </div>
      </div>

      {/* Invoice Card Sheet (printable container) */}
      <div className="bg-white rounded-2xl border border-slate-150 p-8 md:p-12 shadow-md max-w-3xl mx-auto print-area relative overflow-hidden">
        
        {/* Decorative corner accent (hidden on print) */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-50 rounded-full blur-2xl pointer-events-none transform translate-x-1/2 -translate-y-1/2 no-print"></div>

        {/* Invoice Branding & Stamp Header */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-6 border-b border-slate-100 pb-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-brand-600">
              <Activity className="h-7 w-7 text-brand-650" />
              <span className="font-bold font-outfit text-xl tracking-wide text-slate-900">Subhan Care Clinic</span>
            </div>
            <div className="text-xs text-slate-400 space-y-1 font-medium">
              <p className="flex items-center gap-1.5"><MapPin className="h-3 w-3" /> 123 Healthcare Blvd, Medical Suite 400</p>
              <p className="flex items-center gap-1.5"><Phone className="h-3 w-3" /> +1 (555) 019-9000</p>
              <p className="flex items-center gap-1.5"><Mail className="h-3 w-3" /> billing@subhancare.com</p>
            </div>
          </div>

          {/* Dynamic Status Stamp */}
          <div className="flex flex-row md:flex-col items-start md:items-end justify-between w-full md:w-auto gap-4">
            <div className="text-right">
              <h2 className="text-2xl font-black font-outfit text-slate-800 uppercase tracking-tight">Invoice</h2>
              <p className="text-sm font-bold text-brand-600 mt-1">{invoice.id}</p>
            </div>

            {/* Stamp Stamp */}
            <div className="mt-2">
              {invoice.status === 'Paid' ? (
                <div className="border-4 border-dashed border-emerald-500 text-emerald-500 rotate-[-12deg] px-4 py-1.5 text-sm font-black uppercase rounded-lg tracking-wider animate-in zoom-in-50 duration-300">
                  PAID
                </div>
              ) : (
                <div className="border-4 border-dashed border-rose-500 text-rose-500 rotate-[-12deg] px-4 py-1.5 text-sm font-black uppercase rounded-lg tracking-wider animate-in zoom-in-50 duration-300">
                  UNPAID
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Invoice Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 py-8 border-b border-slate-100 text-sm">
          {/* Patient Details */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Billed To</h4>
            <div className="space-y-1">
              <p className="font-extrabold text-slate-850">{invoice.patientName}</p>
              <p className="text-xs text-slate-500 font-medium">Patient Reference: {invoice.patientId}</p>
              <p className="text-xs text-slate-500 font-medium">Address: {invoice.patientId === 'pat-1' ? '123 Maple St, Springfield' : invoice.patientId === 'pat-2' ? '456 Oak Rd, Riverdale' : 'Hospital Registered Address'}</p>
            </div>
          </div>

          {/* Metadata */}
          <div className="space-y-2 sm:text-right">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Invoice Details</h4>
            <div className="space-y-1 text-xs text-slate-500 font-semibold">
              <p><span className="text-slate-400">Date Issued:</span> {invoice.date}</p>
              <p><span className="text-slate-400">Due Date:</span> {invoice.dueDate}</p>
              <p><span className="text-slate-400">Payment Method:</span> {invoice.paymentMethod || 'Cash'}</p>
            </div>
          </div>
        </div>

        {/* Itemized Services Table */}
        <div className="py-8">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-bold text-slate-400 uppercase tracking-wider pb-2">
                <th className="pb-3 w-12 text-center">#</th>
                <th className="pb-3">Service / Treatment Description</th>
                <th className="pb-3 text-right pr-4">Cost ($ USD)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 text-sm font-medium text-slate-700">
              {invoice.services.map((item, idx) => (
                <tr key={idx}>
                  <td className="py-4 text-center text-slate-400 text-xs">{idx + 1}</td>
                  <td className="py-4 font-bold text-slate-800">{item.name}</td>
                  <td className="py-4 text-right pr-4 font-semibold text-slate-800">${item.cost.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Calculation Card */}
        <div className="flex justify-end pt-4 border-t border-slate-150">
          <div className="w-full sm:w-64 space-y-2 text-sm font-semibold">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal:</span>
              <span className="text-slate-800">${invoice.subtotal.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between text-slate-500 border-b border-slate-100 pb-2">
              <span>Tax ({invoice.taxRate}%):</span>
              <span className="text-slate-850">${invoice.taxAmount.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-base font-extrabold text-slate-900 pt-1">
              <span className="font-outfit">Total Due:</span>
              <span className="text-brand-700 font-outfit">${invoice.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Terms & Notes Footer */}
        <div className="mt-12 pt-8 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400 font-semibold leading-relaxed">
            Thank you for choosing Subhan Care Clinic. Payment is due within 7 days of invoice issuance.
          </p>
          <p className="text-[10px] text-slate-400 font-medium mt-1">
            For support or billing disputes, please contact our financial services desk at <span className="font-bold text-slate-500">billing@subhancare.com</span>.
          </p>
        </div>

      </div>
    </div>
  );
};

export default InvoiceDetails;
