import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { toast } from 'react-toastify';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5001/api',
      timeout: 30000, // Increased timeout to 30 seconds for better reliability
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    // Use sessionStorage only (per-tab, each tab has its own session)
    this.api.interceptors.request.use(
      (config) => {
        // Check sessionStorage first (per-tab session)
        const token = sessionStorage.getItem('token');
        // Fallback to localStorage only for backward compatibility during migration
        const fallbackToken = token || localStorage.getItem('token');
        if (fallbackToken) {
          config.headers.Authorization = `Bearer ${fallbackToken}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle errors
    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        // Don't interfere with blob responses - let them pass through
        if (response.config.responseType === 'blob') {
          return response;
        }
        return response;
      },
      async (error) => {
        // For blob requests, don't show toast errors (let the component handle it)
        const isBlobRequest = error?.config?.responseType === 'blob';
        const httpStatus = error.response?.status;
        const requestUrl: string | undefined = error?.config?.url;
        const requestMethod: string | undefined = error?.config?.method;

        // Handle network errors (no response)
        if (!error.response) {
          console.error('Network error:', error.message);
          const networkMessage = error.code === 'ECONNABORTED' 
            ? 'Request timeout. Please check your connection and try again.' 
            : 'Network error. Please check your internet connection.';
          
          // Only show toast for non-GET requests or critical operations
          if (requestMethod !== 'get') {
            toast.error(networkMessage);
          }
          return Promise.reject(error);
        }

        // Handle 401 errors more gracefully
        if (httpStatus === 401) {
          // Check sessionStorage first (per-tab session), then localStorage for backward compatibility
          const storedUser = sessionStorage.getItem('user') || localStorage.getItem('user');
          const storedToken = sessionStorage.getItem('token') || localStorage.getItem('token');
          
          // Check if this is a token expiration or invalid token
          if (storedUser && storedToken) {
            try {
              const userData = JSON.parse(storedUser);
              // Try to verify if token belongs to current user
              const verifyResponse = await this.api.get('/auth/me').catch(() => null);
              
              if (!verifyResponse || verifyResponse.data?.data?.user?._id !== userData._id) {
                // Token doesn't belong to current user or is expired
                // Don't auto-logout - let the component handle it
                if (requestUrl && !requestUrl.includes('/auth/me') && !requestUrl.includes('/auth/')) {
                  console.warn('Token mismatch or expired. Please log in again.');
                }
                return Promise.reject(error);
              }
            } catch (verifyError) {
              // Verification failed - token is invalid or expired
              console.error('Token verification failed:', verifyError);
              // Token may be expired - don't show error for auth endpoints
              if (!requestUrl || !requestUrl.includes('/auth/')) {
                toast.error('Session expired. Please log in again.');
              }
            }
          }
          
          // For auth endpoints, don't show error toast
          if (requestUrl && requestUrl.includes('/auth/')) {
            return Promise.reject(error);
          }
          
          // For other endpoints, check if it's a real auth failure or just token mismatch
          // Don't auto-logout - let the component handle it
        }
        
        // Handle 500 server errors
        if (httpStatus === 500) {
          console.error('Server error:', error.response?.data);
          const serverMessage = error.response?.data?.message || 'Server error occurred. Please try again later.';
          if (!requestUrl || !requestUrl.includes('/auth/')) {
            toast.error(serverMessage);
          }
          return Promise.reject(error);
        }
        
        // Avoid showing disruptive toasts for common auth/permission cases
        const message = error.response?.data?.message || 'An error occurred';

        // Suppress noisy global toasts for 403 Forbidden (permission errors)
        // and 401 (already handled above). Other errors will show a toast.
        // Don't show toast for blob requests - let the component handle the error
        if (!isBlobRequest && httpStatus !== 401 && httpStatus !== 403 && httpStatus !== 500) {
          // Only show toast for non-GET requests to avoid noise
          if (requestMethod !== 'get' || httpStatus >= 400) {
            toast.error(message);
          }
        }
        
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async login(credentials: { email: string; password: string }) {
    const response = await this.api.post('/auth/login', credentials);
    return response.data;
  }

  async register(data: any) {
    const response = await this.api.post('/auth/register', data);
    return response.data;
  }

  async getMe() {
    const response = await this.api.get('/auth/me');
    return response.data;
  }

  async updateProfile(data: any) {
    const response = await this.api.put('/auth/profile', data);
    return response.data;
  }

  async changePassword(data: { currentPassword: string; newPassword: string }) {
    const response = await this.api.put('/auth/change-password', data);
    return response.data;
  }

  async logout() {
    const response = await this.api.post('/auth/logout');
    return response.data;
  }

  async forgotPassword(email: string) {
    const response = await this.api.post('/auth/forgot-password', { email });
    return response.data;
  }

  async resetPassword(token: string, password: string) {
    const response = await this.api.post(`/auth/reset-password/${token}`, { password });
    return response.data;
  }

  async verifyEmail(token: string) {
    const response = await this.api.get(`/auth/verify-email/${token}`);
    return response.data;
  }

  async resendVerificationEmail(email: string) {
    const response = await this.api.post('/auth/resend-verification', { email });
    return response.data;
  }

  // User endpoints
  async getAllUsers(params?: any) {
    const response = await this.api.get('/users', { params });
    return response.data;
  }

  async getUserById(id: string) {
    const response = await this.api.get(`/users/${id}`);
    return response.data;
  }

  async getDoctors(params?: any) {
    const response = await this.api.get('/users/doctors', { params });
    return response.data;
  }

  async getPatients(params?: any) {
    const response = await this.api.get('/users/patients', { params });
    return response.data;
  }

  async searchUsers(params: { q: string; role?: string; page?: number; limit?: number }) {
    const response = await this.api.get('/users/search', { params });
    return response.data;
  }

  async updateUser(id: string, data: any) {
    const response = await this.api.put(`/users/${id}`, data);
    return response.data;
  }

  async deleteUser(id: string) {
    const response = await this.api.delete(`/users/${id}`);
    return response.data;
  }

  // Appointment endpoints
  async createAppointment(data: any) {
    const response = await this.api.post('/appointments', data);
    return response.data;
  }

  async getAllAppointments(params?: any) {
    const response = await this.api.get('/appointments', { params });
    return response.data;
  }

  async getAppointmentById(id: string) {
    const response = await this.api.get(`/appointments/${id}`);
    return response.data;
  }

  async getMyAppointments(params?: any) {
    const response = await this.api.get('/appointments/my-appointments', { params });
    return response.data;
  }

  async getDoctorAppointments(params?: any) {
    const response = await this.api.get('/doctors/appointments', { params });
    return response.data;
  }

  async updateAppointment(id: string, data: any) {
    const response = await this.api.put(`/appointments/${id}`, data);
    return response.data;
  }

  async updateAppointmentStatus(id: string, data: { status: string; notes?: string }) {
    const response = await this.api.put(`/doctors/appointments/${id}/status`, data);
    return response.data;
  }

  async cancelAppointment(id: string, data: { cancellationReason: string }) {
    const response = await this.api.put(`/appointments/${id}/cancel`, data);
    return response.data;
  }

  async deleteAppointment(id: string) {
    const response = await this.api.delete(`/appointments/${id}`);
    return response.data;
  }

  async getAvailableTimeSlots(params: { doctorId: string; date: string }) {
    const response = await this.api.get('/appointments/available-slots', { params });
    return response.data;
  }

  // Medical Record endpoints
  async createMedicalRecord(data: any) {
    const response = await this.api.post('/records', data);
    return response.data;
  }

  async getAllMedicalRecords(params?: any) {
    const response = await this.api.get('/records', { params });
    return response.data;
  }

  async getMedicalRecordById(id: string) {
    const response = await this.api.get(`/records/${id}`);
    return response.data;
  }

  async getPatientMedicalRecords(patientId: string, params?: any) {
    const response = await this.api.get(`/records/patient/${patientId}`, { params });
    return response.data;
  }

  async getDoctorMedicalRecords(params?: any) {
    const response = await this.api.get('/doctors/medical-records', { params });
    return response.data;
  }

  async updateMedicalRecord(id: string, data: any) {
    const response = await this.api.put(`/records/${id}`, data);
    return response.data;
  }

  async updateRecordStatus(id: string, data: { status: string }) {
    const response = await this.api.put(`/records/${id}/status`, data);
    return response.data;
  }

  async deleteMedicalRecord(id: string) {
    const response = await this.api.delete(`/records/${id}`);
    return response.data;
  }

  async exportMedicalRecord(recordId: string, format: 'pdf' | 'csv') {
    try {
      const response = await this.api.post(`/records/${recordId}/export`,
        { format },
        { 
          responseType: 'blob',
          timeout: 60000 // 60 seconds timeout
        }
      );
      return response;
    } catch (error: any) {
      if (error.response && error.response.data instanceof Blob) {
        try {
          const text = await error.response.data.text();
          const errorData = JSON.parse(text);
          error.response.data = errorData;
        } catch (parseError) {
          console.error('Failed to parse error blob:', parseError);
        }
      }
      throw error;
    }
  }

  // Schedule endpoints
  async createSchedule(data: any) {
    const response = await this.api.post('/schedules', data);
    return response.data;
  }

  async getAllSchedules(params?: any) {
    const response = await this.api.get('/schedules', { params });
    return response.data;
  }

  async getScheduleById(id: string) {
    const response = await this.api.get(`/schedules/${id}`);
    return response.data;
  }

  async getMySchedules(params?: any) {
    const response = await this.api.get('/schedules/my-schedules', { params });
    return response.data;
  }

  async getAvailableSchedules(params?: any) {
    const response = await this.api.get('/schedules/available', { params });
    return response.data;
  }

  async updateSchedule(id: string, data: any) {
    const response = await this.api.put(`/schedules/${id}`, data);
    return response.data;
  }

  async updateScheduleStatus(id: string, data: { status: string }) {
    const response = await this.api.put(`/schedules/${id}/status`, data);
    return response.data;
  }

  async deleteSchedule(id: string) {
    const response = await this.api.delete(`/schedules/${id}`);
    return response.data;
  }

  // Admin-specific endpoints
  async getAdminStats() {
    const response = await this.api.get('/admin/stats');
    return response.data;
  }

  async getAdminUsers(params?: any) {
    const response = await this.api.get('/admin/users', { params });
    return response.data;
  }

  async getPendingDoctorRegistrations() {
    const response = await this.api.get('/admin/pending-registrations');
    return response.data;
  }

  async approveDoctorRegistration(doctorId: string) {
    const response = await this.api.patch(`/admin/approve-doctor/${doctorId}`);
    return response.data;
  }

  async rejectDoctorRegistration(doctorId: string, reason?: string) {
    const response = await this.api.patch(`/admin/reject-doctor/${doctorId}`, { reason });
    return response.data;
  }

  async updateAppointmentStatusAdmin(appointmentId: string, data: any) {
    const response = await this.api.patch(`/admin/appointments/${appointmentId}/status`, data);
    return response.data;
  }

  async createDoctor(data: any) {
    const response = await this.api.post('/admin/create-doctor', data);
    return response.data;
  }

  async createMonitor(data: any) {
    const response = await this.api.post('/admin/create-monitor', data);
    return response.data;
  }

  async updateUserAdmin(userId: string, data: any) {
    const response = await this.api.put(`/admin/users/${userId}`, data);
    return response.data;
  }

  async deleteUserAdmin(userId: string) {
    const response = await this.api.delete(`/admin/users/${userId}`);
    return response.data;
  }

  async getSystemHealth() {
    const response = await this.api.get('/admin/system-health');
    return response.data;
  }

  async updateUserStatus(userId: string, isActive: boolean) {
    const response = await this.api.put(`/admin/users/${userId}`, { isActive });
    return response.data;
  }

  // System Settings API methods
  async getSystemInfo() {
    const response = await this.api.get('/admin/system-info');
    return response.data;
  }

  async exportSystemData(dataType: string, format: string = 'json') {
    const response = await this.api.post('/admin/export-data', { dataType, format });
    return response.data;
  }

  async clearSystemCache() {
    const response = await this.api.post('/admin/clear-cache');
    return response.data;
  }

  async updateSystemSettings(settings: any) {
    const response = await this.api.put('/admin/system-settings', { settings });
    return response.data;
  }

  async getSystemLogs(level?: string, limit?: number) {
    const params: any = {};
    if (level) params.level = level;
    if (limit) params.limit = limit;
    const response = await this.api.get('/admin/system-logs', { params });
    return response.data;
  }

  async performSystemBackup(backupType: string = 'full') {
    const response = await this.api.post('/admin/system-backup', { backupType });
    return response.data;
  }

  // Enhanced Monitoring API methods
  async getSystemAnalytics(period: string = '30d') {
    const response = await this.api.get('/monitoring/analytics', { params: { period } });
    return response.data;
  }

  async generateCustomReport(reportType: string, startDate: string, endDate: string, filters: any = {}) {
    const response = await this.api.post('/monitoring/generate-report', {
      reportType,
      startDate,
      endDate,
      filters
    });
    return response.data;
  }

  async getAdminAppointments(params?: any) {
    const response = await this.api.get('/admin/appointments', { params });
    return response.data;
  }

  async getPendingAvailabilityChanges() {
    const response = await this.api.get('/admin/availability?status=pending');
    return response.data;
  }

  async approveAvailabilityChange(changeId: string) {
    const response = await this.api.put(`/admin/availability/${changeId}/approve`);
    return response.data;
  }

      async rejectAvailabilityChange(changeId: string) {
        const response = await this.api.put(`/admin/availability/${changeId}/reject`);
        return response.data;
      }

      // Monitoring & Reports endpoints
      async getMonitoringLoginStats(dateFilter: string = 'daily') {
        const response = await this.api.get(`/monitoring/login-stats?filter=${dateFilter}`);
        return response.data;
      }

      async getMonitoringAppointmentStats(dateFilter: string = 'daily') {
        const response = await this.api.get(`/monitoring/appointment-stats?filter=${dateFilter}`);
        return response.data;
      }

      async getPatientRecordsForExport() {
        const response = await this.api.get('/monitoring/patient-records');
        return response.data;
      }

      async getPatientExportableRecords(patientId: string) {
        const response = await this.api.get(`/monitoring/patient-records/${patientId}`);
        return response.data;
      }

      async exportPatientRecords(patientId: string, format: 'pdf' | 'csv') {
        try {
          const response = await this.api.post(`/monitoring/export/${patientId}`,
            { format },
            { 
              responseType: 'blob',
              timeout: 60000 // 60 seconds timeout for large exports
            }
          );
          
          // Ensure we return the response properly
          return response;
        } catch (error: any) {
          // If error response is a blob (backend error), convert it
          if (error.response && error.response.data instanceof Blob) {
            try {
              const text = await error.response.data.text();
              const errorData = JSON.parse(text);
              error.response.data = errorData;
            } catch (parseError) {
              // If parsing fails, keep the blob
              console.error('Failed to parse error blob:', parseError);
            }
          }
          throw error;
        }
      }

    }

    const apiService = new ApiService();
    export default apiService;
