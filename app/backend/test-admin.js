const mongoose = require('mongoose');
const User = require('./models/User');
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

const testAdmin = async () => {
  try {
    await connectDB();
    
    const admin = await User.findOne({ email: 'admin@example.com' });
    if (admin) {
      console.log('Admin user found:', {
        email: admin.email,
        role: admin.role,
        isActive: admin.isActive
      });
    } else {
      console.log('Admin user not found');
    }
    
    const allUsers = await User.find({});
    console.log(`Total users in database: ${allUsers.length}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
};

testAdmin();




