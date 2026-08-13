import React, { createContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { io as ioClient } from 'socket.io-client';

export const AppContext = createContext();

const getApiUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const clean = envUrl.replace(/\/$/, '');
  return clean.endsWith('/api') ? clean : `${clean}/api`;
};

const API_URL = getApiUrl();

const defaultSettings = {
  hospitalName:    'Subhan Care Clinic',
  hospitalAddress: '123 Healthcare Blvd, Medical Suite 400',
  hospitalPhone:   '+1 (555) 019-9000',
  adminName:       'Subhan Administrator',
  adminEmail:      'admin@subhancare.com',
};

// ─── Role-Based Access Matrix ─────────────────────────────────────────────────
export const ROLE_ACCESS = {
  Admin:        ['dashboard', 'patients', 'doctors', 'appointments', 'billing', 'prescriptions', 'inventory', 'lab', 'reports', 'search', 'settings', 'staff'],
  Doctor:       ['dashboard', 'patients', 'appointments', 'prescriptions', 'inventory', 'lab'],
  Patient:      ['dashboard', 'appointments', 'prescriptions'],
  Receptionist: ['dashboard', 'patients', 'doctors', 'appointments', 'inventory'],
  Billing:      ['dashboard', 'patients', 'billing', 'prescriptions', 'inventory', 'reports'],
  Staff:        ['dashboard', 'patients', 'doctors', 'appointments', 'billing', 'prescriptions', 'inventory', 'lab', 'reports', 'search'],
};

