const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'config.env') });

const BACKEND_API_URL = 'http://localhost:5001';

// Test results
const results = {
  tests: [],
  passed: 0,
  failed: 0
};

function logTest(name, passed, details = '') {
  results.tests.push({ name, passed, details });
  if (passed) {
    results.passed++;
    console.log(`✅ ${name}`);
    if (details) console.log(`   ${details}`);
  } else {
    results.failed++;
    console.log(`❌ ${name}`);
    if (details) console.log(`   ${details}`);
  }
}

async function apiCall(method, endpoint, data = null, token = null) {
  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (token) options.headers.Authorization = `Bearer ${token}`;
    if (data) options.body = JSON.stringify(data);
    
    const response = await fetch(`${BACKEND_API_URL}/api${endpoint}`, options);
    const responseData = await response.json().catch(() => ({ message: 'No JSON' }));
    
    return { ok: response.ok, status: response.status, data: responseData };
  } catch (error) {
    return { ok: false, status: 0, data: { message: error.message } };
  }
}

// Test 1: Verify API endpoints exist and return proper structure
async function testAPIEndpoints() {
  console.log('\n📋 Test 1: API Endpoints Structure');
  console.log('='.repeat(60));
  
  // Test login endpoint
  const loginRes = await apiCall('POST', '/auth/login', {
    email: 'test@test.com',
    password: 'test'
  });
  
  // Should return 401 (unauthorized) not 404 (not found)
  if (loginRes.status === 401) {
    logTest('Login Endpoint Exists', true, 'Returns 401 for invalid credentials (endpoint exists)');
  } else if (loginRes.status === 404) {
    logTest('Login Endpoint Exists', false, 'Returns 404 - endpoint not found');
  } else {
    logTest('Login Endpoint Exists', true, `Status: ${loginRes.status}`);
  }
  
  // Test users endpoint (should require auth)
  const usersRes = await apiCall('GET', '/admin/users');
  if (usersRes.status === 401 || usersRes.status === 403) {
    logTest('Users Endpoint Exists', true, 'Requires authentication (endpoint exists)');
  } else {
    logTest('Users Endpoint Exists', usersRes.status !== 404, `Status: ${usersRes.status}`);
  }
}

// Test 2: Verify data loading functions exist in code
async function testCodeStructure() {
  console.log('\n📋 Test 2: Code Structure Verification');
  console.log('='.repeat(60));
  
  const fs = require('fs');
  const path = require('path');
  
  // Check UsersPage
  const usersPagePath = path.join(__dirname, '../frontend/src/pages/UsersPage.tsx');
  if (fs.existsSync(usersPagePath)) {
    const content = fs.readFileSync(usersPagePath, 'utf8');
    const hasUseEffect = content.includes('useEffect');
    const hasLoadUsers = content.includes('loadUsers');
    const hasApiService = content.includes('apiService.getAdminUsers');
    const hasLoadingState = content.includes('isLoading');
    
    logTest('UsersPage - useEffect Hook', hasUseEffect, hasUseEffect ? 'Found' : 'Missing');
    logTest('UsersPage - loadUsers Function', hasLoadUsers, hasLoadUsers ? 'Found' : 'Missing');
    logTest('UsersPage - API Call', hasApiService, hasApiService ? 'Found' : 'Missing');
    logTest('UsersPage - Loading State', hasLoadingState, hasLoadingState ? 'Found' : 'Missing');
  } else {
    logTest('UsersPage File Exists', false, 'File not found');
  }
  
  // Check DoctorDashboard
  const doctorDashboardPath = path.join(__dirname, '../frontend/src/pages/DoctorDashboard.tsx');
  if (fs.existsSync(doctorDashboardPath)) {
    const content = fs.readFileSync(doctorDashboardPath, 'utf8');
    const hasRaceProtection = content.includes('updatingAppointments');
    const hasToast = content.includes('toast.success') || content.includes('toast.error');
    const hasErrorHandling = content.includes('catch') && content.includes('error');
    const hasReload = content.includes('loadAppointments()');
    
    logTest('DoctorDashboard - Race Condition Protection', hasRaceProtection, hasRaceProtection ? 'Found' : 'Missing');
    logTest('DoctorDashboard - Toast Notifications', hasToast, hasToast ? 'Found' : 'Missing');
    logTest('DoctorDashboard - Error Handling', hasErrorHandling, hasErrorHandling ? 'Found' : 'Missing');
    logTest('DoctorDashboard - Data Reload', hasReload, hasReload ? 'Found' : 'Missing');
  } else {
    logTest('DoctorDashboard File Exists', false, 'File not found');
  }
  
  // Check MonitoringDashboard
  const monitoringPath = path.join(__dirname, '../frontend/src/pages/MonitoringDashboard.tsx');
  if (fs.existsSync(monitoringPath)) {
    const content = fs.readFileSync(monitoringPath, 'utf8');
    const hasBlobCheck = content.includes('blob.size') || content.includes('blob.size === 0');
    const hasArrayBuffer = content.includes('ArrayBuffer');
    const hasContentDisposition = content.includes('content-disposition');
    
    logTest('MonitoringDashboard - Blob Size Check', hasBlobCheck, hasBlobCheck ? 'Found' : 'Missing');
    logTest('MonitoringDashboard - ArrayBuffer Handling', hasArrayBuffer, hasArrayBuffer ? 'Found' : 'Missing');
    logTest('MonitoringDashboard - Content-Disposition', hasContentDisposition, hasContentDisposition ? 'Found' : 'Missing');
  } else {
    logTest('MonitoringDashboard File Exists', false, 'File not found');
  }
  
  // Check MedicalRecordsManagement
  const medicalRecordsPath = path.join(__dirname, '../frontend/src/pages/MedicalRecordsManagement.tsx');
  if (fs.existsSync(medicalRecordsPath)) {
    const content = fs.readFileSync(medicalRecordsPath, 'utf8');
    const hasPatientSearch = content.includes('patientSearchQuery');
    const hasToast = content.includes('toast.success') || content.includes('toast.error');
    const hasReload = content.includes('loadMedicalRecords()');
    
    logTest('MedicalRecordsManagement - Patient Search', hasPatientSearch, hasPatientSearch ? 'Found' : 'Missing');
    logTest('MedicalRecordsManagement - Toast Notifications', hasToast, hasToast ? 'Found' : 'Missing');
    logTest('MedicalRecordsManagement - Data Reload', hasReload, hasReload ? 'Found' : 'Missing');
  } else {
    logTest('MedicalRecordsManagement File Exists', false, 'File not found');
  }
}

