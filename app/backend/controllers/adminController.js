const User = require('../models/User');
const Appointment = require('../models/Appointment');
const MedicalRecord = require('../models/MedicalRecord');
const Schedule = require('../models/Schedule');
const mongoose = require('mongoose');

// Admin Dashboard Statistics
const getAdminStats = async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Get all statistics in parallel for better performance
    const [
      totalUsers,
      totalDoctors,
      totalPatients,
      totalAppointments,
      pendingRegistrations,
      activeAppointments,
      todayAppointments,
      weeklyAppointments
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'doctor', isActive: true }),
      User.countDocuments({ role: 'patient', isActive: true }),
      Appointment.countDocuments(),
      User.countDocuments({ role: 'doctor', isActive: false }),
      Appointment.countDocuments({ status: { $in: ['pending', 'confirmed'] } }),
      Appointment.countDocuments({
        appointmentDate: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
          $lt: new Date(new Date().setHours(23, 59, 59, 999))
        }
      }),
      Appointment.countDocuments({
        appointmentDate: {
          $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      })
    ]);

    const loadTime = Date.now() - startTime;

    res.status(200).json({
      status: 'success',
      data: {
        totalUsers,
        totalDoctors,
        totalPatients,
        totalAppointments,
        pendingRegistrations,
        activeAppointments,
        todayAppointments,
        weeklyAppointments,
        loadTime: `${loadTime}ms`
      }
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch admin statistics',
      error: error.message
    });
  }
};

// Get all users with pagination and filtering
const getAdminUsers = async (req, res) => {
  try {
    const startTime = Date.now();
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    const role = req.query.role;
    const search = req.query.search;
    const status = req.query.status;

    // Build query
    const query = {};
    if (role) query.role = role;
    if (status) query.isActive = status === 'active';
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Get users with pagination
    const [users, total] = await Promise.all([
      User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(query)
    ]);

    const loadTime = Date.now() - startTime;

    res.status(200).json({
      status: 'success',
      data: {
        users,
        total,
        page,
        pages: Math.ceil(total / limit),
        loadTime: `${loadTime}ms`
      }
    });
  } catch (error) {
    console.error('Get admin users error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch users',
      error: error.message
    });
  }
};

// Get all appointments with filtering
const getAdminAppointments = async (req, res) => {
  try {
    const startTime = Date.now();
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    const status = req.query.status;
    const doctorId = req.query.doctorId;
    const patientId = req.query.patientId;
    const date = req.query.date;

    // Build query
    const query = {};
    if (status) query.status = status;
    if (doctorId) query.doctor = doctorId;
    if (patientId) query.patient = patientId;
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      query.appointmentDate = { $gte: startDate, $lt: endDate };
    }

    // Get appointments with populated data
    const [appointments, total] = await Promise.all([
      Appointment.find(query)
        .populate('patient', 'firstName lastName email phone')
        .populate('doctor', 'firstName lastName specialization')
        .sort({ appointmentDate: -1 })
        .skip(skip)
        .limit(limit),
      Appointment.countDocuments(query)
    ]);

    const loadTime = Date.now() - startTime;

    res.status(200).json({
      status: 'success',
      data: {
        appointments,
        total,
        page,
        pages: Math.ceil(total / limit),
        loadTime: `${loadTime}ms`
      }
    });
  } catch (error) {
    console.error('Get admin appointments error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch appointments',
      error: error.message
    });
  }
};

// Update appointment status (Real-time synchronization)
const updateAppointmentStatus = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { status, notes } = req.body;

    // Validate status
    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled', 'no-show'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid appointment status'
      });
    }

    // Update appointment
    const appointment = await Appointment.findByIdAndUpdate(
      appointmentId,
      { 
        status, 
        notes: notes || '',
        updatedBy: req.user._id,
        updatedAt: new Date()
      },
      { new: true }
    ).populate('patient', 'firstName lastName email phone')
     .populate('doctor', 'firstName lastName specialization');

    if (!appointment) {
      return res.status(404).json({
        status: 'error',
        message: 'Appointment not found'
      });
    }

    // Log the action for audit trail
    console.log(`Admin ${req.user.firstName} ${req.user.lastName} updated appointment ${appointmentId} status to ${status}`);

    res.status(200).json({
      status: 'success',
      message: 'Appointment status updated successfully',
      data: appointment
    });
  } catch (error) {
    console.error('Update appointment status error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update appointment status',
      error: error.message
    });
  }
};

// Delete user (Admin only)
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Prevent admin from deleting themselves
    if (userId === req.user._id.toString()) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot delete your own account'
      });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Start transaction for data consistency
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Delete related appointments
      await Appointment.deleteMany(
        { $or: [{ doctor: userId }, { patient: userId }] },
        { session }
      );

      // Delete related medical records
      await MedicalRecord.deleteMany(
        { $or: [{ doctor: userId }, { patient: userId }] },
        { session }
      );

      // Delete related schedules
      await Schedule.deleteMany({ doctor: userId }, { session });

      // Delete user
      await User.findByIdAndDelete(userId, { session });

      // Commit transaction
      await session.commitTransaction();

      console.log(`Admin ${req.user.firstName} ${req.user.lastName} deleted user ${userId}`);

      res.status(200).json({
        status: 'success',
        message: 'User deleted successfully'
      });
    } catch (transactionError) {
      // Rollback transaction
      await session.abortTransaction();
      throw transactionError;
    } finally {
      session.endSession();
    }
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete user',
      error: error.message
    });
  }
};

