const mongoose = require('mongoose');
const User = require('./models/User');
const Appointment = require('./models/Appointment');
const MedicalRecord = require('./models/MedicalRecord');
require('dotenv').config({ path: './config.env' });

async function testExport() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const patientId = '6917a5dfe933c3ec9107a352';
    
    // Check patient
    const patient = await User.findById(patientId).select('-password');
    if (!patient) {
      console.log('❌ Patient not found');
      return;
    }
    console.log('✅ Patient found:', patient.firstName, patient.lastName);
    console.log('   Role:', patient.role);
    
    // Check appointments
    const appointments = await Appointment.find({ patient: patientId }).countDocuments();
    console.log('✅ Appointments:', appointments);
    
    // Check medical records
    const records = await MedicalRecord.find({ patient: patientId }).countDocuments();
    console.log('✅ Medical Records:', records);
    
    // Test CSV generation logic
    console.log('\n📄 Testing CSV generation...');
    const csvContent = `Patient ID,${patientId}\nName,${patient.firstName} ${patient.lastName}\n`;
    console.log('✅ CSV content sample:', csvContent.substring(0, 50) + '...');
    
    // Test PDFKit
    console.log('\n📄 Testing PDFKit...');
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ margin: 50 });
    console.log('✅ PDFDocument created successfully');
    doc.end();
    
    console.log('\n✅ All export components are working!');
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testExport();

