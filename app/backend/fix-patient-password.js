const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: './config.env' });

// Import the User model
const User = require('./models/User');

async function fixPatientPassword() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find the patient
    const patient = await User.findOne({ email: 'alice.johnson@example.com' });
    
    if (!patient) {
      console.log('❌ Patient not found!');
      await mongoose.connection.close();
      return;
    }

    console.log(`✅ Found patient: ${patient.firstName} ${patient.lastName}`);

    // Set the password directly without hashing (the pre-save middleware will hash it)
    patient.password = 'patientpass123';
    await patient.save();

    console.log('✅ Patient password fixed successfully');

    // Verify the password
    const isPasswordValid = await patient.comparePassword('patientpass123');
    console.log(`   Password validation: ${isPasswordValid}`);

    // Close the connection
    await mongoose.connection.close();
    console.log('✅ Database connection closed');

  } catch (error) {
    console.error('❌ Error fixing patient password:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the function
fixPatientPassword();