export const WRITE_ACCESS = {
  Admin:        ['patients', 'doctors', 'appointments', 'billing', 'inventory', 'staff', 'lab'],
  Doctor:       ['lab'],
  Patient:      ['appointments'],
  Receptionist: ['patients', 'appointments'],
  Billing:      ['billing', 'inventory'],
  Staff:        ['patients', 'doctors', 'appointments', 'billing', 'inventory', 'staff', 'lab'],
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
  const [medicines, setMedicines] = useState([]);
  const [staff, setStaff] = useState([]);
  const [labTests, setLabTests] = useState([]);
  const [settings, setSettings] = useState(() => {
    const s = localStorage.getItem('hms_settings');
    return s ? JSON.parse(s) : defaultSettings;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);

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

  // Fetch medicines inventory
  const fetchMedicines = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/inventory`, { headers: getAuthHeaders() });
      const json = await res.json();
      if (json.success) setMedicines(json.data);
    } catch (err) {
      console.error('Error fetching medicines:', err);
    }
  };

  // Fetch staff registry
  const fetchStaff = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/staff`, { headers: getAuthHeaders() });
      const json = await res.json();
      if (json.success) setStaff(json.data);
    } catch (err) {
      console.error('Error fetching staff:', err);
    }
  };

  const fetchLabTests = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/lab`, { headers: getAuthHeaders() });
      const json = await res.json();
      if (json.success) setLabTests(json.data);
    } catch (err) {
      /* silent */
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
      fetchInvoices(),
      fetchMedicines(),
      fetchStaff(),
      fetchLabTests()
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
      setMedicines([]);
      setStaff([]);
      setLabTests([]);
    }
  }, [token]);

  // Socket.io client for real-time notifications
  useEffect(() => {
    if (!token) return undefined;
    const raw = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const base = raw.replace(/\/api\/?$/, '');
    const socket = ioClient(base, { transports: ['websocket'] });

    socket.on('connect', () => console.info('Socket connected', socket.id));
    socket.on('invoice:created', (payload) => {
      if (payload?.invoice) {
        setInvoices(prev => [payload.invoice, ...prev]);
        const note = { id: `inv-created-${payload.invoice.id}-${Date.now()}`, text: `New invoice ${payload.invoice.id} created.`, time: Date.now(), type: 'invoice' };
        setNotifications(prev => [note, ...prev].slice(0, 50));
        toast(`New invoice ${payload.invoice.id} created.`);
      }
    });
    socket.on('invoice:paid', (payload) => {
      if (payload?.invoice) {
        setInvoices(prev => prev.map(i => (i.id === payload.invoice.id ? payload.invoice : i)));
        const note = { id: `inv-paid-${payload.invoice.id}-${Date.now()}`, text: `Invoice ${payload.invoice.id} marked as paid.`, time: Date.now(), type: 'invoice' };
        setNotifications(prev => [note, ...prev].slice(0, 50));
        toast.success(`Invoice ${payload.invoice.id} marked as paid.`);
      }
    });

    return () => { socket.disconnect(); };
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

  const clearNotifications = () => setNotifications([]);

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

  // ── Staff CRUD ────────────────────────────────────────────────────────────────
  const addStaff = async (staffData) => {
    try {
      const res = await fetch(`${API_URL}/staff`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(staffData)
      });
      const json = await res.json();
      if (json.success) {
        await fetchStaff();
        toast.success('Staff member added successfully!');
        return { success: true };
      }
      toast.error(json.error || 'Failed to add staff');
      return { success: false, error: json.error };
    } catch (err) {
      toast.error('Network request failed');
      return { success: false, error: 'Network request failed' };
    }
  };

  const updateStaff = async (id, staffData) => {
    try {
      const res = await fetch(`${API_URL}/staff/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(staffData)
      });
      const json = await res.json();
      if (json.success) {
        await fetchStaff();
        toast.success('Staff details updated!');
        return { success: true };
      }
      toast.error(json.error || 'Failed to update staff');
      return { success: false, error: json.error };
    } catch (err) {
      toast.error('Network request failed');
      return { success: false, error: 'Network request failed' };
    }
  };

  const deleteStaff = async (id) => {
    try {
      const res = await fetch(`${API_URL}/staff/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      const json = await res.json();
      if (json.success) {
        await fetchStaff();
        toast.success('Staff member removed!');
        return { success: true };
      }
      toast.error(json.error || 'Failed to delete staff');
      return { success: false, error: json.error };
    } catch (err) {
      toast.error('Network request failed');
      return { success: false, error: 'Network request failed' };
    }
  };

  // ── Lab Tests CRUD ─────────────────────────────────────────────────────────────
  const addLabTest = async (testData) => {
    try {
      const res = await fetch(`${API_URL}/lab`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(testData)
      });
      const json = await res.json();
      if (json.success) {
        await fetchLabTests();
        toast.success('Lab test created successfully!');
        return { success: true };
      }
      toast.error(json.message || 'Failed to create lab test');
      return { success: false, error: json.message };
    } catch (err) {
      toast.error('Network request failed');
      return { success: false, error: 'Network request failed' };
    }
  };

  const updateLabTest = async (id, testData) => {
    try {
      const res = await fetch(`${API_URL}/lab/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(testData)
      });
      const json = await res.json();
      if (json.success) {
        await fetchLabTests();
        toast.success('Lab test updated!');
        return { success: true };
      }
      toast.error(json.message || 'Failed to update lab test');
      return { success: false, error: json.message };
    } catch (err) {
      toast.error('Network request failed');
      return { success: false, error: 'Network request failed' };
    }
  };

  const deleteLabTest = async (id) => {
    try {
      const res = await fetch(`${API_URL}/lab/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      const json = await res.json();
      if (json.success) {
        await fetchLabTests();
        toast.success('Lab test deleted!');
        return { success: true };
      }
      toast.error(json.message || 'Failed to delete lab test');
      return { success: false, error: json.message };
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

  // ── Inventory / Medicines CRUD ───────────────────────────────────────────────
  const addMedicine = async (medData) => {
    try {
      const res = await fetch(`${API_URL}/inventory`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(medData)
      });
      const json = await res.json();
      if (json.success) {
        await fetchMedicines();
        if (json.stockMerged) {
          toast.success(json.message || 'Existing batch found. Stock has been updated.');
        } else {
          toast.success('Medicine added to inventory!');
        }
        return { success: true, data: json.data, stockMerged: json.stockMerged, message: json.message };
      }
      toast.error(json.error || 'Failed to add medicine');
      return { success: false, error: json.error };
    } catch (err) {
      toast.error('Network request failed');
      return { success: false, error: 'Network request failed' };
    }
  };

  const updateMedicine = async (id, medData) => {
    try {
      const res = await fetch(`${API_URL}/inventory/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(medData)
      });
      const json = await res.json();
      if (json.success) {
        await fetchMedicines();
        toast.success('Medicine updated successfully!');
        return { success: true, data: json.data };
      }
      toast.error(json.error || 'Failed to update medicine');
      return { success: false, error: json.error };
    } catch (err) {
      toast.error('Network request failed');
      return { success: false, error: 'Network request failed' };
    }
  };

  const adjustStock = async (id, adjustment, reason) => {
    try {
      const res = await fetch(`${API_URL}/inventory/${id}/stock`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ adjustment, reason })
      });
      const json = await res.json();
      if (json.success) {
        await fetchMedicines();
        toast.success(json.message || 'Stock updated!');
        return { success: true };
      }
      toast.error(json.error || 'Failed to update stock');
      return { success: false, error: json.error };
    } catch (err) {
      toast.error('Network request failed');
      return { success: false, error: 'Network request failed' };
    }
  };

  const deleteMedicine = async (id) => {
    try {
      const res = await fetch(`${API_URL}/inventory/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      const json = await res.json();
      if (json.success) {
        await fetchMedicines();
        toast.success('Medicine removed from inventory!');
        return { success: true };
      }
      toast.error(json.error || 'Failed to delete medicine');
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
      token,
      theme, toggleTheme,
      user, login, logout, canWrite, isLoading,
      doctors, addDoctor, deleteDoctor,
      staff, fetchStaff, addStaff, updateStaff, deleteStaff,
      patients, addPatient, deletePatient,
      appointments, bookAppointment, cancelAppointment, rescheduleAppointment, getAvailableSlots,
      invoices, addInvoice, markInvoicePaid,
      notifications, clearNotifications,
      medicines, addMedicine, updateMedicine, adjustStock, deleteMedicine, fetchMedicines,
      labTests, addLabTest, updateLabTest, deleteLabTest,
      settings, updateSettings, exportBackup, restoreBackup,
      stats,
    }}>
      {children}
    </AppContext.Provider>
  );
};