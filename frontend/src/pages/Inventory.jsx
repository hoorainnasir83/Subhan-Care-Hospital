import React, { useState, useContext, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import {
  Package, Plus, Search, Trash2, Edit3, AlertTriangle,
  AlertCircle, CheckCircle, TrendingUp, TrendingDown,
  X, RefreshCw, ChevronDown, Clock, DollarSign,
  Boxes, Filter
} from 'lucide-react';

// ── Constants ─────────────────────────────────────────────────────────────────
const CATEGORIES = ['All', 'Tablet', 'Capsule', 'Syrup', 'Injection', 'Cream', 'Drops', 'Inhaler', 'Other'];
const UNITS      = ['Tablets', 'Capsules', 'ml', 'mg', 'Units', 'Strips', 'Vials', 'Bottles'];

const EMPTY_FORM = {
  name: '', genericName: '', category: 'Tablet', manufacturer: '',
  batchNumber: '', expiryDate: '', purchasePrice: '', sellingPrice: '',
  stockQuantity: '0', lowStockThreshold: '10', unit: 'Tablets',
  location: '', description: ''
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const isExpiringSoon = (dateStr, days = 30) => {
  if (!dateStr) return false;
  const diff = new Date(dateStr) - new Date();
  return diff > 0 && diff <= days * 86400000;
};

const isExpired = (dateStr) => {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
};

const daysUntilExpiry = (dateStr) => {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr) - new Date()) / 86400000);
};

const fmt = (n, dec = 2) => Number(n).toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });

// ── Category Badge ────────────────────────────────────────────────────────────
const CATEGORY_COLORS = {
  Tablet: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  Capsule: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  Syrup: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  Injection: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  Cream: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
  Drops: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
  Inhaler: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  Other: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
};

