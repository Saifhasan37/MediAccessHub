const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: './config.env' });

// Import the User model
const User = require('./models/User');

async function addNewPatient() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Create a new patient
    const newPatient = {
      firstName: 'Alice',
      lastName: 'Johnson',
      email: 'alice.johnson@example.com',
      password: 'patientpass123',
      role: 'patient',
      phone: '15551234',
      dateOfBirth: new Date('1990-08-20'),
      subscriptionType: 'basic',
      gender: 'female',
      isActive: true,
      address: {
        street: '456 Oak Street',
        city: 'New York',
        state: 'NY',
        zipCode: '10002',
        country: 'United States'
      },
      emergencyContact: {
        name: 'Bob Johnson',
        phone: '15551235',
        relationship: 'Spouse'
      },
      insuranceProvider: 'Blue Cross Blue Shield',
      insuranceNumber: 'BCBS123456789',
      allergies: ['Penicillin', 'Shellfish'],
      currentMedications: ['Vitamin D', 'Omega-3'],
      medicalHistory: ['Annual physicals', 'No major surgeries']
    };

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPatient.password, saltRounds);
    newPatient.password = hashedPassword;

    // Create the patient user
    const patient = new User(newPatient);
    await patient.save();

    console.log('✅ New patient added successfully:');
    console.log(`   Name: ${newPatient.firstName} ${newPatient.lastName}`);
    console.log(`   Email: ${newPatient.email}`);
    console.log(`   Phone: ${newPatient.phone}`);
    console.log(`   Date of Birth: ${newPatient.dateOfBirth.toDateString()}`);
    console.log(`   Subscription: ${newPatient.subscriptionType}`);
    console.log(`   Insurance: ${newPatient.insuranceProvider}`);
    console.log(`   Allergies: ${newPatient.allergies.join(', ')}`);
    console.log(`   Current Medications: ${newPatient.currentMedications.join(', ')}`);

    // Close the connection
    await mongoose.connection.close();
    console.log('✅ Database connection closed');

  } catch (error) {
    console.error('❌ Error adding new patient:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the function
addNewPatient();


