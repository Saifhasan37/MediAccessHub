import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Calendar, 
  Users, 
  FileText, 
  Clock, 
  TrendingUp, 
  Activity, 
  CheckCircle, 
  Download, 
  Settings,
  Shield,
  BarChart3,
  LogOut
} from 'lucide-react';

const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Real-time updates simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated(new Date());
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const handleExport = (type: string) => {
    // Simulate export functionality
    const data = {
      user: user?.firstName + ' ' + user?.lastName,
      role: user?.role,
      exportType: type,
      timestamp: new Date().toISOString(),
      stats: currentStats
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mediaccesshub-${type}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Mock data - in a real app, this would come from API
  const stats = {
    patient: {
      totalAppointments: 12,
      upcomingAppointments: 3,
      completedAppointments: 9,
      medicalRecords: 8,
    },
    doctor: {
      totalAppointments: 45,
      todayAppointments: 8,
      upcomingAppointments: 15,
      completedAppointments: 30,
      totalPatients: 28,
    },
    admin: {
      totalUsers: 156,
      totalDoctors: 12,
      totalPatients: 144,
      totalAppointments: 234,
      todayAppointments: 18,
      monthlyRevenue: 15600,
    },
  };

  const currentStats = stats[user?.role as keyof typeof stats] || stats.patient;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getRoleSpecificContent = () => {
    if (user?.role === 'patient') {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Appointments */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-primary-600" />
                Upcoming Appointments
              </h3>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-primary-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Dr. Smith - Cardiology</p>
                    <p className="text-sm text-gray-600">Tomorrow, 10:00 AM</p>
                  </div>
                  <span className="badge-info">Confirmed</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-warning-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Dr. Johnson - General</p>
                    <p className="text-sm text-gray-600">Friday, 2:30 PM</p>
                  </div>
                  <span className="badge-warning">Pending</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Medical Records */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <FileText className="h-5 w-5 mr-2 text-primary-600" />
                Recent Medical Records
              </h3>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Annual Checkup</p>
                    <p className="text-sm text-gray-600">Dr. Smith - 2 days ago</p>
                  </div>
                  <CheckCircle className="h-5 w-5 text-success-500" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Blood Test Results</p>
                    <p className="text-sm text-gray-600">Lab - 1 week ago</p>
                  </div>
                  <CheckCircle className="h-5 w-5 text-success-500" />
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (user?.role === 'doctor') {
      return (
        <div className="card">
          <div className="card-body">
            <p className="text-gray-600 text-center">
              Visit the <a href="/doctor-dashboard" className="text-primary-600 hover:text-primary-700 font-medium">Doctor Dashboard</a> to manage appointments, view patient records, and update your availability.
            </p>
          </div>
        </div>
      );
    }

    if (user?.role === 'admin') {
      return (
        <div className="card">
          <div className="card-body">
            <p className="text-gray-600 text-center">
              Visit the <a href="/admin-dashboard" className="text-primary-600 hover:text-primary-700 font-medium">Admin Dashboard</a> to manage users, approve doctors, and access system analytics.
            </p>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <div className="space-y-8 p-6">
        {/* Enhanced Welcome Section with Real-time Features */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-2xl">
                  {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                </span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {getGreeting()}, {user?.firstName}!
                </h1>
                <p className="text-gray-600 mt-1 text-lg">
                  Welcome to your MediAccessHub dashboard. Here's what's happening today.
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {/* Export Dropdown */}
              <div className="relative">
                <button 
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="btn-outline flex items-center"
                  title="Export Data"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </button>
                
                {showExportMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setShowExportMenu(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border border-gray-200 z-20">
                      <div className="py-1">
                        <button
                          onClick={() => {
                            handleExport('appointments');
                            setShowExportMenu(false);
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <Download className="h-4 w-4 inline mr-2" />
                          Export Appointments
                        </button>
                        <button
                          onClick={() => {
                            handleExport('medical-records');
                            setShowExportMenu(false);
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <Download className="h-4 w-4 inline mr-2" />
                          Export Medical Records
                        </button>
                        <button
                          onClick={() => {
                            handleExport('dashboard-data');
                            setShowExportMenu(false);
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <Download className="h-4 w-4 inline mr-2" />
                          Export Dashboard Data
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Logout Button */}
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
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.entries(currentStats).map(([key, value]) => {
            const getIcon = () => {
              switch (key) {
                case 'totalAppointments':
                case 'todayAppointments':
                case 'upcomingAppointments':
                case 'completedAppointments':
                  return <Calendar className="h-6 w-6" />;
                case 'totalPatients':
                case 'totalUsers':
                  return <Users className="h-6 w-6" />;
                case 'medicalRecords':
                  return <FileText className="h-6 w-6" />;
                case 'totalDoctors':
                  return <Users className="h-6 w-6" />;
                case 'monthlyRevenue':
                  return <TrendingUp className="h-6 w-6" />;
                default:
                  return <Activity className="h-6 w-6" />;
              }
            };

            const getLabel = () => {
              return key
                .replace(/([A-Z])/g, ' $1')
                .replace(/^./, str => str.toUpperCase())
                .trim();
            };

            const getValue = () => {
              if (key === 'monthlyRevenue') {
                return `$${value.toLocaleString()}`;
              }
              return value.toString();
            };

            return (
              <div key={key} className="card">
                <div className="card-body">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center text-primary-600">
                        {getIcon()}
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">{getLabel()}</p>
                      <p className="text-2xl font-semibold text-gray-900">{getValue()}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Role-specific content */}
        {getRoleSpecificContent()}

        {/* Enhanced Quick Actions */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {user?.role === 'patient' && (
                <>
                  <Link to="/book-appointment" className="btn-primary flex items-center justify-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Book Appointment
                  </Link>
                  <Link to="/medical-records" className="btn-outline flex items-center justify-center">
                    <FileText className="h-4 w-4 mr-2" />
                    View Medical Records
                  </Link>
                  <Link to="/profile" className="btn-outline flex items-center justify-center">
                    <Users className="h-4 w-4 mr-2" />
                    Update Profile
                  </Link>
                  <Link to="/testing" className="btn-outline flex items-center justify-center">
                    <Settings className="h-4 w-4 mr-2" />
                    Testing Suite
                  </Link>
                </>
              )}
              {user?.role === 'doctor' && (
                <>
                  <Link to="/doctor-dashboard" className="btn-primary flex items-center justify-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Doctor Dashboard
                  </Link>
                  <Link to="/medical-records-management" className="btn-outline flex items-center justify-center">
                    <FileText className="h-4 w-4 mr-2" />
                    Manage Records
                  </Link>
                  <Link to="/availability-management" className="btn-outline flex items-center justify-center">
                    <Clock className="h-4 w-4 mr-2" />
                    My Availability
                  </Link>
                </>
              )}
              {user?.role === 'admin' && (
                <>
                  <Link to="/admin-dashboard" className="btn-primary flex items-center justify-center">
                    <Shield className="h-4 w-4 mr-2" />
                    Admin Dashboard
                  </Link>
                  <Link to="/monitoring-dashboard" className="btn-outline flex items-center justify-center">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Monitoring & Reports
                  </Link>
                  <Link to="/system-settings" className="btn-outline flex items-center justify-center">
                    <Activity className="h-4 w-4 mr-2" />
                    System Settings
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;