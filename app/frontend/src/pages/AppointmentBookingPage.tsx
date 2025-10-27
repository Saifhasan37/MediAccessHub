import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, Clock, FileText, Send, AlertCircle, CheckCircle } from 'lucide-react';
import apiService from '../services/api';

interface Doctor {
  _id: string;
  firstName: string;
  lastName: string;
  specialization: string;
  email: string;
  consultationFee: number;
}

interface AppointmentFormData {
  doctorId: string;
  appointmentDate: string;
  appointmentTime: string;
  reason: string;
  type: string;
}

const AppointmentBookingPage: React.FC = () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { user } = useAuth();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [formData, setFormData] = useState<AppointmentFormData>({
    doctorId: '',
    appointmentDate: '',
    appointmentTime: '',
    reason: '',
    type: 'consultation'
  });

  // Load doctors on component mount
  useEffect(() => {
    const loadDoctors = async () => {
      try {
        setIsLoading(true);
        const response = await apiService.getDoctors();
        setDoctors(response.data.doctors || []);
      } catch (error) {
        setMessage({ type: 'error', text: 'Failed to load doctors' });
      } finally {
        setIsLoading(false);
      }
    };

    loadDoctors();
  }, []);

  const loadAvailableSlots = useCallback(async () => {
    try {
      const response = await apiService.getAvailableTimeSlots({
        doctorId: formData.doctorId,
        date: formData.appointmentDate
      });
      setAvailableSlots(response.data.slots || []);
    } catch (error) {
      setAvailableSlots([]);
    }
  }, [formData.doctorId, formData.appointmentDate]);

  // Load available time slots when doctor and date are selected
  useEffect(() => {
    if (formData.doctorId && formData.appointmentDate) {
      loadAvailableSlots();
    }
  }, [formData.doctorId, formData.appointmentDate, loadAvailableSlots]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear time selection when date changes
    if (name === 'appointmentDate') {
      setFormData(prev => ({
        ...prev,
        appointmentTime: ''
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.doctorId || !formData.appointmentDate || !formData.appointmentTime || !formData.reason) {
      setMessage({ type: 'error', text: 'Please fill in all required fields' });
      return;
    }

    try {
      setIsSubmitting(true);
      setMessage(null);

      const appointmentData = {
        doctor: formData.doctorId,
        appointmentDate: formData.appointmentDate,
        appointmentTime: formData.appointmentTime,
        reason: formData.reason,
        type: formData.type,
        consultationFee: doctors.find(d => d._id === formData.doctorId)?.consultationFee || 100
      };

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const response = await apiService.createAppointment(appointmentData);
      
      setMessage({ 
        type: 'success', 
        text: 'Appointment booked successfully! You will receive a confirmation email shortly.' 
      });
      
      // Reset form
      setFormData({
        doctorId: '',
        appointmentDate: '',
        appointmentTime: '',
        reason: '',
        type: 'consultation'
      });
      setAvailableSlots([]);
      
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to book appointment' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3); // 3 months in advance
    return maxDate.toISOString().split('T')[0];
  };

  const selectedDoctor = doctors.find(d => d._id === formData.doctorId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 py-8">
      <div className="max-w-4xl mx-auto px-6">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <div className="text-center mb-8">
            <div className="mx-auto h-20 w-20 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
              <Calendar className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">Book an Appointment</h1>
            <p className="text-gray-600 text-lg">Select a doctor, choose your preferred date and time, and tell us about your reason for the visit.</p>
          </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center ${
            message.type === 'success' 
              ? 'bg-success-50 border border-success-200 text-success-800' 
              : 'bg-error-50 border border-error-200 text-error-800'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="h-5 w-5 mr-3" />
            ) : (
              <AlertCircle className="h-5 w-5 mr-3" />
            )}
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Doctor Selection */}
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 rounded-xl border border-blue-100">
            <label htmlFor="doctorId" className="block text-lg font-semibold text-gray-900 mb-3">
              Select Doctor *
            </label>
            <select
              id="doctorId"
              name="doctorId"
              value={formData.doctorId}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white shadow-sm"
              required
              disabled={isLoading}
            >
              <option value="">Choose a doctor...</option>
              {doctors.map((doctor) => (
                <option key={doctor._id} value={doctor._id}>
                  Dr. {doctor.firstName} {doctor.lastName} - {doctor.specialization} (${doctor.consultationFee})
                </option>
              ))}
            </select>
            {isLoading && <p className="text-sm text-gray-500 mt-2">Loading doctors...</p>}
            {selectedDoctor && (
              <div className="mt-4 p-4 bg-white rounded-lg border border-blue-200">
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-lg">
                      {selectedDoctor.firstName.charAt(0)}{selectedDoctor.lastName.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Dr. {selectedDoctor.firstName} {selectedDoctor.lastName}</h3>
                    <p className="text-gray-600">{selectedDoctor.specialization}</p>
                    <p className="text-blue-600 font-medium">${selectedDoctor.consultationFee} consultation fee</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Appointment Type */}
          <div>
            <label htmlFor="type" className="label">
              Appointment Type
            </label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className="input"
            >
              <option value="consultation">General Consultation</option>
              <option value="follow-up">Follow-up</option>
              <option value="routine-checkup">Routine Checkup</option>
              <option value="emergency">Emergency</option>
              <option value="specialist">Specialist Consultation</option>
            </select>
          </div>

          {/* Date Selection */}
          <div>
            <label htmlFor="appointmentDate" className="label">
              Appointment Date *
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="date"
                id="appointmentDate"
                name="appointmentDate"
                value={formData.appointmentDate}
                onChange={handleInputChange}
                min={getMinDate()}
                max={getMaxDate()}
                className="input pl-10"
                required
              />
            </div>
          </div>

          {/* Time Selection */}
          <div>
            <label htmlFor="appointmentTime" className="label">
              Appointment Time *
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                id="appointmentTime"
                name="appointmentTime"
                value={formData.appointmentTime}
                onChange={handleInputChange}
                className="input pl-10"
                required
                disabled={!formData.doctorId || !formData.appointmentDate}
              >
                <option value="">Select time...</option>
                {availableSlots.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </div>
            {formData.doctorId && formData.appointmentDate && availableSlots.length === 0 && (
              <p className="text-sm text-warning-600 mt-1">No available slots for this date. Please select another date.</p>
            )}
            {availableSlots.length > 0 && (
              <p className="text-sm text-success-600 mt-1">
                {availableSlots.length} available time slots: {availableSlots.slice(0, 5).join(', ')}
                {availableSlots.length > 5 && ` and ${availableSlots.length - 5} more`}
              </p>
            )}
          </div>

          {/* Reason for Appointment */}
          <div>
            <label htmlFor="reason" className="label">
              Reason for Appointment *
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <textarea
                id="reason"
                name="reason"
                value={formData.reason}
                onChange={handleInputChange}
                rows={4}
                className="input pl-10 resize-none"
                placeholder="Please describe your symptoms or reason for the appointment..."
                required
                maxLength={500}
              />
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {formData.reason.length}/500 characters
            </p>
          </div>

          {/* Doctor Information */}
          {selectedDoctor && (
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
              <h3 className="font-medium text-primary-900 mb-2">Selected Doctor Information</h3>
              <div className="text-sm text-primary-800">
                <p><strong>Name:</strong> Dr. {selectedDoctor.firstName} {selectedDoctor.lastName}</p>
                <p><strong>Specialization:</strong> {selectedDoctor.specialization}</p>
                <p><strong>Consultation Fee:</strong> ${selectedDoctor.consultationFee}</p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-6">
            <button
              type="submit"
              disabled={isSubmitting || !formData.doctorId || !formData.appointmentDate || !formData.appointmentTime || !formData.reason}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  <span className="text-lg">Booking Appointment...</span>
                </>
              ) : (
                <>
                  <Send className="h-5 w-5 mr-3" />
                  <span className="text-lg">Book Appointment</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Information Box */}
        <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-2">Important Information</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Your appointment will be created with "Pending" status</li>
            <li>• You will receive a confirmation email after booking</li>
            <li>• Please arrive 15 minutes before your scheduled time</li>
            <li>• You can cancel or reschedule up to 24 hours in advance</li>
            <li>• Consultation fees are payable at the time of appointment</li>
          </ul>
        </div>
      </div>
      </div>
    </div>
  );
};

export default AppointmentBookingPage;
