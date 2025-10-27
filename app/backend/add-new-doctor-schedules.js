const mongoose = require('mongoose');
require('dotenv').config({ path: './config.env' });

// Import the models
const User = require('./models/User');
const Schedule = require('./models/Schedule');

async function addNewDoctorSchedules() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find the new doctor
    const doctor = await User.findOne({ email: 'dr.emily.davis@example.com' });
    
    if (!doctor) {
      console.log('❌ Doctor not found!');
      await mongoose.connection.close();
      return;
    }

    console.log(`✅ Found doctor: ${doctor.firstName} ${doctor.lastName}`);

    // Clear existing schedules for this doctor
    await Schedule.deleteMany({ doctor: doctor._id });
    console.log('✅ Cleared existing schedules for the new doctor');

    // Create schedules for the next 30 days
    const schedules = [];
    const today = new Date();
    
    for (let i = 1; i <= 30; i++) {
      const scheduleDate = new Date(today);
      scheduleDate.setDate(today.getDate() + i);
      
      // Skip weekends (Saturday = 6, Sunday = 0)
      if (scheduleDate.getDay() === 0 || scheduleDate.getDay() === 6) {
        continue;
      }

      // Create time slots from 9:00 AM to 5:00 PM with 30-minute intervals
      const timeSlots = [];
      for (let hour = 9; hour < 17; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          let endHour = hour;
          let endMinute = minute + 30;
          
          if (endMinute >= 60) {
            endHour += 1;
            endMinute = 0;
          }
          
          const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
          
          timeSlots.push({
            startTime: startTime,
            endTime: endTime,
            isAvailable: true,
            appointmentType: 'consultation',
            maxPatients: 1,
            currentPatients: 0
          });
        }
      }

      // Add lunch break (12:00 PM - 1:00 PM)
      const lunchStartIndex = timeSlots.findIndex(slot => slot.startTime === '12:00');
      const lunchEndIndex = timeSlots.findIndex(slot => slot.startTime === '13:00');
      
      if (lunchStartIndex !== -1 && lunchEndIndex !== -1) {
        for (let j = lunchStartIndex; j < lunchEndIndex; j++) {
          timeSlots[j].isAvailable = false;
          timeSlots[j].currentPatients = 1; // Mark as unavailable
        }
      }

      const schedule = {
        doctor: doctor._id,
        date: scheduleDate,
        timeSlots: timeSlots,
        consultationFee: doctor.consultationFee,
        createdBy: doctor._id,
        workingHours: {
          start: '09:00',
          end: '17:00'
        },
        appointmentDuration: 30,
        isWorkingDay: true,
        status: 'active',
        notes: `Schedule for Dr. ${doctor.firstName} ${doctor.lastName}`
      };

      schedules.push(schedule);
    }

    // Save all schedules
    await Schedule.insertMany(schedules);
    
    console.log(`✅ Created ${schedules.length} schedules for Dr. ${doctor.firstName} ${doctor.lastName}`);
    console.log(`   Date range: ${schedules[0]?.date.toDateString()} to ${schedules[schedules.length - 1]?.date.toDateString()}`);
    console.log(`   Available time slots per day: 14 (9:00 AM - 5:00 PM with lunch break)`);

    // Close the connection
    await mongoose.connection.close();
    console.log('✅ Database connection closed');

  } catch (error) {
    console.error('❌ Error adding doctor schedules:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the function
addNewDoctorSchedules();
