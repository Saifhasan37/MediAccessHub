const mongoose = require('mongoose');
require('dotenv').config({ path: './config.env' });

// Import the User model
const User = require('./models/User');

async function checkPatient() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find the patient
    const patient = await User.findOne({ email: 'alice.johnson@example.com' }).select('+password');
    
    if (!patient) {
      console.log('❌ Patient not found!');
      await mongoose.connection.close();
      return;
    }

    console.log(`✅ Found patient: ${patient.firstName} ${patient.lastName}`);
    console.log(`   Email: ${patient.email}`);
    console.log(`   Role: ${patient.role}`);
    console.log(`   Password hash: ${patient.password.substring(0, 20)}...`);
    console.log(`   Is Active: ${patient.isActive}`);

    // Test password comparison
    const bcrypt = require('bcryptjs');
    const isPasswordValid = await bcrypt.compare('patientpass123', patient.password);
    console.log(`   Password validation: ${isPasswordValid}`);

    // Close the connection
    await mongoose.connection.close();
    console.log('✅ Database connection closed');

  } catch (error) {
    console.error('❌ Error checking patient:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the function
checkPatient();


