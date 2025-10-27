import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Mail, Lock, User, Phone, Calendar } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

interface RegisterForm {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  role: 'patient' | 'doctor';
  // Doctor fields
  specialization?: string;
  licenseNumber?: string;
  yearsOfExperience?: number;
  consultationFee?: number;
  bio?: string;
  // Patient fields
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelationship?: string;
  insuranceProvider?: string;
  insuranceNumber?: string;
}

const RegisterPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register: registerUser, isLoading } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>();

  const selectedRole = watch('role');

  const onSubmit = async (data: RegisterForm) => {
    try {
      const registerData = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        phone: data.phone,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        role: data.role,
        ...(data.role === 'doctor' && {
          specialization: data.specialization,
          licenseNumber: data.licenseNumber,
          yearsOfExperience: data.yearsOfExperience,
          consultationFee: data.consultationFee,
          bio: data.bio,
        }),
        ...(data.role === 'patient' && {
          emergencyContactName: data.emergencyContactName,
          emergencyContactPhone: data.emergencyContactPhone,
          emergencyContactRelationship: data.emergencyContactRelationship,
          insuranceProvider: data.insuranceProvider,
          insuranceNumber: data.insuranceNumber,
        }),
      };

      console.log('Registering with data:', registerData);
      await registerUser(registerData);
      navigate('/dashboard');
    } catch (error) {
      console.error('Registration error:', error);
      // Error is handled by the auth context
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-2xl">MA</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create Your Account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Join MediAccessHub and start managing your healthcare
          </p>
        </div>

        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-gray-100">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Basic Information */}
            <div>
              <label htmlFor="firstName" className="label">
                First Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('firstName', { required: 'First name is required' })}
                  type="text"
                  className={`input pl-10 ${errors.firstName ? 'input-error' : ''}`}
                  placeholder="Enter your first name"
                />
              </div>
              {errors.firstName && (
                <p className="mt-1 text-sm text-error-600">{errors.firstName.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="lastName" className="label">
                Last Name
              </label>
              <input
                {...register('lastName', { required: 'Last name is required' })}
                type="text"
                className={`input ${errors.lastName ? 'input-error' : ''}`}
                placeholder="Enter your last name"
              />
              {errors.lastName && (
                <p className="mt-1 text-sm text-error-600">{errors.lastName.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="label">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
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
                  placeholder="Enter your email"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-error-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="label">
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('phone', { required: 'Phone number is required' })}
                  type="tel"
                  className={`input pl-10 ${errors.phone ? 'input-error' : ''}`}
                  placeholder="Enter your phone number"
                />
              </div>
              {errors.phone && (
                <p className="mt-1 text-sm text-error-600">{errors.phone.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="dateOfBirth" className="label">
                Date of Birth
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('dateOfBirth', { required: 'Date of birth is required' })}
                  type="date"
                  className={`input pl-10 ${errors.dateOfBirth ? 'input-error' : ''}`}
                />
              </div>
              {errors.dateOfBirth && (
                <p className="mt-1 text-sm text-error-600">{errors.dateOfBirth.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="gender" className="label">
                Gender
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
                <p className="mt-1 text-sm text-error-600">{errors.gender.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="role" className="label">
                Account Type
              </label>
              <select
                {...register('role', { required: 'Account type is required' })}
                className={`input ${errors.role ? 'input-error' : ''}`}
              >
                <option value="">Select account type</option>
                <option value="patient">Patient</option>
                <option value="doctor">Doctor</option>
                <option value="admin">Admin</option>
              </select>
              {errors.role && (
                <p className="mt-1 text-sm text-error-600">{errors.role.message}</p>
              )}
            </div>

            {/* Doctor-specific fields */}
            {selectedRole === 'doctor' && (
              <>
                <div>
                  <label htmlFor="specialization" className="label">
                    Specialization
                  </label>
                  <input
                    {...register('specialization', { required: 'Specialization is required' })}
                    type="text"
                    className={`input ${errors.specialization ? 'input-error' : ''}`}
                    placeholder="e.g., Cardiology, Neurology"
                  />
                  {errors.specialization && (
                    <p className="mt-1 text-sm text-error-600">{errors.specialization.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="licenseNumber" className="label">
                    License Number
                  </label>
                  <input
                    {...register('licenseNumber', { required: 'License number is required' })}
                    type="text"
                    className={`input ${errors.licenseNumber ? 'input-error' : ''}`}
                    placeholder="Enter your license number"
                  />
                  {errors.licenseNumber && (
                    <p className="mt-1 text-sm text-error-600">{errors.licenseNumber.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="yearsOfExperience" className="label">
                    Years of Experience
                  </label>
                  <input
                    {...register('yearsOfExperience', {
                      required: 'Years of experience is required',
                      min: { value: 0, message: 'Must be 0 or greater' },
                    })}
                    type="number"
                    min="0"
                    className={`input ${errors.yearsOfExperience ? 'input-error' : ''}`}
                    placeholder="Enter years of experience"
                  />
                  {errors.yearsOfExperience && (
                    <p className="mt-1 text-sm text-error-600">{errors.yearsOfExperience.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="consultationFee" className="label">
                    Consultation Fee ($)
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
                    placeholder="Enter consultation fee"
                  />
                  {errors.consultationFee && (
                    <p className="mt-1 text-sm text-error-600">{errors.consultationFee.message}</p>
                  )}
                </div>
              </>
            )}

            {/* Password fields */}
            <div>
              <label htmlFor="password" className="label">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
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
                  placeholder="Enter your password"
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
                <p className="mt-1 text-sm text-error-600">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="label">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: (value) =>
                      value === watch('password') || 'Passwords do not match',
                  })}
                  type={showConfirmPassword ? 'text' : 'password'}
                  className={`input pl-10 pr-10 ${errors.confirmPassword ? 'input-error' : ''}`}
                  placeholder="Confirm your password"
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
                <p className="mt-1 text-sm text-error-600">{errors.confirmPassword.message}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <LoadingSpinner size="sm" className="text-white" />
              ) : (
                'Create Account'
              )}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  </div>
  );
};

export default RegisterPage;

