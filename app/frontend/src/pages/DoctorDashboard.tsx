import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import DoctorCharts from '../components/Charts/DoctorCharts';
import { 
  Calendar, 
  Users, 
  FileText, 
  Clock, 
  Plus,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  BarChart3,
  Stethoscope,
  XCircle,
  LogOut
} from 'lucide-react';
import apiService from '../services/api';

interface Appointment {
  _id: string;
  patient: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  appointmentDate: string;
  appointmentTime: string;
  status: string;
  reason: string;
  type: string;
}

interface MedicalRecord {
  _id: string;
  patient: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  diagnosis: string;
  notes: string;
  createdAt: string;
  symptoms: string[];
  prescription: string;
}

interface Availability {
  _id: string;
  date: string;
  startTime?: string;
  endTime?: string;
  isAvailable?: boolean;
  isWorkingDay: boolean;
  workingHours: {
    start: string;
    end: string;
  };
  timeSlots?: Array<{
    startTime: string;
    endTime: string;
    isAvailable: boolean;
    maxPatients: number;
    currentPatients: number;
  }>;
  consultationFee?: number;
  appointmentDuration?: number;
}

const DoctorDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('appointments');

  // Load dashboard data on mount and when tab becomes visible
  useEffect(() => {
    let refreshInterval: NodeJS.Timeout | null = null;
    
    const loadData = async () => {
      try {
        await loadDashboardData();
      } catch (error) {
        console.error('Error in initial data load:', error);
      }
    };
    
    // Load immediately
    loadData();
    
    // Set up periodic refresh every 30 seconds, but only when tab is visible
    const setupRefresh = () => {
      if (document.visibilityState === 'visible') {
        if (refreshInterval) clearInterval(refreshInterval);
        refreshInterval = setInterval(() => {
          // Only refresh if tab is visible
          if (document.visibilityState === 'visible') {
            loadDashboardData().catch(err => {
              console.error('Error in periodic refresh:', err);
            });
          }
        }, 30000);
      }
    };
    
    // Setup refresh when tab becomes visible
    setupRefresh();
    document.addEventListener('visibilitychange', setupRefresh);
    
    // Listen for cross-tab data refresh events
    const handleDataRefresh = (event: CustomEvent) => {
      const refreshType = event.detail?.type;
      // Refresh relevant data based on type
      if (!refreshType || refreshType === 'appointments' || refreshType === 'all') {
        loadAppointments().catch(console.error);
      }
      if (!refreshType || refreshType === 'medical-records' || refreshType === 'all') {
        loadMedicalRecords().catch(console.error);
      }
      if (!refreshType || refreshType === 'all') {
        loadAvailability().catch(console.error);
      }
    };
    
    // Listen for auth sync events (user logged in/out in another tab)
    const handleAuthSync = () => {
      // Refresh data when auth changes in another tab
      loadDashboardData().catch(console.error);
    };
    
    window.addEventListener('data-refresh', handleDataRefresh as EventListener);
    window.addEventListener('auth-sync', handleAuthSync);
    
    return () => {
      if (refreshInterval) clearInterval(refreshInterval);
      document.removeEventListener('visibilitychange', setupRefresh);
      window.removeEventListener('data-refresh', handleDataRefresh as EventListener);
      window.removeEventListener('auth-sync', handleAuthSync);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([
        loadAppointments(),
        loadMedicalRecords(),
        loadAvailability()
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load some dashboard data. Please refresh.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAppointments = async () => {
    try {
      const response = await apiService.getDoctorAppointments();
      const appointments = response.data?.appointments || response.data?.data?.appointments || response.data || [];
      setAppointments(Array.isArray(appointments) ? appointments : []);
    } catch (error) {
      console.error('Error loading appointments:', error);
      setAppointments([]); // Set empty array on error
    }
  };

  const loadMedicalRecords = async () => {
    try {
      const response = await apiService.getDoctorMedicalRecords();
      const records = response.data?.records || response.data?.data?.records || response.data || [];
      setMedicalRecords(Array.isArray(records) ? records : []);
    } catch (error) {
      console.error('Error loading medical records:', error);
      setMedicalRecords([]); // Set empty array on error
    }
  };

  const loadAvailability = async () => {
    try {
      const response = await apiService.getMySchedules();
      const schedules = response.data?.schedules || response.data?.data?.schedules || response.data || [];
      setAvailability(Array.isArray(schedules) ? schedules : []);
    } catch (error) {
      console.error('Error loading availability:', error);
      setAvailability([]); // Set empty array on error
    }
  };

  const [updatingAppointments, setUpdatingAppointments] = useState<Set<string>>(new Set());

  const handleAppointmentStatusUpdate = async (appointmentId: string, status: string) => {
    // Prevent duplicate updates (race condition protection)
    if (updatingAppointments.has(appointmentId)) {
      toast.info('Update already in progress. Please wait...');
      return;
    }

    try {
      setUpdatingAppointments(prev => new Set(prev).add(appointmentId));
      
      // Make the API call
      const response = await apiService.updateAppointmentStatus(appointmentId, { status });
      
      if (response.status === 'success') {
        toast.success(`Appointment ${status} successfully`);
        
        // Optimistic update - update local state immediately
        setAppointments(prev => prev.map(apt => 
          apt._id === appointmentId ? { ...apt, status } : apt
        ));
        
        // Trigger cross-tab refresh
        try {
          localStorage.setItem('data-refresh-trigger', JSON.stringify({
            type: 'appointments',
            timestamp: Date.now()
          }));
          // Clear it immediately (other tabs will catch it via storage event)
          setTimeout(() => localStorage.removeItem('data-refresh-trigger'), 100);
        } catch (e) {
          console.error('Error triggering cross-tab refresh:', e);
        }
        
        // Reload appointments in background to get fresh data
        loadAppointments().catch(err => {
          console.error('Error reloading appointments after update:', err);
          // If reload fails, revert optimistic update and reload from server
          loadDashboardData();
        });
      } else {
        throw new Error(response.message || 'Update failed');
      }
    } catch (error: any) {
      console.error('Error updating appointment status:', error);
      
      // Show detailed error message
      const errorMessage = error?.response?.data?.message || 
                          error?.message || 
                          'Failed to update appointment status. Please try again.';
      toast.error(errorMessage);
      
      // Reload data to ensure UI is in sync with server state
      try {
        await loadDashboardData();
      } catch (reloadError) {
        console.error('Error reloading dashboard after update failure:', reloadError);
        toast.warning('Data may be out of sync. Please refresh the page.');
      }
    } finally {
      setUpdatingAppointments(prev => {
        const newSet = new Set(prev);
        newSet.delete(appointmentId);
        return newSet;
      });
    }
  };

  const handleDeleteMedicalRecord = async (recordId: string) => {
    try {
      await apiService.deleteMedicalRecord(recordId);
      await loadMedicalRecords();
    } catch (error) {
      console.error('Error deleting medical record:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      confirmed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      completed: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
      cancelled: { color: 'bg-red-100 text-red-800', icon: AlertCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string | undefined) => {
    if (!timeString) return 'N/A';
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Stethoscope className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Welcome, Dr. {user?.firstName} {user?.lastName}
                </h1>
                <p className="text-gray-600 mt-1 text-lg">
                  {user?.specialization} - Manage your practice and patients
                </p>
                <div className="mt-4 flex items-center space-x-6 text-sm text-gray-500">
                  <span className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {appointments.length} Appointments
                  </span>
                  <span className="flex items-center">
                    <FileText className="h-4 w-4 mr-1" />
                    {medicalRecords.length} Medical Records
                  </span>
                  <span className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    {new Set(medicalRecords.map(r => r.patient._id)).size} Patients
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center">
              <button
                onClick={logout}
                className="btn-primary bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 flex items-center"
                title="Logout"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'appointments', name: 'Appointments', icon: Calendar },
                { id: 'analytics', name: 'Analytics & Charts', icon: BarChart3 },
                { id: 'records', name: 'Medical Records', icon: FileText },
                { id: 'availability', name: 'My Availability', icon: Clock },
                { id: 'patients', name: 'Patients', icon: Users }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedTab(tab.id)}
                    className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                      selectedTab === tab.id
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-2" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {/* Appointments Tab */}
            {selectedTab === 'appointments' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Upcoming Appointments</h3>
                  <button
                    onClick={loadAppointments}
                    className="bg-gradient-to-r from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 text-blue-700 font-medium py-2 px-4 rounded-lg border border-blue-200 transition-all duration-200 flex items-center"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {appointments.map((appointment) => (
                    <div key={appointment._id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {appointment.patient.firstName} {appointment.patient.lastName}
                          </h4>
                          <p className="text-sm text-gray-600">{appointment.patient.email}</p>
                        </div>
                        {getStatusBadge(appointment.status)}
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="h-4 w-4 mr-2" />
                          {formatDate(appointment.appointmentDate)}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="h-4 w-4 mr-2" />
                          {formatTime(appointment.appointmentTime)}
                        </div>
                        <div className="text-sm text-gray-600">
                          <strong>Reason:</strong> {appointment.reason}
                        </div>
                        <div className="text-sm text-gray-600">
                          <strong>Type:</strong> {appointment.type}
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        {appointment.status === 'pending' && (
                          <button
                            onClick={() => handleAppointmentStatusUpdate(appointment._id, 'confirmed')}
                            disabled={updatingAppointments.has(appointment._id)}
                            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-sm px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {updatingAppointments.has(appointment._id) ? 'Processing...' : 'Confirm'}
                          </button>
                        )}
                        {appointment.status === 'confirmed' && (
                          <button
                            onClick={() => handleAppointmentStatusUpdate(appointment._id, 'completed')}
                            disabled={updatingAppointments.has(appointment._id)}
                            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-sm px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {updatingAppointments.has(appointment._id) ? 'Processing...' : 'Mark Complete'}
                          </button>
                        )}
                        <button className="btn-outline text-sm px-3 py-1">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {appointments.length === 0 && (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments scheduled</h3>
                    <p className="text-gray-600">Your upcoming appointments will appear here.</p>
                  </div>
                )}
              </div>
            )}

            {/* Analytics Tab */}
            {selectedTab === 'analytics' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Analytics & Charts</h3>
                  <button
                    onClick={loadDashboardData}
                    className="btn-outline flex items-center"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Data
                  </button>
                </div>
                <DoctorCharts 
                  appointments={appointments}
                  medicalRecords={medicalRecords}
                  availability={availability}
                />
              </div>
            )}

            {/* Medical Records Tab */}
            {selectedTab === 'records' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Medical Records</h3>
                  <button
                    onClick={() => navigate('/medical-records-management')}
                    className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Add Record
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {medicalRecords.map((record) => (
                    <div key={record._id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {record.patient.firstName} {record.patient.lastName}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {formatDate(record.createdAt)}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => navigate('/medical-records-management')}
                            className="text-primary-600 hover:text-primary-800"
                            title="Edit in Medical Records Management"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteMedicalRecord(record._id)}
                            className="text-red-600 hover:text-red-800"
                            title="Delete record"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <strong>Diagnosis:</strong> {record.diagnosis}
                        </div>
                        <div>
                          <strong>Notes:</strong> {record.notes}
                        </div>
                        {record.symptoms && record.symptoms.length > 0 && (
                          <div>
                            <strong>Symptoms:</strong> {record.symptoms.join(', ')}
                          </div>
                        )}
                        {record.prescription && (
                          <div>
                            <strong>Prescription:</strong> {record.prescription}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {medicalRecords.length === 0 && (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No medical records</h3>
                    <p className="text-gray-600">Start by adding medical records for your patients.</p>
                  </div>
                )}
              </div>
            )}

            {/* Availability Tab */}
            {selectedTab === 'availability' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">My Availability</h3>
                  <button
                    onClick={() => navigate('/availability-management')}
                    className="btn-primary flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Set Availability
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {availability.map((slot) => (
                    <div key={slot._id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {formatDate(slot.date)}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {(slot.isWorkingDay || slot.isAvailable) ? 'Available' : 'Unavailable'}
                          </p>
                        </div>
                        {(slot.isWorkingDay || slot.isAvailable) && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Available
                          </span>
                        )}
                      </div>

                      {(slot.isWorkingDay || slot.isAvailable) && (
                        <div className="space-y-2">
                          <div className="flex items-center text-sm text-gray-600">
                            <Clock className="h-4 w-4 mr-2" />
                            {formatTime(slot.workingHours?.start || slot.startTime)} - {formatTime(slot.workingHours?.end || slot.endTime)}
                          </div>
                        </div>
                      )}

                      <div className="mt-3 flex space-x-2">
                        <button 
                          onClick={() => navigate('/availability-management')}
                          className="btn-outline text-sm px-3 py-1 flex items-center"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {availability.length === 0 && (
                  <div className="text-center py-12">
                    <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No availability set</h3>
                    <p className="text-gray-600">Set your availability to start receiving appointments.</p>
                  </div>
                )}
              </div>
            )}

            {/* Patients Tab */}
            {selectedTab === 'patients' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">My Patients</h3>
                  <button 
                    onClick={() => navigate('/medical-records-management')}
                    className="btn-primary flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Record for Patient
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {Array.from(new Set(medicalRecords.map(r => r.patient._id))).map((patientId) => {
                    const patient = medicalRecords.find(r => r.patient._id === patientId)?.patient;
                    const patientRecords = medicalRecords.filter(r => r.patient._id === patientId);
                    const patientAppointments = appointments.filter(a => a.patient._id === patientId);

                    return (
                      <div key={patientId} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {patient?.firstName} {patient?.lastName}
                            </h4>
                            <p className="text-sm text-gray-600">
                              Patient ID: {patientId}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center text-sm text-gray-600">
                            <FileText className="h-4 w-4 mr-2" />
                            {patientRecords.length} Medical Records
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="h-4 w-4 mr-2" />
                            {patientAppointments.length} Appointments
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          <button 
                            onClick={() => navigate('/medical-records-management')}
                            className="btn-outline text-sm px-3 py-1 flex items-center"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add Record
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {medicalRecords.length === 0 && (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No patients yet</h3>
                    <p className="text-gray-600">Your patients will appear here once you start seeing them.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;