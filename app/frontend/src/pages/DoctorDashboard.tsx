import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
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
  Bell,
  UserPlus,
  BarChart3,
  Stethoscope
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
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

const DoctorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('appointments');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [showAddRecord, setShowAddRecord] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [showAvailabilityForm, setShowAvailabilityForm] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedPatient, setSelectedPatient] = useState<string>('');

  // Load dashboard data
  useEffect(() => {
    loadDashboardData();
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
    } finally {
      setIsLoading(false);
    }
  };

  const loadAppointments = async () => {
    try {
      const response = await apiService.getDoctorAppointments();
      setAppointments(response.data.appointments || []);
    } catch (error) {
      console.error('Error loading appointments:', error);
    }
  };

  const loadMedicalRecords = async () => {
    try {
      const response = await apiService.getDoctorMedicalRecords();
      setMedicalRecords(response.data.records || []);
    } catch (error) {
      console.error('Error loading medical records:', error);
    }
  };

  const loadAvailability = async () => {
    try {
      const response = await apiService.getMySchedules();
      setAvailability(response.data.schedules || []);
    } catch (error) {
      console.error('Error loading availability:', error);
    }
  };

  const handleAppointmentStatusUpdate = async (appointmentId: string, status: string) => {
    try {
      await apiService.updateAppointmentStatus(appointmentId, { status });
      await loadAppointments();
    } catch (error) {
      console.error('Error updating appointment status:', error);
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

  const formatTime = (timeString: string) => {
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
            <div className="flex items-center space-x-3">
              <button
                onClick={loadDashboardData}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <RefreshCw className="h-5 w-5" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600 relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  3
                </span>
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
                            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-sm px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                          >
                            Confirm
                          </button>
                        )}
                        {appointment.status === 'confirmed' && (
                          <button
                            onClick={() => handleAppointmentStatusUpdate(appointment._id, 'completed')}
                            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-sm px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                          >
                            Mark Complete
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
                    onClick={() => setShowAddRecord(true)}
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
                          <button className="text-primary-600 hover:text-primary-800">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteMedicalRecord(record._id)}
                            className="text-red-600 hover:text-red-800"
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
                    onClick={() => setShowAvailabilityForm(true)}
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
                            {slot.isAvailable ? 'Available' : 'Unavailable'}
                          </p>
                        </div>
                        {slot.isAvailable && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Available
                          </span>
                        )}
                      </div>

                      {slot.isAvailable && (
                        <div className="space-y-2">
                          <div className="flex items-center text-sm text-gray-600">
                            <Clock className="h-4 w-4 mr-2" />
                            {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                          </div>
                        </div>
                      )}

                      <div className="mt-3 flex space-x-2">
                        <button className="btn-outline text-sm px-3 py-1">
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
                  <button className="btn-primary flex items-center">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Patient
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
                          <button className="btn-primary text-sm px-3 py-1">
                            <Eye className="h-4 w-4 mr-1" />
                            View Profile
                          </button>
                          <button className="btn-outline text-sm px-3 py-1">
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