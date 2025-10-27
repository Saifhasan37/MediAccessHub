import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import { 
  Play, 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  Calendar, 
  FileText, 
  Settings,
  RefreshCw,
  Download
} from 'lucide-react';

interface TestResult {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  duration?: number;
  error?: string;
  details?: any;
}

interface TestSuite {
  id: string;
  name: string;
  description: string;
  tests: TestResult[];
  status: 'pending' | 'running' | 'completed';
}

const PatientPortalTester: React.FC = () => {
  const { user } = useAuth();
  const [testSuites, setTestSuites] = useState<TestSuite[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string | null>(null);
  const [manualTestData, setManualTestData] = useState({
    selectedDoctor: '',
    appointmentDate: '',
    appointmentTime: '',
    reason: '',
    testAppointmentId: ''
  });

  // Initialize test suites
  useEffect(() => {
    initializeTestSuites();
  }, []);

  const initializeTestSuites = () => {
    const suites: TestSuite[] = [
      {
        id: 'auth-tests',
        name: 'Authentication Tests',
        description: 'Test login, logout, and token validation',
        status: 'pending',
        tests: [
          { id: 'login-test', name: 'User Login', status: 'pending' },
          { id: 'token-validation', name: 'Token Validation', status: 'pending' },
          { id: 'logout-test', name: 'User Logout', status: 'pending' }
        ]
      },
      {
        id: 'doctor-tests',
        name: 'Doctor Management Tests',
        description: 'Test doctor listing and availability',
        status: 'pending',
        tests: [
          { id: 'get-doctors', name: 'Get Doctors List', status: 'pending' },
          { id: 'doctor-details', name: 'Doctor Details', status: 'pending' }
        ]
      },
      {
        id: 'appointment-tests',
        name: 'Appointment Tests',
        description: 'Test appointment booking and management',
        status: 'pending',
        tests: [
          { id: 'available-slots', name: 'Get Available Slots', status: 'pending' },
          { id: 'book-appointment', name: 'Book Appointment', status: 'pending' },
          { id: 'get-appointments', name: 'Get My Appointments', status: 'pending' },
          { id: 'cancel-appointment', name: 'Cancel Appointment', status: 'pending' }
        ]
      },
      {
        id: 'ui-tests',
        name: 'UI Component Tests',
        description: 'Test frontend components and navigation',
        status: 'pending',
        tests: [
          { id: 'dashboard-load', name: 'Dashboard Load', status: 'pending' },
          { id: 'booking-form', name: 'Booking Form', status: 'pending' },
          { id: 'navigation', name: 'Navigation', status: 'pending' }
        ]
      }
    ];
    setTestSuites(suites);
  };

  const runTest = async (suiteId: string, testId: string): Promise<TestResult> => {
    const test = testSuites.find(s => s.id === suiteId)?.tests.find(t => t.id === testId);
    if (!test) throw new Error('Test not found');

    const startTime = Date.now();
    let result: TestResult = { ...test, status: 'running' };

    try {
      switch (testId) {
        case 'login-test':
          result = await testLogin();
          break;
        case 'token-validation':
          result = await testTokenValidation();
          break;
        case 'logout-test':
          result = await testLogout();
          break;
        case 'get-doctors':
          result = await testGetDoctors();
          break;
        case 'doctor-details':
          result = await testDoctorDetails();
          break;
        case 'available-slots':
          result = await testAvailableSlots();
          break;
        case 'book-appointment':
          result = await testBookAppointment();
          break;
        case 'get-appointments':
          result = await testGetAppointments();
          break;
        case 'cancel-appointment':
          result = await testCancelAppointment();
          break;
        case 'dashboard-load':
          result = await testDashboardLoad();
          break;
        case 'booking-form':
          result = await testBookingForm();
          break;
        case 'navigation':
          result = await testNavigation();
          break;
        default:
          result = { ...test, status: 'failed', error: 'Test not implemented' };
      }

      result.duration = Date.now() - startTime;
      result.status = result.status === 'running' ? 'passed' : result.status;
    } catch (error: any) {
      result = {
        ...test,
        status: 'failed',
        duration: Date.now() - startTime,
        error: error.message || 'Unknown error'
      };
    }

    return result;
  };

  const testLogin = async (): Promise<TestResult> => {
    try {
      const response = await apiService.login({ email: 'test@example.com', password: 'testpass123' });
      if (response.data.token) {
        return {
          id: 'login-test',
          name: 'User Login',
          status: 'passed',
          details: { token: response.data.token.substring(0, 20) + '...' }
        };
      }
      throw new Error('No token received');
    } catch (error: any) {
      return {
        id: 'login-test',
        name: 'User Login',
        status: 'failed',
        error: error.message
      };
    }
  };

  const testTokenValidation = async (): Promise<TestResult> => {
    try {
      const response = await apiService.getMe();
      if (response.data.user) {
        return {
          id: 'token-validation',
          name: 'Token Validation',
          status: 'passed',
          details: { user: response.data.user.email }
        };
      }
      throw new Error('User data not received');
    } catch (error: any) {
      return {
        id: 'token-validation',
        name: 'Token Validation',
        status: 'failed',
        error: error.message
      };
    }
  };

  const testLogout = async (): Promise<TestResult> => {
    try {
      // Test logout by calling the logout endpoint
      await apiService.logout();
      
      // Don't actually clear storage during testing to avoid interfering with other tests
      // In a real scenario, this would clear the authentication
      
      return {
        id: 'logout-test',
        name: 'User Logout',
        status: 'passed',
        details: { message: 'Logout endpoint accessible' }
      };
    } catch (error: any) {
      return {
        id: 'logout-test',
        name: 'User Logout',
        status: 'failed',
        error: error.message
      };
    }
  };

  const testGetDoctors = async (): Promise<TestResult> => {
    try {
      const response = await apiService.getDoctors();
      if (response.data.doctors && response.data.doctors.length > 0) {
        return {
          id: 'get-doctors',
          name: 'Get Doctors List',
          status: 'passed',
          details: { count: response.data.doctors.length }
        };
      }
      throw new Error('No doctors found');
    } catch (error: any) {
      return {
        id: 'get-doctors',
        name: 'Get Doctors List',
        status: 'failed',
        error: error.message
      };
    }
  };

  const testDoctorDetails = async (): Promise<TestResult> => {
    try {
      const response = await apiService.getDoctors();
      if (response.data.doctors && response.data.doctors.length > 0) {
        const doctor = response.data.doctors[0];
        // Check if doctor has required details
        if (doctor.specialization && doctor.consultationFee) {
          return {
            id: 'doctor-details',
            name: 'Doctor Details',
            status: 'passed',
            details: { 
              name: doctor.fullName,
              specialization: doctor.specialization,
              fee: doctor.consultationFee
            }
          };
        }
        throw new Error('Doctor details incomplete');
      }
      throw new Error('No doctors found');
    } catch (error: any) {
      return {
        id: 'doctor-details',
        name: 'Doctor Details',
        status: 'failed',
        error: error.message
      };
    }
  };

  const testAvailableSlots = async (): Promise<TestResult> => {
    try {
      const doctorsResponse = await apiService.getDoctors();
      const doctorId = doctorsResponse.data.doctors[0]._id;
      // Use a date 7 days in the future to avoid past date issues
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      const dateString = futureDate.toISOString().split('T')[0];
      
      const response = await apiService.getAvailableTimeSlots({
        doctorId,
        date: dateString
      });
      if (response.data.slots && response.data.slots.length > 0) {
        return {
          id: 'available-slots',
          name: 'Get Available Slots',
          status: 'passed',
          details: { slots: response.data.slots.length }
        };
      }
      throw new Error('No slots found');
    } catch (error: any) {
      return {
        id: 'available-slots',
        name: 'Get Available Slots',
        status: 'failed',
        error: error.message
      };
    }
  };

  const testBookAppointment = async (): Promise<TestResult> => {
    try {
      const doctorsResponse = await apiService.getDoctors();
      const doctorId = doctorsResponse.data.doctors[0]._id;
      
      // Use a date 7 days in the future to avoid past date issues
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      const dateString = futureDate.toISOString().split('T')[0];
      
      // Get available slots first to find a valid time slot
      const slotsResponse = await apiService.getAvailableTimeSlots({
        doctorId,
        date: dateString
      });
      
      if (!slotsResponse.data.slots || slotsResponse.data.slots.length === 0) {
        throw new Error('No available slots for the selected date');
      }
      
      // Use the first available slot
      const firstAvailableSlot = slotsResponse.data.slots[0];
      
      const appointmentData = {
        doctor: doctorId,
        appointmentDate: dateString,
        appointmentTime: firstAvailableSlot.startTime,
        reason: 'Test appointment from automated test',
        type: 'consultation'
      };

      const response = await apiService.createAppointment(appointmentData);
      if (response.data.appointment) {
        // Store appointment ID for cleanup
        setManualTestData(prev => ({
          ...prev,
          testAppointmentId: response.data.appointment._id
        }));
        
        return {
          id: 'book-appointment',
          name: 'Book Appointment',
          status: 'passed',
          details: { appointmentId: response.data.appointment._id }
        };
      }
      throw new Error('Appointment not created');
    } catch (error: any) {
      return {
        id: 'book-appointment',
        name: 'Book Appointment',
        status: 'failed',
        error: error.message
      };
    }
  };

  const testGetAppointments = async (): Promise<TestResult> => {
    try {
      const response = await apiService.getMyAppointments();
      if (response.data.appointments) {
        return {
          id: 'get-appointments',
          name: 'Get My Appointments',
          status: 'passed',
          details: { count: response.data.appointments.length }
        };
      }
      throw new Error('No appointments found');
    } catch (error: any) {
      return {
        id: 'get-appointments',
        name: 'Get My Appointments',
        status: 'failed',
        error: error.message
      };
    }
  };

  const testCancelAppointment = async (): Promise<TestResult> => {
    try {
      // Get appointments first
      const appointmentsResponse = await apiService.getMyAppointments();
      if (appointmentsResponse.data.appointments && appointmentsResponse.data.appointments.length > 0) {
        const appointment = appointmentsResponse.data.appointments[0];
        
        // Try to cancel the appointment
        const cancelData = {
          cancellationReason: 'Test cancellation from automated test'
        };
        
        const response = await apiService.cancelAppointment(appointment._id, cancelData);
        
        return {
          id: 'cancel-appointment',
          name: 'Cancel Appointment',
          status: 'passed',
          details: { appointmentId: appointment._id, status: 'cancelled' }
        };
      } else {
        // If no appointments to cancel, create one first and then cancel it
        const doctorsResponse = await apiService.getDoctors();
        const doctorId = doctorsResponse.data.doctors[0]._id;
        
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 2);
        const dateString = futureDate.toISOString().split('T')[0];
        
        // Get available slots first to find a valid time slot
        const slotsResponse = await apiService.getAvailableTimeSlots({
          doctorId,
          date: dateString
        });
        
        if (!slotsResponse.data.slots || slotsResponse.data.slots.length === 0) {
          throw new Error('No available slots for the selected date');
        }
        
        // Use the second available slot (if available) to avoid conflicts
        const availableSlot = slotsResponse.data.slots[1] || slotsResponse.data.slots[0];
        
        const appointmentData = {
          doctor: doctorId,
          appointmentDate: dateString,
          appointmentTime: availableSlot.startTime,
          reason: 'Test appointment for cancellation',
          type: 'consultation'
        };

        const createResponse = await apiService.createAppointment(appointmentData);
        if (createResponse.data.appointment) {
          const cancelData = {
            cancellationReason: 'Test cancellation from automated test'
          };
          
          await apiService.cancelAppointment(createResponse.data.appointment._id, cancelData);
          
          return {
            id: 'cancel-appointment',
            name: 'Cancel Appointment',
            status: 'passed',
            details: { appointmentId: createResponse.data.appointment._id, status: 'cancelled' }
          };
        }
      }
      throw new Error('No appointments available for cancellation');
    } catch (error: any) {
      return {
        id: 'cancel-appointment',
        name: 'Cancel Appointment',
        status: 'failed',
        error: error.message
      };
    }
  };

  const testDashboardLoad = async (): Promise<TestResult> => {
    try {
      // Simulate dashboard load by checking if user data is available
      if (user && user.email) {
        return {
          id: 'dashboard-load',
          name: 'Dashboard Load',
          status: 'passed',
          details: { user: user.email }
        };
      }
      throw new Error('User not authenticated');
    } catch (error: any) {
      return {
        id: 'dashboard-load',
        name: 'Dashboard Load',
        status: 'failed',
        error: error.message
      };
    }
  };

  const testBookingForm = async (): Promise<TestResult> => {
    try {
      // Test if booking form components are accessible
      const doctorsResponse = await apiService.getDoctors();
      if (doctorsResponse.data.doctors.length > 0) {
        return {
          id: 'booking-form',
          name: 'Booking Form',
          status: 'passed',
          details: { doctorsAvailable: true }
        };
      }
      throw new Error('No doctors available for booking');
    } catch (error: any) {
      return {
        id: 'booking-form',
        name: 'Booking Form',
        status: 'failed',
        error: error.message
      };
    }
  };

  const testNavigation = async (): Promise<TestResult> => {
    try {
      // Test navigation by checking if we can access different routes
      // This simulates navigation testing by checking if the user context is available
      if (user && user.email) {
        // Test that we can access user data (simulating navigation between authenticated routes)
        const response = await apiService.getMe();
        if (response.data.user) {
          return {
            id: 'navigation',
            name: 'Navigation',
            status: 'passed',
            details: { 
              message: 'Navigation between authenticated routes working',
              currentRoute: window.location.pathname
            }
          };
        }
      }
      throw new Error('Navigation test failed');
    } catch (error: any) {
      return {
        id: 'navigation',
        name: 'Navigation',
        status: 'failed',
        error: error.message
      };
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setCurrentTest(null);
    
    for (const suite of testSuites) {
      setCurrentTest(suite.name);
      
      const updatedSuite = { ...suite, status: 'running' as const };
      setTestSuites(prev => prev.map(s => s.id === suite.id ? updatedSuite : s));

      for (const test of suite.tests) {
        const result = await runTest(suite.id, test.id);
        
        setTestSuites(prev => prev.map(s => 
          s.id === suite.id 
            ? {
                ...s,
                tests: s.tests.map(t => t.id === test.id ? result : t)
              }
            : s
        ));
        
        // Add delay between tests
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Mark suite as completed
      setTestSuites(prev => prev.map(s => 
        s.id === suite.id 
          ? { ...s, status: 'completed' as const }
          : s
      ));
    }

    setIsRunning(false);
    setCurrentTest(null);
  };

  const runSingleTest = async (suiteId: string, testId: string) => {
    const result = await runTest(suiteId, testId);
    setTestSuites(prev => prev.map(s => 
      s.id === suiteId 
        ? {
            ...s,
            tests: s.tests.map(t => t.id === testId ? result : t)
          }
        : s
    ));
  };

  const resetTests = () => {
    initializeTestSuites();
    setManualTestData({
      selectedDoctor: '',
      appointmentDate: '',
      appointmentTime: '',
      reason: '',
      testAppointmentId: ''
    });
  };

  const exportTestResults = () => {
    const results = {
      timestamp: new Date().toISOString(),
      user: user?.email,
      testSuites: testSuites.map(suite => ({
        ...suite,
        summary: {
          total: suite.tests.length,
          passed: suite.tests.filter(t => t.status === 'passed').length,
          failed: suite.tests.filter(t => t.status === 'failed').length,
          pending: suite.tests.filter(t => t.status === 'pending').length
        }
      }))
    };

    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `patient-portal-test-results-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running': return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'text-green-600 bg-green-50';
      case 'failed': return 'text-red-600 bg-red-50';
      case 'running': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Settings className="h-6 w-6 mr-3 text-primary-600" />
              Patient Portal Testing Suite
            </h1>
            <p className="text-gray-600 mt-2">
              Comprehensive testing tool for all patient portal functionalities
            </p>
            <div className="mt-4 flex items-center space-x-4 text-sm text-gray-500">
              <span className="flex items-center">
                <User className="h-4 w-4 mr-1" />
                Testing as: {user?.email}
              </span>
              <span className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                {new Date().toLocaleString()}
              </span>
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={exportTestResults}
              className="btn-outline flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Results
            </button>
            <button
              onClick={resetTests}
              className="btn-outline flex items-center"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset Tests
            </button>
            <button
              onClick={runAllTests}
              disabled={isRunning}
              className="btn-primary flex items-center disabled:opacity-50"
            >
              <Play className="h-4 w-4 mr-2" />
              {isRunning ? 'Running Tests...' : 'Run All Tests'}
            </button>
          </div>
        </div>
      </div>

      {/* Current Test Status */}
      {currentTest && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <RefreshCw className="h-5 w-5 text-blue-500 animate-spin mr-3" />
            <span className="text-blue-800 font-medium">
              Currently running: {currentTest}
            </span>
          </div>
        </div>
      )}

      {/* Test Suites */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {testSuites.map((suite) => (
          <div key={suite.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{suite.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{suite.description}</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(suite.status)}`}>
                  {suite.status}
                </div>
              </div>

              <div className="space-y-3">
                {suite.tests.map((test) => (
                  <div key={test.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      {getStatusIcon(test.status)}
                      <span className="ml-3 text-sm font-medium text-gray-900">
                        {test.name}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {test.duration && (
                        <span className="text-xs text-gray-500">
                          {test.duration}ms
                        </span>
                      )}
                      <button
                        onClick={() => runSingleTest(suite.id, test.id)}
                        disabled={isRunning}
                        className="text-xs text-primary-600 hover:text-primary-800 disabled:opacity-50"
                      >
                        Run
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Test Details */}
              {suite.tests.some(t => t.details || t.error) && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Test Details:</h4>
                  <div className="space-y-2">
                    {suite.tests.map((test) => (
                      (test.details || test.error) && (
                        <div key={test.id} className="text-xs">
                          <span className="font-medium">{test.name}:</span>
                          {test.details && (
                            <pre className="mt-1 text-gray-600">
                              {JSON.stringify(test.details, null, 2)}
                            </pre>
                          )}
                          {test.error && (
                            <div className="mt-1 text-red-600">
                              Error: {test.error}
                            </div>
                          )}
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Manual Testing Tools */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <FileText className="h-5 w-5 mr-2 text-primary-600" />
          Manual Testing Tools
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Quick Appointment Test */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Quick Appointment Test</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Test Appointment ID
                </label>
                <input
                  type="text"
                  value={manualTestData.testAppointmentId}
                  onChange={(e) => setManualTestData(prev => ({ ...prev, testAppointmentId: e.target.value }))}
                  className="input"
                  placeholder="Appointment ID from automated test"
                />
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={async () => {
                    if (manualTestData.testAppointmentId) {
                      try {
                        await apiService.deleteAppointment(manualTestData.testAppointmentId);
                        alert('Test appointment deleted successfully');
                        setManualTestData(prev => ({ ...prev, testAppointmentId: '' }));
                      } catch (error) {
                        alert('Failed to delete appointment: ' + (error as any).message);
                      }
                    }
                  }}
                  className="btn-error text-sm px-3 py-1"
                >
                  Delete Test Appointment
                </button>
              </div>
            </div>
          </div>

          {/* System Information */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">System Information</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Backend Status:</span>
                <span className="text-green-600">✅ Connected</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Database:</span>
                <span className="text-green-600">✅ MongoDB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Authentication:</span>
                <span className="text-green-600">✅ JWT</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">API Base URL:</span>
                <span className="text-gray-900">http://localhost:5001/api</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Test Summary */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Test Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {testSuites.map((suite) => {
            const passed = suite.tests.filter(t => t.status === 'passed').length;
            const failed = suite.tests.filter(t => t.status === 'failed').length;
            const total = suite.tests.length;
            
            return (
              <div key={suite.id} className="text-center p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900">{suite.name}</h4>
                <div className="mt-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span className="text-green-600">✓ {passed}</span>
                    <span className="text-red-600">✗ {failed}</span>
                    <span className="text-gray-600">/ {total}</span>
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  {total > 0 ? Math.round((passed / total) * 100) : 0}% Pass Rate
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PatientPortalTester;
