import React, { createContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export const AppContext = createContext();

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`;

const defaultSettings = {
  hospitalName:    'Subhan Care Clinic',
  hospitalAddress: '123 Healthcare Blvd, Medical Suite 400',
  hospitalPhone:   '+1 (555) 019-9000',
  adminName:       'Subhan Administrator',
  adminEmail:      'admin@subhancare.com',
};

// ─── Role-Based Access Matrix ─────────────────────────────────────────────────
export const ROLE_ACCESS = {
  Admin:        ['dashboard', 'patients', 'doctors', 'appointments', 'billing', 'reports', 'search', 'settings'],
  Doctor:       ['dashboard', 'patients', 'appointments'],
  Receptionist: ['dashboard', 'patients', 'doctors', 'appointments'],
  Billing:      ['dashboard', 'patients', 'billing', 'reports'],
  Staff:        ['dashboard', 'patients', 'doctors', 'appointments', 'billing', 'reports', 'search'],
};

export const WRITE_ACCESS = {
  Admin:        ['patients', 'doctors', 'appointments', 'billing'],
  Doctor:       [],
  Receptionist: ['patients', 'appointments'],
  Billing:      ['billing'],
  Staff:        ['patients', 'doctors', 'appointments', 'billing'],
};

export const AppProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => localStorage.getItem('hms_theme') || 'light');
  const [token, setToken] = useState(() => localStorage.getItem('hms_token') || null);
  const [user, setUser] = useState(() => {
    const s = localStorage.getItem('hms_user');
    return s ? JSON.parse(s) : null;
  });

  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [settings, setSettings] = useState(() => {
    const s = localStorage.getItem('hms_settings');
    return s ? JSON.parse(s) : defaultSettings;
  });

  const [isLoading, setIsLoading] = useState(false);

  // Sync theme & settings locally
  useEffect(() => { localStorage.setItem('hms_theme', theme); }, [theme]);
  useEffect(() => { localStorage.setItem('hms_settings', JSON.stringify(settings)); }, [settings]);

  // Auth Header Helper
  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  });

  // Fetch doctors roster
  const fetchDoctors = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/doctors`, { headers: getAuthHeaders() });
      const json = await res.json();
      if (json.success) setDoctors(json.data);
    } catch (err) {
      console.error('Error fetching doctors:', err);
    }
  };

  // Fetch patients registry
  const fetchPatients = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/patients`, { headers: getAuthHeaders() });
      const json = await res.json();
      if (json.success) setPatients(json.data);
    } catch (err) {
      console.error('Error fetching patients:', err);
    }
  };

  // Fetch appointments schedule
  const fetchAppointments = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/appointments`, { headers: getAuthHeaders() });
      const json = await res.json();
      if (json.success) setAppointments(json.data);
    } catch (err) {
      console.error('Error fetching appointments:', err);
    }
  };

  // Fetch billing invoices
  const fetchInvoices = async () => {
    if (!token) return;
    const role = user?.role || 'Staff';
    const allowed = ROLE_ACCESS[role] || ROLE_ACCESS.Staff;
    if (!allowed.includes('billing')) return;

    try {
      const res = await fetch(`${API_URL}/invoices`, { headers: getAuthHeaders() });
      const json = await res.json();
      if (json.success) setInvoices(json.data);
    } catch (err) {
      console.error('Error fetching invoices:', err);
    }
  };

  // Load all data on token change or startup
  const fetchAllData = async () => {
    if (!token) return;
    setIsLoading(true);
    await Promise.all([
      fetchDoctors(),
      fetchPatients(),
      fetchAppointments(),
      fetchInvoices()
    ]);
    setIsLoading(false);
  };

  useEffect(() => {
    if (token) {
      fetchAllData();
    } else {
      setDoctors([]);
      setPatients([]);
      setAppointments([]);
      setInvoices([]);
    }
  }, [token]);

  // Verify token and check session on reload
  const checkSession = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/auth/me`, { headers: getAuthHeaders() });
      const json = await res.json();
      if (json.success) {
        setUser(json.user);
        localStorage.setItem('hms_user', JSON.stringify(json.user));
      } else {
        logout();
      }
    } catch (err) {
      console.error('Session check failed:', err);
      logout();
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));

  // ── Auth Actions ─────────────────────────────────────────────────────────────
  const login = async (email, password) => {
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const json = await res.json();
      
      if (json.success) {
        setToken(json.token);
        setUser(json.user);
        localStorage.setItem('hms_token', json.token);
        localStorage.setItem('hms_user', JSON.stringify(json.user));
        // ✅ Toast notification
        toast.success(`Welcome back, ${json.user.name}! 👋`);
        return { success: true };
      } else {
        toast.error(json.error || 'Invalid credentials');
        return { success: false, error: json.error || 'Invalid credentials' };
      }
    } catch (err) {
      toast.error('Cannot connect to server');
      return { success: false, error: 'Cannot connect to authentication server' };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('hms_token');
    localStorage.removeItem('hms_user');
    // ✅ Toast notification
    toast.success('Logged out successfully!');
  };

  const canWrite = (page) => {
    const role = user?.role || 'Staff';
    return (WRITE_ACCESS[role] || WRITE_ACCESS.Staff).includes(page);
  };

  // ── Doctors CRUD ──────────────────────────────────────────────────────────────
  const addDoctor = async (doc) => {
    try {
      const res = await fetch(`${API_URL}/doctors`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(doc)
      });
      const json = await res.json();
      if (json.success) {
        await fetchDoctors();
        // ✅ Toast notification
        toast.success('Doctor added successfully!');
        return { success: true };
      }
      toast.error(json.error || 'Failed to add doctor');
      return { success: false, error: json.error };
    } catch (err) {
      toast.error('Network request failed');
      return { success: false, error: 'Network request failed' };
    }
  };

  const deleteDoctor = async (id) => {
    try {
      const res = await fetch(`${API_URL}/doctors/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      const json = await res.json();
      if (json.success) {
        await Promise.all([fetchDoctors(), fetchAppointments()]);
        // ✅ Toast notification
        toast.success('Doctor deleted successfully!');
        return { success: true };
      }
      toast.error(json.error || 'Failed to delete doctor');
      return { success: false, error: json.error };
    } catch (err) {
      toast.error('Network request failed');
      return { success: false, error: 'Network request failed' };
    }
  };

  // ── Patients CRUD ─────────────────────────────────────────────────────────────
  const addPatient = async (pat) => {
    try {
      const res = await fetch(`${API_URL}/patients`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(pat)
      });
      const json = await res.json();
      if (json.success) {
        await fetchPatients();
        // ✅ Toast notification
        toast.success('Patient added successfully!');
        return { success: true };
      }
      toast.error(json.error || 'Failed to add patient');
      return { success: false, error: json.error };
    } catch (err) {
      toast.error('Network request failed');
      return { success: false, error: 'Network request failed' };
    }
  };

  const deletePatient = async (id) => {
    try {
      const res = await fetch(`${API_URL}/patients/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      const json = await res.json();
      if (json.success) {
        await Promise.all([fetchPatients(), fetchAppointments()]);
        // ✅ Toast notification
        toast.success('Patient deleted successfully!');
        return { success: true };
      }
      toast.error(json.error || 'Failed to delete patient');
      return { success: false, error: json.error };
    } catch (err) {
      toast.error('Network request failed');
      return { success: false, error: 'Network request failed' };
    }
  };

  // ── Appointments CRUD ─────────────────────────────────────────────────────────
  const getAvailableSlots = async (doctorId, date) => {
    if (!doctorId || !date) return { allSlots: [], bookedSlots: [], availableSlots: [] };
    try {
      const res = await fetch(`${API_URL}/appointments/available-slots?doctorId=${doctorId}&date=${date}`, {
        headers: getAuthHeaders()
      });
      const json = await res.json();
      if (json.success) return json;
      return { allSlots: [], bookedSlots: [], availableSlots: [] };
    } catch (err) {
      console.error('Error fetching available slots:', err);
      return { allSlots: [], bookedSlots: [], availableSlots: [] };
    }
  };

  const bookAppointment = async (apt) => {
    try {
      const res = await fetch(`${API_URL}/appointments`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(apt)
      });
      const json = await res.json();
      if (json.success) {
        await Promise.all([fetchAppointments(), fetchDoctors()]);
        // ✅ Toast notification
        toast.success('Appointment booked successfully!');
        return { success: true };
      }
      toast.error(json.error || 'Failed to book appointment');
      return { success: false, error: json.error };
    } catch (err) {
      toast.error('Network request failed');
      return { success: false, error: 'Network request failed' };
    }
  };

  const rescheduleAppointment = async (id, newDate, newTime) => {
    try {
      const res = await fetch(`${API_URL}/appointments/${id}/reschedule`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ newDate, newTime })
      });
      const json = await res.json();
      if (json.success) {
        await Promise.all([fetchAppointments(), fetchDoctors()]);
        // ✅ Toast notification
        toast.success('Appointment rescheduled successfully!');
        return { success: true, message: json.message };
      }
      toast.error(json.error || 'Failed to reschedule appointment');
      return { success: false, error: json.error };
    } catch (err) {
      toast.error('Network request failed');
      return { success: false, error: 'Network request failed' };
    }
  };

  const cancelAppointment = async (id) => {
    try {
      const res = await fetch(`${API_URL}/appointments/${id}/cancel`, {
        method: 'PUT',
        headers: getAuthHeaders()
      });
      const json = await res.json();
      if (json.success) {
        await Promise.all([fetchAppointments(), fetchDoctors()]);
        // ✅ Toast notification
        toast.success('Appointment cancelled successfully!');
        return { success: true };
      }
      toast.error(json.error || 'Failed to cancel appointment');
      return { success: false, error: json.error };
    } catch (err) {
      toast.error('Network request failed');
      return { success: false, error: 'Network request failed' };
    }
  };

  // ── Invoices CRUD ─────────────────────────────────────────────────────────────
  const addInvoice = async (invoiceData) => {
    try {
      const res = await fetch(`${API_URL}/invoices`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(invoiceData)
      });
      const json = await res.json();
      if (json.success) {
        await fetchInvoices();
        // ✅ Toast notification
        toast.success('Invoice created successfully!');
        return json.data;
      }
      toast.error(json.error || 'Failed to create invoice');
      throw new Error(json.error || 'Failed to create invoice');
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const markInvoicePaid = async (id) => {
    try {
      const res = await fetch(`${API_URL}/invoices/${id}/pay`, {
        method: 'PUT',
        headers: getAuthHeaders()
      });
      const json = await res.json();
      if (json.success) {
        await fetchInvoices();
        // ✅ Toast notification
        toast.success('Invoice marked as paid! 💰');
        return { success: true };
      }
      toast.error(json.error || 'Failed to update invoice');
      return { success: false, error: json.error };
    } catch (err) {
      toast.error('Network request failed');
      return { success: false, error: 'Network request failed' };
    }
  };

  // ── Settings ──────────────────────────────────────────────────────────────────
  const updateSettings = (newSettings) => {
    setSettings(newSettings);
    // ✅ Toast notification
    toast.success('Settings saved successfully!');
    if (user?.role === 'Admin') {
      const updated = { ...user, email: newSettings.adminEmail, name: newSettings.adminName };
      setUser(updated);
      localStorage.setItem('hms_user', JSON.stringify(updated));
    }
  };

  const exportBackup = () => {
    // ✅ Toast notification
    toast.success('Backup exported successfully!');
    return JSON.stringify({ doctors, patients, appointments, invoices, settings }, null, 2);
  };

  const restoreBackup = (jsonData) => {
    try {
      const data = JSON.parse(jsonData);
      if (data.settings) setSettings(data.settings);
      // ✅ Toast notification
      toast.success('Backup restored successfully!');
      return { success: true };
    } catch {
      toast.error('Invalid backup file format');
      return { success: false, error: 'Invalid backup file format' };
    }
  };

  // ── Stats ─────────────────────────────────────────────────────────────────────
  const stats = {
    totalPatients:      patients.length,
    totalDoctors:       doctors.length,
    totalAppointments:  appointments.filter(a => a.status === 'Scheduled').length,
    totalRevenue:
      appointments.filter(a => a.status === 'Scheduled').reduce((s, a) => s + a.fee, 0) +
      invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + i.totalAmount, 0),
  };

  return (
    <AppContext.Provider value={{
      theme, toggleTheme,
      user, login, logout, canWrite, isLoading,
      doctors, addDoctor, deleteDoctor,
      patients, addPatient, deletePatient,
      appointments, bookAppointment, cancelAppointment, rescheduleAppointment, getAvailableSlots,
      invoices, addInvoice, markInvoicePaid,
      settings, updateSettings, exportBackup, restoreBackup,
      stats,
    }}>
      {children}
    </AppContext.Provider>
  );
};