// Approve doctor registration
const approveDoctorRegistration = async (req, res) => {
  try {
    const { doctorId } = req.params;

    const doctor = await User.findByIdAndUpdate(
      doctorId,
      { 
        isActive: true,
        approvedBy: req.user._id,
        approvedAt: new Date()
      },
      { new: true }
    ).select('-password');
    
    if (!doctor) {
      return res.status(404).json({
        status: 'error',
        message: 'Doctor not found'
      });
    }

    console.log(`Admin ${req.user.firstName} ${req.user.lastName} approved doctor ${doctorId}`);

    res.status(200).json({
      status: 'success',
      message: 'Doctor registration approved successfully',
      data: doctor
    });
  } catch (error) {
    console.error('Approve doctor registration error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to approve doctor registration',
      error: error.message
    });
  }
};

// Reject doctor registration
const rejectDoctorRegistration = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { reason } = req.body;

    const doctor = await User.findByIdAndUpdate(
      doctorId,
      { 
        isActive: false,
        rejectionReason: reason || 'Registration rejected by admin',
        rejectedBy: req.user._id,
        rejectedAt: new Date()
      },
      { new: true }
    ).select('-password');
    
    if (!doctor) {
      return res.status(404).json({
        status: 'error',
        message: 'Doctor not found'
      });
    }

    console.log(`Admin ${req.user.firstName} ${req.user.lastName} rejected doctor ${doctorId}`);

    res.status(200).json({
      status: 'success',
      message: 'Doctor registration rejected successfully',
      data: doctor
    });
  } catch (error) {
    console.error('Reject doctor registration error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to reject doctor registration',
      error: error.message
    });
  }
};

// Get pending doctor registrations
const getPendingDoctorRegistrations = async (req, res) => {
  try {
    const startTime = Date.now();
    
    const registrations = await User.find({ 
      role: 'doctor', 
      isActive: false,
      approvedBy: { $exists: false },
      rejectedBy: { $exists: false }
    })
    .select('-password')
      .sort({ createdAt: -1 });

    const loadTime = Date.now() - startTime;

    res.status(200).json({
      status: 'success',
      data: {
        registrations,
        total: registrations.length,
        loadTime: `${loadTime}ms`
      }
    });
  } catch (error) {
    console.error('Get pending registrations error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch pending registrations',
      error: error.message
    });
  }
};

