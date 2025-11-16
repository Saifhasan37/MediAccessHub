const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: './config.env' });

// Admin credentials - EMBEDDED IN CODE
const ADMIN_CREDENTIALS = {
  email: 'admin@mediaccess.com',
  password: 'Admin@123',
  firstName: 'System',
  lastName: 'Admin',
  phone: '+11234567890',
  dateOfBirth: new Date('1990-01-01'),
  gender: 'other',
  role: 'admin'
};

// User Schema (simplified for initialization)
const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: { type: String, unique: true },
  password: String,
  phone: String,
  dateOfBirth: Date,
  gender: String,
  role: String,
  isActive: { type: Boolean, default: true },
  isEmailVerified: { type: Boolean, default: true }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

async function initializeAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mediaccesshub', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: ADMIN_CREDENTIALS.email });
    
    if (existingAdmin) {
      console.log('ℹ️  Admin user already exists');
      
      // Update password if needed
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(ADMIN_CREDENTIALS.password, salt);
      
      await User.findByIdAndUpdate(existingAdmin._id, {
        password: hashedPassword,
        firstName: ADMIN_CREDENTIALS.firstName,
        lastName: ADMIN_CREDENTIALS.lastName,
        role: 'admin',
        isActive: true,
        isEmailVerified: true
      });
      
      console.log('✅ Admin credentials updated');
    } else {
      // Hash password
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(ADMIN_CREDENTIALS.password, salt);

      // Create admin user
      await User.create({
        ...ADMIN_CREDENTIALS,
        password: hashedPassword,
        isActive: true,
        isEmailVerified: true
      });

      console.log('✅ Admin user created successfully');
    }

    console.log('\n📋 Admin Login Credentials:');
    console.log('   Email:', ADMIN_CREDENTIALS.email);
    console.log('   Password:', ADMIN_CREDENTIALS.password);
    console.log('\n⚠️  Keep these credentials secure!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing admin:', error);
    process.exit(1);
  }
}

// Run initialization
initializeAdmin();

