import React, { useState, useContext, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import Pagination from '../components/Pagination';
import {
  Users,
  UserPlus,
  Search,
  Edit3,
  Trash2,
  Mail,
  Phone,
  Briefcase,
  Clock,
  ShieldCheck,
  Plus,
  X,
  AlertCircle,
  ShieldAlert
} from 'lucide-react';

const ROLES_FILTER = ['All', 'Receptionist', 'Billing', 'Staff', 'Admin'];
const ITEMS_PER_PAGE = 8;

const Staff = () => {
  const { staff = [], addStaff, updateStaff, deleteStaff, canWrite } = useContext(AppContext);
  const writeAllowed = canWrite ? canWrite('staff') : true;

  // States required by prompt
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [showForm, setShowForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Staff',
    department: 'General',
    shift: 'Morning',
    salary: '',
    password: ''
  });

  // Additional helper states for modal error, delete confirm & pagination
  const [formError, setFormError] = useState('');
  const [staffToDelete, setStaffToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Stats calculation
  const stats = useMemo(() => {
    const total = staff.length;
    const receptionists = staff.filter(s => s.role === 'Receptionist').length;
    const billing = staff.filter(s => s.role === 'Billing').length;
    const generalStaff = staff.filter(s => s.role === 'Staff').length;
    return { total, receptionists, billing, generalStaff };
  }, [staff]);

  // Filtered staff based on search term & role filter
  const filteredStaff = useMemo(() => {
    return (staff || []).filter(item => {
      const matchesRole = roleFilter === 'All' || item.role === roleFilter;
      const term = search.toLowerCase().trim();
      const matchesSearch = !term || (
        (item.name && item.name.toLowerCase().includes(term)) ||
        (item.email && item.email.toLowerCase().includes(term)) ||
        (item.phone && item.phone.includes(term)) ||
        (item.department && item.department.toLowerCase().includes(term)) ||
        (item.id && item.id.toLowerCase().includes(term))
      );
      return matchesRole && matchesSearch;
    });
  }, [staff, search, roleFilter]);

  // Pagination logic
  const totalPages = Math.ceil(filteredStaff.length / ITEMS_PER_PAGE);
  const paginatedStaff = useMemo(() => {
    return filteredStaff.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
    );
  }, [filteredStaff, currentPage]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handleRoleFilterChange = (role) => {
    setRoleFilter(role);
    setCurrentPage(1);
  };

  // Form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Modal actions
  const handleOpenAdd = () => {
    setEditingStaff(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: 'Staff',
      department: 'General',
      shift: 'Morning',
      salary: '',
      password: ''
    });
    setFormError('');
    setShowForm(true);
  };

  const handleOpenEdit = (member) => {
    setEditingStaff(member);
    setFormData({
      name: member.name || '',
      email: member.email || '',
      phone: member.phone || '',
      role: member.role || 'Staff',
      department: member.department || 'General',
      shift: member.shift || 'Morning',
      salary: member.salary !== undefined && member.salary !== null ? String(member.salary) : '',
      password: ''
    });
    setFormError('');
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const { name, email, phone, role, department, shift, salary, password } = formData;

    if (!name || !email || !phone || !role || !department) {
      setFormError('Please fill out all required fields.');
      return;
    }

    if (!editingStaff && !password) {
      setFormError('Password is required when creating a new staff member account.');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setFormError('Please enter a valid email address.');
      return;
    }

    const payload = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      role,
      department: department.trim() || 'General',
      shift: shift || 'Morning',
      salary: salary !== '' ? Number(salary) : 0
    };

    if (!editingStaff) {
      payload.password = password;
    }

    let res;
    if (editingStaff) {
      const targetId = editingStaff.id || editingStaff._id;
      res = await updateStaff(targetId, payload);
    } else {
      res = await addStaff(payload);
    }

    if (res && res.success) {
      setShowForm(false);
      setEditingStaff(null);
    } else {
      setFormError(res?.error || 'Failed to save staff member details.');
    }
  };

  const handleDelete = async (staffId) => {
    if (!staffId) return;
    const res = await deleteStaff(staffId);
    if (res && res.success) {
      setStaffToDelete(null);
    }
  };

  // Badge helpers
  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case 'Admin':
        return 'bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'Receptionist':
        return 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'Billing':
        return 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  const getShiftBadgeStyle = (shift) => {
    switch (shift) {
      case 'Morning':
        return 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900';
      case 'Evening':
        return 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900';
      case 'Night':
        return 'bg-slate-800 dark:bg-slate-900 text-slate-100 border-slate-700';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-xl font-bold font-outfit text-slate-800 dark:text-slate-200">
            Staff & HR Management
          </h2>
          <p className="text-xs text-slate-400 font-medium">
            Manage hospital staff directory, roles, shifts, and system accounts
            {filteredStaff.length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 rounded-full font-bold">
                {filteredStaff.length} members
              </span>
            )}
          </p>
        </div>
        {writeAllowed && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-bold shadow-md transition-all"
          >
            <UserPlus className="h-4 w-4" />
            Add Staff Member
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Staff */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Staff</p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-slate-100 font-outfit mt-1">
              {stats.total}
            </h3>
            <span className="text-[11px] font-semibold text-slate-400">Active Directory</span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 flex items-center justify-center border border-brand-100 dark:border-brand-900/50">
            <Users className="h-6 w-6" />
          </div>
        </div>

        {/* Receptionists */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Receptionists</p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-slate-100 font-outfit mt-1">
              {stats.receptionists}
            </h3>
            <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">Front Desk & Ops</span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/50">
            <Phone className="h-6 w-6" />
          </div>
        </div>

        {/* Billing */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Billing</p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-slate-100 font-outfit mt-1">
              {stats.billing}
            </h3>
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">Finance & Accounts</span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/50">
            <Briefcase className="h-6 w-6" />
          </div>
        </div>

        {/* General Staff */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">General Staff</p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-slate-100 font-outfit mt-1">
              {stats.generalStaff}
            </h3>
            <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400">Support & Operations</span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-100 dark:border-purple-900/50">
            <ShieldCheck className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="h-5 w-5 text-slate-400 absolute left-3.5 inset-y-0 my-auto" />
          <input
            type="text"
            placeholder="Search staff by name, email, phone, department, or ID..."
            value={search}
            onChange={handleSearchChange}
            className="block w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"
          />
        </div>

        {/* Role Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {ROLES_FILTER.map(roleOption => (
            <button
              key={roleOption}
              onClick={() => handleRoleFilterChange(roleOption)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                roleFilter === roleOption
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {roleOption}
            </button>
          ))}
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          {filteredStaff.length === 0 ? (
            <div className="text-center py-16">
              <Users className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-base font-bold text-slate-400">No staff members found.</p>
              <p className="text-xs text-slate-400 mt-1">Try adjusting your search terms or role filters.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-850 border-b border-slate-150 dark:border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <th className="px-4 py-3.5">ID / Name / Email</th>
                  <th className="px-4 py-3.5">Role</th>
                  <th className="px-4 py-3.5">Department</th>
                  <th className="px-4 py-3.5">Shift</th>
                  <th className="px-4 py-3.5">Phone</th>
                  {writeAllowed && <th className="px-4 py-3.5 text-center">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm font-medium">
                {paginatedStaff.map(member => {
                  const memberId = member.id || member._id || '—';
                  const initials = member.name
                    ? member.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
                    : 'ST';

                  return (
                    <tr
                      key={member._id || member.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* ID / Name / Email */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center text-white font-extrabold text-xs shadow-sm flex-shrink-0">
                            {initials}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                                {member.name}
                              </span>
                              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                                {memberId}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                              <Mail className="h-3 w-3 flex-shrink-0 text-slate-400" />
                              <span>{member.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${getRoleBadgeStyle(member.role)}`}>
                          <ShieldCheck className="h-3.5 w-3.5" />
                          {member.role || 'Staff'}
                        </span>
                      </td>

                      {/* Department */}
                      <td className="px-4 py-3.5 text-xs font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                          {member.department || 'General'}
                        </div>
                      </td>

                      {/* Shift */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${getShiftBadgeStyle(member.shift)}`}>
                          <Clock className="h-3 w-3" />
                          {member.shift || 'Morning'}
                        </span>
                      </td>

                      {/* Phone */}
                      <td className="px-4 py-3.5 text-xs font-mono font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 text-slate-400" />
                          {member.phone || '—'}
                        </div>
                      </td>

                      {/* Actions */}
                      {writeAllowed && (
                        <td className="px-4 py-3.5 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleOpenEdit(member)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="Edit Staff Member"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setStaffToDelete(member)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                              title="Delete Staff Member"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Component */}
        {filteredStaff.length > 0 && (
          <div className="px-4 pb-2">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={filteredStaff.length}
              itemsPerPage={ITEMS_PER_PAGE}
            />
          </div>
        )}
      </div>

      {/* Read-only notice */}
      {!writeAllowed && (
        <div className="flex items-center gap-2 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900 rounded-xl text-xs font-semibold text-amber-700 dark:text-amber-400">
          <ShieldAlert className="h-4 w-4 flex-shrink-0" />
          Your role has read-only access to the Staff directory.
        </div>
      )}

      {/* Add / Edit Staff Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowForm(false)}></div>
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-150 dark:border-slate-800 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400">
                  {editingStaff ? <Edit3 className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
                </div>
                <div>
                  <h3 className="text-lg font-bold font-outfit text-slate-800 dark:text-slate-200">
                    {editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {editingStaff ? 'Update staff member details and permissions' : 'Create a staff profile and system login account'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="bg-rose-50 dark:bg-rose-950/30 border-l-4 border-rose-500 p-3 rounded-r-lg flex items-center gap-2 text-xs font-semibold text-rose-800 dark:text-rose-300 mb-4">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  placeholder="e.g. Sarah Jenkins"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    placeholder="e.g. sarah@subhancare.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="phone"
                    placeholder="e.g. +1 555 123 4567"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              {/* Role & Shift */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Role <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="Staff">Staff</option>
                    <option value="Receptionist">Receptionist</option>
                    <option value="Billing">Billing</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Shift <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="shift"
                    value={formData.shift}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="Morning">Morning</option>
                    <option value="Evening">Evening</option>
                    <option value="Night">Night</option>
                  </select>
                </div>
              </div>

              {/* Department & Salary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    name="department"
                    placeholder="e.g. Front Desk, General, HR"
                    value={formData.department}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Salary
                  </label>
                  <input
                    type="number"
                    name="salary"
                    placeholder="e.g. 45000"
                    value={formData.salary}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              {/* Password (Required on create, hidden on edit) */}
              {!editingStaff && (
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Account Password <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    name="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    This password will be used by the staff member to log in to their account.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-6">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
                >
                  {editingStaff ? 'Save Changes' : 'Create Staff Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {staffToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setStaffToDelete(null)}></div>
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-150 dark:border-slate-800 animate-in zoom-in-95 duration-150 text-center">
            <div className="h-12 w-12 rounded-full bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold font-outfit text-slate-800 dark:text-slate-100 mb-1">
              Delete Staff Member
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              Are you sure you want to remove <span className="font-bold text-slate-800 dark:text-slate-200">{staffToDelete.name}</span>? This will also delete their associated system login user account.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setStaffToDelete(null)}
                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(staffToDelete.id || staffToDelete._id)}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md transition-all"
              >
                Delete Member
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Staff;
