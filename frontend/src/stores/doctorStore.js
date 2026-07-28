import { create } from 'zustand';
import toast from 'react-hot-toast';

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`;

const useDoctorStore = create((set, get) => ({
  doctors: [],
  isLoading: false,
  error: null,
  currentPage: 1,
  totalPages: 1,
  total: 0,

  fetchDoctors: async (token, page = 1, limit = 10, search = '') => {
    if (!token) return;
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(
        `${API_URL}/doctors?page=${page}&limit=${limit}&search=${search}`,
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
          doctors: json.data,
          currentPage: json.currentPage || page,
          totalPages: json.totalPages || 1,
          total: json.total || json.count,
          isLoading: false
        });
      }
    } catch (err) {
      set({ error: 'Failed to fetch doctors', isLoading: false });
    }
  },

  addDoctor: async (token, doctorData) => {
    try {
      const res = await fetch(`${API_URL}/doctors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(doctorData)
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Doctor added successfully!');
        await get().fetchDoctors(token);
        return { success: true };
      }
      toast.error(json.error || 'Failed to add doctor');
      return { success: false, error: json.error };
    } catch (err) {
      toast.error('Network request failed');
      return { success: false, error: 'Network request failed' };
    }
  },

  deleteDoctor: async (token, id) => {
    try {
      const res = await fetch(`${API_URL}/doctors/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Doctor deleted successfully!');
        await get().fetchDoctors(token);
        return { success: true };
      }
      toast.error(json.error || 'Failed to delete doctor');
      return { success: false, error: json.error };
    } catch (err) {
      toast.error('Network request failed');
      return { success: false, error: 'Network request failed' };
    }
  }
}));

export default useDoctorStore;