import React, { useState, useEffect, useRef, useContext } from 'react';
import { Trash2, Search, AlertTriangle, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { AppContext } from '../context/AppContext';

const FREQUENCIES = ['Once daily','Twice daily','Thrice daily','As needed','Every 4 hours','Every 6 hours','Every 8 hours','Every 12 hours'];

const inputCls = 'px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 w-full';

// ✅ Stock Status Badge
const StockBadge = ({ medicine }) => {
  if (!medicine) return null;
  const { stockQuantity, lowStockThreshold } = medicine;

  if (stockQuantity === 0) {
    return (
      <span className="flex items-center gap-1 text-[10px] font-bold text-rose-600 dark:text-rose-400">
        <XCircle className="h-3 w-3" /> Out of Stock
      </span>
    );
  }
  if (stockQuantity <= lowStockThreshold) {
    return (
      <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400">
        <AlertTriangle className="h-3 w-3" /> Low Stock ({stockQuantity} left)
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
      <CheckCircle className="h-3 w-3" /> In Stock ({stockQuantity})
    </span>
  );
};

// ✅ Medicine Dropdown Item
const MedicineOption = ({ medicine, onSelect, isSelected }) => {
  const isOutOfStock = medicine.stockQuantity === 0;
  const isLowStock = medicine.stockQuantity > 0 && medicine.stockQuantity <= medicine.lowStockThreshold;

  return (
    <button
      type="button"
      disabled={isOutOfStock}
      onClick={() => !isOutOfStock && onSelect(medicine)}
      className={`w-full text-left px-3 py-2.5 border-b border-slate-100 dark:border-slate-700 last:border-0 transition-colors
        ${isOutOfStock
          ? 'opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-800/50'
          : 'hover:bg-brand-50 dark:hover:bg-brand-950/30 cursor-pointer'
        }
        ${isSelected ? 'bg-brand-50 dark:bg-brand-950/30' : ''}
      `}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{medicine.name}</p>
          {medicine.genericName && (
            <p className="text-[10px] text-slate-500 dark:text-slate-400">{medicine.genericName}</p>
          )}
          <p className="text-[10px] text-slate-400 dark:text-slate-500">{medicine.category} • {medicine.unit}</p>
        </div>
        <div className="flex-shrink-0 text-right">
          <StockBadge medicine={medicine} />
          {isOutOfStock && (
            <p className="text-[9px] text-slate-400 mt-0.5">Cannot select</p>
          )}
        </div>
      </div>
      {isLowStock && !isOutOfStock && (
        <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
          <AlertTriangle className="h-2.5 w-2.5" />
          Warning: Only {medicine.stockQuantity} units available
        </p>
      )}
    </button>
  );
};

const MedicationRow = ({ med, index, onChange, onRemove, canRemove, selectedMedicineIds = [] }) => {
  const { token } = useContext(AppContext);
  const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}`;

  const [searchQuery, setSearchQuery] = useState(med.name || '');
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // ✅ Fetch medicines from inventory
  const fetchMedicines = async (search = '') => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${API_URL}/inventory?search=${encodeURIComponent(search)}&limit=50`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      const json = await res.json();
      if (json.success) {
        setMedicines(json.data || []);
      } else {
        setError('Failed to load medicines');
      }
    } catch (err) {
      setError('Cannot connect to inventory');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Open dropdown & fetch medicines
  const handleInputFocus = () => {
    setIsOpen(true);
    fetchMedicines(searchQuery);
  };

  // ✅ Search as user types
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    setIsOpen(true);
    fetchMedicines(val);

    // Clear selected medicine if user changes input
    if (selectedMedicine && val !== selectedMedicine.name) {
      setSelectedMedicine(null);
      onChange(index, 'medicineId', '');
      onChange(index, 'name', val);
    }
  };

  // ✅ Select medicine from dropdown
  const handleSelectMedicine = (medicine) => {
    // Check for duplicate
    if (selectedMedicineIds.includes(medicine.id) && med.medicineId !== medicine.id) {
      alert(`⚠️ ${medicine.name} is already added to this prescription!`);
      return;
    }

    setSelectedMedicine(medicine);
    setSearchQuery(medicine.name);
    setIsOpen(false);

    // Update form fields
    onChange(index, 'name', medicine.name);
    onChange(index, 'medicineId', medicine.id);
    onChange(index, 'dosage', med.dosage || '');
  };

  // ✅ Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ✅ Filter medicines (exclude already selected)
  const filteredMedicines = medicines.filter(m =>
    !selectedMedicineIds.includes(m.id) || m.id === med.medicineId
  );

  return (
    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Medication #{index + 1}
        </span>
        {canRemove && (
          <button type="button" onClick={onRemove}
            className="p-1 rounded-lg text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 transition-colors">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Medicine Name - Searchable Dropdown */}
      <div className="grid grid-cols-2 gap-3">
        <div ref={dropdownRef} className="relative">
          <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1 block">
            Medicine Name *
          </label>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={handleInputFocus}
              placeholder="Search medicine..."
              required
              className="pl-8 pr-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 w-full"
            />
            {loading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 animate-spin" />
            )}
          </div>

          {/* Selected Medicine Stock Status */}
          {selectedMedicine && (
            <div className="mt-1">
              <StockBadge medicine={selectedMedicine} />
            </div>
          )}

          {/* Dropdown */}
          {isOpen && (
            <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-64 overflow-y-auto">

              {/* Loading State */}
              {loading && (
                <div className="flex items-center justify-center gap-2 py-6 text-xs text-slate-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading medicines...
                </div>
              )}

              {/* Error State */}
              {error && !loading && (
                <div className="py-4 px-3 text-xs text-rose-500 font-semibold text-center">
                  ⚠️ {error}
                </div>
              )}

              {/* Empty State */}
              {!loading && !error && filteredMedicines.length === 0 && (
                <div className="py-6 text-center text-xs text-slate-400">
                  {searchQuery
                    ? `No matching medicine found for "${searchQuery}"`
                    : 'No medicines found in inventory'
                  }
                </div>
              )}

              {/* Medicine List */}
              {!loading && !error && filteredMedicines.map(medicine => (
                <MedicineOption
                  key={medicine.id}
                  medicine={medicine}
                  onSelect={handleSelectMedicine}
                  isSelected={med.medicineId === medicine.id}
                />
              ))}
            </div>
          )}
        </div>

        {/* Dosage */}
        <div>
          <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1 block">
            Dosage *
          </label>
          <input
            type="text"
            value={med.dosage || ''}
            onChange={e => onChange(index, 'dosage', e.target.value)}
            placeholder="e.g. 500mg"
            maxLength={50}
            required
            className={inputCls}
          />
        </div>
      </div>

      {/* Frequency & Duration */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1 block">
            Frequency *
          </label>
          <select
            value={med.frequency || ''}
            onChange={e => onChange(index, 'frequency', e.target.value)}
            required
            className={inputCls}
          >
            <option value="">Select frequency...</option>
            {FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1 block">
            Duration (days) *
          </label>
          <input
            type="number"
            value={med.duration || ''}
            onChange={e => onChange(index, 'duration', parseInt(e.target.value))}
            placeholder="7"
            min={1}
            max={365}
            required
            className={inputCls}
          />
        </div>
      </div>

      {/* Instructions */}
      <div>
        <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1 block">
          Instructions
        </label>
        <input
          type="text"
          value={med.instructions || ''}
          onChange={e => onChange(index, 'instructions', e.target.value)}
          placeholder="e.g. Take with food"
          maxLength={500}
          className={inputCls}
        />
      </div>
    </div>
  );
};

export default MedicationRow;