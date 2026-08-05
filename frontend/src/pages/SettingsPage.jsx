import React, { useState, useContext, useRef } from 'react';
import { AppContext } from '../context/AppContext';
import { Settings, Save, Download, Upload, CheckCircle2, AlertCircle } from 'lucide-react';

const SettingsPage = () => {
  const { settings, updateSettings, exportBackup, restoreBackup, user } = useContext(AppContext);
  const isAdmin = user?.role === 'Admin';

  // Form State: Hospital Details
  const [hospitalName, setHospitalName] = useState(settings.hospitalName);
  const [hospitalAddress, setHospitalAddress] = useState(settings.hospitalAddress);
  const [hospitalPhone, setHospitalPhone] = useState(settings.hospitalPhone);

  // Form State: User Details
  const [adminName, setAdminName] = useState(settings.adminName);
  const [adminEmail, setAdminEmail] = useState(settings.adminEmail);

  // Status indicators
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [backupSuccess, setBackupSuccess] = useState('');
  const [backupError, setBackupError] = useState('');
  const fileInputRef = useRef(null);

  const handleSaveSettings = (e) => {
    e.preventDefault();
    setSaveSuccess(false);

    if (!hospitalName || !hospitalAddress || !hospitalPhone || !adminName || !adminEmail) {
      setBackupError('All details are required.');
      return;
    }

    updateSettings({
      hospitalName,
      hospitalAddress,
      hospitalPhone,
      adminName,
      adminEmail
    });

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Export Backup File
  const handleExport = () => {
    const backupJson = exportBackup();
    const blob = new Blob([backupJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Subhan_Care_Database_Backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  // Import Backup File
  const handleImport = (e) => {
    setBackupSuccess('');
    setBackupError('');
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = restoreBackup(event.target.result);
      if (result.success) {
        setBackupSuccess('Database successfully restored! Refreshing page details...');
        // Refresh states in view by resetting form values
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setBackupError(result.error);
      }
    };
    reader.readAsText(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-outfit text-slate-800 dark:text-slate-200">Hospital Settings</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Manage hospital info, admin accounts, and data backups</p>
        </div>
        <Settings className="h-6 w-6 text-brand-600 dark:text-brand-400" />
      </div>

      {/* Non-Admin Notice */}
      {!isAdmin && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border-l-4 border-amber-500 p-4 rounded-r-xl text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
          <span>Read-Only Mode: Only system Administrators can modify hospital settings or perform database backups.</span>
        </div>
      )}

      {/* Save Success Alert */}
      {saveSuccess && (
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border-l-4 border-emerald-500 p-4 rounded-r-xl flex items-center gap-2 text-sm font-bold text-emerald-800 dark:text-emerald-300 animate-bounce">
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          <span>Branding and profiles saved successfully!</span>
        </div>
      )}

      {/* Backup Alert */}
      {backupSuccess && (
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border-l-4 border-emerald-500 p-4 rounded-r-xl text-sm font-bold text-emerald-800 dark:text-emerald-300">
          {backupSuccess}
        </div>
      )}
      {backupError && (
        <div className="bg-rose-50 dark:bg-rose-950/20 border-l-4 border-rose-500 p-4 rounded-r-xl text-sm font-bold text-rose-800 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-rose-500" />
          <span>{backupError}</span>
        </div>
      )}

      {/* Forms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Hospital Details Form */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-base font-bold font-outfit text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-3">Hospital Details</h3>
          
          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Hospital Name
              </label>
              <input
                type="text"
                value={hospitalName}
                onChange={(e) => setHospitalName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-850 dark:text-slate-250"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Hospital Address
              </label>
              <input
                type="text"
                value={hospitalAddress}
                onChange={(e) => setHospitalAddress(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-850 dark:text-slate-250"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Contact Phone
              </label>
              <input
                type="text"
                value={hospitalPhone}
                onChange={(e) => setHospitalPhone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-850 dark:text-slate-250"
              />
            </div>

            {isAdmin && (
              <button
                type="submit"
                className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-500/10 transition-colors"
              >
                <Save className="h-4.5 w-4.5" />
                <span>Save Details</span>
              </button>
            )}
          </form>
        </div>

        {/* Admin Profile Form */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-base font-bold font-outfit text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-3">Admin Profile</h3>
          
          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Administrator Name
              </label>
              <input
                type="text"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-850 dark:text-slate-250"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Security Email
              </label>
              <input
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-850 dark:text-slate-250"
              />
            </div>

            <div className="text-[10px] text-slate-400 font-medium bg-slate-50 dark:bg-slate-850 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
              Note: Changing this email will update your active Admin login ID. The login password remains <b>admin123</b>.
            </div>

            {isAdmin && (
              <button
                type="submit"
                className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-500/10 transition-colors"
              >
                <Save className="h-4.5 w-4.5" />
                <span>Update Profile</span>
              </button>
            )}
          </form>
        </div>

      </div>

      {/* Database Backup Workspace */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm space-y-6">
        <div>
          <h3 className="text-base font-bold font-outfit text-slate-800 dark:text-slate-200">Database Utilities</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500">Backup your local storage database files or restore a previous session</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Download Backup */}
          <button
            onClick={handleExport}
            disabled={!isAdmin}
            className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-brand-500 dark:hover:border-brand-500 hover:bg-brand-50/20 dark:hover:bg-slate-850/50 disabled:opacity-40 disabled:pointer-events-none rounded-2xl transition-all duration-200 group text-center space-y-2"
          >
            <Download className="h-8 w-8 text-slate-450 group-hover:text-brand-600 group-hover:scale-110 transition-all" />
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Download Backup</p>
              <p className="text-[11px] text-slate-400">Save complete database state as a JSON file</p>
            </div>
          </button>

          {/* Restore Backup */}
          <button
            onClick={triggerFileInput}
            disabled={!isAdmin}
            className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-brand-500 dark:hover:border-brand-500 hover:bg-brand-50/20 dark:hover:bg-slate-850/50 disabled:opacity-40 disabled:pointer-events-none rounded-2xl transition-all duration-200 group text-center space-y-2"
          >
            <Upload className="h-8 w-8 text-slate-450 group-hover:text-brand-600 group-hover:scale-110 transition-all" />
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Restore Database</p>
              <p className="text-[11px] text-slate-400">Upload a JSON backup file to overwrite current states</p>
            </div>
            {/* Hidden Input File */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImport}
              accept=".json"
              className="hidden"
            />
          </button>
        </div>
      </div>

    </div>
  );
};

export default SettingsPage;
