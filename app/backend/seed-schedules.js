const mongoose = require('mongoose');
const Schedule = require('./models/Schedule');
const User = require('./models/User');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'config.env') });

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

const createTestSchedules = async () => {
  try {
    // Get all doctors
    const doctors = await User.find({ role: 'doctor' });
    console.log(`Found ${doctors.length} doctors`);

    if (doctors.length === 0) {
      console.log('No doctors found. Please create doctors first.');
      return;
    }

    // Create schedules for the next 30 days for each doctor
    const schedules = [];
    const today = new Date();
    
    for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
      const scheduleDate = new Date(today);
      scheduleDate.setDate(today.getDate() + dayOffset);
      
      // Skip weekends for some doctors
      const dayOfWeek = scheduleDate.getDay();
      
      for (const doctor of doctors) {
        // Skip weekends for most doctors (except emergency doctors)
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          if (!doctor.specialization.toLowerCase().includes('emergency')) {
            continue;
          }
        }

        // Create time slots for the day (9 AM to 5 PM, 30-minute slots)
        const timeSlots = [];
        for (let hour = 9; hour < 17; hour++) {
          for (let minute = 0; minute < 60; minute += 30) {
            const startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            const endTime = minute === 30 ? `${(hour + 1).toString().padStart(2, '0')}:00` : `${hour.toString().padStart(2, '0')}:30`;
            
            timeSlots.push({
              startTime,
              endTime,
              isAvailable: true,
              appointmentType: 'consultation',
              maxPatients: 1,
              currentPatients: 0
            });
          }
        }

        // Create lunch break (12:00 - 13:00)
        const lunchBreakIndex = timeSlots.findIndex(slot => slot.startTime === '12:00');
        if (lunchBreakIndex !== -1) {
          // Remove lunch break slots
          timeSlots.splice(lunchBreakIndex, 2);
        }

        const schedule = new Schedule({
          doctor: doctor._id,
          date: scheduleDate,
          timeSlots,
          isWorkingDay: true,
          workingHours: {
            start: '09:00',
            end: '17:00'
          },
          appointmentDuration: 30,
          consultationFee: doctor.consultationFee || 100,
          status: 'active',
          createdBy: doctor._id
        });

        schedules.push(schedule);
      }
    }

    // Clear existing schedules first
    await Schedule.deleteMany({});
    console.log('Cleared existing schedules');

    // Insert new schedules
    await Schedule.insertMany(schedules);
    console.log(`Created ${schedules.length} schedules`);

    console.log('✅ Schedule seeding completed successfully!');
  } catch (error) {
    console.error('Error creating schedules:', error);
  }
};

const seedSchedules = async () => {
  await connectDB();
  await createTestSchedules();
  mongoose.connection.close();
};

// Run if called directly
if (require.main === module) {
  seedSchedules();
}

module.exports = { createTestSchedules };