const CategoryBadge = ({ category }) => (
  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${CATEGORY_COLORS[category] || CATEGORY_COLORS.Other}`}>
    {category}
  </span>
);

// ── Stock Status Badge ─────────────────────────────────────────────────────────
const StockBadge = ({ med }) => {
  if (med.stockQuantity === 0) {
    return <span className="flex items-center gap-1 text-[10px] font-bold text-red-600 dark:text-red-400"><AlertCircle className="h-3 w-3" /> Out of Stock</span>;
  }
  if (med.isLowStock || med.stockQuantity <= med.lowStockThreshold) {
    return <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400"><AlertTriangle className="h-3 w-3" /> Low Stock</span>;
  }
  return <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400"><CheckCircle className="h-3 w-3" /> In Stock</span>;
};

// ── Main Component ─────────────────────────────────────────────────────────────
const Inventory = () => {
  const { medicines, addMedicine, updateMedicine, adjustStock, deleteMedicine, fetchMedicines, canWrite } = useContext(AppContext);
  const writeAllowed = canWrite('inventory');

  // Tab / filter state
  const [activeTab, setActiveTab]         = useState('list');    // 'list' | 'alerts'
  const [search, setSearch]               = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Modal state
  const [showForm, setShowForm]           = useState(false);
  const [editingMed, setEditingMed]       = useState(null);      // null = add, object = edit
  const [formData, setFormData]           = useState(EMPTY_FORM);
  const [formError, setFormError]         = useState('');
  const [formLoading, setFormLoading]     = useState(false);

  // Stock adjustment modal
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockMed, setStockMed]             = useState(null);
  const [stockAdj, setStockAdj]             = useState('');
  const [stockReason, setStockReason]       = useState('');
  const [stockType, setStockType]           = useState('add');    // 'add' | 'remove'
  const [stockLoading, setStockLoading]     = useState(false);

  // Delete confirmation
  const [deleteId, setDeleteId]           = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ── Derived Stats ───────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const lowStock    = medicines.filter(m => m.stockQuantity <= m.lowStockThreshold && m.stockQuantity > 0);
    const outOfStock  = medicines.filter(m => m.stockQuantity === 0);
    const expiringSoon = medicines.filter(m => isExpiringSoon(m.expiryDate));
    const expired     = medicines.filter(m => isExpired(m.expiryDate));
    const totalValue  = medicines.reduce((s, m) => s + m.sellingPrice * m.stockQuantity, 0);
    return { total: medicines.length, lowStock: lowStock.length, outOfStock: outOfStock.length, expiringSoon: expiringSoon.length, expired: expired.length, totalValue };
  }, [medicines]);

  // ── Filtered List ───────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = medicines;
    if (search.trim()) {
      const re = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      list = list.filter(m => re.test(m.name) || re.test(m.genericName) || re.test(m.manufacturer) || re.test(m.batchNumber));
    }
    if (categoryFilter !== 'All') list = list.filter(m => m.category === categoryFilter);
    return list;
  }, [medicines, search, categoryFilter]);

  const alertMeds = useMemo(() =>
    medicines.filter(m => m.stockQuantity <= m.lowStockThreshold || isExpiringSoon(m.expiryDate) || isExpired(m.expiryDate))
      .sort((a, b) => a.stockQuantity - b.stockQuantity),
    [medicines]);

  // ── Form Handlers ───────────────────────────────────────────────────────────
  const openAddForm = () => {
    setEditingMed(null);
    setFormData(EMPTY_FORM);
    setFormError('');
    setShowForm(true);
  };

  const openEditForm = (med) => {
    setEditingMed(med);
    setFormData({
      name: med.name, genericName: med.genericName || '', category: med.category,
      manufacturer: med.manufacturer || '', batchNumber: med.batchNumber || '',
      expiryDate: med.expiryDate, purchasePrice: med.purchasePrice,
      sellingPrice: med.sellingPrice, stockQuantity: med.stockQuantity,
      lowStockThreshold: med.lowStockThreshold, unit: med.unit || 'Tablets',
      location: med.location || '', description: med.description || ''
    });
    setFormError('');
    setShowForm(true);
  };

  const handleFormChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim())     { setFormError('Medicine name is required.'); return; }
    if (!formData.expiryDate)      { setFormError('Expiry date is required.'); return; }
    if (Number(formData.purchasePrice) < 0) { setFormError('Purchase price must be ≥ 0.'); return; }
    if (Number(formData.sellingPrice)  < 0) { setFormError('Selling price must be ≥ 0.'); return; }

    setFormLoading(true);
    try {
      let result;
      if (editingMed) {
        result = await updateMedicine(editingMed.id, formData);
      } else {
        result = await addMedicine(formData);
      }
      if (result.success) {
        setShowForm(false);
      } else {
        setFormError(result.error || 'Operation failed. Please try again.');
      }
    } catch {
      setFormError('An unexpected error occurred.');
    } finally {
      setFormLoading(false);
    }
  };

  // ── Stock Adjustment Handlers ───────────────────────────────────────────────
  const openStockModal = (med) => {
    setStockMed(med);
    setStockAdj('');
    setStockReason('');
    setStockType('add');
    setShowStockModal(true);
  };

  const handleStockSubmit = async (e) => {
    e.preventDefault();
    const adjNum = parseInt(stockAdj);
    if (!adjNum || adjNum <= 0) { return; }

    setStockLoading(true);
    const finalAdj = stockType === 'remove' ? -adjNum : adjNum;
    const result = await adjustStock(stockMed.id, finalAdj, stockReason);
    setStockLoading(false);

    if (result.success) {
      setShowStockModal(false);
    }
  };

  // ── Delete Handler ──────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    await deleteMedicine(deleteId);
    setDeleteLoading(false);
    setDeleteId(null);
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-outfit text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Package className="h-7 w-7 text-brand-500" />
            Pharmacy Inventory
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage medicines, stock levels and expiry alerts
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => fetchMedicines()}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium transition-colors"
            title="Refresh inventory"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          {writeAllowed && (
            <button
              id="btn-add-medicine"
              onClick={openAddForm}
              className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-brand-500/20 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Medicine
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<Boxes className="h-5 w-5 text-blue-500" />} label="Total Medicines" value={stats.total} bg="bg-blue-50 dark:bg-blue-950/30" />
        <StatCard icon={<AlertTriangle className="h-5 w-5 text-amber-500" />} label="Low / Out of Stock" value={stats.lowStock + stats.outOfStock} bg="bg-amber-50 dark:bg-amber-950/30" highlight={stats.lowStock + stats.outOfStock > 0} />
        <StatCard icon={<Clock className="h-5 w-5 text-rose-500" />} label="Expiring Soon" value={stats.expiringSoon + stats.expired} bg="bg-rose-50 dark:bg-rose-950/30" highlight={stats.expiringSoon + stats.expired > 0} />
        <StatCard icon={<DollarSign className="h-5 w-5 text-emerald-500" />} label="Stock Value" value={`$${fmt(stats.totalValue)}`} bg="bg-emerald-50 dark:bg-emerald-950/30" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl w-fit">
        {[
          { id: 'list',   label: 'All Medicines' },
          { id: 'alerts', label: `Alerts ${alertMeds.length > 0 ? `(${alertMeds.length})` : ''}` }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === tab.id
                ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── All Medicines Tab ────────────────────────────────────────────────── */}
      {activeTab === 'list' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm overflow-hidden">
          {/* Search / Filter Bar */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                id="inv-search"
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, generic name, manufacturer…"
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-300 dark:focus:ring-brand-700"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="pl-9 pr-8 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-300 dark:focus:ring-brand-700 appearance-none cursor-pointer"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Table */}
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-slate-400 dark:text-slate-500">
              <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-semibold">No medicines found</p>
              <p className="text-xs mt-1">{search || categoryFilter !== 'All' ? 'Try adjusting your filters.' : 'Add your first medicine to get started.'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                    {['Medicine', 'Category', 'Batch', 'Stock', 'Expiry', 'Price', 'Location', 'Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
                  {filtered.map(med => {
                    const exp = isExpired(med.expiryDate);
                    const expSoon = isExpiringSoon(med.expiryDate);
                    const daysLeft = daysUntilExpiry(med.expiryDate);
                    const rowBg = exp ? 'bg-red-50/40 dark:bg-red-950/10'
                      : expSoon ? 'bg-amber-50/40 dark:bg-amber-950/10'
                      : (med.isLowStock || med.stockQuantity <= med.lowStockThreshold) ? 'bg-amber-50/20 dark:bg-amber-950/5'
                      : '';

                    return (
                      <tr key={med.id} className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors ${rowBg}`}>
                        {/* Medicine Name */}
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[180px]">{med.name}</p>
                          {med.genericName && <p className="text-xs text-slate-400 dark:text-slate-500 truncate max-w-[180px]">{med.genericName}</p>}
                          <p className="text-[10px] text-slate-400 mt-0.5">{med.id}</p>
                        </td>

                        {/* Category */}
                        <td className="px-4 py-3">
                          <CategoryBadge category={med.category} />
                        </td>

                        {/* Batch */}
                        <td className="px-4 py-3">
                          <p className="text-xs font-medium text-slate-600 dark:text-slate-300 font-mono">{med.batchNumber || '—'}</p>
                        </td>

                        {/* Stock */}
                        <td className="px-4 py-3">
                          <p className={`font-bold text-base ${med.stockQuantity === 0 ? 'text-red-600 dark:text-red-400' : (med.isLowStock || med.stockQuantity <= med.lowStockThreshold) ? 'text-amber-600 dark:text-amber-400' : 'text-slate-800 dark:text-slate-200'}`}>
                            {med.stockQuantity}
                          </p>
                          <p className="text-[10px] text-slate-400">{med.unit}</p>
                          <StockBadge med={med} />
                        </td>

                        {/* Expiry */}
                        <td className="px-4 py-3">
                          <p className={`text-xs font-medium ${exp ? 'text-red-600 dark:text-red-400' : expSoon ? 'text-amber-600 dark:text-amber-400' : 'text-slate-600 dark:text-slate-300'}`}>
                            {med.expiryDate}
                          </p>
                          {exp && <p className="text-[10px] font-bold text-red-500">EXPIRED</p>}
                          {!exp && expSoon && <p className="text-[10px] font-bold text-amber-500">{daysLeft}d left</p>}
                        </td>

                        {/* Price */}
                        <td className="px-4 py-3">
                          <p className="text-xs text-slate-500 dark:text-slate-400">Buy: <span className="font-medium text-slate-700 dark:text-slate-300">${fmt(med.purchasePrice)}</span></p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Sell: <span className="font-semibold text-emerald-600 dark:text-emerald-400">${fmt(med.sellingPrice)}</span></p>
                        </td>

                        {/* Location */}
                        <td className="px-4 py-3">
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[100px]">{med.location || '—'}</p>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {writeAllowed && (
                              <>
                                <button
                                  id={`btn-stock-${med.id}`}
                                  onClick={() => openStockModal(med)}
                                  title="Adjust Stock"
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/30 transition-colors"
                                >
                                  <TrendingUp className="h-4 w-4" />
                                </button>
                                <button
                                  id={`btn-edit-${med.id}`}
                                  onClick={() => openEditForm(med)}
                                  title="Edit Medicine"
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors"
                                >
                                  <Edit3 className="h-4 w-4" />
                                </button>
                                <button
                                  id={`btn-delete-${med.id}`}
                                  onClick={() => setDeleteId(med.id)}
                                  title="Delete Medicine"
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="px-4 py-2 text-xs text-slate-400 dark:text-slate-500 border-t border-slate-50 dark:border-slate-800">
                Showing {filtered.length} of {medicines.length} medicines
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Alerts Tab ───────────────────────────────────────────────────────── */}
      {activeTab === 'alerts' && (
        <div className="space-y-4">
          {alertMeds.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-800 p-16 text-center">
              <CheckCircle className="h-12 w-12 mx-auto mb-3 text-emerald-400 opacity-60" />
              <p className="font-semibold text-slate-600 dark:text-slate-300">All good! No alerts at this time.</p>
              <p className="text-xs text-slate-400 mt-1">All medicines are well-stocked and within expiry.</p>
            </div>
          ) : (
            alertMeds.map(med => {
              const exp = isExpired(med.expiryDate);
              const expSoon = isExpiringSoon(med.expiryDate);
              const lowSt = med.stockQuantity <= med.lowStockThreshold;
              const daysLeft = daysUntilExpiry(med.expiryDate);

              return (
                <div
                  key={med.id}
                  className={`bg-white dark:bg-slate-900 rounded-xl border shadow-sm p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
                    exp ? 'border-red-200 dark:border-red-800/50'
                    : expSoon ? 'border-amber-200 dark:border-amber-800/50'
                    : 'border-amber-100 dark:border-amber-900/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${exp ? 'bg-red-100 dark:bg-red-950/40' : 'bg-amber-100 dark:bg-amber-950/40'}`}>
                      {exp || expSoon
                        ? <Clock className={`h-5 w-5 ${exp ? 'text-red-500' : 'text-amber-500'}`} />
                        : <AlertTriangle className="h-5 w-5 text-amber-500" />
                      }
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{med.name}</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        <CategoryBadge category={med.category} />
                        {lowSt && (
                          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-full">
                            Stock: {med.stockQuantity} / {med.lowStockThreshold} threshold
                          </span>
                        )}
                        {exp && (
                          <span className="text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-2 py-0.5 rounded-full">
                            EXPIRED: {med.expiryDate}
                          </span>
                        )}
                        {!exp && expSoon && (
                          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-full">
                            Expires in {daysLeft} day{daysLeft !== 1 ? 's' : ''} — {med.expiryDate}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {writeAllowed && (
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => openStockModal(med)}
                        className="px-3 py-1.5 text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors"
                      >
                        Adjust Stock
                      </button>
                      <button
                        onClick={() => openEditForm(med)}
                        className="px-3 py-1.5 text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        Edit
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── Add / Edit Medicine Modal ─────────────────────────────────────────── */}
      {showForm && (
        <Modal title={editingMed ? 'Edit Medicine' : 'Add Medicine'} onClose={() => setShowForm(false)}>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Medicine Name *" required>
                <input name="name" value={formData.name} onChange={handleFormChange} placeholder="e.g. Paracetamol 500mg" className={inputCls} />
              </FormField>
              <FormField label="Generic Name">
                <input name="genericName" value={formData.genericName} onChange={handleFormChange} placeholder="e.g. Acetaminophen" className={inputCls} />
              </FormField>
              <FormField label="Category *" required>
                <select name="category" value={formData.category} onChange={handleFormChange} className={inputCls}>
                  {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </FormField>
              <FormField label="Unit">
                <select name="unit" value={formData.unit} onChange={handleFormChange} className={inputCls}>
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </FormField>
              <FormField label="Manufacturer">
                <input name="manufacturer" value={formData.manufacturer} onChange={handleFormChange} placeholder="e.g. PharmaCo" className={inputCls} />
              </FormField>
              <FormField label="Batch Number">
                <input name="batchNumber" value={formData.batchNumber} onChange={handleFormChange} placeholder="e.g. BT-2024-001" className={inputCls} />
              </FormField>
              <FormField label="Expiry Date *" required>
                <input name="expiryDate" type="date" value={formData.expiryDate} onChange={handleFormChange} className={inputCls} />
              </FormField>
              <FormField label="Location / Shelf">
                <input name="location" value={formData.location} onChange={handleFormChange} placeholder="e.g. Shelf A1" className={inputCls} />
              </FormField>
              <FormField label="Purchase Price ($) *" required>
                <input name="purchasePrice" type="number" min="0" step="0.01" value={formData.purchasePrice} onChange={handleFormChange} placeholder="0.00" className={inputCls} />
              </FormField>
              <FormField label="Selling Price ($) *" required>
                <input name="sellingPrice" type="number" min="0" step="0.01" value={formData.sellingPrice} onChange={handleFormChange} placeholder="0.00" className={inputCls} />
              </FormField>
              <FormField label="Stock Quantity">
                <input name="stockQuantity" type="number" min="0" value={formData.stockQuantity} onChange={handleFormChange} className={inputCls} />
              </FormField>
              <FormField label="Low Stock Threshold">
                <input name="lowStockThreshold" type="number" min="0" value={formData.lowStockThreshold} onChange={handleFormChange} className={inputCls} />
              </FormField>
            </div>
            <FormField label="Description">
              <textarea name="description" value={formData.description} onChange={handleFormChange} rows={2} placeholder="Optional notes…" className={`${inputCls} resize-none`} />
            </FormField>

            {formError && (
              <div className="flex items-center gap-2 text-sm text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 px-3 py-2 rounded-lg">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {formError}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-medium border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={formLoading} className="px-5 py-2 text-sm font-semibold bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white rounded-xl shadow-md shadow-brand-500/20 transition-colors">
                {formLoading ? 'Saving…' : editingMed ? 'Save Changes' : 'Add Medicine'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Stock Adjustment Modal ───────────────────────────────────────────── */}
      {showStockModal && stockMed && (
        <Modal title={`Adjust Stock — ${stockMed.name}`} onClose={() => setShowStockModal(false)}>
          <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
            <p className="text-xs text-slate-500 dark:text-slate-400">Current Stock</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">{stockMed.stockQuantity} <span className="text-sm font-normal text-slate-400">{stockMed.unit}</span></p>
          </div>
          <form onSubmit={handleStockSubmit} className="space-y-4">
            {/* Add / Remove Toggle */}
            <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setStockType('add')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold transition-colors ${stockType === 'add' ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
              >
                <TrendingUp className="h-4 w-4" /> Add Stock
              </button>
              <button
                type="button"
                onClick={() => setStockType('remove')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold transition-colors ${stockType === 'remove' ? 'bg-rose-600 text-white' : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
              >
                <TrendingDown className="h-4 w-4" /> Remove Stock
              </button>
            </div>

            <FormField label={`Quantity to ${stockType === 'add' ? 'Add' : 'Remove'} *`} required>
              <input
                type="number"
                min="1"
                max={stockType === 'remove' ? stockMed.stockQuantity : undefined}
                value={stockAdj}
                onChange={e => setStockAdj(e.target.value)}
                placeholder="Enter quantity"
                className={inputCls}
                autoFocus
              />
            </FormField>
            <FormField label="Reason (optional)">
              <input
                value={stockReason}
                onChange={e => setStockReason(e.target.value)}
                placeholder={stockType === 'add' ? 'e.g. Restocked from supplier' : 'e.g. Dispensed to patient'}
                className={inputCls}
              />
            </FormField>

            {stockType === 'remove' && stockAdj && parseInt(stockAdj) > stockMed.stockQuantity && (
              <p className="text-xs text-rose-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> Cannot remove more than current stock ({stockMed.stockQuantity}).
              </p>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowStockModal(false)} className="px-4 py-2 text-sm font-medium border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                Cancel
              </button>
              <button
                type="submit"
                disabled={stockLoading || !stockAdj || parseInt(stockAdj) <= 0 || (stockType === 'remove' && parseInt(stockAdj) > stockMed.stockQuantity)}
                className={`px-5 py-2 text-sm font-semibold text-white rounded-xl shadow-md disabled:opacity-60 transition-colors ${stockType === 'add' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20' : 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20'}`}
              >
                {stockLoading ? 'Updating…' : `Confirm ${stockType === 'add' ? 'Add' : 'Remove'}`}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Delete Confirmation Modal ────────────────────────────────────────── */}
      {deleteId && (
        <Modal title="Confirm Deletion" onClose={() => setDeleteId(null)} maxW="max-w-sm">
          <div className="text-center space-y-4">
            <div className="mx-auto h-14 w-14 rounded-full bg-rose-100 dark:bg-rose-950/40 flex items-center justify-center">
              <Trash2 className="h-6 w-6 text-rose-500" />
            </div>
            <div>
              <p className="font-semibold text-slate-800 dark:text-slate-200">Delete this medicine?</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">This action cannot be undone.</p>
            </div>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-sm font-medium border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleteLoading} className="px-5 py-2 text-sm font-semibold bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white rounded-xl shadow-md shadow-rose-500/20 transition-colors">
                {deleteLoading ? 'Deleting…' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ── Reusable Sub-Components ────────────────────────────────────────────────────

const StatCard = ({ icon, label, value, bg, highlight }) => (
  <div className={`rounded-xl p-4 border flex items-center gap-3 ${bg} ${highlight ? 'border-amber-200 dark:border-amber-800/50' : 'border-slate-100 dark:border-slate-800'}`}>
    <div className={`p-2 rounded-lg bg-white dark:bg-slate-900 shadow-sm flex-shrink-0`}>{icon}</div>
    <div>
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
      <p className={`text-xl font-bold font-outfit ${highlight ? 'text-amber-700 dark:text-amber-400' : 'text-slate-800 dark:text-slate-200'}`}>{value}</p>
    </div>
  </div>
);

const Modal = ({ title, onClose, children, maxW = 'max-w-2xl' }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/60 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
    <div className={`w-full ${maxW} bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 max-h-[90vh] flex flex-col`}>
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
        <h3 className="font-bold text-base font-outfit text-slate-800 dark:text-slate-200">{title}</h3>
        <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="px-6 py-5 overflow-y-auto flex-1">{children}</div>
    </div>
  </div>
);

const FormField = ({ label, required, children }) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
      {label}{required && <span className="text-rose-500 ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

const inputCls = 'px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-300 dark:focus:ring-brand-700 w-full transition-colors';

export default Inventory;
