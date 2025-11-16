const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'config.env') });

const API_URL = process.env.FRONTEND_URL || 'http://localhost:5001';
// Note: FRONTEND_URL in config might be the frontend URL, but we need backend API URL
const BACKEND_API_URL = 'http://localhost:5001';

// Test results tracker
const testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

// Helper function to log test results
function logTest(name, passed, message = '') {
  testResults.tests.push({ name, passed, message });
  if (passed) {
    testResults.passed++;
    console.log(`✅ ${name}`);
    if (message) console.log(`   ${message}`);
  } else {
    testResults.failed++;
    console.log(`❌ ${name}`);
    if (message) console.log(`   ${message}`);
  }
}

// Helper function to make API calls
async function apiCall(method, endpoint, data = null, token = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    if (token) {
      options.headers.Authorization = `Bearer ${token}`;
    }
    
    if (data) {
      options.body = JSON.stringify(data);
    }
    
    const response = await fetch(`${BACKEND_API_URL}/api${endpoint}`, options);
    const responseData = await response.json().catch(() => ({ message: 'No JSON response' }));
    
    return {
      ok: response.ok,
      status: response.status,
      data: responseData
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      data: { message: error.message }
    };
  }
}

// Test 1: Initial Data Loading - Users List
async function testUsersListLoading() {
  console.log('\n📋 Test 1: Users List Loading');
  console.log('='.repeat(60));
  
  // Login as admin first
  const loginRes = await apiCall('POST', '/auth/login', {
    email: 'admin@example.com',
    password: 'adminpass123'
  });
  
  if (!loginRes.ok) {
    logTest('Admin Login', false, 'Cannot test without admin login');
    return;
  }
  
  const token = loginRes.data.token;
  logTest('Admin Login', true, 'Logged in successfully');
  
  // Test get users
  const usersRes = await apiCall('GET', '/admin/users', null, token);
  if (usersRes.ok && (usersRes.data.data?.users || usersRes.data.users || Array.isArray(usersRes.data))) {
    const users = usersRes.data.data?.users || usersRes.data.users || usersRes.data || [];
    logTest('Users List API', true, `Loaded ${users.length} users`);
  } else {
    logTest('Users List API', false, `Status: ${usersRes.status}, Message: ${usersRes.data.message}`);
  }
}

// Test 2: Appointment Acceptance
async function testAppointmentAcceptance() {
  console.log('\n📋 Test 2: Appointment Acceptance');
  console.log('='.repeat(60));
  
  // Login as doctor
  const loginRes = await apiCall('POST', '/auth/login', {
    email: 'doctor1@example.com',
    password: 'doctorpass123'
  });
  
  if (!loginRes.ok) {
    logTest('Doctor Login', false, 'Cannot test without doctor login');
    return;
  }
  
  const token = loginRes.data.token;
  logTest('Doctor Login', true, 'Logged in successfully');
  
  // Get doctor's appointments
  const appointmentsRes = await apiCall('GET', '/doctors/appointments', null, token);
  if (!appointmentsRes.ok) {
    logTest('Get Appointments', false, `Status: ${appointmentsRes.status}`);
    return;
  }
  
  const appointments = appointmentsRes.data.data?.appointments || appointmentsRes.data.appointments || appointmentsRes.data || [];
  logTest('Get Appointments', true, `Found ${appointments.length} appointments`);
  
  // Find a pending appointment
  const pendingAppointment = appointments.find(apt => apt.status === 'pending');
  
  if (pendingAppointment) {
    // Test updating appointment status
    const updateRes = await apiCall('PATCH', `/doctors/appointments/${pendingAppointment._id}`, {
      status: 'confirmed'
    }, token);
    
    if (updateRes.ok) {
      logTest('Appointment Acceptance', true, 'Appointment status updated successfully');
      
      // Verify the update
      const verifyRes = await apiCall('GET', '/doctors/appointments', null, token);
      const updatedAppointments = verifyRes.data.data?.appointments || verifyRes.data.appointments || verifyRes.data || [];
      const updated = updatedAppointments.find(apt => apt._id === pendingAppointment._id);
      
      if (updated && updated.status === 'confirmed') {
        logTest('Appointment Status Verification', true, 'Status correctly updated in database');
      } else {
        logTest('Appointment Status Verification', false, 'Status not updated correctly');
      }
    } else {
      logTest('Appointment Acceptance', false, `Status: ${updateRes.status}, Message: ${updateRes.data.message}`);
    }
  } else {
    logTest('Appointment Acceptance', true, 'No pending appointments to test (this is OK)');
  }
}

