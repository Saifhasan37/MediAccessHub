const Appointment = require('../models/Appointment');
const User = require('../models/User');
const Schedule = require('../models/Schedule');
const { validationResult } = require('express-validator');

// @desc    Create appointment
// @route   POST /api/appointments
// @access  Private
const createAppointment = async (req, res) => {
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

    const { doctor, appointmentDate, appointmentTime, reason, type, duration, symptoms } = req.body;

    // Check if doctor exists and is active
    const doctorUser = await User.findOne({ _id: doctor, role: 'doctor', isActive: true });
    if (!doctorUser) {
      return res.status(404).json({
        status: 'error',
        message: 'Doctor not found or inactive'
      });
    }

    // Check if doctor has availability on the requested date
    const schedule = await Schedule.findOne({
      doctor: doctor,
      date: {
        $gte: new Date(new Date(appointmentDate).setHours(0, 0, 0, 0)),
        $lt: new Date(new Date(appointmentDate).setHours(23, 59, 59, 999))
      },
      status: 'active'
    });

    if (!schedule) {
      return res.status(400).json({
        status: 'error',
        message: 'Doctor is not available on this date'
      });
    }

    // Check if the requested time slot is available
    const requestedTime = appointmentTime;
    const isTimeSlotAvailable = schedule.timeSlots.some(slot => 
      slot.startTime === requestedTime && 
      slot.isAvailable && 
      slot.currentPatients < slot.maxPatients
    );

    if (!isTimeSlotAvailable) {
      return res.status(400).json({
        status: 'error',
        message: 'Requested time slot is not available'
      });
    }

    // Create appointment
    const appointmentData = {
      patient: req.user._id,
      doctor: doctor,
      appointmentDate: appointmentDate,
      appointmentTime: appointmentTime,
      reason: reason,
      type: type || 'consultation',
      duration: duration || 30,
      consultationFee: doctorUser.consultationFee,
      symptoms: symptoms || []
    };

    const appointment = await Appointment.create(appointmentData);

    // Update schedule to mark time slot as booked
    const timeSlot = schedule.timeSlots.find(slot => slot.startTime === requestedTime);
    if (timeSlot) {
      timeSlot.currentPatients += 1;
      if (timeSlot.currentPatients >= timeSlot.maxPatients) {
        timeSlot.isAvailable = false;
      }
      await schedule.save();
    }

    // Populate appointment data
    await appointment.populate([
      { path: 'patient', select: 'firstName lastName email phone' },
      { path: 'doctor', select: 'firstName lastName specialization consultationFee' }
    ]);

    res.status(201).json({
      status: 'success',
      message: 'Appointment created successfully',
      data: {
        appointment
      }
    });
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error during appointment creation',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};

// @desc    Get all appointments (Admin only)
// @route   GET /api/appointments
// @access  Private/Admin
const getAllAppointments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.type) filter.type = req.query.type;
    if (req.query.doctor) filter.doctor = req.query.doctor;
    if (req.query.patient) filter.patient = req.query.patient;
    if (req.query.dateFrom || req.query.dateTo) {
      filter.appointmentDate = {};
      if (req.query.dateFrom) filter.appointmentDate.$gte = new Date(req.query.dateFrom);
      if (req.query.dateTo) filter.appointmentDate.$lte = new Date(req.query.dateTo);
    }

    const appointments = await Appointment.find(filter)
      .populate([
        { path: 'patient', select: 'firstName lastName email phone' },
        { path: 'doctor', select: 'firstName lastName specialization' }
      ])
      .sort({ appointmentDate: -1, appointmentTime: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Appointment.countDocuments(filter);

    res.status(200).json({
      status: 'success',
      results: appointments.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: {
        appointments
      }
    });
  } catch (error) {
    console.error('Get all appointments error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};

// @desc    Get appointment by ID
// @route   GET /api/appointments/:id
// @access  Private
const getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate([
        { path: 'patient', select: 'firstName lastName email phone dateOfBirth gender' },
        { path: 'doctor', select: 'firstName lastName specialization consultationFee' }
      ]);

    if (!appointment) {
      return res.status(404).json({
        status: 'error',
        message: 'Appointment not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        appointment
      }
    });
  } catch (error) {
    console.error('Get appointment by ID error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};

// @desc    Update appointment
// @route   PUT /api/appointments/:id
// @access  Private
const updateAppointment = async (req, res) => {
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

    const allowedUpdates = ['appointmentDate', 'appointmentTime', 'reason', 'notes', 'symptoms', 'diagnosis', 'prescription', 'followUpDate', 'followUpNotes'];
    const updates = {};

    // Filter allowed updates
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate([
      { path: 'patient', select: 'firstName lastName email phone' },
      { path: 'doctor', select: 'firstName lastName specialization' }
    ]);

    if (!appointment) {
      return res.status(404).json({
        status: 'error',
        message: 'Appointment not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Appointment updated successfully',
      data: {
        appointment
      }
    });
  } catch (error) {
    console.error('Update appointment error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};

// @desc    Delete appointment
// @route   DELETE /api/appointments/:id
// @access  Private
const deleteAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        status: 'error',
        message: 'Appointment not found'
      });
    }

    // Release the time slot in the doctor's schedule
    if (appointment.status === 'scheduled' || appointment.status === 'confirmed') {
      const schedule = await Schedule.findOne({
        doctor: appointment.doctor,
        date: appointment.appointmentDate
      });

      if (schedule) {
        const timeSlot = schedule.timeSlots.find(slot => slot.startTime === appointment.appointmentTime);
        if (timeSlot) {
          timeSlot.currentPatients = Math.max(0, timeSlot.currentPatients - 1);
          timeSlot.isAvailable = true;
          await schedule.save();
        }
      }
    }

    await Appointment.findByIdAndDelete(req.params.id);

    res.status(200).json({
      status: 'success',
      message: 'Appointment deleted successfully'
    });
  } catch (error) {
    console.error('Delete appointment error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};

// @desc    Get patient appointments
// @route   GET /api/appointments/my-appointments
// @access  Private
const getPatientAppointments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = { patient: req.user._id };
    if (req.query.status) filter.status = req.query.status;

    const appointments = await Appointment.find(filter)
      .populate([
        { path: 'doctor', select: 'firstName lastName specialization consultationFee' }
      ])
      .sort({ appointmentDate: -1, appointmentTime: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Appointment.countDocuments(filter);

    res.status(200).json({
      status: 'success',
      results: appointments.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: {
        appointments
      }
    });
  } catch (error) {
    console.error('Get patient appointments error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};

// @desc    Get doctor appointments
// @route   GET /api/appointments/doctor-appointments
// @access  Private/Doctor
const getDoctorAppointments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = { doctor: req.user._id };
    if (req.query.status) filter.status = req.query.status;

    const appointments = await Appointment.find(filter)
      .populate([
        { path: 'patient', select: 'firstName lastName email phone dateOfBirth' }
      ])
      .sort({ appointmentDate: 1, appointmentTime: 1 })
      .skip(skip)
      .limit(limit);

    const total = await Appointment.countDocuments(filter);

    res.status(200).json({
      status: 'success',
      results: appointments.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: {
        appointments
      }
    });
  } catch (error) {
    console.error('Get doctor appointments error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};

// @desc    Update appointment status
// @route   PUT /api/appointments/:id/status
// @access  Private
const updateAppointmentStatus = async (req, res) => {
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

    const { status, notes } = req.body;

    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status, notes },
      { new: true, runValidators: true }
    ).populate([
      { path: 'patient', select: 'firstName lastName email phone' },
      { path: 'doctor', select: 'firstName lastName specialization' }
    ]);

    if (!appointment) {
      return res.status(404).json({
        status: 'error',
        message: 'Appointment not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Appointment status updated successfully',
      data: {
        appointment
      }
    });
  } catch (error) {
    console.error('Update appointment status error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};

// @desc    Cancel appointment
// @route   PUT /api/appointments/:id/cancel
// @access  Private
const cancelAppointment = async (req, res) => {
  try {
    const { cancellationReason } = req.body;

    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        status: 'error',
        message: 'Appointment not found'
      });
    }

    if (appointment.status === 'completed') {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot cancel a completed appointment'
      });
    }

    // Release the time slot in the doctor's schedule
    if (appointment.status === 'scheduled' || appointment.status === 'confirmed') {
      const schedule = await Schedule.findOne({
        doctor: appointment.doctor,
        date: appointment.appointmentDate
      });

      if (schedule) {
        const timeSlot = schedule.timeSlots.find(slot => slot.startTime === appointment.appointmentTime);
        if (timeSlot) {
          timeSlot.currentPatients = Math.max(0, timeSlot.currentPatients - 1);
          timeSlot.isAvailable = true;
          await schedule.save();
        }
      }
    }

    // Update appointment
    appointment.status = 'cancelled';
    appointment.cancelledBy = req.user._id;
    appointment.cancellationReason = cancellationReason;
    appointment.cancelledAt = new Date();

    await appointment.save();

    res.status(200).json({
      status: 'success',
      message: 'Appointment cancelled successfully',
      data: {
        appointment
      }
    });
  } catch (error) {
    console.error('Cancel appointment error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};

// @desc    Get available time slots for a doctor
// @route   GET /api/appointments/available-slots
// @access  Private
const getAvailableTimeSlots = async (req, res) => {
  try {
    const { doctorId, date } = req.query;

    if (!doctorId || !date) {
      return res.status(400).json({
        status: 'error',
        message: 'Doctor ID and date are required'
      });
    }

    const schedule = await Schedule.findOne({
      doctor: doctorId,
      date: {
        $gte: new Date(new Date(date).setHours(0, 0, 0, 0)),
        $lt: new Date(new Date(date).setHours(23, 59, 59, 999))
      },
      status: 'active'
    });

    if (!schedule) {
      return res.status(404).json({
        status: 'error',
        message: 'No schedule found for this doctor on the specified date'
      });
    }

    const availableSlots = schedule.timeSlots
      .filter(slot => slot.isAvailable && slot.currentPatients < slot.maxPatients)
      .map(slot => slot.startTime);

    res.status(200).json({
      status: 'success',
      data: {
        slots: availableSlots,
        doctor: schedule.doctor,
        date: schedule.date
      }
    });
  } catch (error) {
    console.error('Get available time slots error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};

module.exports = {
  createAppointment,
  getAllAppointments,
  getAppointmentById,
  updateAppointment,
  deleteAppointment,
  getPatientAppointments,
  getDoctorAppointments,
  updateAppointmentStatus,
  cancelAppointment,
  getAvailableTimeSlots
};

