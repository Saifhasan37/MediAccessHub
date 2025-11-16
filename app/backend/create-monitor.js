const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, './config.env') });

const createMonitor = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Check if monitor already exists
    const existingMonitor = await User.findOne({ email: 'monitor_1761760389@example.com' });
    
    if (existingMonitor) {
      console.log('ℹ️  Monitor user already exists');
      console.log(`   Email: ${existingMonitor.email}`);
      console.log(`   Name: ${existingMonitor.firstName} ${existingMonitor.lastName}`);
      await mongoose.connection.close();
      return;
    }

    // Create monitor user
    const monitorPassword = await bcrypt.hash('monitor123', 12);
    const monitor = new User({
      firstName: 'Mon',
      lastName: 'Itor',
      email: 'monitor_1761760389@example.com',
      password: monitorPassword,
      role: 'monitor',
      isActive: true,
      isEmailVerified: true,
      gender: 'other',
      phone: '5559999',
      dateOfBirth: '1985-01-01'
    });

    await monitor.save();
    console.log('✅ Monitor user created successfully!');
    console.log(`   Email: ${monitor.email}`);
    console.log(`   Password: monitor123`);
    console.log(`   Name: ${monitor.firstName} ${monitor.lastName}`);

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error creating monitor:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

createMonitor();

