import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, Clock, User, Plus, Filter, Search, Download, RefreshCw } from 'lucide-react';

const AppointmentsPage: React.FC = () => {
  const { user } = useAuth();
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Real-time updates simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated(new Date());
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLastUpdated(new Date());
    setIsRefreshing(false);
  };

  const handleExport = () => {
    const data = {
      user: user?.firstName + ' ' + user?.lastName,
      role: user?.role,
      exportType: 'appointments',
      timestamp: new Date().toISOString(),
      appointments: filteredAppointments
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `appointments-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Mock data - in a real app, this would come from API
  const appointments = [
    {
      id: '1',
      patient: { name: 'John Doe', email: 'john@example.com' },
      doctor: { name: 'Dr. Smith', specialization: 'Cardiology' },
      date: '2024-01-15',
      time: '10:00',
      status: 'confirmed',
      type: 'consultation',
      reason: 'Regular checkup'
    },
    {
      id: '2',
      patient: { name: 'Jane Smith', email: 'jane@example.com' },
      doctor: { name: 'Dr. Johnson', specialization: 'General Medicine' },
      date: '2024-01-16',
      time: '14:30',
      status: 'pending',
      type: 'follow-up',
      reason: 'Follow-up appointment'
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <span className="badge-success">Confirmed</span>;
      case 'pending':
        return <span className="badge-warning">Pending</span>;
      case 'completed':
        return <span className="badge-info">Completed</span>;
      case 'cancelled':
        return <span className="badge-error">Cancelled</span>;
      default:
        return <span className="badge-gray">{status}</span>;
    }
  };

  const filteredAppointments = appointments.filter(appointment => {
    const matchesFilter = filter === 'all' || appointment.status === filter;
    const matchesSearch = searchQuery === '' || 
      appointment.patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      appointment.doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      appointment.reason.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
            <p className="text-gray-600">Manage your appointments and schedule</p>
            <p className="text-sm text-gray-500 mt-1">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleExport}
              className="btn-outline flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
            <button className="btn-primary flex items-center">
              <Plus className="h-4 w-4 mr-2" />
              Book Appointment
            </button>
          </div>
        </div>
        
        {/* Search and Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search appointments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-10"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="input"
            >
              <option value="all">All Status</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>


      {/* Appointments List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredAppointments.map((appointment) => (
          <div key={appointment.id} className="card">
            <div className="card-body">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {user?.role === 'patient' ? appointment.doctor.name : appointment.patient.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {user?.role === 'patient' ? appointment.doctor.specialization : appointment.patient.email}
                    </p>
                  </div>
                </div>
                {getStatusBadge(appointment.status)}
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  {new Date(appointment.date).toLocaleDateString()}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="h-4 w-4 mr-2" />
                  {appointment.time}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <User className="h-4 w-4 mr-2" />
                  {appointment.type}
                </div>
              </div>

              <p className="text-sm text-gray-700 mb-4">{appointment.reason}</p>

              <div className="flex space-x-2">
                <button className="btn-outline text-sm px-3 py-1">
                  View Details
                </button>
                {appointment.status === 'pending' && (
                  <button className="btn-primary text-sm px-3 py-1">
                    Confirm
                  </button>
                )}
                {appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
                  <button className="btn-error text-sm px-3 py-1">
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredAppointments.length === 0 && (
        <div className="card">
          <div className="card-body text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments found</h3>
            <p className="text-gray-600">
              {filter === 'all' 
                ? "You don't have any appointments yet." 
                : `No appointments with status "${filter}" found.`
              }
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentsPage;

