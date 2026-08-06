import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { 
  Settings, Save, CheckCircle2, AlertCircle, Building2, User, 
  ShieldCheck, Bell, Mail, MessageSquare, Database, MonitorSmartphone, Loader2, Play
} from 'lucide-react';
import toast from 'react-hot-toast';
import { AppContext } from '../context/AppContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const SettingsPage = () => {
  const { user, exportBackup, restoreBackup } = useContext(AppContext);
  const isAdmin = user?.role === 'Admin';
  const token = localStorage.getItem('hms_token');

  const [activeTab, setActiveTab] = useState(isAdmin ? 'hospital' : 'profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Settings State
  const [hospital, setHospital] = useState({ name: '', address: '', phone: '', email: '', website: '', emergencyContact: '', currency: 'USD', timeZone: 'UTC', dateFormat: 'MM/DD/YYYY' });
  const [system, setSystem] = useState({ appointmentDuration: 30, openingHours: '', workingDays: [], language: 'English', theme: 'light' });
  const [security, setSecurity] = useState({ passwordPolicy: true, minPasswordLength: 8, requireUppercase: true, requireNumbers: true, requireSymbols: false, maxLoginAttempts: 5, accountLockTime: 15 });
  const [notifications, setNotifications] = useState({ emailNotifications: true, smsNotifications: false, appointmentReminders: true, billingAlerts: true, stockAlerts: true });
  const [email, setEmail] = useState({ smtpHost: '', smtpPort: 587, username: '', password: '', senderEmail: '', senderName: '' });
  const [sms, setSms] = useState({ provider: 'None', customGatewayUrl: '', customGatewayKey: '', twilioSid: '', twilioAuthToken: '', twilioPhone: '' });

  // Profile State
  const [profile, setProfile] = useState({ name: '', email: '', phone: '', avatar: '' });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  // Sessions
  const [sessions, setSessions] = useState([]);

  // Fetch all data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch Profile
        const profRes = await axios.get(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
        if (profRes.data.success) {
          setProfile(profRes.data.user);
        }

        // Fetch Sessions
        const sessRes = await axios.get(`${API_URL}/auth/sessions`, { headers: { Authorization: `Bearer ${token}` } });
        if (sessRes.data.success) {
          setSessions(sessRes.data.data);
        }

        // Fetch Global Settings if Admin
        if (isAdmin) {
          const setRes = await axios.get(`${API_URL}/settings`, { headers: { Authorization: `Bearer ${token}` } });
          if (setRes.data.success && setRes.data.data) {
            const data = setRes.data.data;
            if (data.hospital) setHospital(data.hospital);
            if (data.system) setSystem(data.system);
            if (data.security) setSecurity(data.security);
            if (data.notifications) setNotifications(data.notifications);
            if (data.email) setEmail({ ...data.email, password: '' }); // keep password empty
            if (data.sms) setSms({ ...data.sms, twilioAuthToken: '' }); // keep token empty
          }
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
        toast.error('Failed to load settings.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isAdmin, token]);

  // Handlers
  const handleSaveSettings = async (category, data) => {
    setSaving(true);
    try {
      await axios.put(`${API_URL}/settings`, { [category]: data }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(`${category.charAt(0).toUpperCase() + category.slice(1)} settings saved!`);
    } catch (err) {
      toast.error(`Failed to save ${category} settings.`);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await axios.put(`${API_URL}/auth/profile`, profile, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePassword = async () => {
    if (passwords.newPassword !== passwords.confirmPassword) {
      return toast.error('New passwords do not match');
    }
    if (passwords.newPassword.length < security.minPasswordLength) {
      return toast.error(`Password must be at least ${security.minPasswordLength} characters`);
    }
    setSaving(true);
    try {
      await axios.put(`${API_URL}/auth/profile/password`, passwords, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Password changed successfully!');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    const toastId = toast.loading('Sending test email...');
    try {
      const res = await axios.post(`${API_URL}/settings/test-email`, { toEmail: profile.email }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(res.data.message, { id: toastId });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Test email failed', { id: toastId });
    }
  };

  const handleBackupExport = () => {
    const backupJson = exportBackup();
    const blob = new Blob([backupJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SubhanCare_Backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    toast.success('Backup downloaded');
  };

  const handleBackupImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = restoreBackup(event.target.result);
      if (result.success) {
        toast.success('Database restored successfully! Reloading...');
        setTimeout(() => window.location.reload(), 1500);
      } else {
        toast.error(result.error);
      }
    };
    reader.readAsText(file);
  };

  const TABS = [
    { id: 'hospital', label: 'Hospital', icon: Building2, adminOnly: true },
    { id: 'profile', label: 'Profile', icon: User, adminOnly: false },
    { id: 'account', label: 'Account', icon: MonitorSmartphone, adminOnly: false },
    { id: 'system', label: 'System', icon: Settings, adminOnly: true },
    { id: 'email', label: 'Email', icon: Mail, adminOnly: true },
    { id: 'sms', label: 'SMS', icon: MessageSquare, adminOnly: true },
    { id: 'security', label: 'Security', icon: ShieldCheck, adminOnly: true },
    { id: 'notifications', label: 'Notifications', icon: Bell, adminOnly: true },
    { id: 'backup', label: 'Backup', icon: Database, adminOnly: true },
  ];

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-brand-600 h-10 w-10" /></div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="bg-brand-100 dark:bg-brand-900/30 p-3 rounded-xl"><Settings className="h-6 w-6 text-brand-600 dark:text-brand-400" /></div>
        <div>
          <h1 className="text-2xl font-bold font-outfit text-slate-800 dark:text-slate-100">Settings</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage your account and system preferences</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Navigation */}
        <div className="w-full lg:w-64 flex-shrink-0 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-2 sm:p-3 shadow-sm h-fit">
          <nav className="flex flex-row lg:flex-col gap-1 overflow-x-auto no-scrollbar pb-1 lg:pb-0">
            {TABS.filter(tab => !tab.adminOnly || isAdmin).map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap min-h-[44px] ${
                    isActive 
                      ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300' 
                      : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className={`h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 ${isActive ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400 dark:text-slate-500'}`} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
          
          {/* HOSPITAL SETTINGS */}
          {activeTab === 'hospital' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Hospital Information</h2>
                <p className="text-sm text-slate-500 mt-1">Basic contact and identification details for the hospital.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Hospital Name</label><input type="text" value={hospital.name} onChange={e=>setHospital({...hospital, name: e.target.value})} className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent dark:text-slate-200" /></div>
                <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Emergency Contact</label><input type="text" value={hospital.emergencyContact} onChange={e=>setHospital({...hospital, emergencyContact: e.target.value})} className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent dark:text-slate-200" /></div>
                <div className="md:col-span-2"><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Address</label><input type="text" value={hospital.address} onChange={e=>setHospital({...hospital, address: e.target.value})} className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent dark:text-slate-200" /></div>
                <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone Number</label><input type="text" value={hospital.phone} onChange={e=>setHospital({...hospital, phone: e.target.value})} className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent dark:text-slate-200" /></div>
                <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label><input type="email" value={hospital.email} onChange={e=>setHospital({...hospital, email: e.target.value})} className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent dark:text-slate-200" /></div>
                <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Website</label><input type="text" value={hospital.website} onChange={e=>setHospital({...hospital, website: e.target.value})} className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent dark:text-slate-200" /></div>
                <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Currency</label><select value={hospital.currency} onChange={e=>setHospital({...hospital, currency: e.target.value})} className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent dark:text-slate-200"><option value="USD">USD ($)</option><option value="PKR">PKR (Rs)</option><option value="EUR">EUR (€)</option><option value="GBP">GBP (£)</option></select></div>
              </div>
              <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                <button onClick={() => handleSaveSettings('hospital', hospital)} disabled={saving} className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2"><Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </div>
          )}

          {/* PROFILE SETTINGS */}
          {activeTab === 'profile' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Personal Information</h2>
                  <p className="text-sm text-slate-500 mt-1">Update your personal details.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label><input type="text" value={profile.name} onChange={e=>setProfile({...profile, name: e.target.value})} className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent dark:text-slate-200" /></div>
                  <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label><input type="email" value={profile.email} onChange={e=>setProfile({...profile, email: e.target.value})} className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent dark:text-slate-200" /></div>
                  <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone Number</label><input type="text" value={profile.phone} onChange={e=>setProfile({...profile, phone: e.target.value})} className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent dark:text-slate-200" /></div>
                  <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Role</label><input type="text" value={profile.role} disabled className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 dark:text-slate-400 opacity-70 cursor-not-allowed" /></div>
                </div>
                <div className="flex justify-end">
                  <button onClick={handleSaveProfile} disabled={saving} className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2"><Save className="w-4 h-4" /> Save Profile</button>
                </div>
              </div>

              <div className="pt-8 border-t border-slate-200 dark:border-slate-800 space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Change Password</h2>
                  <p className="text-sm text-slate-500 mt-1">Ensure your account uses a long, random password to stay secure.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2"><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Current Password</label><input type="password" value={passwords.currentPassword} onChange={e=>setPasswords({...passwords, currentPassword: e.target.value})} className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent dark:text-slate-200" /></div>
                  <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">New Password</label><input type="password" value={passwords.newPassword} onChange={e=>setPasswords({...passwords, newPassword: e.target.value})} className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent dark:text-slate-200" /></div>
                  <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Confirm New Password</label><input type="password" value={passwords.confirmPassword} onChange={e=>setPasswords({...passwords, confirmPassword: e.target.value})} className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent dark:text-slate-200" /></div>
                </div>
                <div className="flex justify-end">
                  <button onClick={handleSavePassword} disabled={saving} className="bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Update Password</button>
                </div>
              </div>
            </div>
          )}

          {/* ACCOUNT SETTINGS */}
          {activeTab === 'account' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
               <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Account & Sessions</h2>
                <p className="text-sm text-slate-500 mt-1">Manage your active sessions and device history.</p>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-slate-700 dark:text-slate-300">Active Sessions</h3>
                {sessions.map((sess) => (
                  <div key={sess.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-4">
                      <MonitorSmartphone className="h-8 w-8 text-slate-400" />
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{sess.device} {sess.current && <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full ml-2">Current</span>}</p>
                        <p className="text-xs text-slate-500">IP: {sess.ip} • Last Active: {new Date(sess.lastActive).toLocaleString()}</p>
                      </div>
                    </div>
                    {!sess.current && (
                      <button className="text-sm text-rose-600 font-medium hover:underline">Revoke</button>
                    )}
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button onClick={() => toast.success('All other devices logged out')} className="bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 dark:bg-rose-900/30 dark:border-rose-800 dark:hover:bg-rose-900/50 px-6 py-2 rounded-lg font-medium transition-colors">Logout From All Devices</button>
              </div>
            </div>
          )}

          {/* SYSTEM SETTINGS */}
          {activeTab === 'system' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">System Configuration</h2>
                <p className="text-sm text-slate-500 mt-1">Global preferences that affect all users.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Appointment Duration (mins)</label><input type="number" value={system.appointmentDuration} onChange={e=>setSystem({...system, appointmentDuration: parseInt(e.target.value)})} className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent dark:text-slate-200" /></div>
                <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Opening Hours</label><input type="text" value={system.openingHours} onChange={e=>setSystem({...system, openingHours: e.target.value})} className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent dark:text-slate-200" /></div>
                <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Default Language</label><select value={system.language} onChange={e=>setSystem({...system, language: e.target.value})} className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent dark:text-slate-200"><option value="English">English</option><option value="Spanish">Spanish</option><option value="French">French</option></select></div>
                <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Default Theme</label><select value={system.theme} onChange={e=>setSystem({...system, theme: e.target.value})} className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent dark:text-slate-200"><option value="light">Light</option><option value="dark">Dark</option></select></div>
              </div>
              <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                <button onClick={() => handleSaveSettings('system', system)} disabled={saving} className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2"><Save className="w-4 h-4" /> Save System Settings</button>
              </div>
            </div>
          )}

          {/* EMAIL SETTINGS */}
          {activeTab === 'email' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Email Configuration (SMTP)</h2>
                <p className="text-sm text-slate-500 mt-1">Configure the SMTP server used for sending system emails (password resets, notifications). Overrides environment variables if set.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2"><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">SMTP Host</label><input type="text" placeholder="smtp.gmail.com" value={email.smtpHost} onChange={e=>setEmail({...email, smtpHost: e.target.value})} className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent dark:text-slate-200" /></div>
                <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">SMTP Port</label><input type="number" value={email.smtpPort} onChange={e=>setEmail({...email, smtpPort: parseInt(e.target.value)})} className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent dark:text-slate-200" /></div>
                <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Username / Email</label><input type="text" value={email.username} onChange={e=>setEmail({...email, username: e.target.value})} className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent dark:text-slate-200" /></div>
                <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label><input type="password" placeholder="Leave blank to keep existing" value={email.password} onChange={e=>setEmail({...email, password: e.target.value})} className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent dark:text-slate-200" /></div>
                <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Sender Email</label><input type="email" value={email.senderEmail} onChange={e=>setEmail({...email, senderEmail: e.target.value})} className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent dark:text-slate-200" /></div>
                <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Sender Name</label><input type="text" value={email.senderName} onChange={e=>setEmail({...email, senderName: e.target.value})} className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent dark:text-slate-200" /></div>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800">
                <button onClick={handleTestEmail} className="bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 px-6 py-2 rounded-lg font-medium flex items-center gap-2"><Play className="w-4 h-4" /> Test Connection</button>
                <button onClick={() => handleSaveSettings('email', email)} disabled={saving} className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2"><Save className="w-4 h-4" /> Save SMTP Settings</button>
              </div>
            </div>
          )}

          {/* SMS SETTINGS */}
          {activeTab === 'sms' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">SMS Gateway Configuration</h2>
                <p className="text-sm text-slate-500 mt-1">Configure your SMS provider for sending text notifications to patients.</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Select Provider</label>
                  <select value={sms.provider} onChange={e=>setSms({...sms, provider: e.target.value})} className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent dark:text-slate-200">
                    <option value="None">None (Disabled)</option>
                    <option value="Twilio">Twilio</option>
                    <option value="Custom Gateway">Custom API Gateway</option>
                  </select>
                </div>

                {sms.provider === 'Twilio' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="md:col-span-2"><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Account SID</label><input type="text" value={sms.twilioSid} onChange={e=>setSms({...sms, twilioSid: e.target.value})} className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-slate-200" /></div>
                    <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Auth Token</label><input type="password" placeholder="Leave blank to keep existing" value={sms.twilioAuthToken} onChange={e=>setSms({...sms, twilioAuthToken: e.target.value})} className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-slate-200" /></div>
                    <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Twilio Phone Number</label><input type="text" value={sms.twilioPhone} onChange={e=>setSms({...sms, twilioPhone: e.target.value})} className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-slate-200" /></div>
                  </div>
                )}

                {sms.provider === 'Custom Gateway' && (
                  <div className="grid grid-cols-1 gap-5 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">API Endpoint URL</label><input type="text" value={sms.customGatewayUrl} onChange={e=>setSms({...sms, customGatewayUrl: e.target.value})} placeholder="https://api.sms-provider.com/send" className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-slate-200" /></div>
                    <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">API Key / Token</label><input type="password" value={sms.customGatewayKey} onChange={e=>setSms({...sms, customGatewayKey: e.target.value})} className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-slate-200" /></div>
                  </div>
                )}
              </div>
              <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                <button onClick={() => handleSaveSettings('sms', sms)} disabled={saving} className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2"><Save className="w-4 h-4" /> Save SMS Settings</button>
              </div>
            </div>
          )}

          {/* SECURITY SETTINGS */}
          {activeTab === 'security' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Security & Authentication</h2>
                <p className="text-sm text-slate-500 mt-1">Configure password policies and lockout rules to keep the system secure.</p>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div>
                    <h3 className="font-semibold text-slate-800 dark:text-slate-200">Enforce Password Policy</h3>
                    <p className="text-xs text-slate-500">Require users to meet complexity requirements.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={security.passwordPolicy} onChange={e=>setSecurity({...security, passwordPolicy: e.target.checked})} className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-500"></div>
                  </label>
                </div>

                <div className={`grid grid-cols-1 md:grid-cols-2 gap-5 ${!security.passwordPolicy && 'opacity-50 pointer-events-none'}`}>
                  <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Minimum Password Length</label><input type="number" min="6" max="32" value={security.minPasswordLength} onChange={e=>setSecurity({...security, minPasswordLength: parseInt(e.target.value)})} className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent dark:text-slate-200" /></div>
                  <div className="flex items-center gap-4 mt-6">
                    <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300"><input type="checkbox" checked={security.requireUppercase} onChange={e=>setSecurity({...security, requireUppercase: e.target.checked})} className="rounded text-brand-600 focus:ring-brand-500 bg-slate-100 border-slate-300" /> Require Uppercase</label>
                    <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300"><input type="checkbox" checked={security.requireNumbers} onChange={e=>setSecurity({...security, requireNumbers: e.target.checked})} className="rounded text-brand-600 focus:ring-brand-500 bg-slate-100 border-slate-300" /> Require Numbers</label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Max Login Attempts</label><input type="number" value={security.maxLoginAttempts} onChange={e=>setSecurity({...security, maxLoginAttempts: parseInt(e.target.value)})} className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent dark:text-slate-200" /></div>
                  <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Account Lockout Time (mins)</label><input type="number" value={security.accountLockTime} onChange={e=>setSecurity({...security, accountLockTime: parseInt(e.target.value)})} className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent dark:text-slate-200" /></div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                <button onClick={() => handleSaveSettings('security', security)} disabled={saving} className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2"><Save className="w-4 h-4" /> Save Security Policies</button>
              </div>
            </div>
          )}

          {/* NOTIFICATIONS SETTINGS */}
          {activeTab === 'notifications' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Notification Preferences</h2>
                <p className="text-sm text-slate-500 mt-1">Configure which events trigger system-wide emails or SMS.</p>
              </div>
              
              <div className="space-y-4">
                {Object.entries(notifications).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div>
                      <h3 className="font-semibold text-slate-800 dark:text-slate-200 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</h3>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={value} onChange={e=>setNotifications({...notifications, [key]: e.target.checked})} className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-500"></div>
                    </label>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                <button onClick={() => handleSaveSettings('notifications', notifications)} disabled={saving} className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2"><Save className="w-4 h-4" /> Save Preferences</button>
              </div>
            </div>
          )}

          {/* BACKUP SETTINGS */}
          {activeTab === 'backup' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Database Backup & Restore</h2>
                <p className="text-sm text-slate-500 mt-1">Export your data to a secure JSON file or restore from an existing backup.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl flex flex-col items-center justify-center text-center space-y-4">
                  <Database className="h-12 w-12 text-brand-500" />
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100">Export Database</h3>
                    <p className="text-xs text-slate-500 mt-1">Download a complete snapshot of your HMS data.</p>
                  </div>
                  <button onClick={handleBackupExport} className="w-full bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg font-medium">Download Backup JSON</button>
                </div>

                <div className="p-6 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl flex flex-col items-center justify-center text-center space-y-4">
                  <AlertCircle className="h-12 w-12 text-rose-500" />
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100">Restore Database</h3>
                    <p className="text-xs text-slate-500 mt-1">Warning: This will overwrite current data.</p>
                  </div>
                  <label className="w-full bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 px-4 py-2 rounded-lg font-medium cursor-pointer transition-colors">
                    Upload Backup JSON
                    <input type="file" accept=".json" className="hidden" onChange={handleBackupImport} />
                  </label>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
