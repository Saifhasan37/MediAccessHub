const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: './config.env' });

// Import the User model
const User = require('./models/User');

async function addNewDoctor() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Create a new doctor
    const newDoctor = {
      firstName: 'Emily',
      lastName: 'Davis',
      email: 'dr.emily.davis@example.com',
      password: 'doctorpass123',
      role: 'doctor',
      phone: '15550123',
      dateOfBirth: new Date('1985-03-15'),
      gender: 'female',
      specialization: 'Dermatology',
      licenseNumber: 'DERM-2024-001',
      yearsOfExperience: 7,
      consultationFee: 200,
      bio: 'Experienced dermatologist specializing in skin conditions and cosmetic dermatology.',
      isActive: true,
      address: {
        street: '123 Medical Plaza',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'United States'
      }
    };

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newDoctor.password, saltRounds);
    newDoctor.password = hashedPassword;

    // Create the doctor user
    const doctor = new User(newDoctor);
    await doctor.save();

    console.log('✅ New doctor added successfully:');
    console.log(`   Name: ${newDoctor.firstName} ${newDoctor.lastName}`);
    console.log(`   Email: ${newDoctor.email}`);
    console.log(`   Specialization: ${newDoctor.specialization}`);
    console.log(`   License: ${newDoctor.licenseNumber}`);
    console.log(`   Experience: ${newDoctor.yearsOfExperience} years`);
    console.log(`   Consultation Fee: $${newDoctor.consultationFee}`);

    // Close the connection
    await mongoose.connection.close();
    console.log('✅ Database connection closed');

  } catch (error) {
    console.error('❌ Error adding new doctor:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the function
addNewDoctor();
