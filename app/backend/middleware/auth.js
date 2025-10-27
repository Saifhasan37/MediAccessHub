const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - verify JWT token
const protect = async (req, res, next) => {
  try {
    let token;

    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Access denied. No token provided.'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from token
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return res.status(401).json({
          status: 'error',
          message: 'Token is valid but user no longer exists.'
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({
          status: 'error',
          message: 'Account is deactivated. Please contact support.'
        });
      }

      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid token.'
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error during authentication.'
    });
  }
};

// Restrict to specific roles
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to perform this action.'
      });
    }
    next();
  };
};

// Check if user can access patient data
const canAccessPatientData = async (req, res, next) => {
  try {
    const patientId = req.params.patientId || req.params.id;
    const user = req.user;

    // Admin can access all patient data
    if (user.role === 'admin') {
      return next();
    }

    // Doctors can access their patients' data
    if (user.role === 'doctor') {
      // Check if the doctor has appointments with this patient
      const Appointment = require('../models/Appointment');
      const hasAppointment = await Appointment.findOne({
        doctor: user._id,
        patient: patientId
      });

      if (hasAppointment) {
        return next();
      }
    }

    // Patients can only access their own data
    if (user.role === 'patient' && user._id.toString() === patientId) {
      return next();
    }

    return res.status(403).json({
      status: 'error',
      message: 'You do not have permission to access this patient data.'
    });
  } catch (error) {
    console.error('Patient data access check error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error during access check.'
    });
  }
};

// Check if user can access appointment data
const canAccessAppointment = async (req, res, next) => {
  try {
    const appointmentId = req.params.appointmentId || req.params.id;
    const user = req.user;

    // Admin can access all appointments
    if (user.role === 'admin') {
      return next();
    }

    // Get appointment details
    const Appointment = require('../models/Appointment');
    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({
        status: 'error',
        message: 'Appointment not found.'
      });
    }

    // Check if user is involved in the appointment
    if (user.role === 'patient' && appointment.patient.toString() === user._id.toString()) {
      return next();
    }

    if (user.role === 'doctor' && appointment.doctor.toString() === user._id.toString()) {
      return next();
    }

    return res.status(403).json({
      status: 'error',
      message: 'You do not have permission to access this appointment.'
    });
  } catch (error) {
    console.error('Appointment access check error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error during access check.'
    });
  }
};

// Check if user can access medical record
const canAccessMedicalRecord = async (req, res, next) => {
  try {
    const recordId = req.params.recordId || req.params.id;
    const user = req.user;

    // Admin can access all records
    if (user.role === 'admin') {
      return next();
    }

    // Get medical record details
    const MedicalRecord = require('../models/MedicalRecord');
    const record = await MedicalRecord.findById(recordId);

    if (!record) {
      return res.status(404).json({
        status: 'error',
        message: 'Medical record not found.'
      });
    }

    // Check if user is involved in the record
    if (user.role === 'patient' && record.patient.toString() === user._id.toString()) {
      return next();
    }

    if (user.role === 'doctor' && record.doctor.toString() === user._id.toString()) {
      return next();
    }

    return res.status(403).json({
      status: 'error',
      message: 'You do not have permission to access this medical record.'
    });
  } catch (error) {
    console.error('Medical record access check error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error during access check.'
    });
  }
};

// Optional auth - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        
        if (user && user.isActive) {
          req.user = user;
        }
      } catch (error) {
        // Token is invalid, but we don't fail the request
        console.log('Invalid token in optional auth:', error.message);
      }
    }

    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next(); // Continue even if there's an error
  }
};

module.exports = {
  protect,
  restrictTo,
  canAccessPatientData,
  canAccessAppointment,
  canAccessMedicalRecord,
  optionalAuth
};

