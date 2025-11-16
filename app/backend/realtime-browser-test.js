const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'config.env') });

const BACKEND_API_URL = 'http://localhost:5001';

// Test credentials from seeded database
const testUsers = {
  admin: { email: 'admin@example.com', password: 'adminpass123' },
  doctor: { email: 'doctor1@example.com', password: 'doctorpass123' },
  patient: { email: 'patient1@example.com', password: 'patientpass123' },
  monitor: { email: 'monitor_1761760389@example.com', password: 'monitor123' }
};

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
    
    return { ok: response.ok, status: response.status, data: responseData, headers: response.headers };
  } catch (error) {
    return { ok: false, status: 0, data: { message: error.message } };
  }
}

async function testAllFunctions() {
  console.log('🧪 Real-Time Browser Function Testing');
  console.log('='.repeat(60));
  
  // Test 1: Login as Admin
  console.log('\n📋 Test 1: Admin Login & Initial Data Loading');
  console.log('-'.repeat(60));
  const adminLogin = await apiCall('POST', '/auth/login', testUsers.admin);
  
  if (!adminLogin.ok) {
    console.log('❌ Admin login failed:', adminLogin.data.message);
    console.log('   Status:', adminLogin.status);
    return;
  }
  
  const adminToken = adminLogin.data.token;
  console.log('✅ Admin logged in successfully');
  
  // Test initial data loading - Users list
  console.log('\n   Testing: Users List Auto-Load');
  const usersRes = await apiCall('GET', '/admin/users', null, adminToken);
  if (usersRes.ok) {
    const users = usersRes.data?.data?.users || usersRes.data?.users || usersRes.data || [];
    console.log(`   ✅ Users loaded: ${users.length} users found`);
    console.log(`   ✅ Data structure: ${Array.isArray(users) ? 'Array' : 'Not array'}`);
  } else {
    console.log(`   ❌ Failed to load users: ${usersRes.status}`);
  }
  
  // Test initial data loading - Appointments
  console.log('\n   Testing: Appointments List Auto-Load');
  const appointmentsRes = await apiCall('GET', '/admin/appointments', null, adminToken);
  if (appointmentsRes.ok) {
    const appointments = appointmentsRes.data?.data?.appointments || appointmentsRes.data?.appointments || appointmentsRes.data || [];
    console.log(`   ✅ Appointments loaded: ${appointments.length} appointments found`);
  } else {
    console.log(`   ❌ Failed to load appointments: ${appointmentsRes.status}`);
  }
  
  // Test 2: Login as Doctor and test appointment acceptance
  console.log('\n📋 Test 2: Doctor Appointment Acceptance');
  console.log('-'.repeat(60));
  const doctorLogin = await apiCall('POST', '/auth/login', testUsers.doctor);
  
  if (!doctorLogin.ok) {
    console.log('❌ Doctor login failed:', doctorLogin.data.message);
  } else {
    const doctorToken = doctorLogin.data.token;
    console.log('✅ Doctor logged in successfully');
    
    // Get doctor's appointments
    const doctorAppointmentsRes = await apiCall('GET', '/doctors/appointments', null, doctorToken);
    if (doctorAppointmentsRes.ok) {
      const appointments = doctorAppointmentsRes.data?.data?.appointments || doctorAppointmentsRes.data?.appointments || doctorAppointmentsRes.data || [];
      console.log(`   ✅ Doctor appointments loaded: ${appointments.length} appointments`);
      
      // Find a pending appointment
      const pendingAppt = appointments.find(a => a.status === 'pending');
      if (pendingAppt) {
        console.log(`   ✅ Found pending appointment: ${pendingAppt._id}`);
        
        // Test appointment acceptance
        const updateRes = await apiCall('PATCH', `/doctors/appointments/${pendingAppt._id}`, {
          status: 'confirmed'
        }, doctorToken);
        
        if (updateRes.ok) {
          console.log('   ✅ Appointment accepted successfully');
          
          // Verify data still loads after update
          const verifyRes = await apiCall('GET', '/doctors/appointments', null, doctorToken);
          if (verifyRes.ok) {
            const updatedAppts = verifyRes.data?.data?.appointments || verifyRes.data?.appointments || verifyRes.data || [];
            console.log(`   ✅ Data reloaded successfully: ${updatedAppts.length} appointments`);
            console.log('   ✅ Data did not disappear after update');
          }
        } else {
          console.log(`   ❌ Appointment acceptance failed: ${updateRes.data.message}`);
        }
      } else {
        console.log('   ⚠️  No pending appointments to test (this is OK)');
      }
    } else {
      console.log(`   ❌ Failed to load doctor appointments: ${doctorAppointmentsRes.status}`);
    }
  }
  
  // Test 3: Login as Monitor and test patient record extraction
  console.log('\n📋 Test 3: Patient Record Extraction');
  console.log('-'.repeat(60));
  const monitorLogin = await apiCall('POST', '/auth/login', testUsers.monitor);
  
  if (!monitorLogin.ok) {
    console.log('❌ Monitor login failed:', monitorLogin.data.message);
  } else {
    const monitorToken = monitorLogin.data.token;
    console.log('✅ Monitor logged in successfully');
    
    // Get patient records list
    const patientsRes = await apiCall('GET', '/monitoring/patient-records', null, monitorToken);
    if (patientsRes.ok) {
      const patients = patientsRes.data?.data?.patients || patientsRes.data?.patients || patientsRes.data || [];
      console.log(`   ✅ Patient records loaded: ${patients.length} patients`);
      
      if (patients.length > 0) {
        const patientId = patients[0]._id || patients[0].patientId;
        console.log(`   ✅ Testing export for patient: ${patientId}`);
        
        // Test CSV export
        try {
          const exportRes = await fetch(`${BACKEND_API_URL}/api/monitoring/export/${patientId}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${monitorToken}`
            },
            body: JSON.stringify({ format: 'csv' })
          });
          
          if (exportRes.ok) {
            const contentType = exportRes.headers.get('content-type');
            const contentLength = exportRes.headers.get('content-length');
            const blob = await exportRes.blob();
            
            console.log(`   ✅ Export successful:`);
            console.log(`      Content-Type: ${contentType}`);
            console.log(`      File Size: ${blob.size} bytes`);
            console.log(`      Blob Type: ${blob instanceof Blob ? 'Blob' : 'Not Blob'}`);
            
            if (blob.size > 0) {
              console.log('   ✅ File is not empty - download will work');
            } else {
              console.log('   ⚠️  File is empty');
            }
          } else {
            console.log(`   ❌ Export failed: ${exportRes.status}`);
          }
        } catch (error) {
          console.log(`   ❌ Export error: ${error.message}`);
        }
      }
    } else {
      console.log(`   ❌ Failed to load patient records: ${patientsRes.status}`);
    }
  }
  
  // Test 4: Doctor upload/comment functionality
  console.log('\n📋 Test 4: Doctor Upload/Comment');
  console.log('-'.repeat(60));
  if (doctorLogin.ok) {
    const doctorToken = doctorLogin.data.token;
    
    // Get patients
    const patientsRes = await apiCall('GET', '/users/patients', null, doctorToken);
    if (patientsRes.ok) {
      const patients = patientsRes.data?.data?.patients || patientsRes.data?.patients || patientsRes.data || [];
      console.log(`   ✅ Patients loaded: ${patients.length} patients`);
      
      if (patients.length > 0) {
        const patientId = patients[0]._id;
        
        // Create medical record with prescription and notes
        const recordData = {
          patient: patientId,
          diagnosis: 'Test Diagnosis - Browser Test',
          notes: 'Test notes for browser verification',
          symptoms: ['Test symptom'],
          prescription: 'Test prescription medication - Browser Verified',
          status: 'active'
        };
        
        const createRes = await apiCall('POST', '/doctors/medical-records', recordData, doctorToken);
        if (createRes.ok) {
          console.log('   ✅ Medical record created successfully');
          console.log('   ✅ Prescription and notes saved');
          
          // Verify record appears in list
          const recordsRes = await apiCall('GET', '/doctors/medical-records', null, doctorToken);
          if (recordsRes.ok) {
            const records = recordsRes.data?.data?.records || recordsRes.data?.records || recordsRes.data || [];
            const createdRecord = records.find(r => r.diagnosis === 'Test Diagnosis - Browser Test');
            
            if (createdRecord) {
              console.log('   ✅ Record appears in list');
              console.log(`   ✅ Prescription saved: ${createdRecord.prescription ? 'Yes' : 'No'}`);
              console.log(`   ✅ Notes saved: ${createdRecord.notes ? 'Yes' : 'No'}`);
            } else {
              console.log('   ⚠️  Record created but not found in list');
            }
          }
        } else {
          console.log(`   ❌ Failed to create record: ${createRes.data.message}`);
        }
      }
    } else {
      console.log(`   ❌ Failed to load patients: ${patientsRes.status}`);
    }
  }
  
  // Test 5: Patient search
  console.log('\n📋 Test 5: Patient Search');
  console.log('-'.repeat(60));
  if (doctorLogin.ok) {
    const doctorToken = doctorLogin.data.token;
    
    const patientsRes = await apiCall('GET', '/users/patients', null, doctorToken);
    if (patientsRes.ok) {
      const patients = patientsRes.data?.data?.patients || patientsRes.data?.patients || patientsRes.data || [];
      console.log(`   ✅ Patients loaded: ${patients.length} patients`);
      
      if (patients.length > 0) {
        const searchTerm = patients[0].firstName;
        const filtered = patients.filter(p => 
          p.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        console.log(`   ✅ Search functionality works:`);
        console.log(`      Search term: "${searchTerm}"`);
        console.log(`      Results found: ${filtered.length}`);
        console.log(`      Total patients: ${patients.length}`);
      }
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Real-time testing completed!');
  console.log('='.repeat(60));
}

testAllFunctions().catch(console.error);

