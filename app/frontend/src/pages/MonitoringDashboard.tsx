import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import apiService from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  Users,
  Calendar,
  Download,
  RefreshCw,
  Eye,
  UserCheck
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
  diagnosis: string;
  prescription: string;
  comments: string;
  doctor: string;
}

const MonitoringDashboard: React.FC = () => {
  const { user } = useAuth();
  const [loginStats, setLoginStats] = useState<LoginStats | null>(null);
  const [appointmentStats, setAppointmentStats] = useState<AppointmentStats | null>(null);
  const [patientRecords, setPatientRecords] = useState<PatientRecord[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<string>('');
  const [exportableRecords, setExportableRecords] = useState<ExportableRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [dateFilter, setDateFilter] = useState('daily');
  const [isExporting, setIsExporting] = useState(false);
  const [systemAnalytics, setSystemAnalytics] = useState<any>(null);
  // const [customReport, setCustomReport] = useState<any>(null);
  // const [reportType, setReportType] = useState('user-activity');
  // const [reportStartDate, setReportStartDate] = useState('');
  // const [reportEndDate, setReportEndDate] = useState('');

  useEffect(() => {
    loadMonitoringData();
  }, [dateFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMonitoringData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [loginStatsRes, appointmentStatsRes, patientRecordsRes, analyticsRes] = await Promise.all([
        apiService.getMonitoringLoginStats(dateFilter),
        apiService.getMonitoringAppointmentStats(dateFilter),
        apiService.getPatientRecordsForExport(),
        apiService.getSystemAnalytics('30d')
      ]);

      if (loginStatsRes.status === 'success') {
        setLoginStats(loginStatsRes.data);
      }
      if (appointmentStatsRes.status === 'success') {
        setAppointmentStats(appointmentStatsRes.data);
      }
      if (patientRecordsRes.status === 'success') {
        setPatientRecords(patientRecordsRes.data.patients);
      }
      if (analyticsRes.status === 'success') {
        setSystemAnalytics(analyticsRes.data);
      }
    } catch (error) {
      console.error('Failed to load monitoring data:', error);
      toast.error('Failed to load monitoring data.');
    } finally {
      setIsLoading(false);
    }
  }, [dateFilter]);

  const handlePatientSelect = async (patientId: string) => {
    setSelectedPatient(patientId);
    try {
      const response = await apiService.getPatientExportableRecords(patientId);
      if (response.status === 'success') {
        setExportableRecords(response.data.records);
      }
    } catch (error) {
      console.error('Failed to load patient records:', error);
      toast.error('Failed to load patient records.');
    }
  };

  const handleExport = async (format: 'pdf' | 'csv') => {
    if (!selectedPatient) {
      toast.error('Please select a patient first.');
      return;
    }

    setIsExporting(true);
    try {
      const response = await apiService.exportPatientRecords(selectedPatient, format);
      if (response.status === 'success') {
        // Create download link
        const blob = new Blob([response.data], { 
          type: format === 'pdf' ? 'application/pdf' : 'text/csv' 
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `patient-records-${selectedPatient}-${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast.success(`${format.toUpperCase()} export completed successfully!`);
      }
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
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
          <button
            onClick={loadMonitoringData}
            className="btn-outline flex items-center"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
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
            <UserCheck className="h-8 w-8 text-primary-600 mr-4" />
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
      {selectedTab === 'login-stats' && loginStats && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="card p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Daily Logins</h3>
              <p className="text-3xl font-bold text-primary-600">{loginStats.dailyLogins}</p>
            </div>
            <div className="card p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Weekly Logins</h3>
              <p className="text-3xl font-bold text-primary-600">{loginStats.weeklyLogins}</p>
            </div>
            <div className="card p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Monthly Logins</h3>
              <p className="text-3xl font-bold text-primary-600">{loginStats.monthlyLogins}</p>
            </div>
            <div className="card p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Logins</h3>
              <p className="text-3xl font-bold text-primary-600">{loginStats.totalLogins}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900">Logins by Role</h3>
              </div>
              <div className="card-body">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Patients</span>
                    <span className="font-semibold">{loginStats.loginsByRole.patients}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Doctors</span>
                    <span className="font-semibold">{loginStats.loginsByRole.doctors}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Admins</span>
                    <span className="font-semibold">{loginStats.loginsByRole.admins}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900">Recent Logins</h3>
              </div>
              <div className="card-body">
                <div className="space-y-3">
                  {loginStats.recentLogins.slice(0, 5).map((login, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <div>
                        <span className="font-medium">{login.user}</span>
                        <span className="text-gray-500 ml-2">({login.role})</span>
                      </div>
                      <span className="text-gray-500">{formatTime(login.loginTime)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Appointment Statistics Tab */}
      {selectedTab === 'appointment-stats' && appointmentStats && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Appointments</h3>
              <p className="text-3xl font-bold text-primary-600">{appointmentStats.totalAppointments}</p>
            </div>
            <div className="card p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">This Week</h3>
              <p className="text-3xl font-bold text-success-600">{appointmentStats.appointmentTrends.thisWeek}</p>
            </div>
            <div className="card p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Last Week</h3>
              <p className="text-3xl font-bold text-warning-600">{appointmentStats.appointmentTrends.lastWeek}</p>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Appointments by Doctor</h3>
            </div>
            <div className="card-body">
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
                      <tr key={doctor.doctorId}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {doctor.doctorName || 'Unknown Doctor'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {doctor.totalAppointments || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {doctor.todayAppointments || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {doctor.pendingAppointments || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {doctor.completedAppointments || 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export Records Tab */}
      {selectedTab === 'export-records' && (
        <div className="space-y-6">
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Patient Records List</h3>
            </div>
            <div className="card-body">
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {patientRecords.map((patient) => (
                      <tr key={patient._id}>
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
                          {patient.assignedDoctor}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(patient.lastAppointment)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handlePatientSelect(patient.patientId)}
                            className="btn-outline btn-sm mr-2"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {selectedPatient && exportableRecords.length > 0 && (
            <div className="card">
              <div className="card-header flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Exportable Records</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleExport('pdf')}
                    disabled={isExporting}
                    className="btn-primary btn-sm flex items-center"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Export PDF
                  </button>
                  <button
                    onClick={() => handleExport('csv')}
                    disabled={isExporting}
                    className="btn-outline btn-sm flex items-center"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Export CSV
                  </button>
                </div>
              </div>
              <div className="card-body">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Diagnosis</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prescription</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comments</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {exportableRecords.map((record, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {record.patientId}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(record.date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {record.diagnosis}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {record.prescription}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {record.comments}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {record.doctor}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MonitoringDashboard;

