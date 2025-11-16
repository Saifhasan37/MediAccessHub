import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import apiService from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  AppointmentTrendsChart,
  LoginByRoleChart,
  UserCountsChart,
  DoctorAppointmentsChart
} from '../components/Charts/MonitorCharts';
import {
  Users,
  Calendar,
  Download,
  RefreshCw,
  Eye,
  FileText,
  LogOut
} from 'lucide-react';

interface LoginStats {
  totalLogins: number;
  dailyLogins: number;
  weeklyLogins: number;
  monthlyLogins: number;
  loginsByRole: {
    patients: number;
    doctors: number;
    admins: number;
  };
  userCountsByRole: {
    patients: number;
    doctors: number;
    admins: number;
    monitors: number;
  };
  recentLogins: Array<{
    user: string;
    role: string;
    loginTime: string;
    ipAddress: string;
  }>;
}

interface AppointmentStats {
  totalAppointments: number;
  appointmentsByDoctor: Array<{
    doctorName: string;
    doctorId: string;
    totalAppointments: number;
    todayAppointments: number;
    pendingAppointments: number;
    completedAppointments: number;
  }>;
  appointmentsByDate: Array<{
    date: string;
    count: number;
  }>;
  appointmentTrends: {
    thisWeek: number;
    lastWeek: number;
    trend: 'up' | 'down' | 'stable';
  };
}

interface PatientRecord {
  _id: string;
  patientId: string;
  fullName: string;
  age: number;
  gender: string;
  totalAppointments: number;
  assignedDoctor: string;
  lastAppointment: string;
}

interface ExportableRecord {
  patientId: string;
  date: string;
  diagnosis: string | string[];
  prescription: string | any[];
  comments?: string;
  doctor: string;
  recordType?: string;
  status?: string;
  title?: string;
  description?: string;
  symptoms?: string[];
  treatment?: string;
  vitalSigns?: any;
  labResults?: any[];
}

const MonitoringDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [loginStats, setLoginStats] = useState<LoginStats | null>(null);
  const [appointmentStats, setAppointmentStats] = useState<AppointmentStats | null>(null);
  const [patientRecords, setPatientRecords] = useState<PatientRecord[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<string>('');
  const [exportableRecords, setExportableRecords] = useState<ExportableRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [dateFilter, setDateFilter] = useState('daily');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState(false);
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  // System analytics is currently not displayed; remove state to avoid unused warnings
  // const [customReport, setCustomReport] = useState<any>(null);
  // const [reportType, setReportType] = useState('user-activity');
  // const [reportStartDate, setReportStartDate] = useState('');
  // const [reportEndDate, setReportEndDate] = useState('');

  const loadMonitoringData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [loginStatsRes, appointmentStatsRes, patientRecordsRes] = await Promise.all([
        apiService.getMonitoringLoginStats(dateFilter),
        apiService.getMonitoringAppointmentStats(dateFilter),
        apiService.getPatientRecordsForExport()
      ]);

      if (loginStatsRes.status === 'success') {
        setLoginStats(loginStatsRes.data);
      } else {
        toast.error('Failed to load login statistics');
      }
      
      if (appointmentStatsRes.status === 'success') {
        console.log('Appointment Stats Data:', appointmentStatsRes.data);
        setAppointmentStats(appointmentStatsRes.data);
      } else {
        toast.error('Failed to load appointment statistics');
      }
      
      if (patientRecordsRes.status === 'success') {
        setPatientRecords(patientRecordsRes.data.patients);
      } else {
        toast.error('Failed to load patient records');
      }
      
      toast.success('Dashboard data refreshed successfully', { autoClose: 2000 });
    } catch (error: any) {
      console.error('Failed to load monitoring data:', error);
      const errorMessage = error?.response?.data?.message || 'Failed to load monitoring data. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [dateFilter]);

  useEffect(() => {
    loadMonitoringData();
  }, [loadMonitoringData]);

  // Real-time auto refresh
  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => {
      loadMonitoringData();
    }, 15000);
    return () => clearInterval(id);
  }, [autoRefresh, loadMonitoringData]);

  const handlePatientSelect = async (patientId: string) => {
    if (!patientId) {
      toast.error('Invalid patient ID');
      return;
    }
    
    // If clicking the same patient, toggle selection (deselect)
    if (selectedPatient === patientId) {
      setSelectedPatient('');
      setExportableRecords([]);
      toast.info('Patient deselected');
      return;
    }
    
    setSelectedPatient(patientId);
    setExportableRecords([]); // Clear previous records
    
    // Show loading toast
    const loadingToast = toast.info('Loading patient records...', { autoClose: false });
    
    try {
      console.log('Loading records for patient:', patientId);
      const response = await apiService.getPatientExportableRecords(patientId);
      
      toast.dismiss(loadingToast);
      
      // Handle both old and new response formats
      if (response && response.status === 'success') {
        const records = response.data?.records || [];
        const hasRecords = response.data?.hasRecords ?? (records.length > 0);
        const message = response.data?.message;
        
        setExportableRecords(records);
        console.log(`Loaded ${records.length} medical records for patient`, {
          hasRecords,
          message,
          patientId: response.data?.patientId
        });
        
        if (records.length > 0) {
          toast.success(`Loaded ${records.length} medical record(s). Scroll down to view details.`, { autoClose: 3000 });
        } else {
          // Show the message from backend if available, otherwise default message
          const infoMessage = message || 'No medical records found. Patient may have appointments. Export will include all available data.';
          toast.info(infoMessage, { autoClose: 4000 });
        }
      } else if (response && response.status === 'error') {
        // Backend returned an error but we still want to allow export
        console.warn('Backend returned error but allowing export:', response.message);
        setExportableRecords([]);
        toast.info('No medical records preview available. Export will still work if patient has appointments.', { autoClose: 4000 });
      } else {
        // Unexpected response format, but don't block
        console.warn('Unexpected response format:', response);
        setExportableRecords([]);
        toast.info('No medical records found. Patient may have appointments. Export will include all available data.', { autoClose: 4000 });
      }
    } catch (error: any) {
      toast.dismiss(loadingToast);
      console.error('Failed to load patient records:', error);
      console.error('Error details:', {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
        url: error?.config?.url
      });
      
      // Always set empty array to allow export to proceed
      setExportableRecords([]);
      
      // Show helpful message but don't block - export will still work
      if (error?.response?.status === 404) {
        // Check if it's a patient not found error or just no records
        const errorMessage = error?.response?.data?.message || '';
        if (errorMessage.includes('Patient not found')) {
          toast.error('Patient not found. Please select a different patient.');
        } else {
          toast.info('No medical records found. Export will still work if patient has appointments.', { autoClose: 4000 });
        }
      } else if (error?.response?.status === 401) {
        toast.error('Authentication failed. Please log in again.');
        return;
      } else if (error?.response?.status === 403) {
        toast.error('You do not have permission to view these records.');
        return;
      } else if (error?.response?.status === 400) {
        // Invalid patient ID
        toast.error('Invalid patient ID. Please select a different patient.');
      } else {
        // Network or other errors - still allow export
        toast.info('Could not load medical records preview. Export will still work if patient has appointments.', { autoClose: 4000 });
      }
    }
  };

  const handleExport = async (format: 'pdf' | 'csv') => {
    if (!selectedPatient) {
      toast.error('Please select a patient first.');
      return;
    }

    setIsExporting(true);
    const toastId = toast.info(`Preparing ${format.toUpperCase()} export...`, { autoClose: false });
    
    try {
      console.log(`Exporting ${format} for patient:`, selectedPatient);
      
      // Make sure we have a valid patient ID
      if (!selectedPatient || typeof selectedPatient !== 'string') {
        setIsExporting(false);
        toast.dismiss(toastId);
        toast.error('Invalid patient ID. Please select a patient first.');
        return;
      }
      
      // Use apiService for consistent error handling and authentication
      const response = await apiService.exportPatientRecords(selectedPatient, format);
      
      // Get the blob from response
      const blob = response.data;
      
      console.log('Blob received:', {
        size: blob.size,
        type: blob.type
      });
      
      // Check if blob is empty
      if (blob.size === 0) {
        throw new Error('Received empty file from server. Please try again.');
      }
      
      // Check if blob is actually an error JSON (backend might send JSON errors as blob)
      const contentType = response.headers['content-type'] || response.headers['Content-Type'] || '';
      if (contentType.includes('application/json')) {
        // Clone the blob before reading to avoid consuming it
        const blobClone = blob.slice();
        const text = await blobClone.text();
        try {
          const errorData = JSON.parse(text);
          throw new Error(errorData.message || errorData.error || 'Export failed. Please try again.');
        } catch (parseError) {
          // If parsing fails, it's not JSON, proceed with download
        }
      }

      // Get filename from Content-Disposition header or create default
      const contentDisposition = response.headers['content-disposition'] || response.headers['Content-Disposition'] || '';
      let suggestedName = `patient-records-${selectedPatient}-${new Date().toISOString().split('T')[0]}.${format}`;
      
      if (contentDisposition && contentDisposition.includes('filename=')) {
        const matches = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (matches && matches[1]) {
          suggestedName = matches[1].replace(/['"]/g, '').trim();
          // Decode URI encoding if present
          try {
            suggestedName = decodeURIComponent(suggestedName);
          } catch (e) {
            // If decoding fails, use as is
          }
        }
      }
      
      console.log('Starting download:', {
        size: blob.size,
        type: blob.type,
        filename: suggestedName
      });
      
      // Create download link and trigger download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = suggestedName;
      link.style.display = 'none';
      
      // Set download attribute (critical for forcing download)
      link.setAttribute('download', suggestedName);
      
      // Append to body (required for some browsers)
      document.body.appendChild(link);
      
      console.log('Triggering download:', {
        filename: suggestedName,
        blobSize: blob.size,
        blobType: blob.type
      });
      
      // Trigger click
      link.click();
      
      // Cleanup after ensuring download starts
      setTimeout(() => {
        try {
          if (document.body.contains(link)) {
            document.body.removeChild(link);
          }
          // Don't revoke URL immediately - give browser time to download
          setTimeout(() => {
            window.URL.revokeObjectURL(url);
            console.log('URL revoked after download');
          }, 2000);
        } catch (cleanupError) {
          console.error('Cleanup error:', cleanupError);
        }
      }, 500);
      
      // Reset exporting state after successful export
      setIsExporting(false);
      
      toast.dismiss(toastId);
      toast.success(`${format.toUpperCase()} export completed! File: ${suggestedName}`, {
        autoClose: 4000
      });
    } catch (error: any) {
      console.error('Export failed:', error);
      console.error('Export error details:', {
        message: error?.message,
        name: error?.name,
        response: error?.response?.data,
        status: error?.response?.status
      });
      
      toast.dismiss(toastId);
      
      let errorMessage = 'Export failed. Please try again.';
      
      // Handle Axios errors
      if (error?.response) {
        const contentType = error.response.headers?.['content-type'] || '';
        if (contentType.includes('application/json')) {
          errorMessage = error.response.data?.message || error.response.data?.error || errorMessage;
        } else {
          errorMessage = error.response.statusText || errorMessage;
        }
      } else if (error instanceof Error) {
        // Check if it's a network error
        if (error.message.includes('fetch') || error.message.includes('network') || error.message.includes('Failed to fetch')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Request timeout. Please try again.';
        } else {
          // Use the error message from the thrown error
          errorMessage = error.message;
        }
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      // Reset exporting state
      setIsExporting(false);
      
      toast.error(errorMessage);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString();
  };

  // Get selected patient data
  const selectedPatientData = selectedPatient 
    ? patientRecords.find(p => (p.patientId || p._id) === selectedPatient)
    : null;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center relative">
        <h1 className="text-3xl font-bold text-gray-900">Monitoring & Reports Dashboard</h1>
        <div className="flex items-center space-x-4">
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="input w-auto"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="input w-auto"
          >
            <option value="">All roles</option>
            <option value="patient">Patient</option>
            <option value="doctor">Doctor</option>
            <option value="admin">Admin</option>
          </select>
          <button
            onClick={loadMonitoringData}
            className="btn-outline flex items-center"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
          <label className="flex items-center text-sm text-gray-600">
            <input
              type="checkbox"
              className="mr-2"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Auto refresh
          </label>

          {/* Logout Button */}
          <button
            onClick={logout}
            className="btn-primary bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 flex items-center"
            title="Logout"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </button>

          {/* Quick Actions menu */}
          <div className="relative">
            <button
              onClick={() => setShowQuickMenu((s) => !s)}
              className="btn-primary"
            >
              Quick Actions
            </button>
            {showQuickMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded shadow-lg z-20">
                <div className="py-1 text-sm text-gray-700">
                  <button
                    className="w-full text-left px-4 py-2 hover:bg-gray-50"
                    onClick={() => { setShowQuickMenu(false); loadMonitoringData(); }}
                  >
                    Refresh now
                  </button>
                  <div className="border-t my-1" />
                  <button
                    className="w-full text-left px-4 py-2 hover:bg-gray-50"
                    onClick={() => { setDateFilter('daily'); setShowQuickMenu(false); }}
                  >
                    Set filter: Daily
                  </button>
                  <button
                    className="w-full text-left px-4 py-2 hover:bg-gray-50"
                    onClick={() => { setDateFilter('weekly'); setShowQuickMenu(false); }}
                  >
                    Set filter: Weekly
                  </button>
                  <button
                    className="w-full text-left px-4 py-2 hover:bg-gray-50"
                    onClick={() => { setDateFilter('monthly'); setShowQuickMenu(false); }}
                  >
                    Set filter: Monthly
                  </button>
                  <div className="border-t my-1" />
                  <button
                    className="w-full text-left px-4 py-2 hover:bg-gray-50"
                    onClick={() => { setSelectedTab('overview'); setShowQuickMenu(false); }}
                  >
                    Go to Overview
                  </button>
                  <button
                    className="w-full text-left px-4 py-2 hover:bg-gray-50"
                    onClick={() => { setSelectedTab('login-stats'); setShowQuickMenu(false); }}
                  >
                    Go to Login Statistics
                  </button>
                  <button
                    className="w-full text-left px-4 py-2 hover:bg-gray-50"
                    onClick={() => { setSelectedTab('appointment-stats'); setShowQuickMenu(false); }}
                  >
                    Go to Appointment Statistics
                  </button>
                  <button
                    className="w-full text-left px-4 py-2 hover:bg-gray-50"
                    onClick={() => { setSelectedTab('export-records'); setShowQuickMenu(false); }}
                  >
                    Go to Export Records
                  </button>
                  <div className="border-t my-1" />
                  <button
                    className="w-full text-left px-4 py-2 hover:bg-gray-50"
                    onClick={() => { setAutoRefresh((v) => !v); setShowQuickMenu(false); }}
                  >
                    Toggle Auto refresh
                  </button>
                  <div className="border-t my-1" />
                  <button
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
                    disabled={!selectedPatient || isExporting}
                    onClick={() => { setShowQuickMenu(false); handleExport('csv'); }}
                  >
                    Export CSV (selected patient)
                  </button>
                  <button
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
                    disabled={!selectedPatient || isExporting}
                    onClick={() => { setShowQuickMenu(false); handleExport('pdf'); }}
                  >
                    Export PDF (selected patient)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <p className="text-gray-600 mb-6">
        Welcome, {user?.firstName}! Monitor system activity and export patient records.
      </p>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-4">
        <button
          className={`py-2 px-4 text-sm font-medium ${selectedTab === 'overview' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setSelectedTab('overview')}
        >
          Overview
        </button>
        <button
          className={`py-2 px-4 text-sm font-medium ${selectedTab === 'login-stats' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setSelectedTab('login-stats')}
        >
          Login Statistics
        </button>
        <button
          className={`py-2 px-4 text-sm font-medium ${selectedTab === 'appointment-stats' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setSelectedTab('appointment-stats')}
        >
          Appointment Statistics
        </button>
        <button
          className={`py-2 px-4 text-sm font-medium ${selectedTab === 'export-records' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setSelectedTab('export-records')}
        >
          Export Records
        </button>
      </div>

      {/* Overview Tab */}
      {selectedTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card flex items-center p-4">
            <Users className="h-8 w-8 text-primary-600 mr-4" />
            <div>
              <p className="text-sm text-gray-500">Total Logins ({dateFilter})</p>
              <p className="text-2xl font-semibold text-gray-900">
                {loginStats?.totalLogins || 0}
              </p>
            </div>
          </div>
          <div className="card flex items-center p-4">
            <Calendar className="h-8 w-8 text-success-600 mr-4" />
            <div>
              <p className="text-sm text-gray-500">Total Appointments</p>
              <p className="text-2xl font-semibold text-gray-900">
                {appointmentStats?.totalAppointments || 0}
              </p>
            </div>
          </div>
          <div className="card flex items-center p-4">
            <Users className="h-8 w-8 text-warning-600 mr-4" />
            <div>
              <p className="text-sm text-gray-500">Active Patients</p>
              <p className="text-2xl font-semibold text-gray-900">
                {patientRecords.length}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Login Statistics Tab */}
      {selectedTab === 'login-stats' && (
        <div className="space-y-6">
          {!loginStats ? (
            <div className="card p-8 text-center">
              <p className="text-gray-500">No login statistics available. Please refresh the page.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="card p-4 hover:shadow-lg transition-shadow">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Daily Logins</h3>
                  <p className="text-3xl font-bold text-primary-600">{loginStats.dailyLogins}</p>
                  <p className="text-sm text-gray-500 mt-1">Last 24 hours</p>
                </div>
                <div className="card p-4 hover:shadow-lg transition-shadow">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Weekly Logins</h3>
                  <p className="text-3xl font-bold text-primary-600">{loginStats.weeklyLogins}</p>
                  <p className="text-sm text-gray-500 mt-1">Last 7 days</p>
                </div>
                <div className="card p-4 hover:shadow-lg transition-shadow">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Monthly Logins</h3>
                  <p className="text-3xl font-bold text-primary-600">{loginStats.monthlyLogins}</p>
                  <p className="text-sm text-gray-500 mt-1">Last 30 days</p>
                </div>
                <div className="card p-4 hover:shadow-lg transition-shadow">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Logins</h3>
                  <p className="text-3xl font-bold text-primary-600">{loginStats.totalLogins}</p>
                  <p className="text-sm text-gray-500 mt-1">All time</p>
                </div>
              </div>

              {/* User Statistics Chart */}
              {loginStats.userCountsByRole && (
                <UserCountsChart userCountsByRole={loginStats.userCountsByRole} />
              )}

              {/* Login Activity Chart */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {loginStats.loginsByRole && (
                  <LoginByRoleChart loginsByRole={loginStats.loginsByRole} />
                )}
                
                <div className="card">
                  <div className="card-header">
                    <h3 className="text-lg font-medium text-gray-900">Login Summary</h3>
                    <p className="text-sm text-gray-500 mt-1">Quick overview of login activity</p>
                  </div>
                  <div className="card-body">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                        <span className="text-gray-700 font-medium">Patients</span>
                        <span className="font-bold text-blue-600">{loginStats.loginsByRole.patients}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                        <span className="text-gray-700 font-medium">Doctors</span>
                        <span className="font-bold text-green-600">{loginStats.loginsByRole.doctors}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                        <span className="text-gray-700 font-medium">Admins</span>
                        <span className="font-bold text-purple-600">{loginStats.loginsByRole.admins}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <h3 className="text-lg font-medium text-gray-900">Recent Logins</h3>
                  </div>
                  <div className="card-body">
                    {loginStats.recentLogins.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">No recent login activity</p>
                    ) : (
                      <div className="space-y-3">
                        {loginStats.recentLogins
                          .filter(l => !roleFilter || l.role === roleFilter)
                          .slice(0, 5)
                          .map((login, index) => (
                          <div key={index} className="flex justify-between items-center text-sm p-2 hover:bg-gray-50 rounded">
                            <div>
                              <span className="font-medium">{login.user}</span>
                              <span className={`ml-2 px-2 py-1 rounded text-xs ${
                                login.role === 'patient' ? 'bg-blue-100 text-blue-700' :
                                login.role === 'doctor' ? 'bg-green-100 text-green-700' :
                                'bg-purple-100 text-purple-700'
                              }`}>
                                {login.role}
                              </span>
                            </div>
                            <span className="text-gray-500">{formatTime(login.loginTime)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Appointment Statistics Tab */}
      {selectedTab === 'appointment-stats' && (
        <div className="space-y-6">
          {!appointmentStats ? (
            <div className="card p-8 text-center">
              <p className="text-gray-500">No appointment statistics available. Please refresh the page.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="card p-4 hover:shadow-lg transition-shadow">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Appointments</h3>
                  <p className="text-3xl font-bold text-primary-600">{appointmentStats.totalAppointments}</p>
                  <p className="text-sm text-gray-500 mt-1">All time</p>
                </div>
                <div className="card p-4 hover:shadow-lg transition-shadow">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">This Week</h3>
                  <p className="text-3xl font-bold text-success-600">{appointmentStats.appointmentTrends.thisWeek}</p>
                  <p className="text-sm text-gray-500 mt-1">Last 7 days</p>
                </div>
                <div className="card p-4 hover:shadow-lg transition-shadow">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Last Week</h3>
                  <p className="text-3xl font-bold text-warning-600">{appointmentStats.appointmentTrends.lastWeek}</p>
                  <p className="text-sm text-gray-500 mt-1">Previous 7 days</p>
                </div>
              </div>

              {/* Appointment Trend Charts */}
              <AppointmentTrendsChart 
                appointmentsByDate={appointmentStats.appointmentsByDate}
                appointmentTrends={appointmentStats.appointmentTrends}
              />

              {/* Doctor Appointments Chart */}
              {appointmentStats.appointmentsByDoctor.length > 0 && (
                <DoctorAppointmentsChart appointmentsByDoctor={appointmentStats.appointmentsByDoctor} />
              )}

              {/* Appointments by Doctor Table */}
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-medium text-gray-900">Appointments by Doctor - Detailed View</h3>
                </div>
                <div className="card-body">
                  {appointmentStats.appointmentsByDoctor.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No appointment data available</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Today</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pending</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completed</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {appointmentStats.appointmentsByDoctor
                            .filter(doctor => doctor.doctorName && doctor.doctorName.trim() !== '')
                            .map((doctor) => (
                            <tr key={doctor.doctorId} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {doctor.doctorName || 'Unknown Doctor'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <span className="font-semibold">{doctor.totalAppointments || 0}</span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <span className={doctor.todayAppointments > 0 ? 'text-blue-600 font-semibold' : ''}>
                                  {doctor.todayAppointments || 0}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <span className={doctor.pendingAppointments > 0 ? 'text-orange-600 font-semibold' : ''}>
                                  {doctor.pendingAppointments || 0}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <span className={doctor.completedAppointments > 0 ? 'text-green-600 font-semibold' : ''}>
                                  {doctor.completedAppointments || 0}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Export Records Tab */}
      {selectedTab === 'export-records' && (
        <div className="space-y-6">
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Patient Records List</h3>
              <p className="text-sm text-gray-500 mt-1">Select a patient to view and export their medical records</p>
            </div>
            <div className="card-body">
              {patientRecords.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Patients Found</h3>
                  <p className="text-gray-500">No patient records are available for export at this time.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Full Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Age</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gender</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Appointments</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned Doctor</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Appointment</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {patientRecords.map((patient) => (
                      <tr 
                        key={patient.patientId || patient._id} 
                        onClick={() => handlePatientSelect(patient.patientId || patient._id)}
                        className={`cursor-pointer hover:bg-gray-50 transition-colors ${selectedPatient === (patient.patientId || patient._id) ? 'bg-blue-50' : ''}`}
                        title="Click to view patient records"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {patient.patientId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {patient.fullName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {patient.age}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {patient.gender}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {patient.totalAppointments}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {patient.assignedDoctor || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(patient.lastAppointment)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              )}
            </div>
          </div>

          {selectedPatient && (
            <div className="card border-2 border-blue-200 shadow-lg">
              <div className="card-header flex justify-between items-center bg-blue-50">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <Eye className="h-5 w-5 mr-2 text-blue-600" />
                    Selected Patient - View & Export
                  </h3>
                  {selectedPatientData && (
                    <p className="text-sm font-semibold text-gray-900 mt-1">
                      Patient: {selectedPatientData.fullName}
                    </p>
                  )}
                  <p className="text-sm text-gray-600 mt-1">
                    {exportableRecords.length > 0 
                      ? `✓ ${exportableRecords.length} medical record(s) loaded. Scroll down to view details. Export includes all patient data.`
                      : 'ℹ️ No medical records preview available. Export will include all patient data (appointments and information). Medical records will be included if available.'}
                  </p>
                  <p className="text-xs text-blue-700 mt-1 font-semibold">
                    Patient ID: {selectedPatient}
                  </p>
                </div>
              </div>
              <div className="card-body">
                {exportableRecords.length > 0 ? (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-md font-semibold text-gray-900 flex items-center">
                        <FileText className="h-4 w-4 mr-2 text-blue-600" />
                        Medical Records Preview ({exportableRecords.length} record{exportableRecords.length !== 1 ? 's' : ''})
                      </h4>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleExport('pdf')}
                          disabled={isExporting || !selectedPatient}
                          className="btn-primary btn-sm flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Export as PDF"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          {isExporting ? 'Exporting...' : 'Download PDF'}
                        </button>
                        <button
                          onClick={() => handleExport('csv')}
                          disabled={isExporting || !selectedPatient}
                          className="btn-outline btn-sm flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Export as CSV"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          {isExporting ? 'Exporting...' : 'Download CSV'}
                        </button>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Diagnosis</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prescription</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {exportableRecords.map((record, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {record.date || 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {record.recordType || 'N/A'}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500">
                                {Array.isArray(record.diagnosis) 
                                  ? record.diagnosis.join(', ') 
                                  : (record.diagnosis || 'N/A')}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500">
                                {Array.isArray(record.prescription) 
                                  ? record.prescription.map((med: any) => 
                                      `${med.name || ''} ${med.dosage || ''}`.trim()
                                    ).filter(Boolean).join('; ') || 'N/A'
                                  : (record.prescription || 'N/A')}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {record.doctor || 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  (record.status === 'finalized' || record.status === 'completed') ? 'bg-green-100 text-green-800' :
                                  record.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                                  record.status === 'archived' ? 'bg-gray-100 text-gray-800' :
                                  'bg-blue-100 text-blue-800'
                                }`}>
                                  {record.status || 'N/A'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {/* Download buttons below the table */}
                    <div className="mt-4 pt-4 border-t border-gray-200 flex justify-center space-x-3">
                      <button
                        onClick={() => handleExport('pdf')}
                        disabled={isExporting || !selectedPatient}
                        className="btn-primary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Export as PDF"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        {isExporting ? 'Exporting...' : 'Download PDF'}
                      </button>
                      <button
                        onClick={() => handleExport('csv')}
                        disabled={isExporting || !selectedPatient}
                        className="btn-outline flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Export as CSV"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        {isExporting ? 'Exporting...' : 'Download CSV'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h4 className="text-md font-medium text-gray-900 mb-2">No Medical Records Preview Available</h4>
                    <p className="text-sm text-gray-600 mb-4">
                      Medical records could not be loaded for preview, but the export will still work.
                    </p>
                    <p className="text-xs text-gray-500">
                      The export will include all available patient data including appointments and patient information.
                      Medical records will be included in the export if they exist.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MonitoringDashboard;

