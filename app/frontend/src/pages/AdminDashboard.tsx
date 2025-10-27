import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import AdminCharts from '../components/Charts/AdminCharts';
import AdminPerformanceMonitor from '../components/AdminPerformanceMonitor';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Calendar, 
  Clock, 
  Settings,
  TrendingUp,
  Activity,
  AlertCircle,
  CheckCircle,
  XCircle,
  Edit,
  Filter,
  BarChart3,
  Search,
  RefreshCw,
  Bell,
  Database,
  Monitor,
  Trash2,
  Eye,
  MoreVertical,
  Mail,
  Star,
  Shield
} from 'lucide-react';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
  specialization?: string;
  gender?: string;
  createdAt: string;
  yearsOfExperience?: number;
}

interface DoctorRegistration {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  specialization: string;
  licenseNumber: string;
  yearsOfExperience: number;
  status: string;
  createdAt: string;
}

interface Appointment {
  _id: string;
  patient: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  doctor: {
    _id: string;
    firstName: string;
    lastName: string;
    specialization: string;
  };
  appointmentDate: string;
  appointmentTime: string;
  status: string;
  reason: string;
  type: string;
  notes?: string;
}

interface AvailabilityChange {
  _id: string;
  doctor: {
    firstName: string;
    lastName: string;
  };
  date: string;
  time: string;
  changeTime: string;
  status: string;
}

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDoctors: 0,
    totalPatients: 0,
    pendingRegistrations: 0,
    totalAppointments: 0,
    pendingChanges: 0
  });

  // Data states
  const [users, setUsers] = useState<User[]>([]);
  const [pendingRegistrations, setPendingRegistrations] = useState<DoctorRegistration[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [availabilityChanges, setAvailabilityChanges] = useState<AvailabilityChange[]>([]);

  // Filter states
  const [userFilter, setUserFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<User | null>(null);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const startTime = Date.now();
      
      // Use admin API endpoints for better performance
      const [statsResponse, usersResponse, registrationsResponse, appointmentsResponse] = await Promise.all([
        apiService.getAdminStats(),
        apiService.getAdminUsers({ limit: 100 }),
        apiService.getPendingDoctorRegistrations(),
        apiService.getAdminAppointments({ limit: 50 })
      ]);

      // Update state with admin API data
      setStats(statsResponse.data.data);
      setUsers(usersResponse.data.data.users);
      setPendingRegistrations(registrationsResponse.data.data.registrations);
      setAppointments(appointmentsResponse.data.data.appointments);

      const loadTime = Date.now() - startTime;
      console.log(`Dashboard loaded in ${loadTime}ms`);
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Fallback to original methods if admin API fails
      await Promise.all([
        loadStats(),
        loadUsers(),
        loadPendingRegistrations(),
        loadAppointments(),
        loadAvailabilityChanges()
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await apiService.getAdminStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await apiService.getAdminUsers();
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadPendingRegistrations = async () => {
    try {
      const response = await apiService.getPendingDoctorRegistrations();
      setPendingRegistrations(response.data.registrations || []);
    } catch (error) {
      console.error('Error loading pending registrations:', error);
    }
  };

  const loadAppointments = async () => {
    try {
      const response = await apiService.getAdminAppointments();
      setAppointments(response.data.appointments || []);
    } catch (error) {
      console.error('Error loading appointments:', error);
    }
  };

  const loadAvailabilityChanges = async () => {
    try {
      const response = await apiService.getPendingAvailabilityChanges();
      setAvailabilityChanges(response.data.changes || []);
    } catch (error) {
      console.error('Error loading availability changes:', error);
    }
  };

  const handleApproveDoctor = async (doctorId: string) => {
    try {
      await apiService.approveDoctorRegistration(doctorId);
      await loadPendingRegistrations();
      await loadStats();
    } catch (error) {
      console.error('Error approving doctor:', error);
    }
  };

  const handleRejectDoctor = async (doctorId: string) => {
    try {
      await apiService.rejectDoctorRegistration(doctorId);
      await loadPendingRegistrations();
      await loadStats();
    } catch (error) {
      console.error('Error rejecting doctor:', error);
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      await apiService.updateUserStatus(userId, !currentStatus);
      await loadUsers();
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  const handleApproveAvailabilityChange = async (changeId: string) => {
    try {
      await apiService.approveAvailabilityChange(changeId);
      await loadAvailabilityChanges();
    } catch (error) {
      console.error('Error approving availability change:', error);
    }
  };

  const handleRejectAvailabilityChange = async (changeId: string) => {
    try {
      await apiService.rejectAvailabilityChange(changeId);
      await loadAvailabilityChanges();
    } catch (error) {
      console.error('Error rejecting availability change:', error);
    }
  };

  const handleDeleteDoctor = async (doctorId: string) => {
    try {
      await apiService.deleteUser(doctorId);
      await loadDashboardData(); // Reload all data for consistency
      setShowDeleteModal(false);
      setSelectedDoctor(null);
    } catch (error) {
      console.error('Error deleting doctor:', error);
    }
  };

  // Real-time appointment status update
  const handleAppointmentStatusUpdate = async (appointmentId: string, newStatus: string, notes?: string) => {
    try {
      await apiService.updateAppointmentStatusAdmin(appointmentId, {
        status: newStatus,
        notes: notes || ''
      });
      
      // Update local state immediately for real-time feel
      setAppointments(prev => 
        prev.map(apt => 
          apt._id === appointmentId 
            ? { ...apt, status: newStatus, notes: notes || apt.notes }
            : apt
        )
      );
      
      console.log(`Appointment ${appointmentId} status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating appointment status:', error);
    }
  };

  const handleViewAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowAppointmentModal(true);
  };

  const confirmDeleteDoctor = (doctor: User) => {
    setSelectedDoctor(doctor);
    setShowDeleteModal(true);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      inactive: { color: 'bg-red-100 text-red-800', icon: XCircle },
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
      approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircle }
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

  const filteredUsers = users.filter(user => {
    const matchesRole = userFilter === 'all' || user.role === userFilter;
    const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? user.isActive : !user.isActive);
    const matchesSearch = searchQuery === '' || 
      user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesRole && matchesStatus && matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome, Admin {user?.firstName} {user?.lastName}
            </h1>
            <p className="text-gray-600 mt-1">
              Manage users, approve registrations, and oversee system operations
            </p>
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
                {stats.pendingRegistrations + stats.pendingChanges}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <UserCheck className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Doctors</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalDoctors}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Patients</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalPatients}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertCircle className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingRegistrations}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Calendar className="h-6 w-6 text-indigo-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Appointments</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalAppointments}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <Clock className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Changes</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingChanges}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', name: 'Overview', icon: TrendingUp },
              { id: 'analytics', name: 'Analytics & Charts', icon: BarChart3 },
              { id: 'users', name: 'User Management', icon: Users },
              { id: 'registrations', name: 'Doctor Registrations', icon: UserCheck },
              { id: 'appointments', name: 'Appointments', icon: Calendar },
              { id: 'availability', name: 'Availability Changes', icon: Clock },
              { id: 'settings', name: 'System Settings', icon: Settings }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
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
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
              <h3 className="text-lg font-medium text-gray-900">System Overview</h3>
                  <p className="text-sm text-gray-600 mt-1">Welcome back! Here's what's happening in your system.</p>
                </div>
                <button
                  onClick={loadDashboardData}
                  className="btn-outline flex items-center"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Data
                </button>
              </div>

              {/* Quick Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
                  <div className="flex items-center justify-between">
                        <div>
                      <p className="text-blue-100 text-sm">Total Users</p>
                      <p className="text-3xl font-bold">{stats.totalUsers}</p>
                        </div>
                    <div className="bg-blue-400 p-3 rounded-lg">
                      <Users className="w-6 h-6" />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm">Total Doctors</p>
                      <p className="text-3xl font-bold">{stats.totalDoctors}</p>
                    </div>
                    <div className="bg-green-400 p-3 rounded-lg">
                      <UserCheck className="w-6 h-6" />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm">Total Appointments</p>
                      <p className="text-3xl font-bold">{stats.totalAppointments}</p>
                    </div>
                    <div className="bg-purple-400 p-3 rounded-lg">
                      <Calendar className="w-6 h-6" />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-xl shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100 text-sm">Pending Approvals</p>
                      <p className="text-3xl font-bold">{stats.pendingRegistrations}</p>
                    </div>
                    <div className="bg-orange-400 p-3 rounded-lg">
                      <Clock className="w-6 h-6" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                    User Growth Trend
                  </h4>
                  <div className="h-64 flex items-center justify-center">
                    <div className="w-full">
                      {/* Simple Bar Chart */}
                      <div className="flex items-end justify-between h-48 space-x-2">
                        <div className="flex flex-col items-center">
                          <div className="bg-blue-500 w-12 rounded-t" style={{ height: '80%' }}></div>
                          <span className="text-xs text-gray-600 mt-2">Users</span>
                          <span className="text-sm font-semibold">{stats.totalUsers}</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <div className="bg-green-500 w-12 rounded-t" style={{ height: '60%' }}></div>
                          <span className="text-xs text-gray-600 mt-2">Doctors</span>
                          <span className="text-sm font-semibold">{stats.totalDoctors}</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <div className="bg-purple-500 w-12 rounded-t" style={{ height: '70%' }}></div>
                          <span className="text-xs text-gray-600 mt-2">Patients</span>
                          <span className="text-sm font-semibold">{stats.totalPatients}</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <div className="bg-orange-500 w-12 rounded-t" style={{ height: '90%' }}></div>
                          <span className="text-xs text-gray-600 mt-2">Appointments</span>
                          <span className="text-sm font-semibold">{stats.totalAppointments}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                    System Performance
                  </h4>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Server Uptime</span>
                      <div className="flex items-center">
                        <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                          <div className="bg-green-500 h-2 rounded-full" style={{ width: '99.9%' }}></div>
                        </div>
                        <span className="text-green-600 font-semibold">99.9%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Database Health</span>
                      <div className="flex items-center">
                        <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                          <div className="bg-blue-500 h-2 rounded-full" style={{ width: '95%' }}></div>
                        </div>
                        <span className="text-blue-600 font-semibold">95%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">API Response</span>
                      <div className="flex items-center">
                        <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                          <div className="bg-purple-500 h-2 rounded-full" style={{ width: '98%' }}></div>
                        </div>
                        <span className="text-purple-600 font-semibold">98%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Active Sessions</span>
                      <div className="flex items-center">
                        <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                          <div className="bg-orange-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                        </div>
                        <span className="text-orange-600 font-semibold">75%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* System Health Monitoring */}
              <AdminPerformanceMonitor />

              {/* Additional Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-purple-600" />
                    Appointment Trends
                  </h4>
                  <div className="h-64 flex items-center justify-center">
                    <div className="w-full">
                      {/* Line Chart Representation */}
                      <div className="flex items-end justify-between h-48 space-x-1">
                        {[65, 72, 58, 85, 92, 78, 88].map((height, index) => (
                          <div key={index} className="flex flex-col items-center">
                            <div 
                              className="bg-purple-500 w-8 rounded-t transition-all duration-300 hover:bg-purple-600" 
                              style={{ height: `${height}%` }}
                            ></div>
                            <span className="text-xs text-gray-500 mt-2">
                              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index]}
                            </span>
                      </div>
                    ))}
                      </div>
                      <div className="mt-4 text-center">
                        <span className="text-sm text-gray-600">Weekly Appointment Trends</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <Users className="h-5 w-5 mr-2 text-indigo-600" />
                    User Distribution
                  </h4>
                  <div className="h-64 flex items-center justify-center">
                    <div className="w-full">
                      {/* Pie Chart Representation */}
                      <div className="flex items-center justify-center h-48">
                        <div className="relative w-32 h-32">
                          <div className="absolute inset-0 rounded-full border-8 border-blue-500" style={{ clipPath: 'polygon(50% 50%, 50% 0%, 100% 0%, 100% 50%)' }}></div>
                          <div className="absolute inset-0 rounded-full border-8 border-green-500" style={{ clipPath: 'polygon(50% 50%, 100% 50%, 100% 100%, 50% 100%)' }}></div>
                          <div className="absolute inset-0 rounded-full border-8 border-purple-500" style={{ clipPath: 'polygon(50% 50%, 50% 100%, 0% 100%, 0% 50%)' }}></div>
                          <div className="absolute inset-0 rounded-full border-8 border-orange-500" style={{ clipPath: 'polygon(50% 50%, 0% 50%, 0% 0%, 50% 0%)' }}></div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-4">
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
                          <span className="text-xs text-gray-600">Patients: {stats.totalPatients}</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
                          <span className="text-xs text-gray-600">Doctors: {stats.totalDoctors}</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-purple-500 rounded mr-2"></div>
                          <span className="text-xs text-gray-600">Admins: 1</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-orange-500 rounded mr-2"></div>
                          <span className="text-xs text-gray-600">Others: 0</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Doctor Registrations */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-900 flex items-center">
                      <UserCheck className="h-5 w-5 mr-2 text-blue-600" />
                      Doctor Registrations
                    </h4>
                    <span className="text-sm text-gray-500 bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      {pendingRegistrations.length} pending
                    </span>
                  </div>
                  <div className="space-y-3">
                    {pendingRegistrations.slice(0, 3).map((registration) => (
                      <div key={registration._id} className="group p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{registration.firstName} {registration.lastName}</p>
                            <p className="text-sm text-gray-600 flex items-center mt-1">
                              <Shield className="h-3 w-3 mr-1" />
                              {registration.specialization}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Applied: {new Date(registration.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex space-x-2 ml-3">
                            <button
                              onClick={() => handleApproveDoctor(registration._id)}
                              className="p-1 text-green-600 hover:bg-green-100 rounded"
                              title="Approve"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleRejectDoctor(registration._id)}
                              className="p-1 text-red-600 hover:bg-red-100 rounded"
                              title="Reject"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {pendingRegistrations.length === 0 && (
                      <div className="text-center py-6">
                        <UserCheck className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm">No pending registrations</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Recent Appointments */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-900 flex items-center">
                      <Calendar className="h-5 w-5 mr-2 text-green-600" />
                      Recent Appointments
                    </h4>
                    <span className="text-sm text-gray-500 bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      {appointments.length} total
                    </span>
                  </div>
                  <div className="space-y-3">
                    {appointments.slice(0, 3).map((appointment) => (
                      <div key={appointment._id} className="group p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{appointment.patient.firstName} {appointment.patient.lastName}</p>
                            <p className="text-sm text-gray-600 flex items-center mt-1">
                              <Calendar className="h-3 w-3 mr-1" />
                              with Dr. {appointment.doctor.firstName} {appointment.doctor.lastName}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(appointment.appointmentDate).toLocaleDateString()} at {appointment.appointmentTime}
                            </p>
                        </div>
                            <div className="flex items-center space-x-2 ml-3">
                        {getStatusBadge(appointment.status)}
                              <select
                                value={appointment.status}
                                onChange={(e) => handleAppointmentStatusUpdate(appointment._id, e.target.value)}
                                className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              >
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                                <option value="no-show">No Show</option>
                              </select>
                              <button
                                onClick={() => handleViewAppointment(appointment)}
                                className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                            </div>
                        </div>
                      </div>
                    ))}
                    {appointments.length === 0 && (
                      <div className="text-center py-6">
                        <Calendar className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm">No recent appointments</p>
                  </div>
                    )}
                  </div>
                </div>

                {/* Active Doctors */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-900 flex items-center">
                      <Users className="h-5 w-5 mr-2 text-purple-600" />
                      Active Doctors
                    </h4>
                    <span className="text-sm text-gray-500 bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                      {users.filter(u => u.role === 'doctor' && u.isActive).length} active
                    </span>
                  </div>
                  <div className="space-y-3">
                    {users.filter(u => u.role === 'doctor' && u.isActive).slice(0, 3).map((doctor) => (
                      <div key={doctor._id} className="group p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">Dr. {doctor.firstName} {doctor.lastName}</p>
                            <p className="text-sm text-gray-600 flex items-center mt-1">
                              <Star className="h-3 w-3 mr-1" />
                              {doctor.specialization || 'General Practice'}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {(doctor as any).yearsOfExperience || 0} years experience
                            </p>
                          </div>
                          <div className="flex space-x-2 ml-3">
                            <button
                              onClick={() => confirmDeleteDoctor(doctor)}
                              className="p-1 text-red-600 hover:bg-red-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Remove Doctor"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                            <button
                              className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                              title="More Options"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {users.filter(u => u.role === 'doctor' && u.isActive).length === 0 && (
                      <div className="text-center py-6">
                        <Users className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm">No active doctors</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                <h3 className="text-lg font-medium text-gray-900">Analytics & Charts</h3>
                  <p className="text-sm text-gray-600 mt-1">Visual insights into system performance and user activity</p>
                </div>
                <div className="flex items-center space-x-3">
                  <select
                    value={selectedTimeRange}
                    onChange={(e) => setSelectedTimeRange(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="24h">Last 24 Hours</option>
                    <option value="7d">Last 7 Days</option>
                    <option value="30d">Last 30 Days</option>
                    <option value="90d">Last 90 Days</option>
                  </select>
                <button
                  onClick={loadDashboardData}
                  className="btn-outline flex items-center"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Data
                </button>
              </div>
              </div>

              {/* Enhanced Analytics with Dashboard Data */}
              <AdminCharts 
                loginStats={stats}
                appointmentStats={{ appointmentsByDoctor: appointments }}
                userStats={users}
              />

              {/* Real-time System Status */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Activity className="h-5 w-5 mr-2 text-green-600" />
                    Real-time System Status
                  </h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Server Status</span>
                      <span className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        <span className="text-green-600 font-semibold">Online</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Database</span>
                      <span className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        <span className="text-green-600 font-semibold">Connected</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">API Response</span>
                      <span className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        <span className="text-green-600 font-semibold">Healthy</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Active Users</span>
                      <span className="flex items-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                        <span className="text-blue-600 font-semibold">{users.filter(u => u.isActive).length}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Bell className="h-5 w-5 mr-2 text-orange-600" />
                    Recent Activity
                  </h4>
                  <div className="space-y-3">
                    {pendingRegistrations.slice(0, 3).map((registration, index) => (
                      <div key={registration._id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-sm">New Doctor Registration</p>
                          <p className="text-xs text-gray-600">{registration.firstName} {registration.lastName}</p>
                        </div>
                        <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
                          Pending
                        </span>
                      </div>
                    ))}
                    {appointments.slice(0, 2).map((appointment, index) => (
                      <div key={appointment._id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-sm">New Appointment</p>
                          <p className="text-xs text-gray-600">
                            {appointment.patient.firstName} with Dr. {appointment.doctor.firstName}
                          </p>
                        </div>
                        <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                          {appointment.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Additional Analytics Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Database className="h-5 w-5 mr-2 text-blue-600" />
                    System Performance
                  </h4>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">CPU Usage</span>
                      <span className="font-semibold text-green-600">45%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Memory Usage</span>
                      <span className="font-semibold text-blue-600">62%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Disk Usage</span>
                      <span className="font-semibold text-yellow-600">38%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Network I/O</span>
                      <span className="font-semibold text-purple-600">12 MB/s</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Activity className="h-5 w-5 mr-2 text-green-600" />
                    User Activity
                  </h4>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Active Sessions</span>
                      <span className="font-semibold text-green-600">{users.filter(u => u.isActive).length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">New Users Today</span>
                      <span className="font-semibold text-blue-600">3</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Login Attempts</span>
                      <span className="font-semibold text-purple-600">127</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Failed Logins</span>
                      <span className="font-semibold text-red-600">8</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Monitor className="h-5 w-5 mr-2 text-purple-600" />
                    App Health
                  </h4>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">API Response Time</span>
                      <span className="font-semibold text-green-600">150ms</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Error Rate</span>
                      <span className="font-semibold text-green-600">0.1%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Database Health</span>
                      <span className="font-semibold text-green-600">Healthy</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Cache Hit Rate</span>
                      <span className="font-semibold text-blue-600">94%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* User Management Tab */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">User Management</h3>
                <button
                  onClick={loadUsers}
                  className="btn-outline flex items-center"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </button>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="input pl-10"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-gray-400" />
                  <select
                    value={userFilter}
                    onChange={(e) => setUserFilter(e.target.value)}
                    className="input"
                  >
                    <option value="all">All Users</option>
                    <option value="doctor">Doctors</option>
                    <option value="patient">Patients</option>
                    <option value="admin">Admins</option>
                  </select>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="input"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Users Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Specialty/Gender</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map((user) => (
                      <tr key={user._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.specialization || user.gender || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(user.isActive ? 'active' : 'inactive')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button className="text-primary-600 hover:text-primary-900">
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleToggleUserStatus(user._id, user.isActive)}
                              className={user.isActive ? "text-red-600 hover:text-red-900" : "text-green-600 hover:text-green-900"}
                            >
                              {user.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Doctor Registrations Tab */}
          {activeTab === 'registrations' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Doctor Registration Requests</h3>
                <button
                  onClick={loadPendingRegistrations}
                  className="btn-outline flex items-center"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Specialty</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Experience</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pendingRegistrations.map((registration) => (
                      <tr key={registration._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{registration.firstName} {registration.lastName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{registration.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{registration.specialization}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{registration.yearsOfExperience} years</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(registration.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleApproveDoctor(registration._id)}
                              className="text-green-600 hover:text-green-900"
                              disabled={registration.status !== 'pending'}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleRejectDoctor(registration._id)}
                              className="text-red-600 hover:text-red-900"
                              disabled={registration.status !== 'pending'}
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Appointments Tab */}
          {activeTab === 'appointments' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Appointment Management</h3>
                <button
                  onClick={loadAppointments}
                  className="btn-outline flex items-center"
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
                        <p className="text-sm text-gray-600">with Dr. {appointment.doctor.firstName} {appointment.doctor.lastName}</p>
                      </div>
                      {getStatusBadge(appointment.status)}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        {new Date(appointment.appointmentDate).toLocaleDateString()}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="h-4 w-4 mr-2" />
                        {appointment.appointmentTime}
                      </div>
                      <div className="text-sm text-gray-600">
                        <strong>Reason:</strong> {appointment.reason}
                      </div>
                      <div className="text-sm text-gray-600">
                        <strong>Type:</strong> {appointment.type}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Availability Changes Tab */}
          {activeTab === 'availability' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Pending Availability Changes</h3>
                <button
                  onClick={loadAvailabilityChanges}
                  className="btn-outline flex items-center"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">New Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {availabilityChanges.map((change) => (
                      <tr key={change._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            Dr. {change.doctor.firstName} {change.doctor.lastName}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(change.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{change.time}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{change.changeTime}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(change.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleApproveAvailabilityChange(change._id)}
                              className="text-green-600 hover:text-green-900"
                              disabled={change.status !== 'pending'}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleRejectAvailabilityChange(change._id)}
                              className="text-red-600 hover:text-red-900"
                              disabled={change.status !== 'pending'}
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* System Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">System Settings</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">System Information</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Version:</strong> 1.0.0</p>
                    <p><strong>Database:</strong> MongoDB</p>
                    <p><strong>Environment:</strong> Development</p>
                    <p><strong>Last Backup:</strong> {new Date().toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Quick Actions</h4>
                  <div className="space-y-2">
                    <button className="btn-outline w-full text-left">Export User Data</button>
                    <button className="btn-outline w-full text-left">System Backup</button>
                    <button className="btn-outline w-full text-left">Clear Cache</button>
                    <button className="btn-outline w-full text-left">View Logs</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Doctor Confirmation Modal */}
      {showDeleteModal && selectedDoctor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Remove Doctor</h3>
                  <p className="text-sm text-gray-600">This action cannot be undone</p>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-700">
                  Are you sure you want to remove <strong>Dr. {selectedDoctor.firstName} {selectedDoctor.lastName}</strong> from the system?
                </p>
                <p className="text-sm text-red-600 mt-2">
                  This will also remove all their appointments and medical records.
                </p>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteDoctor(selectedDoctor._id)}
                  className="flex-1 px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Remove Doctor
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Appointment Details Modal */}
      {showAppointmentModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Appointment Details</h3>
                <button
                  onClick={() => setShowAppointmentModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Patient Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    Patient Information
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <span className="font-medium text-gray-600 w-20">Name:</span>
                      <span>{selectedAppointment.patient.firstName} {selectedAppointment.patient.lastName}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Mail className="h-3 w-3 mr-1 text-gray-400" />
                      <span className="text-gray-600">{selectedAppointment.patient.email}</span>
                    </div>
                  </div>
                </div>

                {/* Doctor Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <UserCheck className="h-4 w-4 mr-2" />
                    Doctor Information
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <span className="font-medium text-gray-600 w-20">Name:</span>
                      <span>Dr. {selectedAppointment.doctor.firstName} {selectedAppointment.doctor.lastName}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Shield className="h-3 w-3 mr-1 text-gray-400" />
                      <span className="text-gray-600">{selectedAppointment.doctor.specialization}</span>
                    </div>
                  </div>
                </div>

                {/* Appointment Details */}
                <div className="bg-gray-50 rounded-lg p-4 md:col-span-2">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Appointment Details
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center text-sm">
                      <Calendar className="h-3 w-3 mr-1 text-gray-400" />
                      <span className="font-medium text-gray-600 mr-2">Date:</span>
                      <span>{new Date(selectedAppointment.appointmentDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Clock className="h-3 w-3 mr-1 text-gray-400" />
                      <span className="font-medium text-gray-600 mr-2">Time:</span>
                      <span>{selectedAppointment.appointmentTime}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <span className="font-medium text-gray-600 mr-2">Type:</span>
                      <span>{selectedAppointment.type}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <span className="font-medium text-gray-600 mr-2">Status:</span>
                      {getStatusBadge(selectedAppointment.status)}
                    </div>
                  </div>
                  
                  {selectedAppointment.reason && (
                    <div className="mt-4">
                      <span className="font-medium text-gray-600 text-sm">Reason:</span>
                      <p className="text-sm text-gray-700 mt-1">{selectedAppointment.reason}</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowAppointmentModal(false)}
                  className="px-6 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
