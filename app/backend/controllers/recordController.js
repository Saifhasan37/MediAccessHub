const MedicalRecord = require('../models/MedicalRecord');
const { validationResult } = require('express-validator');

// @desc    Create medical record
// @route   POST /api/records
// @access  Private/Doctor
const createMedicalRecord = async (req, res) => {
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

    const recordData = {
      ...req.body,
      doctor: req.user._id,
      reviewedBy: req.user._id,
      reviewedAt: new Date()
    };

    const record = await MedicalRecord.create(recordData);

    // Populate record data
    await record.populate([
      { path: 'patient', select: 'firstName lastName email phone dateOfBirth' },
      { path: 'doctor', select: 'firstName lastName specialization' }
    ]);

    res.status(201).json({
      status: 'success',
      message: 'Medical record created successfully',
      data: {
        record
      }
    });
  } catch (error) {
    console.error('Create medical record error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error during medical record creation',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};

// @desc    Get all medical records (Admin only)
// @route   GET /api/records
// @access  Private/Admin
const getAllMedicalRecords = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};
    if (req.query.recordType) filter.recordType = req.query.recordType;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.doctor) filter.doctor = req.query.doctor;
    if (req.query.patient) filter.patient = req.query.patient;

    const records = await MedicalRecord.find(filter)
      .populate([
        { path: 'patient', select: 'firstName lastName email phone' },
        { path: 'doctor', select: 'firstName lastName specialization' }
      ])
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await MedicalRecord.countDocuments(filter);

    res.status(200).json({
      status: 'success',
      results: records.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: {
        records
      }
    });
  } catch (error) {
    console.error('Get all medical records error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};

// @desc    Get medical record by ID
// @route   GET /api/records/:id
// @access  Private
const getMedicalRecordById = async (req, res) => {
  try {
    const record = await MedicalRecord.findById(req.params.id)
      .populate([
        { path: 'patient', select: 'firstName lastName email phone dateOfBirth gender' },
        { path: 'doctor', select: 'firstName lastName specialization' }
      ]);

    if (!record) {
      return res.status(404).json({
        status: 'error',
        message: 'Medical record not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        record
      }
    });
  } catch (error) {
    console.error('Get medical record by ID error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};

// @desc    Update medical record
// @route   PUT /api/records/:id
// @access  Private
const updateMedicalRecord = async (req, res) => {
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

    const allowedUpdates = ['title', 'description', 'symptoms', 'diagnosis', 'treatment', 'medications', 'labResults', 'followUpRequired', 'followUpDate', 'followUpNotes', 'notes'];
    const updates = {};

    // Filter allowed updates
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const record = await MedicalRecord.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate([
      { path: 'patient', select: 'firstName lastName email phone' },
      { path: 'doctor', select: 'firstName lastName specialization' }
    ]);

    if (!record) {
      return res.status(404).json({
        status: 'error',
        message: 'Medical record not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Medical record updated successfully',
      data: {
        record
      }
    });
  } catch (error) {
    console.error('Update medical record error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};

// @desc    Delete medical record
// @route   DELETE /api/records/:id
// @access  Private
const deleteMedicalRecord = async (req, res) => {
  try {
    const record = await MedicalRecord.findByIdAndDelete(req.params.id);

    if (!record) {
      return res.status(404).json({
        status: 'error',
        message: 'Medical record not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Medical record deleted successfully'
    });
  } catch (error) {
    console.error('Delete medical record error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};

// @desc    Get patient medical records
// @route   GET /api/records/patient/:patientId
// @access  Private
const getPatientMedicalRecords = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = { patient: req.params.patientId };
    if (req.query.recordType) filter.recordType = req.query.recordType;
    if (req.query.status) filter.status = req.query.status;

    const records = await MedicalRecord.find(filter)
      .populate([
        { path: 'doctor', select: 'firstName lastName specialization' }
      ])
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await MedicalRecord.countDocuments(filter);

    res.status(200).json({
      status: 'success',
      results: records.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: {
        records
      }
    });
  } catch (error) {
    console.error('Get patient medical records error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};

// @desc    Get doctor medical records
// @route   GET /api/records/doctor
// @access  Private/Doctor
const getDoctorMedicalRecords = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = { doctor: req.user._id };
    if (req.query.recordType) filter.recordType = req.query.recordType;
    if (req.query.status) filter.status = req.query.status;

    const records = await MedicalRecord.find(filter)
      .populate([
        { path: 'patient', select: 'firstName lastName email phone dateOfBirth' }
      ])
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await MedicalRecord.countDocuments(filter);

    res.status(200).json({
      status: 'success',
      results: records.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: {
        records
      }
    });
  } catch (error) {
    console.error('Get doctor medical records error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};

// @desc    Update record status
// @route   PUT /api/records/:id/status
// @access  Private
const updateRecordStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!['draft', 'finalized', 'archived'].includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid status. Must be draft, finalized, or archived'
      });
    }

    const record = await MedicalRecord.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).populate([
      { path: 'patient', select: 'firstName lastName email phone' },
      { path: 'doctor', select: 'firstName lastName specialization' }
    ]);

    if (!record) {
      return res.status(404).json({
        status: 'error',
        message: 'Medical record not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Medical record status updated successfully',
      data: {
        record
      }
    });
  } catch (error) {
    console.error('Update record status error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};

module.exports = {
  createMedicalRecord,
  getAllMedicalRecords,
  getMedicalRecordById,
  updateMedicalRecord,
  deleteMedicalRecord,
  getPatientMedicalRecords,
  getDoctorMedicalRecords,
  updateRecordStatus
};

