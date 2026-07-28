import { create } from 'zustand';
import toast from 'react-hot-toast';

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`;

const useAppointmentStore = create((set, get) => ({
  appointments: [],
  isLoading: false,
  error: null,
  currentPage: 1,
  totalPages: 1,
  total: 0,

  fetchAppointments: async (token, page = 1, limit = 10) => {
    if (!token) return;
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(
        `${API_URL}/appointments?page=${page}&limit=${limit}`,
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
          appointments: json.data,
          currentPage: json.currentPage || page,
          totalPages: json.totalPages || 1,
          total: json.total || json.count,
          isLoading: false
        });
      }
    } catch (err) {
      set({ error: 'Failed to fetch appointments', isLoading: false });
    }
  },

  bookAppointment: async (token, aptData) => {
    try {
      const res = await fetch(`${API_URL}/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(aptData)
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Appointment booked successfully!');
        await get().fetchAppointments(token);
        return { success: true };
      }
      toast.error(json.error || 'Failed to book appointment');
      return { success: false, error: json.error };
    } catch (err) {
      toast.error('Network request failed');
      return { success: false, error: 'Network request failed' };
    }
  },

  cancelAppointment: async (token, id) => {
    try {
      const res = await fetch(`${API_URL}/appointments/${id}/cancel`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Appointment cancelled!');
        await get().fetchAppointments(token);
        return { success: true };
      }
      toast.error(json.error || 'Failed to cancel');
      return { success: false, error: json.error };
    } catch (err) {
      toast.error('Network request failed');
      return { success: false, error: 'Network request failed' };
    }
  },

  rescheduleAppointment: async (token, id, newDate, newTime) => {
    try {
      const res = await fetch(`${API_URL}/appointments/${id}/reschedule`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ newDate, newTime })
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Appointment rescheduled!');
        await get().fetchAppointments(token);
        return { success: true };
      }
      toast.error(json.error || 'Failed to reschedule');
      return { success: false, error: json.error };
    } catch (err) {
      toast.error('Network request failed');
      return { success: false, error: 'Network request failed' };
    }
  }
}));

export default useAppointmentStore;