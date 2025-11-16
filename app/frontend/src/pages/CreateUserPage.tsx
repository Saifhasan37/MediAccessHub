import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, User, Mail, Lock, Phone, Calendar, Stethoscope } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import apiService from '../services/api';

interface DoctorForm {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  specialization: string;
  licenseNumber: string;
  yearsOfExperience: number;
  consultationFee: number;
  bio?: string;
}

interface MonitorForm {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
}

const CreateUserPage: React.FC = () => {
  const [userType, setUserType] = useState<'doctor' | 'monitor'>('doctor');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<any>();

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    setMessage(null);

    try {
      // Normalize phone to match backend regex: optional + followed by 1-16 digits starting non-zero
      const normalizedPhone = (() => {
        const digits = (data.phone || '').replace(/\D/g, '');
        if (!digits) {
          throw new Error('Please enter a valid phone number');
        }
        // Remove leading zeros and ensure it starts with a non-zero digit
        const cleanDigits = digits.replace(/^0+/, '');
        if (!cleanDigits || cleanDigits.length === 0) {
          throw new Error('Please enter a valid phone number (must start with a non-zero digit)');
        }
        // Ensure phone number matches backend validation: /^[\+]?[1-9][\d]{0,15}$/
        if (!/^[1-9]\d{0,15}$/.test(cleanDigits)) {
          throw new Error('Please enter a valid phone number (must start with 1-9 and be 1-16 digits)');
        }
        return `+${cleanDigits}`;
      })();

      // Validate required fields
      if (userType === 'doctor') {
        if (!data.specialization?.trim()) {
          throw new Error('Specialization is required for doctors');
        }
        if (!data.licenseNumber?.trim()) {
          throw new Error('License number is required for doctors');
        }
      }

      const userData = {
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: data.email.trim().toLowerCase(),
        password: data.password,
        phone: normalizedPhone,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        ...(userType === 'doctor' && {
          specialization: data.specialization?.trim(),
          licenseNumber: data.licenseNumber?.trim(),
          yearsOfExperience: Number(data.yearsOfExperience) || 0,
          consultationFee: Number(data.consultationFee) || 0,
          bio: data.bio?.trim() || '',
        }),
      };

      console.log(`Creating ${userType} with data:`, { ...userData, password: '***' });

      if (userType === 'doctor') {
        await apiService.createDoctor(userData);
        setMessage({ type: 'success', text: 'Doctor account created successfully!' });
      } else {
        await apiService.createMonitor(userData);
        setMessage({ type: 'success', text: 'Monitor account created successfully!' });
      }

      // Reset form
      reset();
      
      // Navigate back after 2 seconds
      setTimeout(() => {
        navigate('/admin-dashboard');
      }, 2000);
    } catch (error: any) {
      console.error(`Error creating ${userType}:`, error);
      let errorMessage = `Failed to create ${userType} account`;
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors) {
        // Handle validation errors
        const validationErrors = error.response.data.errors;
        if (Array.isArray(validationErrors) && validationErrors.length > 0) {
          errorMessage = validationErrors.map((e: any) => e.msg || e.message).join(', ');
        }
      }
      
      setMessage({
        type: 'error',
        text: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <div className="text-center mb-8">
            <div className="mx-auto h-20 w-20 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
              {userType === 'doctor' ? (
                <Stethoscope className="h-10 w-10 text-white" />
              ) : (
                <User className="h-10 w-10 text-white" />
              )}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Create {userType === 'doctor' ? 'Doctor' : 'Monitor'} Account
            </h1>
            <p className="text-gray-600 text-lg">
              Add a new {userType} to the MediAccessHub system
            </p>
          </div>

          {/* User Type Selector */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex rounded-lg border border-gray-300 p-1">
              <button
                type="button"
                onClick={() => {
                  setUserType('doctor');
                  reset();
                  setMessage(null);
                }}
                className={`px-6 py-2 rounded-md font-medium transition-colors ${
                  userType === 'doctor'
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Doctor
              </button>
              <button
                type="button"
                onClick={() => {
                  setUserType('monitor');
                  reset();
                  setMessage(null);
                }}
                className={`px-6 py-2 rounded-md font-medium transition-colors ${
                  userType === 'monitor'
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Monitor
              </button>
            </div>
          </div>

          {message && (
            <div
              className={`mb-6 p-4 rounded-lg ${
                message.type === 'success'
                  ? 'bg-green-50 border border-green-200 text-green-800'
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}
            >
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Basic Information */}
              <div>
                <label htmlFor="firstName" className="label">
                  First Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    {...register('firstName', { required: 'First name is required' })}
                    type="text"
                    className={`input pl-10 ${errors.firstName ? 'input-error' : ''}`}
                    placeholder="Enter first name"
                  />
                </div>
                {errors.firstName && (
                  <p className="mt-1 text-sm text-error-600">{errors.firstName.message as string}</p>
                )}
              </div>

              <div>
                <label htmlFor="lastName" className="label">
                  Last Name *
                </label>
                <input
                  {...register('lastName', { required: 'Last name is required' })}
                  type="text"
                  className={`input ${errors.lastName ? 'input-error' : ''}`}
                  placeholder="Enter last name"
                />
                {errors.lastName && (
                  <p className="mt-1 text-sm text-error-600">{errors.lastName.message as string}</p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="label">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^\S+@\S+$/i,
                        message: 'Invalid email address',
                      },
                    })}
                    type="email"
                    className={`input pl-10 ${errors.email ? 'input-error' : ''}`}
                    placeholder="Enter email"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-error-600">{errors.email.message as string}</p>
                )}
              </div>

              <div>
                <label htmlFor="phone" className="label">
                  Phone Number *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    {...register('phone', { required: 'Phone number is required' })}
                    type="tel"
                    className={`input pl-10 ${errors.phone ? 'input-error' : ''}`}
                    placeholder="Enter phone number"
                  />
                </div>
                {errors.phone && (
                  <p className="mt-1 text-sm text-error-600">{errors.phone.message as string}</p>
                )}
              </div>

              <div>
                <label htmlFor="dateOfBirth" className="label">
                  Date of Birth *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    {...register('dateOfBirth', { required: 'Date of birth is required' })}
                    type="date"
                    className={`input pl-10 ${errors.dateOfBirth ? 'input-error' : ''}`}
                  />
                </div>
                {errors.dateOfBirth && (
                  <p className="mt-1 text-sm text-error-600">{errors.dateOfBirth.message as string}</p>
                )}
              </div>

              <div>
                <label htmlFor="gender" className="label">
                  Gender *
                </label>
                <select
                  {...register('gender', { required: 'Gender is required' })}
                  className={`input ${errors.gender ? 'input-error' : ''}`}
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
                {errors.gender && (
                  <p className="mt-1 text-sm text-error-600">{errors.gender.message as string}</p>
                )}
              </div>

              {/* Doctor-specific fields */}
              {userType === 'doctor' && (
                <>
                  <div>
                    <label htmlFor="specialization" className="label">
                      Specialization *
                    </label>
                    <input
                      {...register('specialization', { required: 'Specialization is required' })}
                      type="text"
                      className={`input ${errors.specialization ? 'input-error' : ''}`}
                      placeholder="e.g., Cardiology, Neurology"
                    />
                    {errors.specialization && (
                      <p className="mt-1 text-sm text-error-600">{errors.specialization.message as string}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="licenseNumber" className="label">
                      License Number *
                    </label>
                    <input
                      {...register('licenseNumber', { required: 'License number is required' })}
                      type="text"
                      className={`input ${errors.licenseNumber ? 'input-error' : ''}`}
                      placeholder="Enter license number"
                    />
                    {errors.licenseNumber && (
                      <p className="mt-1 text-sm text-error-600">{errors.licenseNumber.message as string}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="yearsOfExperience" className="label">
                      Years of Experience *
                    </label>
                    <input
                      {...register('yearsOfExperience', {
                        required: 'Years of experience is required',
                        min: { value: 0, message: 'Must be 0 or greater' },
                      })}
                      type="number"
                      min="0"
                      className={`input ${errors.yearsOfExperience ? 'input-error' : ''}`}
                      placeholder="Enter years"
                    />
                    {errors.yearsOfExperience && (
                      <p className="mt-1 text-sm text-error-600">{errors.yearsOfExperience.message as string}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="consultationFee" className="label">
                      Consultation Fee ($) *
                    </label>
                    <input
                      {...register('consultationFee', {
                        required: 'Consultation fee is required',
                        min: { value: 0, message: 'Must be 0 or greater' },
                      })}
                      type="number"
                      min="0"
                      step="0.01"
                      className={`input ${errors.consultationFee ? 'input-error' : ''}`}
                      placeholder="Enter fee"
                    />
                    {errors.consultationFee && (
                      <p className="mt-1 text-sm text-error-600">{errors.consultationFee.message as string}</p>
                    )}
                  </div>
                </>
              )}

              {/* Password fields */}
              <div>
                <label htmlFor="password" className="label">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    {...register('password', {
                      required: 'Password is required',
                      minLength: {
                        value: 6,
                        message: 'Password must be at least 6 characters',
                      },
                    })}
                    type={showPassword ? 'text' : 'password'}
                    className={`input pl-10 pr-10 ${errors.password ? 'input-error' : ''}`}
                    placeholder="Enter password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-error-600">{errors.password.message as string}</p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="label">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    {...register('confirmPassword', {
                      required: 'Please confirm password',
                      validate: (value) =>
                        value === watch('password') || 'Passwords do not match',
                    })}
                    type={showConfirmPassword ? 'text' : 'password'}
                    className={`input pl-10 pr-10 ${errors.confirmPassword ? 'input-error' : ''}`}
                    placeholder="Confirm password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-error-600">{errors.confirmPassword.message as string}</p>
                )}
              </div>
            </div>

            {/* Bio field for doctors - full width */}
            {userType === 'doctor' && (
              <div>
                <label htmlFor="bio" className="label">
                  Bio (Optional)
                </label>
                <textarea
                  {...register('bio')}
                  rows={4}
                  className="input resize-none"
                  placeholder="Enter a brief biography..."
                  maxLength={500}
                />
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-6 flex gap-4">
              <button
                type="button"
                onClick={() => navigate('/admin-dashboard')}
                className="flex-1 py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <LoadingSpinner size="sm" className="text-white mr-2" />
                    Creating...
                  </div>
                ) : (
                  `Create ${userType === 'doctor' ? 'Doctor' : 'Monitor'} Account`
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateUserPage;

