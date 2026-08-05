import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('hms_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const prescriptionStore = {
  state: {
    prescriptions: [],
    currentPrescription: null,
    loading: false,
    error: null,
    filters: { status: '', patientId: '', doctorId: '', search: '' },
    pagination: { page: 1, limit: 20, total: 0 }
  },

  async fetchPrescriptions(filters = {}, page = 1) {
    this.state.loading = true;
    this.state.error = null;
    try {
      const params = { page, limit: filters.limit || 20 };
      if (filters.patientId) params.patientId = filters.patientId;
      if (filters.doctorId)  params.doctorId  = filters.doctorId;
      if (filters.status)    params.status    = filters.status;
      if (filters.search)    params.search    = filters.search;

      const res = await axios.get(`${API_BASE}/prescriptions`, { headers: getAuthHeaders(), params });
      this.state.prescriptions = res.data.data || [];
      this.state.pagination = { page, limit: filters.limit || 20, total: res.data.total || 0 };
      this.state.filters = filters;
      return res.data;
    } catch (err) {
      this.state.error = err.response?.data?.error || err.message;
      throw err;
    } finally {
      this.state.loading = false;
    }
  },

  async fetchPrescriptionById(id) {
    this.state.loading = true;
    this.state.error = null;
    try {
      const res = await axios.get(`${API_BASE}/prescriptions/${id}`, { headers: getAuthHeaders() });
      this.state.currentPrescription = res.data.data;
      return res.data.data;
    } catch (err) {
      this.state.error = err.response?.data?.error || err.message;
      throw err;
    } finally {
      this.state.loading = false;
    }
  },

  async fetchPatientPrescriptions(patientId, filters = {}) {
    return this.fetchPrescriptions({ ...filters, patientId });
  },

  async fetchDoctorPrescriptions(doctorId, filters = {}) {
    return this.fetchPrescriptions({ ...filters, doctorId });
  },

  async createPrescription(data) {
    this.state.loading = true;
    this.state.error = null;
    try {
      const res = await axios.post(`${API_BASE}/prescriptions`, data, { headers: getAuthHeaders() });
      this.state.prescriptions.unshift(res.data.data);
      return res.data.data;
    } catch (err) {
      this.state.error = err.response?.data?.error || err.message;
      throw err;
    } finally {
      this.state.loading = false;
    }
  },

  async updatePrescription(id, data) {
    this.state.loading = true;
    this.state.error = null;
    try {
      const res = await axios.put(`${API_BASE}/prescriptions/${id}`, data, { headers: getAuthHeaders() });
      const idx = this.state.prescriptions.findIndex(r => r._id === id || r.prescriptionId === id);
      if (idx !== -1) this.state.prescriptions[idx] = res.data.data;
      this.state.currentPrescription = res.data.data;
      return res.data.data;
    } catch (err) {
      this.state.error = err.response?.data?.error || err.message;
      throw err;
    } finally {
      this.state.loading = false;
    }
  },

  async deletePrescription(id) {
    this.state.loading = true;
    this.state.error = null;
    try {
      const res = await axios.delete(`${API_BASE}/prescriptions/${id}`, { headers: getAuthHeaders() });
      const idx = this.state.prescriptions.findIndex(r => r._id === id || r.prescriptionId === id);
      if (idx !== -1) this.state.prescriptions[idx] = { ...this.state.prescriptions[idx], status: 'Cancelled' };
      return res.data;
    } catch (err) {
      this.state.error = err.response?.data?.error || err.message;
      throw err;
    } finally {
      this.state.loading = false;
    }
  },

  async refillPrescription(id) {
    this.state.loading = true;
    this.state.error = null;
    try {
      const res = await axios.post(`${API_BASE}/prescriptions/${id}/refill`, {}, { headers: getAuthHeaders() });
      this.state.prescriptions.unshift(res.data.data);
      return res.data.data;
    } catch (err) {
      this.state.error = err.response?.data?.error || err.message;
      throw err;
    } finally {
      this.state.loading = false;
    }
  },

  async checkRefillEligibility(id) {
    try {
      const res = await axios.get(`${API_BASE}/prescriptions/${id}/refill-status`, { headers: getAuthHeaders() });
      return res.data.data;
    } catch (err) {
      this.state.error = err.response?.data?.error || err.message;
      throw err;
    }
  },

  setFilters(newFilters) {
    this.state.filters = { ...this.state.filters, ...newFilters };
  },

  clearError() {
    this.state.error = null;
  }
};

export default prescriptionStore;
