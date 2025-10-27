const Schedule = require('../models/Schedule');
const { validationResult } = require('express-validator');

// @desc    Create schedule
// @route   POST /api/schedules
// @access  Private/Doctor
const createSchedule = async (req, res) => {
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

    const scheduleData = {
      ...req.body,
      doctor: req.user._id,
      createdBy: req.user._id,
      lastModifiedBy: req.user._id
    };

    const schedule = await Schedule.create(scheduleData);

    // Populate schedule data
    await schedule.populate([
      { path: 'doctor', select: 'firstName lastName specialization' }
    ]);

    res.status(201).json({
      status: 'success',
      message: 'Schedule created successfully',
      data: {
        schedule
      }
    });
  } catch (error) {
    console.error('Create schedule error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error during schedule creation',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};

// @desc    Get all schedules (Admin only)
// @route   GET /api/schedules
// @access  Private/Admin
const getAllSchedules = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};
    if (req.query.doctor) filter.doctor = req.query.doctor;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.dateFrom || req.query.dateTo) {
      filter.date = {};
      if (req.query.dateFrom) filter.date.$gte = new Date(req.query.dateFrom);
      if (req.query.dateTo) filter.date.$lte = new Date(req.query.dateTo);
    }

    const schedules = await Schedule.find(filter)
      .populate([
        { path: 'doctor', select: 'firstName lastName specialization' }
      ])
      .sort({ date: 1 })
      .skip(skip)
      .limit(limit);

    const total = await Schedule.countDocuments(filter);

    res.status(200).json({
      status: 'success',
      results: schedules.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: {
        schedules
      }
    });
  } catch (error) {
    console.error('Get all schedules error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};

// @desc    Get schedule by ID
// @route   GET /api/schedules/:id
// @access  Private
const getScheduleById = async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id)
      .populate([
        { path: 'doctor', select: 'firstName lastName specialization' }
      ]);

    if (!schedule) {
      return res.status(404).json({
        status: 'error',
        message: 'Schedule not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        schedule
      }
    });
  } catch (error) {
    console.error('Get schedule by ID error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};

// @desc    Update schedule
// @route   PUT /api/schedules/:id
// @access  Private/Doctor
const updateSchedule = async (req, res) => {
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

    const allowedUpdates = ['date', 'timeSlots', 'breakTime', 'isWorkingDay', 'workingHours', 'appointmentDuration', 'consultationFee', 'notes', 'isRecurring', 'recurringPattern', 'recurringDays', 'recurringEndDate'];
    const updates = {
      lastModifiedBy: req.user._id
    };

    // Filter allowed updates
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const schedule = await Schedule.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate([
      { path: 'doctor', select: 'firstName lastName specialization' }
    ]);

    if (!schedule) {
      return res.status(404).json({
        status: 'error',
        message: 'Schedule not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Schedule updated successfully',
      data: {
        schedule
      }
    });
  } catch (error) {
    console.error('Update schedule error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};

// @desc    Delete schedule
// @route   DELETE /api/schedules/:id
// @access  Private/Doctor
const deleteSchedule = async (req, res) => {
  try {
    const schedule = await Schedule.findByIdAndDelete(req.params.id);

    if (!schedule) {
      return res.status(404).json({
        status: 'error',
        message: 'Schedule not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Schedule deleted successfully'
    });
  } catch (error) {
    console.error('Delete schedule error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};

// @desc    Get doctor schedules
// @route   GET /api/schedules/my-schedules
// @access  Private/Doctor
const getDoctorSchedules = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = { doctor: req.user._id };
    if (req.query.status) filter.status = req.query.status;

    const schedules = await Schedule.find(filter)
      .sort({ date: 1 })
      .skip(skip)
      .limit(limit);

    const total = await Schedule.countDocuments(filter);

    res.status(200).json({
      status: 'success',
      results: schedules.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: {
        schedules
      }
    });
  } catch (error) {
    console.error('Get doctor schedules error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};

// @desc    Get available schedules
// @route   GET /api/schedules/available
// @access  Private
const getAvailableSchedules = async (req, res) => {
  try {
    const { doctorId, dateFrom, dateTo } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = { status: 'active', isWorkingDay: true };
    
    if (doctorId) filter.doctor = doctorId;
    
    if (dateFrom || dateTo) {
      filter.date = {};
      if (dateFrom) filter.date.$gte = new Date(dateFrom);
      if (dateTo) filter.date.$lte = new Date(dateTo);
    } else {
      // Default to current date and future dates
      filter.date = { $gte: new Date() };
    }

    const schedules = await Schedule.find(filter)
      .populate([
        { path: 'doctor', select: 'firstName lastName specialization consultationFee' }
      ])
      .sort({ date: 1 })
      .skip(skip)
      .limit(limit);

    const total = await Schedule.countDocuments(filter);

    res.status(200).json({
      status: 'success',
      results: schedules.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: {
        schedules
      }
    });
  } catch (error) {
    console.error('Get available schedules error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};

// @desc    Update schedule status
// @route   PUT /api/schedules/:id/status
// @access  Private/Doctor
const updateScheduleStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!['active', 'inactive', 'cancelled'].includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid status. Must be active, inactive, or cancelled'
      });
    }

    const schedule = await Schedule.findByIdAndUpdate(
      req.params.id,
      { status, lastModifiedBy: req.user._id },
      { new: true, runValidators: true }
    ).populate([
      { path: 'doctor', select: 'firstName lastName specialization' }
    ]);

    if (!schedule) {
      return res.status(404).json({
        status: 'error',
        message: 'Schedule not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Schedule status updated successfully',
      data: {
        schedule
      }
    });
  } catch (error) {
    console.error('Update schedule status error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};

module.exports = {
  createSchedule,
  getAllSchedules,
  getScheduleById,
  updateSchedule,
  deleteSchedule,
  getDoctorSchedules,
  getAvailableSchedules,
  updateScheduleStatus
};

