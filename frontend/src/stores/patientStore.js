import { create } from 'zustand';
import toast from 'react-hot-toast';

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`;

const usePatientStore = create((set, get) => ({
  patients: [],
  isLoading: false,
  error: null,
  currentPage: 1,
  totalPages: 1,
  total: 0,

  fetchPatients: async (token, page = 1, limit = 10, search = '') => {
    if (!token) return;
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(
        `${API_URL}/patients?page=${page}&limit=${limit}&search=${search}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      const json = await res.json();
      if (json.success) {
        set({
          patients: json.data,
          currentPage: json.currentPage || page,
          totalPages: json.totalPages || 1,
          total: json.total || json.count,
          isLoading: false
        });
      }
    } catch (err) {
      set({ error: 'Failed to fetch patients', isLoading: false });
    }
  },

  addPatient: async (token, patientData) => {
    try {
      const res = await fetch(`${API_URL}/patients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(patientData)
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Patient added successfully!');
        await get().fetchPatients(token);
        return { success: true };
      }
      toast.error(json.error || 'Failed to add patient');
      return { success: false, error: json.error };
    } catch (err) {
      toast.error('Network request failed');
      return { success: false, error: 'Network request failed' };
    }
  },

  deletePatient: async (token, id) => {
    try {
      const res = await fetch(`${API_URL}/patients/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Patient deleted successfully!');
        await get().fetchPatients(token);
        return { success: true };
      }
      toast.error(json.error || 'Failed to delete patient');
      return { success: false, error: json.error };
    } catch (err) {
      toast.error('Network request failed');
      return { success: false, error: 'Network request failed' };
    }
  },

  setPage: (page) => set({ currentPage: page })
}));

export default usePatientStore;