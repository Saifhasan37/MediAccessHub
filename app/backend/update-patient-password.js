const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: './config.env' });

// Import the User model
const User = require('./models/User');

async function updatePatientPassword() {
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

    // Update the password
    const newPassword = 'patientpass123';
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    patient.password = hashedPassword;
    await patient.save();

    console.log('✅ Patient password updated successfully');
    console.log(`   Email: ${patient.email}`);
    console.log(`   New password: ${newPassword}`);

    // Close the connection
    await mongoose.connection.close();
    console.log('✅ Database connection closed');

  } catch (error) {
    console.error('❌ Error updating patient password:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the function
updatePatientPassword();


