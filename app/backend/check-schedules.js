const mongoose = require('mongoose');
const Schedule = require('./models/Schedule');
require('dotenv').config({ path: './config.env' });

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mediaccesshub', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => console.error('❌ MongoDB connection error:', err));

const checkSchedules = async () => {
  try {
    const schedules = await Schedule.find({}).limit(5);
    console.log('📅 Found schedules:');
    schedules.forEach(schedule => {
      console.log(`   Doctor: ${schedule.doctor}, Date: ${schedule.date}, Status: ${schedule.status}`);
    });
    
    const count = await Schedule.countDocuments();
    console.log(`\n📊 Total schedules: ${count}`);
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
};

checkSchedules();





