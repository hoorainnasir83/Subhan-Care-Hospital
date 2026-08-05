import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { Printer, Check, ArrowLeft, Activity, Mail, Phone, MapPin, CreditCard, ShieldCheck, X, CheckCircle2, Lock } from 'lucide-react';

const InvoiceDetails = ({ invoiceId, onClose }) => {
  const { invoices, patients, settings, markInvoicePaid, canWrite } = useContext(AppContext);
  const invoice = invoices.find(inv => inv.id === invoiceId);
  const patient = patients.find(p => p.id === (invoice?.patientId));
  const writeAllowed = canWrite('billing');

  // Digital Online Payment Modal State
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState('JazzCash'); // 'JazzCash' | 'EasyPaisa' | 'Stripe'
  const [mobileNumber, setMobileNumber] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  if (!invoice) {
    return (
      <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-150 dark:border-slate-800 text-center space-y-4">
        <p className="text-slate-500 font-bold">Invoice not found.</p>
        <button onClick={onClose} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm font-semibold">
          Go Back
        </button>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const handleOnlinePaymentSubmit = (e) => {
    e.preventDefault();
    setCheckoutError('');

    if (selectedGateway === 'JazzCash' || selectedGateway === 'EasyPaisa') {
      const cleanNum = mobileNumber.replace(/\D/g, '');
      if (cleanNum.length !== 11) {
        setCheckoutError(`Please enter a valid 11-digit ${selectedGateway} mobile account number.`);
        return;
      }
    } else if (selectedGateway === 'Stripe') {
      if (!cardNumber || !cardExpiry || !cardCvc) {
        setCheckoutError('Please enter all card details.');
        return;
      }
    }

    setIsProcessing(true);

    // Simulate real-time Gateway API authorization latency
    setTimeout(() => {
      setIsProcessing(false);
      setPaymentSuccess(true);
      markInvoicePaid(invoice.id);
      setTimeout(() => {
        setShowCheckoutModal(false);
        setPaymentSuccess(false);
      }, 2000);
    }, 2200);
  };

  const hospitalName = settings?.hospitalName || 'Subhan Care Clinic';
  const hospitalAddress = settings?.hospitalAddress || '123 Healthcare Blvd, Medical Suite 400';
  const hospitalPhone = settings?.hospitalPhone || '+1 (555) 019-9000';
  const adminEmail = settings?.adminEmail || 'billing@subhancare.com';
  const patientAddress = patient?.address || 'Hospital Registered Address';

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Detail Actions (hidden when printing) */}
      <div className="flex items-center justify-between no-print bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-150 dark:border-slate-800 shadow-sm flex-wrap gap-3">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Invoices</span>
        </button>

        <div className="flex items-center gap-3 flex-wrap">
          {invoice.status === 'Unpaid' && (
            <button
              onClick={() => {
                const gateway = ['JazzCash', 'EasyPaisa', 'Stripe'].includes(invoice.paymentMethod) ? invoice.paymentMethod : 'JazzCash';
                setSelectedGateway(gateway);
                setShowCheckoutModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg text-xs font-bold shadow-md shadow-emerald-500/20 transition-all active:scale-98"
            >
              <CreditCard className="h-4 w-4" />
              <span>Pay Online Now ({invoice.paymentMethod || 'Digital'})</span>
            </button>
          )}

          {invoice.status === 'Unpaid' && writeAllowed && (
            <button
              onClick={() => markInvoicePaid(invoice.id)}
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold transition-colors"
            >
              <Check className="h-4 w-4 text-emerald-600" />
              <span>Manual Mark Paid</span>
            </button>
          )}

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold shadow-md shadow-brand-500/10 transition-colors"
          >
            <Printer className="h-4 w-4" />
            <span>Print Paid Slip</span>
          </button>
        </div>
      </div>

      {/* Invoice Card Sheet (printable container) */}
      <div className="bg-white rounded-2xl border border-slate-150 p-8 md:p-12 shadow-md max-w-3xl mx-auto print-area relative overflow-hidden text-slate-800">
        
        {/* Decorative corner accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-50 rounded-full blur-2xl pointer-events-none transform translate-x-1/2 -translate-y-1/2 no-print"></div>

        {/* Invoice Branding & Stamp Header */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-6 border-b border-slate-100 pb-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-brand-600">
              <Activity className="h-7 w-7 text-brand-650" />
              <span className="font-bold font-outfit text-xl tracking-wide text-slate-900">{hospitalName}</span>
            </div>
            <div className="text-xs text-slate-400 space-y-1 font-medium">
              <p className="flex items-center gap-1.5"><MapPin className="h-3 w-3" /> {hospitalAddress}</p>
              <p className="flex items-center gap-1.5"><Phone className="h-3 w-3" /> {hospitalPhone}</p>
              <p className="flex items-center gap-1.5"><Mail className="h-3 w-3" /> {adminEmail}</p>
            </div>
          </div>

          {/* Dynamic Status Stamp */}
          <div className="flex flex-row md:flex-col items-start md:items-end justify-between w-full md:w-auto gap-4">
            <div className="text-right">
              <h2 className="text-2xl font-black font-outfit text-slate-800 uppercase tracking-tight">Invoice Receipt</h2>
              <p className="text-sm font-bold text-brand-600 mt-1">{invoice.id}</p>
            </div>

            <div className="mt-2">
              {invoice.status === 'Paid' ? (
                <div className="border-4 border-dashed border-emerald-500 text-emerald-500 rotate-[-12deg] px-4 py-1.5 text-sm font-black uppercase rounded-lg tracking-wider animate-in zoom-in-50 duration-300">
                  PAID ✓
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
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Billed To</h4>
            <div className="space-y-1">
              <p className="font-extrabold text-slate-850">{invoice.patientName}</p>
              <p className="text-xs text-slate-500 font-medium">Patient Reference: {invoice.patientId}</p>
              <p className="text-xs text-slate-500 font-medium">Address: {patientAddress}</p>
            </div>
          </div>

          <div className="space-y-2 sm:text-right">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Invoice Details</h4>
            <div className="space-y-1 text-xs text-slate-500 font-semibold">
              <p><span className="text-slate-400">Date Issued:</span> {invoice.date}</p>
              <p><span className="text-slate-400">Due Date:</span> {invoice.dueDate}</p>
              <p><span className="text-slate-400">Payment Gateway:</span> <strong className="text-slate-700">{invoice.paymentMethod || 'Digital Gateway'}</strong></p>
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
              {invoice.services && invoice.services.map((item, idx) => (
                <tr key={idx}>
                  <td className="py-4 text-center text-slate-400 text-xs">{idx + 1}</td>
                  <td className="py-4 font-bold text-slate-800">{item.name}</td>
                  <td className="py-4 text-right pr-4 font-semibold text-slate-800">${Number(item.cost).toFixed(2)}</td>
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
            
            {invoice.discount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount ({invoice.discount}%):</span>
                <span>-${(invoice.discountAmount || (invoice.subtotal * invoice.discount / 100)).toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between text-slate-500 border-b border-slate-100 pb-2">
              <span>Tax ({invoice.taxRate}%):</span>
              <span className="text-slate-850">${invoice.taxAmount.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-base font-extrabold text-slate-900 pt-1">
              <span className="font-outfit">Total Paid Amount:</span>
              <span className="text-emerald-600 font-outfit">${invoice.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {invoice.notes && (
          <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600">
            <p className="font-bold text-slate-500 uppercase tracking-wider mb-1">Billing Notes</p>
            <p>{invoice.notes}</p>
          </div>
        )}

        <div className="mt-12 pt-8 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400 font-semibold leading-relaxed">
            Thank you for choosing {hospitalName}. Official computer-generated invoice slip.
          </p>
        </div>
      </div>

      {/* Online Digital Payment Modal (JazzCash / EasyPaisa / Stripe) */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800 space-y-5 relative">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                <h3 className="font-bold font-outfit text-slate-800 dark:text-slate-100 text-base">Secure Digital Checkout</h3>
              </div>
              <button onClick={() => setShowCheckoutModal(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Gateway Selector Tabs */}
            <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              {['JazzCash', 'EasyPaisa', 'Stripe'].map(gw => (
                <button
                  key={gw}
                  type="button"
                  onClick={() => { setSelectedGateway(gw); setCheckoutError(''); }}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${
                    selectedGateway === gw
                      ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {gw}
                </button>
              ))}
            </div>

            {/* Invoice Total Summary Header */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 flex justify-between items-center text-xs">
              <span className="text-slate-500">Invoice Amount Due:</span>
              <span className="text-base font-extrabold text-emerald-600 font-outfit">${invoice.totalAmount.toFixed(2)}</span>
            </div>

            {paymentSuccess ? (
              <div className="text-center py-8 space-y-3 animate-in zoom-in-95 duration-200">
                <CheckCircle2 className="h-14 w-14 text-emerald-500 mx-auto" />
                <h4 className="font-black text-lg text-slate-800 dark:text-slate-100">Payment Successful!</h4>
                <p className="text-xs text-slate-500">Your invoice has been marked as <strong>PAID</strong> and official slip generated.</p>
              </div>
            ) : (
              <form onSubmit={handleOnlinePaymentSubmit} className="space-y-4">
                {checkoutError && (
                  <div className="p-3 bg-rose-50 text-rose-600 text-xs font-semibold rounded-xl border border-rose-200">
                    {checkoutError}
                  </div>
                )}

                {(selectedGateway === 'JazzCash' || selectedGateway === 'EasyPaisa') && (
                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">
                      Enter {selectedGateway} Account Number (11 Digits) *
                    </label>
                    <input
                      type="text"
                      value={mobileNumber}
                      onChange={e => setMobileNumber(e.target.value)}
                      placeholder="03001234567"
                      maxLength={11}
                      autoFocus
                      className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono font-bold tracking-wider text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-400 focus:outline-none"
                    />
                    <p className="text-[10px] text-slate-400">
                      You will receive an MPIN prompt on your {selectedGateway} mobile app/device to authorize payment.
                    </p>
                  </div>
                )}

                {selectedGateway === 'Stripe' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Card Number *</label>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={e => setCardNumber(e.target.value)}
                        placeholder="4242 4242 4242 4242"
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-brand-400 focus:outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Expiry (MM/YY) *</label>
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={e => setCardExpiry(e.target.value)}
                          placeholder="12/28"
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-brand-400 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">CVC *</label>
                        <input
                          type="password"
                          value={cardCvc}
                          onChange={e => setCardCvc(e.target.value)}
                          placeholder="123"
                          maxLength={4}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-brand-400 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Lock className="h-3.5 w-3.5" />
                        <span>Pay ${invoice.totalAmount.toFixed(2)} via {selectedGateway}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default InvoiceDetails;