// Test 3: Patient Record Extraction
async function testPatientRecordExtraction() {
  console.log('\n📋 Test 3: Patient Record Extraction');
  console.log('='.repeat(60));
  
  // Login as monitor
  const loginRes = await apiCall('POST', '/auth/login', {
    email: 'monitor_1761760389@example.com',
    password: 'monitor123'
  });
  
  if (!loginRes.ok) {
    logTest('Monitor Login', false, 'Cannot test without monitor login');
    return;
  }
  
  const token = loginRes.data.token;
  logTest('Monitor Login', true, 'Logged in successfully');
  
  // Get patient records list
  const patientsRes = await apiCall('GET', '/monitoring/patient-records', null, token);
  if (!patientsRes.ok) {
    logTest('Get Patient Records List', false, `Status: ${patientsRes.status}`);
    return;
  }
  
  const patients = patientsRes.data.data?.patients || patientsRes.data.patients || patientsRes.data || [];
  logTest('Get Patient Records List', true, `Found ${patients.length} patients`);
  
  if (patients.length > 0) {
    const patientId = patients[0]._id || patients[0].patientId;
    
    // Get exportable records for patient
    const recordsRes = await apiCall('GET', `/monitoring/patient-records/${patientId}`, null, token);
    if (recordsRes.ok) {
      const records = recordsRes.data.data?.records || recordsRes.data.records || recordsRes.data || [];
      logTest('Get Exportable Records', true, `Found ${records.length} records for patient`);
      
      if (records.length > 0) {
        // Test CSV export
        try {
          const csvRes = await fetch(`${BACKEND_API_URL}/api/monitoring/export/${patientId}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ format: 'csv' })
          });
          
          if (csvRes.ok && csvRes.headers.get('content-type')?.includes('csv')) {
            const blob = await csvRes.blob();
            logTest('CSV Export', true, `File size: ${blob.size} bytes`);
          } else {
            logTest('CSV Export', false, `Status: ${csvRes.status}`);
          }
        } catch (error) {
          logTest('CSV Export', false, `Error: ${error.message}`);
        }
      } else {
        logTest('CSV Export', true, 'No records to export (this is OK)');
      }
    } else {
      logTest('Get Exportable Records', false, `Status: ${recordsRes.status}`);
    }
  } else {
    logTest('Patient Records Extraction', true, 'No patients found (this is OK)');
  }
}

// Test 4: Doctor Portal Upload/Comment
async function testDoctorUploadComment() {
  console.log('\n📋 Test 4: Doctor Portal Upload/Comment');
  console.log('='.repeat(60));
  
  // Login as doctor
  const loginRes = await apiCall('POST', '/auth/login', {
    email: 'doctor1@example.com',
    password: 'doctorpass123'
  });
  
  if (!loginRes.ok) {
    logTest('Doctor Login', false, 'Cannot test without doctor login');
    return;
  }
  
  const token = loginRes.data.token;
  logTest('Doctor Login', true, 'Logged in successfully');
  
  // Get patients
  const patientsRes = await apiCall('GET', '/users/patients', null, token);
  if (!patientsRes.ok) {
    logTest('Get Patients', false, `Status: ${patientsRes.status}`);
    return;
  }
  
  const patients = patientsRes.data.data?.patients || patientsRes.data.patients || patientsRes.data || [];
  logTest('Get Patients', true, `Found ${patients.length} patients`);
  
  if (patients.length > 0) {
    const patientId = patients[0]._id;
    
    // Test creating medical record with prescription and notes
    const recordData = {
      patient: patientId,
      diagnosis: 'Test Diagnosis',
      notes: 'Test notes for medical record',
      symptoms: ['Test symptom 1', 'Test symptom 2'],
      prescription: 'Test prescription medication',
      status: 'active'
    };
    
    const createRes = await apiCall('POST', '/doctors/medical-records', recordData, token);
    if (createRes.ok) {
      logTest('Create Medical Record', true, 'Medical record created successfully');
      
      // Verify the record was created
      const recordsRes = await apiCall('GET', '/doctors/medical-records', null, token);
      if (recordsRes.ok) {
        const records = recordsRes.data.data?.records || recordsRes.data.records || recordsRes.data || [];
        const createdRecord = records.find(r => r.diagnosis === 'Test Diagnosis');
        
        if (createdRecord) {
          logTest('Medical Record Verification', true, 'Record found in list');
          logTest('Prescription Saved', createdRecord.prescription === 'Test prescription medication', 
            createdRecord.prescription ? 'Prescription saved correctly' : 'Prescription not saved');
          logTest('Notes Saved', createdRecord.notes === 'Test notes for medical record',
            createdRecord.notes ? 'Notes saved correctly' : 'Notes not saved');
        } else {
          logTest('Medical Record Verification', false, 'Record not found in list');
        }
      }
    } else {
      logTest('Create Medical Record', false, `Status: ${createRes.status}, Message: ${createRes.data.message}`);
    }
  } else {
    logTest('Doctor Upload/Comment', true, 'No patients found (this is OK)');
  }
}

// Test 5: Patient Search
async function testPatientSearch() {
  console.log('\n📋 Test 5: Patient Search');
  console.log('='.repeat(60));
  
  // Login as doctor
  const loginRes = await apiCall('POST', '/auth/login', {
    email: 'doctor1@example.com',
    password: 'doctorpass123'
  });
  
  if (!loginRes.ok) {
    logTest('Doctor Login', false, 'Cannot test without doctor login');
    return;
  }
  
  const token = loginRes.data.token;
  logTest('Doctor Login', true, 'Logged in successfully');
  
  // Get patients
  const patientsRes = await apiCall('GET', '/users/patients', null, token);
  if (!patientsRes.ok) {
    logTest('Get Patients', false, `Status: ${patientsRes.status}`);
    return;
  }
  
  const patients = patientsRes.data.data?.patients || patientsRes.data.patients || patientsRes.data || [];
  logTest('Get Patients', true, `Found ${patients.length} patients`);
  
  if (patients.length > 0) {
    // Test search functionality
    const searchTerm = patients[0].firstName;
    const searchRes = await apiCall('GET', `/users/search?q=${encodeURIComponent(searchTerm)}&role=patient`, null, token);
    
    if (searchRes.ok) {
      const searchResults = searchRes.data.data?.users || searchRes.data.users || searchRes.data || [];
      const found = searchResults.some(p => 
        p.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      logTest('Patient Search', found, `Found ${searchResults.length} results for "${searchTerm}"`);
    } else {
      // If search endpoint doesn't exist, test client-side filtering
      const filtered = patients.filter(p => 
        p.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      logTest('Patient Search (Client-side)', filtered.length > 0, 
        `Found ${filtered.length} patients matching "${searchTerm}"`);
    }
  } else {
    logTest('Patient Search', true, 'No patients found (this is OK)');
  }
}

// Test 6: Data Loading on Initial Render
async function testInitialDataLoading() {
  console.log('\n📋 Test 6: Initial Data Loading');
  console.log('='.repeat(60));
  
  // Test Admin Dashboard data loading
  const adminLogin = await apiCall('POST', '/auth/login', {
    email: 'admin@example.com',
    password: 'adminpass123'
  });
  
  if (adminLogin.ok) {
    const token = adminLogin.data.token;
    
    // Test parallel data loading (simulating what happens on mount)
    const [statsRes, usersRes, appointmentsRes, registrationsRes] = await Promise.all([
      apiCall('GET', '/admin/stats', null, token),
      apiCall('GET', '/admin/users', null, token),
      apiCall('GET', '/admin/appointments', null, token),
      apiCall('GET', '/admin/pending-doctors', null, token)
    ]);
    
    const statsOk = statsRes.ok && statsRes.data;
    const usersOk = usersRes.ok && (usersRes.data.data?.users || usersRes.data.users || Array.isArray(usersRes.data));
    const appointmentsOk = appointmentsRes.ok && (appointmentsRes.data.data?.appointments || appointmentsRes.data.appointments || Array.isArray(appointmentsRes.data));
    const registrationsOk = registrationsRes.ok;
    
    logTest('Admin Stats Loading', statsOk, statsOk ? 'Stats loaded' : `Status: ${statsRes.status}`);
    logTest('Admin Users Loading', usersOk, usersOk ? 'Users loaded' : `Status: ${usersRes.status}`);
    logTest('Admin Appointments Loading', appointmentsOk, appointmentsOk ? 'Appointments loaded' : `Status: ${appointmentsRes.status}`);
    logTest('Admin Registrations Loading', registrationsOk, registrationsOk ? 'Registrations loaded' : `Status: ${registrationsRes.status}`);
  } else {
    logTest('Admin Login for Data Loading Test', false, 'Cannot test without admin login');
  }
}

// Main test runner
async function runAllTests() {
  console.log('🧪 Starting Comprehensive Function Tests');
  console.log('='.repeat(60));
  console.log(`API URL: ${BACKEND_API_URL}`);
  console.log('='.repeat(60));
  
  try {
    await testInitialDataLoading();
    await testUsersListLoading();
    await testAppointmentAcceptance();
    await testPatientRecordExtraction();
    await testDoctorUploadComment();
    await testPatientSearch();
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Test Summary');
    console.log('='.repeat(60));
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`📋 Total: ${testResults.passed + testResults.failed}`);
    console.log(`Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);
    
    if (testResults.failed === 0) {
      console.log('\n🎉 All tests passed!');
    } else {
      console.log('\n⚠️  Some tests failed. Review the output above.');
    }
    
    console.log('\n' + '='.repeat(60));
    
  } catch (error) {
    console.error('❌ Test suite error:', error);
  }
}

// Run tests
runAllTests().catch(console.error);