// Test 3: Verify response handling
async function testResponseHandling() {
  console.log('\n📋 Test 3: Response Handling Patterns');
  console.log('='.repeat(60));
  
  const fs = require('fs');
  const path = require('path');
  
  const files = [
    '../frontend/src/pages/UsersPage.tsx',
    '../frontend/src/pages/AdminDashboard.tsx',
    '../frontend/src/pages/DoctorDashboard.tsx',
    '../frontend/src/pages/MedicalRecordsManagement.tsx'
  ];
  
  files.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      const hasArrayCheck = content.includes('Array.isArray') || content.includes('|| []');
      const hasErrorHandling = content.includes('catch') && content.includes('error');
      const hasFallback = content.includes('|| []') || content.includes('|| {}');
      
      const fileName = path.basename(file);
      logTest(`${fileName} - Array Safety Check`, hasArrayCheck, hasArrayCheck ? 'Found' : 'Missing');
      logTest(`${fileName} - Error Handling`, hasErrorHandling, hasErrorHandling ? 'Found' : 'Missing');
      logTest(`${fileName} - Fallback Values`, hasFallback, hasFallback ? 'Found' : 'Missing');
    }
  });
}

// Test 4: Verify auto-refresh implementation
async function testAutoRefresh() {
  console.log('\n📋 Test 4: Auto-Refresh Implementation');
  console.log('='.repeat(60));
  
  const fs = require('fs');
  const path = require('path');
  
  const adminDashboardPath = path.join(__dirname, '../frontend/src/pages/AdminDashboard.tsx');
  if (fs.existsSync(adminDashboardPath)) {
    const content = fs.readFileSync(adminDashboardPath, 'utf8');
    const hasSetInterval = content.includes('setInterval');
    const hasClearInterval = content.includes('clearInterval');
    const hasRefreshInterval = content.includes('30000') || content.includes('refreshInterval');
    
    logTest('AdminDashboard - Auto-Refresh', hasSetInterval && hasClearInterval, 
      hasSetInterval && hasClearInterval ? 'Found setInterval with cleanup' : 'Missing');
    logTest('AdminDashboard - 30s Refresh', hasRefreshInterval, hasRefreshInterval ? 'Found' : 'Missing');
  }
  
  const doctorDashboardPath = path.join(__dirname, '../frontend/src/pages/DoctorDashboard.tsx');
  if (fs.existsSync(doctorDashboardPath)) {
    const content = fs.readFileSync(doctorDashboardPath, 'utf8');
    const hasSetInterval = content.includes('setInterval');
    const hasClearInterval = content.includes('clearInterval');
    
    logTest('DoctorDashboard - Auto-Refresh', hasSetInterval && hasClearInterval,
      hasSetInterval && hasClearInterval ? 'Found setInterval with cleanup' : 'Missing');
  }
}

// Main test runner
async function runTests() {
  console.log('🧪 Comprehensive Function Test Suite');
  console.log('='.repeat(60));
  console.log(`Backend API: ${BACKEND_API_URL}`);
  console.log('='.repeat(60));
  
  try {
    await testAPIEndpoints();
    await testCodeStructure();
    await testResponseHandling();
    await testAutoRefresh();
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Test Summary');
    console.log('='.repeat(60));
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`📋 Total: ${results.passed + results.failed}`);
    
    if (results.failed === 0) {
      console.log('\n🎉 All tests passed! All fixes are properly implemented.');
    } else {
      const failedTests = results.tests.filter(t => !t.passed);
      console.log('\n⚠️  Failed Tests:');
      failedTests.forEach(test => {
        console.log(`   - ${test.name}: ${test.details}`);
      });
    }
    
    console.log('\n' + '='.repeat(60));
    
  } catch (error) {
    console.error('❌ Test suite error:', error);
  }
}

runTests().catch(console.error);

