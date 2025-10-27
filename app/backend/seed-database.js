const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Appointment = require('./models/Appointment');
const Schedule = require('./models/Schedule');
const MedicalRecord = require('./models/MedicalRecord');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, './config.env') });

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`Connected to MongoDB`);
  } catch (error) {
    console.error(`Database connection error: ${error}`);
    process.exit(1);
  }
};

const seedDatabase = async () => {
  try {
    await connectDB();

    // Clear existing data
    await User.deleteMany({});
    await Appointment.deleteMany({});
    await Schedule.deleteMany({});
    await MedicalRecord.deleteMany({});

    console.log('Cleared existing data');

    // Create admin user
    const adminPassword = await bcrypt.hash('adminpass123', 12);
    const admin = new User({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      password: adminPassword,
      role: 'admin',
      isActive: true,
      gender: 'other',
      phone: '5550000',
      dateOfBirth: '1980-01-01'
    });
    await admin.save();
    console.log('Created admin user');

    // Create doctor users
    const doctors = [
      {
        firstName: 'John',
        lastName: 'Smith',
        email: 'doctor1@example.com',
        password: await bcrypt.hash('doctorpass123', 12),
        role: 'doctor',
        specialization: 'Cardiology',
        licenseNumber: 'DOC001',
        yearsOfExperience: 10,
        isActive: true,
        gender: 'male',
        phone: '5551001',
        dateOfBirth: '1975-03-15',
        consultationFee: 150
      },
      {
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'doctor2@example.com',
        password: await bcrypt.hash('doctorpass123', 12),
        role: 'doctor',
        specialization: 'Neurology',
        licenseNumber: 'DOC002',
        yearsOfExperience: 8,
        isActive: true,
        gender: 'female',
        phone: '5551002',
        dateOfBirth: '1980-07-22',
        consultationFee: 175
      },
      {
        firstName: 'Michael',
        lastName: 'Brown',
        email: 'doctor3@example.com',
        password: await bcrypt.hash('doctorpass123', 12),
        role: 'doctor',
        specialization: 'Pediatrics',
        licenseNumber: 'DOC003',
        yearsOfExperience: 15,
        isActive: true,
        gender: 'male',
        phone: '5551003',
        dateOfBirth: '1970-11-08',
        consultationFee: 125
      }
    ];

    const createdDoctors = [];
    for (const doctorData of doctors) {
      const doctor = new User(doctorData);
      await doctor.save();
      createdDoctors.push(doctor);
      console.log(`Created doctor: ${doctor.firstName} ${doctor.lastName}`);
    }

    // Create patient users
    const patients = [
      {
        firstName: 'Alice',
        lastName: 'Williams',
        email: 'patient1@example.com',
        password: await bcrypt.hash('patientpass123', 12),
        role: 'patient',
        isActive: true,
        gender: 'female',
        dateOfBirth: '1990-05-15',
        phone: '5550101'
      },
      {
        firstName: 'Bob',
        lastName: 'Davis',
        email: 'patient2@example.com',
        password: await bcrypt.hash('patientpass123', 12),
        role: 'patient',
        isActive: true,
        gender: 'male',
        dateOfBirth: '1985-12-03',
        phone: '5550102'
      },
      {
        firstName: 'Carol',
        lastName: 'Miller',
        email: 'patient3@example.com',
        password: await bcrypt.hash('patientpass123', 12),
        role: 'patient',
        isActive: true,
        gender: 'female',
        dateOfBirth: '1992-08-22',
        phone: '5550103'
      }
    ];

    const createdPatients = [];
    for (const patientData of patients) {
      const patient = new User(patientData);
      await patient.save();
      createdPatients.push(patient);
      console.log(`Created patient: ${patient.firstName} ${patient.lastName}`);
    }

    console.log('Skipping complex data creation for now - users created successfully');

    console.log('\n✅ Database seeded successfully!');
    console.log('\n📋 Test Credentials:');
    console.log('Admin: admin@example.com / adminpass123');
    console.log('Doctor 1: doctor1@example.com / doctorpass123');
    console.log('Doctor 2: doctor2@example.com / doctorpass123');
    console.log('Doctor 3: doctor3@example.com / doctorpass123');
    console.log('Patient 1: patient1@example.com / patientpass123');
    console.log('Patient 2: patient2@example.com / patientpass123');
    console.log('Patient 3: patient3@example.com / patientpass123');

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    mongoose.connection.close();
  }
};

seedDatabase();