import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import { 
  Calendar, 
  Clock, 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle,
  XCircle,
  Save,
  RefreshCw
} from 'lucide-react';

interface Availability {
  _id: string;
  date: string;
  startTime?: string;  // For backward compatibility
  endTime?: string;    // For backward compatibility
  isAvailable?: boolean; // For backward compatibility
  timeSlots: Array<{
    startTime: string;
    endTime: string;
    isAvailable: boolean;
    maxPatients: number;
    currentPatients: number;
  }>;
  isWorkingDay: boolean;
  workingHours: {
    start: string;
    end: string;
  };
  appointmentDuration: number;
  consultationFee: number;
  status: string;
  notes?: string;
}


const AvailabilityManagement: React.FC = () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { user } = useAuth();
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedDate, setSelectedDate] = useState('');
  const [editingDate, setEditingDate] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    date: '',
    startTime: '09:00',
    endTime: '17:00',
    isAvailable: true,
    consultationFee: 50,
    appointmentDuration: 30,
    notes: ''
  });

  // Generate time slots based on start and end time
  const generateTimeSlots = (startTime: string, endTime: string, duration: number = 30) => {
    const slots = [];
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    
    while (start < end) {
      const slotStart = start.toTimeString().substr(0, 5);
      start.setMinutes(start.getMinutes() + duration);
      const slotEnd = start.toTimeString().substr(0, 5);
      
      // Don't add a slot if it would exceed the end time
      if (start > end) break;
      
      slots.push({
        startTime: slotStart,
        endTime: slotEnd,
        isAvailable: true,
        maxPatients: 1,
        currentPatients: 0
      });
    }
    
    return slots;
  };

  useEffect(() => {
    loadAvailability();
  }, []);

  const loadAvailability = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getMySchedules();
      setAvailability(response.data.schedules || []);
    } catch (error) {
      console.error('Error loading availability:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const scheduleData = {
        date: formData.date,
        isWorkingDay: formData.isAvailable,
        workingHours: {
          start: formData.startTime,
          end: formData.endTime
        },
        timeSlots: formData.isAvailable ? generateTimeSlots(formData.startTime, formData.endTime, formData.appointmentDuration) : [],
        appointmentDuration: formData.appointmentDuration,
        consultationFee: formData.consultationFee,
        status: 'active',
        notes: formData.notes
      };

      if (editingDate) {
        // Update existing schedule
        const existingSchedule = availability.find(a => a.date === editingDate);
        if (existingSchedule) {
          await apiService.updateSchedule(existingSchedule._id, scheduleData);
        }
      } else {
        // Create new schedule
        await apiService.createSchedule(scheduleData);
      }

      await loadAvailability();
      resetForm();
    } catch (error) {
      console.error('Error saving availability:', error);
    }
  };

  const handleEdit = (schedule: Availability) => {
    setEditingDate(schedule.date);
    setFormData({
      date: schedule.date,
      startTime: schedule.timeSlots?.[0]?.startTime || schedule.workingHours?.start || '09:00',
      endTime: schedule.timeSlots?.[schedule.timeSlots.length - 1]?.endTime || schedule.workingHours?.end || '17:00',
      isAvailable: schedule.isWorkingDay,
      consultationFee: (schedule as any).consultationFee || 50,
      appointmentDuration: (schedule as any).appointmentDuration || 30,
      notes: schedule.notes || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (scheduleId: string) => {
    if (window.confirm('Are you sure you want to delete this availability?')) {
      try {
        await apiService.deleteSchedule(scheduleId);
        await loadAvailability();
      } catch (error) {
        console.error('Error deleting availability:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      date: '',
      startTime: '09:00',
      endTime: '17:00',
      isAvailable: true,
      consultationFee: 50,
      appointmentDuration: 30,
      notes: ''
    });
    setEditingDate(null);
    setShowForm(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
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

  // Get next 30 days for date picker
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getNext30Days = () => {
    const days = [];
    const today = new Date();
    
    for (let i = 1; i <= 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push(date.toISOString().split('T')[0]);
    }
    
    return days;
  };

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
            <h1 className="text-2xl font-bold text-gray-900">My Availability</h1>
            <p className="text-gray-600 mt-1">Set and manage your available hours for appointments</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={loadAvailability}
              className="btn-outline flex items-center"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Set Availability
            </button>
          </div>
        </div>
      </div>

      {/* Calendar View */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Weekly Calendar</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {availability.map((schedule) => (
            <div key={schedule._id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-medium text-gray-900">
                    {formatDate(schedule.date)}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {schedule.isAvailable ? 'Available' : 'Unavailable'}
                  </p>
                </div>
                <div className="flex items-center space-x-1">
                  {schedule.isAvailable ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>
              </div>

              {schedule.isAvailable && (
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="h-4 w-4 mr-2" />
                    {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                  </div>
                  <div className="text-sm text-gray-600">
                    <strong>Time Slots:</strong> {schedule.timeSlots.length}
                  </div>
                  {schedule.notes && (
                    <div className="text-sm text-gray-600">
                      <strong>Notes:</strong> {schedule.notes}
                    </div>
                  )}
                </div>
              )}

              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(schedule)}
                  className="btn-outline text-sm px-3 py-1"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(schedule._id)}
                  className="btn-error text-sm px-3 py-1"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {availability.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No availability set</h3>
            <p className="text-gray-600">Set your availability to start receiving appointments.</p>
          </div>
        )}
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingDate ? 'Edit Availability' : 'Set New Availability'}
                </h3>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Date *</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="input"
                    required
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div>
                  <label className="label">
                    <input
                      type="checkbox"
                      checked={formData.isAvailable}
                      onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                      className="mr-2"
                    />
                    Available on this date
                  </label>
                </div>

                {formData.isAvailable && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="label">Start Time *</label>
                        <input
                          type="time"
                          value={formData.startTime}
                          onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                          className="input"
                          required
                        />
                      </div>
                      <div>
                        <label className="label">End Time *</label>
                        <input
                          type="time"
                          value={formData.endTime}
                          onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                          className="input"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="label">Consultation Fee ($) *</label>
                        <input
                          type="number"
                          value={formData.consultationFee}
                          onChange={(e) => setFormData({ ...formData, consultationFee: parseFloat(e.target.value) || 0 })}
                          className="input"
                          min="0"
                          step="0.01"
                          required
                        />
                      </div>
                      <div>
                        <label className="label">Appointment Duration (min) *</label>
                        <input
                          type="number"
                          value={formData.appointmentDuration}
                          onChange={(e) => setFormData({ ...formData, appointmentDuration: parseInt(e.target.value) || 30 })}
                          className="input"
                          min="15"
                          max="120"
                          step="15"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="label">Notes</label>
                      <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        className="input"
                        rows={3}
                        placeholder="Add any notes about this availability..."
                      />
                    </div>
                  </>
                )}

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="btn-outline"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary flex items-center"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {editingDate ? 'Update Availability' : 'Set Availability'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AvailabilityManagement;
