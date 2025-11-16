const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, './config.env') });

const fixMonitorPassword = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Find monitor user
    const monitor = await User.findOne({ email: 'monitor_1761760389@example.com' });
    
    if (!monitor) {
      console.log('❌ Monitor user not found. Creating...');
      // Create monitor user
      const newMonitor = new User({
        firstName: 'Mon',
        lastName: 'Itor',
        email: 'monitor_1761760389@example.com',
        password: 'monitor123', // Set as plain text - pre-save middleware will hash it
        role: 'monitor',
        isActive: true,
        isEmailVerified: true,
        gender: 'other',
        phone: '5559999',
        dateOfBirth: '1985-01-01'
      });
      await newMonitor.save();
      console.log('✅ Monitor user created!');
    } else {
      console.log('✅ Monitor user found. Updating password...');
      // Set password as plain text - the pre-save middleware will hash it
      monitor.password = 'monitor123';
      monitor.isActive = true;
      monitor.isEmailVerified = true;
      await monitor.save();
      console.log('✅ Monitor password updated successfully!');
      
      // Verify password using the model's comparePassword method
      const isValid = await monitor.comparePassword('monitor123');
      console.log(`\n🔐 Password verification: ${isValid ? '✅ Valid' : '❌ Invalid'}`);
    }

    console.log('\n📋 Monitor Credentials:');
    console.log('   Email: monitor_1761760389@example.com');
    console.log('   Password: monitor123');

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

fixMonitorPassword();