// System health check
const getSystemHealth = async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Check database connection
    const dbState = mongoose.connection.readyState;
    const dbStatus = dbState === 1 ? 'connected' : 'disconnected';
    
    // Check memory usage
    const memUsage = process.memoryUsage();
    const memoryUsage = {
      rss: Math.round(memUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024)
    };

    // Check uptime
    const uptime = Math.floor(process.uptime());

    const responseTime = Date.now() - startTime;

    res.status(200).json({
      status: 'success',
      data: {
        database: {
          status: dbStatus,
          readyState: dbState
        },
        memory: memoryUsage,
        uptime: {
          seconds: uptime,
          formatted: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${uptime % 60}s`
        },
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('System health check error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get system health',
      error: error.message
    });
  }
};

// @desc    Get pending doctor registrations (new enhanced version)
// @route   GET /api/admin/pending-doctors
// @access  Private/Admin
const getPendingDoctors = async (req, res) => {
  try {
    const pendingDoctors = await User.find({
      role: 'doctor',
      approvalStatus: 'pending'
    })
    .select('-password')
    .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      data: {
        count: pendingDoctors.length,
        doctors: pendingDoctors
      }
    });
  } catch (error) {
    console.error('Get pending doctors error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch pending doctors',
      error: error.message
    });
  }
};

// @desc    Approve doctor (new enhanced version)
// @route   PATCH /api/admin/approve-doctor/:doctorId
// @access  Private/Admin
const approveDoctor = async (req, res) => {
  try {
    const { doctorId } = req.params;
    
    const doctor = await User.findById(doctorId);
    
    if (!doctor) {
      return res.status(404).json({
        status: 'error',
        message: 'Doctor not found'
      });
    }

    if (doctor.role !== 'doctor') {
      return res.status(400).json({
        status: 'error',
        message: 'User is not a doctor'
      });
    }

    // Update approval status
    doctor.approvalStatus = 'approved';
    doctor.isApproved = true;
    doctor.approvedBy = req.user.id;
    doctor.approvedAt = new Date();
    await doctor.save();

    res.status(200).json({
      status: 'success',
      message: 'Doctor approved successfully',
      data: {
        doctor: {
          id: doctor._id,
          name: `${doctor.firstName} ${doctor.lastName}`,
          email: doctor.email,
          specialization: doctor.specialization,
          approvalStatus: doctor.approvalStatus
        }
      }
    });
  } catch (error) {
    console.error('Approve doctor error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to approve doctor',
      error: error.message
    });
  }
};

// @desc    Reject doctor (new enhanced version)
// @route   PATCH /api/admin/reject-doctor/:doctorId
// @access  Private/Admin
const rejectDoctor = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { reason } = req.body;
    
    const doctor = await User.findById(doctorId);
    
    if (!doctor) {
      return res.status(404).json({
        status: 'error',
        message: 'Doctor not found'
      });
    }

    if (doctor.role !== 'doctor') {
      return res.status(400).json({
        status: 'error',
        message: 'User is not a doctor'
      });
    }

    // Update approval status
    doctor.approvalStatus = 'rejected';
    doctor.isApproved = false;
    doctor.approvedBy = req.user.id;
    doctor.approvedAt = new Date();
    doctor.rejectionReason = reason || 'Application rejected by admin';
    await doctor.save();

    res.status(200).json({
      status: 'success',
      message: 'Doctor rejected successfully',
      data: {
        doctor: {
          id: doctor._id,
          name: `${doctor.firstName} ${doctor.lastName}`,
          email: doctor.email,
          specialization: doctor.specialization,
          approvalStatus: doctor.approvalStatus,
          rejectionReason: doctor.rejectionReason
        }
      }
    });
  } catch (error) {
    console.error('Reject doctor error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to reject doctor',
      error: error.message
    });
  }
};

// @desc    Create doctor account (Admin only)
// @route   POST /api/admin/create-doctor
// @access  Private/Admin
const createDoctor = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      dateOfBirth,
      gender,
      specialization,
      licenseNumber,
      yearsOfExperience,
      consultationFee,
      bio
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'User with this email already exists'
      });
    }

    // Create doctor
    const doctor = await User.create({
      firstName,
      lastName,
      email,
      password,
      phone,
      dateOfBirth,
      gender,
      role: 'doctor',
      specialization,
      licenseNumber,
      yearsOfExperience: yearsOfExperience || 0,
      consultationFee: consultationFee || 0,
      bio: bio || '',
      isApproved: true,
      approvalStatus: 'approved',
      approvedBy: req.user._id,
      approvedAt: new Date(),
      isEmailVerified: true, // Admin-created accounts are pre-verified
      isActive: true
    });

    // Remove password from response
    doctor.password = undefined;

    console.log(`Admin ${req.user.firstName} ${req.user.lastName} created doctor ${doctor._id}`);

    res.status(201).json({
      status: 'success',
      message: 'Doctor account created successfully',
      data: { doctor }
    });
  } catch (error) {
    console.error('Create doctor error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err) => ({
        field: err.path,
        message: err.message
      }));
      
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: validationErrors
      });
    }
    
    // Handle duplicate key errors (e.g., duplicate email)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        status: 'error',
        message: `${field} already exists`,
        field: field
      });
    }
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to create doctor account',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};

// @desc    Create monitor account (Admin only)
// @route   POST /api/admin/create-monitor
// @access  Private/Admin
const createMonitor = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      dateOfBirth,
      gender
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'User with this email already exists'
      });
    }

    // Create monitor
    const monitor = await User.create({
      firstName,
      lastName,
      email,
      password,
      phone,
      dateOfBirth,
      gender,
      role: 'monitor',
      isEmailVerified: true, // Admin-created accounts are pre-verified
      isActive: true
    });

    // Remove password from response
    monitor.password = undefined;

    console.log(`Admin ${req.user.firstName} ${req.user.lastName} created monitor ${monitor._id}`);

    res.status(201).json({
      status: 'success',
      message: 'Monitor account created successfully',
      data: { monitor }
    });
  } catch (error) {
    console.error('Create monitor error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err) => ({
        field: err.path,
        message: err.message
      }));
      
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: validationErrors
      });
    }
    
    // Handle duplicate key errors (e.g., duplicate email)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        status: 'error',
        message: `${field} already exists`,
        field: field
      });
    }
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to create monitor account',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};

// @desc    Update user (Admin only)
// @route   PUT /api/admin/users/:userId
// @access  Private/Admin
const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;

    // Prevent updating sensitive fields
    delete updates.password;
    delete updates.role;
    delete updates._id;

    const user = await User.findByIdAndUpdate(
      userId,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    console.log(`Admin ${req.user.firstName} ${req.user.lastName} updated user ${userId}`);

    res.status(200).json({
      status: 'success',
      message: 'User updated successfully',
      data: { user }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update user',
      error: error.message
    });
  }
};

module.exports = {
  getAdminStats,
  getAdminUsers,
  getAdminAppointments,
  updateAppointmentStatus,
  deleteUser,
  approveDoctorRegistration,
  rejectDoctorRegistration,
  getPendingDoctorRegistrations,
  getSystemHealth,
  getPendingDoctors,
  approveDoctor,
  rejectDoctor,
  createDoctor,
  createMonitor,
  updateUser
};