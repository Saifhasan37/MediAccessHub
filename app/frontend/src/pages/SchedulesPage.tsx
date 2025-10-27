import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Clock, Plus, Calendar, Filter, Edit, Trash2 } from 'lucide-react';

const SchedulesPage: React.FC = () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { user } = useAuth();
  const [filter, setFilter] = useState('all');

  // Mock data - in a real app, this would come from API
  const schedules = [
    {
      id: '1',
      date: '2024-01-15',
      workingHours: { start: '09:00', end: '17:00' },
      appointmentDuration: 30,
      consultationFee: 150,
      timeSlots: [
        { startTime: '09:00', endTime: '09:30', isAvailable: true, currentPatients: 0, maxPatients: 1 },
        { startTime: '09:30', endTime: '10:00', isAvailable: false, currentPatients: 1, maxPatients: 1 },
        { startTime: '10:00', endTime: '10:30', isAvailable: true, currentPatients: 0, maxPatients: 1 },
      ],
      status: 'active',
      totalAvailableAppointments: 2
    },
    {
      id: '2',
      date: '2024-01-16',
      workingHours: { start: '08:00', end: '16:00' },
      appointmentDuration: 45,
      consultationFee: 150,
      timeSlots: [
        { startTime: '08:00', endTime: '08:45', isAvailable: true, currentPatients: 0, maxPatients: 1 },
        { startTime: '08:45', endTime: '09:30', isAvailable: true, currentPatients: 0, maxPatients: 1 },
        { startTime: '09:30', endTime: '10:15', isAvailable: false, currentPatients: 1, maxPatients: 1 },
      ],
      status: 'active',
      totalAvailableAppointments: 2
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="badge-success">Active</span>;
      case 'inactive':
        return <span className="badge-warning">Inactive</span>;
      case 'cancelled':
        return <span className="badge-error">Cancelled</span>;
      default:
        return <span className="badge-gray">{status}</span>;
    }
  };

  const filteredSchedules = schedules.filter(schedule => {
    if (filter === 'all') return true;
    return schedule.status === filter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Schedule Management</h1>
          <p className="text-gray-600">Manage your availability and appointment slots</p>
        </div>
        <button className="btn-primary flex items-center">
          <Plus className="h-5 w-5 mr-2" />
          Add Schedule
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-body">
          <div className="flex items-center space-x-4">
            <Filter className="h-5 w-5 text-gray-400" />
            <div className="flex space-x-2">
              {['all', 'active', 'inactive', 'cancelled'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    filter === status
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Schedules List */}
      <div className="space-y-4">
        {filteredSchedules.map((schedule) => (
          <div key={schedule.id} className="card">
            <div className="card-body">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {new Date(schedule.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {schedule.workingHours.start} - {schedule.workingHours.end}
                    </p>
                  </div>
                </div>
                {getStatusBadge(schedule.status)}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600">Appointment Duration</p>
                  <p className="font-medium text-gray-900">{schedule.appointmentDuration} minutes</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600">Consultation Fee</p>
                  <p className="font-medium text-gray-900">${schedule.consultationFee}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600">Available Slots</p>
                  <p className="font-medium text-gray-900">{schedule.totalAvailableAppointments}</p>
                </div>
              </div>

              {/* Time Slots */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Time Slots</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {schedule.timeSlots.map((slot, index) => (
                    <div
                      key={index}
                      className={`p-2 rounded-md text-sm ${
                        slot.isAvailable
                          ? 'bg-success-50 text-success-700 border border-success-200'
                          : 'bg-gray-50 text-gray-600 border border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">
                          {slot.startTime} - {slot.endTime}
                        </span>
                        <span className="text-xs">
                          {slot.currentPatients}/{slot.maxPatients}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>{schedule.timeSlots.length} time slots</span>
                  <span>{schedule.totalAvailableAppointments} available</span>
                </div>
                <div className="flex space-x-2">
                  <button className="btn-outline text-sm px-3 py-1 flex items-center">
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </button>
                  <button className="btn-error text-sm px-3 py-1 flex items-center">
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredSchedules.length === 0 && (
        <div className="card">
          <div className="card-body text-center py-12">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No schedules found</h3>
            <p className="text-gray-600">
              {filter === 'all' 
                ? "You don't have any schedules set up yet." 
                : `No schedules with status "${filter}" found.`
              }
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchedulesPage;

