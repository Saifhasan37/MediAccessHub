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

module.exports = {
  getAdminStats,
  getAdminUsers,
  getAdminAppointments,
  updateAppointmentStatus,
  deleteUser,
  approveDoctorRegistration,
  rejectDoctorRegistration,
  getPendingDoctorRegistrations,
  getSystemHealth
};