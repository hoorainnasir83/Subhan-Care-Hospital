import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('hms_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const initialState = {
  medicalRecords: [],
  currentRecord: null,
  medicalTimeline: [],
  medicalSummary: null,
  loading: false,
  error: null,
  filters: {
    recordType: '',
    status: '',
    severity: '',
    search: '',
    dateRange: { from: '', to: '' }
  },
  pagination: {
    page: 1,
    limit: 10,
    total: 0
  },
  cacheTimestamp: null
};

const medicalRecordStore = {
  state: { ...initialState },

  // Fetch all medical records
  async fetchMedicalRecords(filters = {}, page = 1) {
    this.state.loading = true;
    this.state.error = null;
    try {
      const params = {
        page,
        limit: filters.limit || 20,
        ...(filters.recordType && { recordType: filters.recordType }),
        ...(filters.status && { status: filters.status }),
        ...(filters.severity && { severity: filters.severity }),
        ...(filters.search && { search: filters.search }),
        ...(filters.patientId && { patientId: filters.patientId }),
        ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
        ...(filters.dateTo && { dateTo: filters.dateTo })
      };

      const response = await axios.get(`${API_BASE}/medical-records`, {
        headers: getAuthHeaders(),
        params
      });

      this.state.medicalRecords = response.data.data || [];
      this.state.pagination = {
        page: response.data.page || page,
        limit: filters.limit || 20,
        total: response.data.total || response.data.count || 0
      };
      this.state.filters = filters;
      this.state.cacheTimestamp = Date.now();

      return response.data;
    } catch (error) {
      this.state.error = error.response?.data?.error || error.message;
      throw error;
    } finally {
      this.state.loading = false;
    }
  },

  // Fetch single medical record
  async fetchMedicalRecordById(recordId) {
    this.state.loading = true;
    this.state.error = null;
    try {
      const response = await axios.get(`${API_BASE}/medical-records/${recordId}`, {
        headers: getAuthHeaders()
      });
      this.state.currentRecord = response.data.data;
      return response.data.data;
    } catch (error) {
      this.state.error = error.response?.data?.error || error.message;
      throw error;
    } finally {
      this.state.loading = false;
    }
  },

  // Fetch patient's medical timeline
  async fetchPatientMedicalTimeline(patientId, page = 1) {
    this.state.loading = true;
    this.state.error = null;
    try {
      const response = await axios.get(
        `${API_BASE}/medical-records/patient/${patientId}/timeline`,
        { headers: getAuthHeaders(), params: { page, limit: 50 } }
      );
      this.state.medicalTimeline = response.data.data || [];
      this.state.pagination = response.data.pagination || {};
      return response.data.data;
    } catch (error) {
      this.state.error = error.response?.data?.error || error.message;
      throw error;
    } finally {
      this.state.loading = false;
    }
  },

  // Fetch patient's medical summary
  async fetchMedicalSummary(patientId) {
    this.state.loading = true;
    this.state.error = null;
    try {
      const response = await axios.get(
        `${API_BASE}/medical-records/patient/${patientId}/summary`,
        { headers: getAuthHeaders() }
      );
      this.state.medicalSummary = response.data.data;
      return response.data.data;
    } catch (error) {
      this.state.error = error.response?.data?.error || error.message;
      throw error;
    } finally {
      this.state.loading = false;
    }
  },

  // Create medical record
  async createMedicalRecord(data) {
    this.state.loading = true;
    this.state.error = null;
    try {
      const response = await axios.post(`${API_BASE}/medical-records`, data, {
        headers: getAuthHeaders()
      });
      this.state.medicalRecords.unshift(response.data.data);
      return response.data.data;
    } catch (error) {
      this.state.error = error.response?.data?.error || error.message;
      throw error;
    } finally {
      this.state.loading = false;
    }
  },

  // Update medical record
  async updateMedicalRecord(recordId, data) {
    this.state.loading = true;
    this.state.error = null;
    try {
      const response = await axios.put(`${API_BASE}/medical-records/${recordId}`, data, {
        headers: getAuthHeaders()
      });
      const targetId = recordId;
      const index = this.state.medicalRecords.findIndex(r => r._id === targetId || r.recordId === targetId);
      if (index !== -1) {
        this.state.medicalRecords[index] = response.data.data;
      }
      this.state.currentRecord = response.data.data;
      return response.data.data;
    } catch (error) {
      this.state.error = error.response?.data?.error || error.message;
      throw error;
    } finally {
      this.state.loading = false;
    }
  },

  // Delete medical record
  async deleteMedicalRecord(recordId) {
    this.state.loading = true;
    this.state.error = null;
    try {
      const response = await axios.delete(`${API_BASE}/medical-records/${recordId}`, {
        headers: getAuthHeaders()
      });
      this.state.medicalRecords = this.state.medicalRecords.filter(r => r._id !== recordId && r.recordId !== recordId);
      return response.data;
    } catch (error) {
      this.state.error = error.response?.data?.error || error.message;
      throw error;
    } finally {
      this.state.loading = false;
    }
  },

  // Set filters
  setFilters(newFilters) {
    this.state.filters = { ...this.state.filters, ...newFilters };
  },

  // Clear error
  clearError() {
    this.state.error = null;
  }
};

export default medicalRecordStore;
