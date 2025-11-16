const User = require('../models/User');
const { validationResult } = require('express-validator');

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';
    if (req.query.specialization) filter.specialization = new RegExp(req.query.specialization, 'i');

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(filter);

    res.status(200).json({
      status: 'success',
      results: users.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: {
        users
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};

// @desc    Update user (Admin only)
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const allowedUpdates = ['firstName', 'lastName', 'phone', 'isActive', 'role'];
    const updates = {};

    // Filter allowed updates
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'User updated successfully',
      data: {
        user
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};

// @desc    Delete user (Admin only)
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};

// @desc    Get all doctors
// @route   GET /api/users/doctors
// @access  Private
const getDoctors = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = { role: 'doctor', isActive: true };
    if (req.query.specialization) {
      filter.specialization = new RegExp(req.query.specialization, 'i');
    }

    const doctors = await User.find(filter)
      .select('-password -emergencyContact -insuranceProvider -insuranceNumber -allergies -currentMedications -medicalHistory')
      .sort({ firstName: 1, lastName: 1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(filter);

    res.status(200).json({
      status: 'success',
      results: doctors.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: {
        doctors
      }
    });
  } catch (error) {
    console.error('Get doctors error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};

// @desc    Get all patients (Admin) or doctor's patients (Doctor)
// @route   GET /api/users/patients
// @access  Private (Admin/Doctor)
const getPatients = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100; // Increase limit for doctors to see all their patients
    const skip = (page - 1) * limit;
    const user = req.user;

    let patientFilter = { role: 'patient' };
    let total;

    // If user is a doctor, only show patients who have completed appointments with this doctor
    if (user.role === 'doctor') {
      const Appointment = require('../models/Appointment');
      const mongoose = require('mongoose');
      
      // Convert doctor ID to ObjectId to ensure proper matching
      // Try both _id and id, but prioritize _id (which is the ObjectId)
      let doctorObjectId;
      if (user._id) {
        // _id is already an ObjectId from Mongoose
        doctorObjectId = user._id instanceof mongoose.Types.ObjectId ? user._id : new mongoose.Types.ObjectId(user._id);
      } else if (user.id) {
        doctorObjectId = new mongoose.Types.ObjectId(user.id);
      } else {
        return res.status(500).json({
          status: 'error',
          message: 'Doctor ID not found'
        });
      }
      
      // Try direct query first (MongoDB handles ObjectId matching automatically)
      // Fallback to $or if needed for string format
      const doctorIdString = doctorObjectId.toString();
      
      // First try with ObjectId directly (most common case)
      let doctorQuery = { doctor: doctorObjectId };
      
      // Test if any appointments exist with ObjectId format
      const testCount = await Appointment.countDocuments(doctorQuery);
      
      // If no appointments found, try with string format
      if (testCount === 0) {
        doctorQuery = { doctor: doctorIdString };
        const testCount2 = await Appointment.countDocuments(doctorQuery);
        
        if (testCount2 === 0) {
          // Try $or query as last resort
          doctorQuery = {
            $or: [
              { doctor: doctorObjectId },
              { doctor: doctorIdString }
            ]
          };
        }
      }
      
      // First, let's check if there are any appointments at all for this doctor
      const totalAppointments = await Appointment.countDocuments(doctorQuery);
      const completedAppointmentsCount = await Appointment.countDocuments({ 
        ...doctorQuery,
        status: 'completed'
      });
      
      // Log for debugging (can be removed in production)
      if (process.env.NODE_ENV === 'development') {
        console.log('Doctor ID:', doctorObjectId, 'Type:', typeof doctorObjectId);
        console.log('Total appointments for doctor:', totalAppointments);
        console.log('Completed appointments count:', completedAppointmentsCount);
        
        // Also check what appointments exist
        const sampleAppointments = await Appointment.find(doctorQuery).limit(5);
        console.log('Sample appointments:', sampleAppointments.map(apt => ({
          id: apt._id,
          patient: apt.patient,
          status: apt.status,
          doctor: apt.doctor,
          doctorType: typeof apt.doctor
        })));
      }
      
      // Get unique patient IDs from completed appointments with this doctor
      // Using distinct on the Model to get unique patient IDs
      // Use the doctorQuery that handles both ObjectId and string formats
      const completedPatientIds = await Appointment.distinct('patient', { 
        ...doctorQuery,
        status: 'completed'
      });
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Completed patient IDs found:', completedPatientIds.length);
        console.log('Patient IDs:', completedPatientIds);
      }
      
      if (!completedPatientIds || completedPatientIds.length === 0) {
        // No completed appointments found for this doctor
        return res.status(200).json({
          status: 'success',
          results: 0,
          total: 0,
          page,
          pages: 0,
          data: {
            patients: []
          },
          message: 'No patients found. You can only create medical records for patients who have completed appointments with you.'
        });
      }
      
      // Filter to only show patients with completed appointments
      // Convert to ObjectId if needed for proper comparison
      const patientObjectIds = completedPatientIds.map(id => {
        if (id instanceof mongoose.Types.ObjectId) {
          return id;
        }
        // Handle both string IDs and ObjectIds
        try {
          return new mongoose.Types.ObjectId(id);
        } catch (e) {
          console.error('Error converting patient ID to ObjectId:', id, e);
          return null;
        }
      }).filter(id => id !== null); // Remove any null values
      
      if (patientObjectIds.length === 0) {
        return res.status(200).json({
          status: 'success',
          results: 0,
          total: 0,
          page,
          pages: 0,
          data: {
            patients: []
          },
          message: 'No patients found. You can only create medical records for patients who have completed appointments with you.'
        });
      }
      
      patientFilter = {
        role: 'patient',
        _id: { $in: patientObjectIds }
      };
      
      total = await User.countDocuments(patientFilter);
    } else if (user.role === 'admin') {
      // Admin can see all patients
      total = await User.countDocuments(patientFilter);
    } else {
      // Other roles (patients, monitors) cannot access this endpoint
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to access patient data.'
      });
    }

    const patients = await User.find(patientFilter)
      .select('-password -specialization -licenseNumber -yearsOfExperience -consultationFee')
      .sort({ firstName: 1, lastName: 1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      status: 'success',
      results: patients.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: {
        patients
      }
    });
  } catch (error) {
    console.error('Get patients error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};

// @desc    Search users (Admin only)
// @route   GET /api/users/search
// @access  Private/Admin
const searchUsers = async (req, res) => {
  try {
    const { q, role, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    if (!q) {
      return res.status(400).json({
        status: 'error',
        message: 'Search query is required'
      });
    }

    // Build search filter
    const filter = {
      $or: [
        { firstName: new RegExp(q, 'i') },
        { lastName: new RegExp(q, 'i') },
        { email: new RegExp(q, 'i') },
        { phone: new RegExp(q, 'i') }
      ]
    };

    if (role) {
      filter.role = role;
    }

    const users = await User.find(filter)
      .select('-password')
      .sort({ firstName: 1, lastName: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);

    res.status(200).json({
      status: 'success',
      results: users.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: {
        users
      }
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getDoctors,
  getPatients,
  searchUsers
};

