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
  Filter,
  BarChart3,
  Search,
  RefreshCw,
  Database,
  Monitor,
  Trash2,
  Eye,
  MoreVertical,
  Mail,
  Star,
  Shield,
  UserPlus,
  LogOut,
  Edit,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
  specialization?: string;
  gender?: string;
  phoneNumber?: string;
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
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'users' | 'registrations' | 'appointments' | 'availability' | 'settings'>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(false); // Separate flag to prevent concurrent requests
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
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editFormData, setEditFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    gender: '',
    specialization: ''
  });

  useEffect(() => {
    // Load data immediately on mount
    loadDashboardData();
    
    // Set up periodic refresh every 30 seconds to prevent stale data
    // Use a longer interval to prevent lag when multiple tabs are open
    const refreshInterval = setInterval(() => {
      // Only refresh if tab is visible to prevent unnecessary requests
      if (!document.hidden) {
        loadDashboardData();
      }
    }, 30000);
    
    // Also listen for visibility changes to refresh when tab becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadDashboardData();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Listen for cross-tab data refresh events
    const handleDataRefresh = (event: CustomEvent) => {
      const refreshType = event.detail?.type;
      // Refresh all data on cross-tab updates
      loadDashboardData().catch(console.error);
    };
    
    // Listen for auth sync events
    const handleAuthSync = () => {
      loadDashboardData().catch(console.error);
    };
    
    window.addEventListener('data-refresh', handleDataRefresh as EventListener);
    window.addEventListener('auth-sync', handleAuthSync);
    
    return () => {
      clearInterval(refreshInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('data-refresh', handleDataRefresh as EventListener);
      window.removeEventListener('auth-sync', handleAuthSync);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadDashboardData = async () => {
    // Prevent concurrent requests - if already loading, skip
    if (isLoadingData) {
      console.log('Already loading, skipping...');
      return;
    }
    
    try {
      setIsLoadingData(true);
      setIsLoading(true);
      const startTime = Date.now();
      
      console.log('Loading admin dashboard data...');
      
      // Use admin API endpoints for better performance
      // Use Promise.allSettled to handle individual failures gracefully
      const results = await Promise.allSettled([
        apiService.getAdminStats().catch(err => {
          console.error('Error loading stats:', err);
          return { status: 'error', data: null };
        }),
        apiService.getAdminUsers({ limit: 100 }).catch(err => {
          console.error('Error loading users:', err);
          return { status: 'error', data: null };
        }),
        apiService.getPendingDoctorRegistrations().catch(err => {
          console.error('Error loading registrations:', err);
          return { status: 'error', data: null };
        }),
        apiService.getAdminAppointments({ limit: 50 }).catch(err => {
          console.error('Error loading appointments:', err);
          return { status: 'error', data: null };
        })
      ]);
      
      const [statsResponse, usersResponse, registrationsResponse, appointmentsResponse] = results;

      // Update state with admin API data - handle various response formats
      // Handle Promise.allSettled results
      const statsData = statsResponse.status === 'fulfilled' ? statsResponse.value : null;
      const usersData = usersResponse.status === 'fulfilled' ? usersResponse.value : null;
      const registrationsData = registrationsResponse.status === 'fulfilled' ? registrationsResponse.value : null;
      const appointmentsData = appointmentsResponse.status === 'fulfilled' ? appointmentsResponse.value : null;
      
      if (statsData?.data) {
        if (statsData.data.data) {
          setStats(statsData.data.data);
        } else if (statsData.data) {
          setStats(statsData.data);
        }
      }
      
      if (usersData?.data) {
        const users = usersData.data.data?.users || usersData.data.users || usersData.data || [];
        setUsers(Array.isArray(users) ? users : []);
      } else {
        setUsers([]); // Set empty array if no data
      }
      
      if (registrationsData?.data) {
        const registrations = registrationsData.data.data?.registrations || registrationsData.data.registrations || registrationsData.data || [];
        setPendingRegistrations(Array.isArray(registrations) ? registrations : []);
      } else {
        setPendingRegistrations([]); // Set empty array if no data
      }
      
      if (appointmentsData?.data) {
        const appointments = appointmentsData.data.data?.appointments || appointmentsData.data.appointments || appointmentsData.data || [];
        setAppointments(Array.isArray(appointments) ? appointments : []);
      } else {
        setAppointments([]); // Set empty array if no data
      }

      const loadTime = Date.now() - startTime;
      console.log(`Dashboard loaded in ${loadTime}ms`);
      
    } catch (error: any) {
      console.error('Error loading dashboard data:', error);
      
      // Ensure we set empty arrays on error so the UI can render
      setUsers([]);
      setPendingRegistrations([]);
      setAppointments([]);
      
      // Fallback to original methods if admin API fails
      try {
        await Promise.all([
          loadStats().catch(() => {}),
          loadUsers().catch(() => {}),
          loadPendingRegistrations().catch(() => {}),
          loadAppointments().catch(() => {})
        ]);
      } catch (fallbackError) {
        console.error('Fallback loading also failed:', fallbackError);
      }
    } finally {
      // Always clear loading state, even if there were errors
      setIsLoading(false);
      setIsLoadingData(false);
      console.log('Dashboard loading complete');
    }
  };

  const loadStats = async () => {
    try {
      const response = await apiService.getAdminStats();
      if (response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await apiService.getAdminUsers();
      const users = response.data?.users || response.data?.data?.users || response.data || [];
      setUsers(Array.isArray(users) ? users : []);
    } catch (error) {
      console.error('Error loading users:', error);
      setUsers([]); // Set empty array on error to prevent undefined issues
    }
  };

  const loadPendingRegistrations = async () => {
    try {
      const response = await apiService.getPendingDoctorRegistrations();
      const registrations = response.data?.registrations || response.data?.data?.registrations || response.data || [];
      setPendingRegistrations(Array.isArray(registrations) ? registrations : []);
    } catch (error) {
      console.error('Error loading pending registrations:', error);
      setPendingRegistrations([]); // Set empty array on error
    }
  };

  const loadAppointments = async () => {
    try {
      const response = await apiService.getAdminAppointments();
      const appointments = response.data?.appointments || response.data?.data?.appointments || response.data || [];
      setAppointments(Array.isArray(appointments) ? appointments : []);
    } catch (error) {
      console.error('Error loading appointments:', error);
      setAppointments([]); // Set empty array on error
    }
  };

  const loadAvailabilityChanges = async () => {
    try {
      // API endpoint not implemented yet - commenting out to prevent 404 errors
      // const response = await apiService.getPendingAvailabilityChanges();
      // setAvailabilityChanges(response.data.changes || []);
      setAvailabilityChanges([]); // Set empty array for now
    } catch (error) {
      console.error('Error loading availability changes:', error);
      setAvailabilityChanges([]);
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

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber || '',
      gender: user.gender || '',
      specialization: user.specialization || ''
    });
    setShowEditModal(true);
  };

  const handleSaveUser = async () => {
    if (!selectedUser) return;
    
    try {
      await apiService.updateUser(selectedUser._id, editFormData);
      setShowEditModal(false);
      setSelectedUser(null);
      await loadUsers();
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const handleApproveAvailabilityChange = async (changeId: string) => {
    try {
      // API endpoint not implemented yet
      // await apiService.approveAvailabilityChange(changeId);
      // await loadAvailabilityChanges();
      console.log('Availability approval feature not yet implemented:', changeId);
    } catch (error) {
      console.error('Error approving availability change:', error);
    }
  };

  const handleRejectAvailabilityChange = async (changeId: string) => {
    try {
      // API endpoint not implemented yet
      // await apiService.rejectAvailabilityChange(changeId);
      // await loadAvailabilityChanges();
      console.log('Availability rejection feature not yet implemented:', changeId);
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
          <button
            onClick={logout}
            className="btn-primary bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 flex items-center transition-all duration-200"
            title="Logout"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </button>
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
                  onClick={() => setActiveTab(tab.id as 'overview' | 'analytics' | 'users' | 'registrations' | 'appointments' | 'availability' | 'settings')}
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
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => navigate('/create-user')}
                    className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-4 py-2 rounded-lg shadow-md flex items-center gap-2 transition-all duration-200"
                  >
                    <UserPlus className="h-5 w-5" />
                    Create User
                  </button>
                  <button
                    onClick={loadDashboardData}
                    className="btn-outline flex items-center"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Data
                </button>
              </div>
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
                    <Activity className="h-5 w-5 mr-2 text-orange-600" />
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
                            <button
                              onClick={() => handleEditUser(user)}
                              className="text-primary-600 hover:text-primary-900"
                              title="Edit User"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleToggleUserStatus(user._id, user.isActive)}
                              className={user.isActive ? "text-red-600 hover:text-red-900" : "text-green-600 hover:text-green-900"}
                              title={user.isActive ? "Deactivate User" : "Activate User"}
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

              {pendingRegistrations.length === 0 ? (
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  <UserCheck className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No Pending Registrations</h4>
                  <p className="text-gray-600 mb-4">
                    All doctor registrations have been processed. Doctors created by admins are automatically approved.
                  </p>
                  <button
                    onClick={() => navigate('/create-user')}
                    className="btn-primary inline-flex items-center"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Create New Doctor
                  </button>
                </div>
              ) : (
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
              )}
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
              <div className="max-w-2xl">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">System Information</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Version:</strong> 1.0.0</p>
                    <p><strong>Database:</strong> MongoDB</p>
                    <p><strong>Environment:</strong> Development</p>
                    <p><strong>Last Backup:</strong> {new Date().toLocaleDateString()}</p>
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

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Edit User</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={editFormData.firstName}
                    onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={editFormData.lastName}
                    onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={editFormData.phoneNumber}
                  onChange={(e) => setEditFormData({ ...editFormData, phoneNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gender
                  </label>
                  <select
                    value={editFormData.gender}
                    onChange={(e) => setEditFormData({ ...editFormData, gender: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                {selectedUser.role === 'doctor' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Specialization
                    </label>
                    <input
                      type="text"
                      value={editFormData.specialization}
                      onChange={(e) => setEditFormData({ ...editFormData, specialization: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                )}
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Role:</strong> {selectedUser.role}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  <strong>Status:</strong> {selectedUser.isActive ? 'Active' : 'Inactive'}
                </p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveUser}
                className="px-6 py-2 text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
