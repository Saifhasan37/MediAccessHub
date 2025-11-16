const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'config.env') });

const API_URL = process.env.FRONTEND_URL || 'http://localhost:5001';

// Test data for concurrent registrations
const doctors = [
  {
    firstName: 'Concurrent',
    lastName: 'Doctor1',
    email: 'concurrent.doctor1@test.com',
    password: 'doctorpass123',
    role: 'doctor',
    specialization: 'Cardiology',
    licenseNumber: 'LIC123456',
    yearsOfExperience: 10,
    consultationFee: 100,
    phone: '1234567890',
    dateOfBirth: '1980-01-01',
    gender: 'male',
    address: '123 Test St'
  },
  {
    firstName: 'Concurrent',
    lastName: 'Doctor2',
    email: 'concurrent.doctor2@test.com',
    password: 'doctorpass123',
    role: 'doctor',
    specialization: 'Pediatrics',
    licenseNumber: 'LIC123457',
    yearsOfExperience: 8,
    consultationFee: 90,
    phone: '1234567891',
    dateOfBirth: '1985-02-02',
    gender: 'female',
    address: '124 Test St'
  }
];

const patients = [
  {
    firstName: 'Concurrent',
    lastName: 'Patient1',
    email: 'concurrent.patient1@test.com',
    password: 'patientpass123',
    role: 'patient',
    phone: '1234567892',
    dateOfBirth: '1990-03-03',
    gender: 'male',
    address: '125 Test St'
  },
  {
    firstName: 'Concurrent',
    lastName: 'Patient2',
    email: 'concurrent.patient2@test.com',
    password: 'patientpass123',
    role: 'patient',
    phone: '1234567893',
    dateOfBirth: '1991-04-04',
    gender: 'female',
    address: '126 Test St'
  },
  {
    firstName: 'Concurrent',
    lastName: 'Patient3',
    email: 'concurrent.patient3@test.com',
    password: 'patientpass123',
    role: 'patient',
    phone: '1234567894',
    dateOfBirth: '1992-05-05',
    gender: 'male',
    address: '127 Test St'
  },
  {
    firstName: 'Concurrent',
    lastName: 'Patient4',
    email: 'concurrent.patient4@test.com',
    password: 'patientpass123',
    role: 'patient',
    phone: '1234567895',
    dateOfBirth: '1993-06-06',
    gender: 'female',
    address: '128 Test St'
  }
];

// Function to register a user
async function registerUser(userData, userType) {
  const startTime = Date.now();
  try {
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    const endTime = Date.now();
    const duration = endTime - startTime;
    const data = await response.json();
    
    return {
      success: response.ok,
      userType,
      email: userData.email,
      duration: `${duration}ms`,
      status: response.status,
      message: data?.message || (response.ok ? 'Success' : 'Failed')
    };
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    return {
      success: false,
      userType,
      email: userData.email,
      duration: `${duration}ms`,
      status: 'N/A',
      message: error.message,
      error: error.message
    };
  }
}

// Function to login a user
async function loginUser(email, password, userType) {
  const startTime = Date.now();
  try {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const endTime = Date.now();
    const duration = endTime - startTime;
    const data = await response.json();
    
    return {
      success: response.ok,
      userType,
      email,
      duration: `${duration}ms`,
      token: data?.token ? 'Received' : 'Missing',
      role: data?.user?.role || 'N/A'
    };
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    return {
      success: false,
      userType,
      email,
      duration: `${duration}ms`,
      status: 'N/A',
      message: error.message
    };
  }
}

// Main concurrency test
async function runConcurrencyTest() {
  console.log('🚀 Starting Concurrency Test...\n');
  console.log('='.repeat(60));
  console.log('Testing Concurrent Registrations');
  console.log('='.repeat(60));
  
  // Test 1: Concurrent Doctor Registrations
  console.log('\n📋 Test 1: Registering 2 Doctors Concurrently...\n');
  const doctorPromises = doctors.map(doctor => registerUser(doctor, 'Doctor'));
  const doctorResults = await Promise.all(doctorPromises);
  
  doctorResults.forEach((result, index) => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} Doctor ${index + 1}: ${result.email}`);
    console.log(`   Status: ${result.status} | Duration: ${result.duration}`);
    if (!result.success) {
      console.log(`   Error: ${result.message}`);
    }
  });
  
  // Wait a bit before patient registrations
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Test 2: Concurrent Patient Registrations
  console.log('\n📋 Test 2: Registering 4 Patients Concurrently...\n');
  const patientPromises = patients.map(patient => registerUser(patient, 'Patient'));
  const patientResults = await Promise.all(patientPromises);
  
  patientResults.forEach((result, index) => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} Patient ${index + 1}: ${result.email}`);
    console.log(`   Status: ${result.status} | Duration: ${result.duration}`);
    if (!result.success) {
      console.log(`   Error: ${result.message}`);
    }
  });
  
  // Wait a bit before login tests
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Test 3: Concurrent Logins
  console.log('\n📋 Test 3: Testing Concurrent Logins...\n');
  
  const allUsers = [
    ...doctors.map(d => ({ email: d.email, password: d.password, type: 'Doctor' })),
    ...patients.map(p => ({ email: p.email, password: p.password, type: 'Patient' }))
  ];
  
  const loginPromises = allUsers.map(user => 
    loginUser(user.email, user.password, user.type)
  );
  const loginResults = await Promise.all(loginPromises);
  
  loginResults.forEach((result, index) => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.userType} Login: ${result.email}`);
    console.log(`   Duration: ${result.duration} | Token: ${result.token || 'N/A'}`);
    if (!result.success) {
      console.log(`   Error: ${result.message}`);
    }
  });
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary');
  console.log('='.repeat(60));
  
  const doctorSuccess = doctorResults.filter(r => r.success).length;
  const patientSuccess = patientResults.filter(r => r.success).length;
  const loginSuccess = loginResults.filter(r => r.success).length;
  
  console.log(`\nDoctor Registrations: ${doctorSuccess}/${doctors.length} successful`);
  console.log(`Patient Registrations: ${patientSuccess}/${patients.length} successful`);
  console.log(`Logins: ${loginSuccess}/${allUsers.length} successful`);
  
  const totalSuccess = doctorSuccess + patientSuccess + loginSuccess;
  const totalTests = doctors.length + patients.length + allUsers.length;
  
  console.log(`\nOverall: ${totalSuccess}/${totalTests} operations successful`);
  
  if (totalSuccess === totalTests) {
    console.log('\n✅ All concurrent operations completed successfully!');
  } else {
    console.log('\n⚠️  Some operations failed. Check the errors above.');
  }
  
  // Calculate average response times
  const allDurations = [
    ...doctorResults.map(r => parseInt(r.duration)),
    ...patientResults.map(r => parseInt(r.duration)),
    ...loginResults.map(r => parseInt(r.duration))
  ].filter(d => !isNaN(d));
  
  if (allDurations.length > 0) {
    const avgDuration = allDurations.reduce((a, b) => a + b, 0) / allDurations.length;
    const maxDuration = Math.max(...allDurations);
    const minDuration = Math.min(...allDurations);
    
    console.log(`\n⏱️  Performance Metrics:`);
    console.log(`   Average Response Time: ${avgDuration.toFixed(2)}ms`);
    console.log(`   Fastest Response: ${minDuration}ms`);
    console.log(`   Slowest Response: ${maxDuration}ms`);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Concurrency test completed!\n');
}

// Run the test
runConcurrencyTest().catch(error => {
  console.error('❌ Test failed with error:', error.message);
  process.exit(1);
});

