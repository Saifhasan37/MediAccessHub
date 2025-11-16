const MedicalRecord = require('../models/MedicalRecord');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const PDFDocument = require('pdfkit');

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

    // If user is a doctor, verify that patient has a completed appointment with this doctor
    if (req.user.role === 'doctor' && req.body.patient) {
      const hasCompletedAppointment = await Appointment.findOne({
        doctor: req.user._id,
        patient: req.body.patient,
        status: 'completed'
      });

      if (!hasCompletedAppointment) {
        return res.status(403).json({
          status: 'error',
          message: 'You can only create medical records for patients who have completed appointments with you. Please complete an appointment with this patient first.'
        });
      }
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

    const allowedUpdates = ['recordType', 'title', 'description', 'symptoms', 'diagnosis', 'treatment', 'medications', 'labResults', 'followUpRequired', 'followUpDate', 'followUpNotes', 'status'];
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
    
    // Patients can only see finalized records (unless specifically requested)
    // Doctors and admins can see all records
    if (req.user.role === 'patient' && !req.query.status) {
      filter.status = 'finalized';
    }

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

// @desc    Export single medical record
// @route   POST /api/records/:id/export
// @access  Private
const exportMedicalRecord = async (req, res) => {
  let pdfDoc = null;
  try {
    const { id } = req.params;
    const { format = 'pdf' } = req.body;
    
    // Validate format
    if (format !== 'csv' && format !== 'pdf') {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid format. Supported formats: csv, pdf'
      });
    }
    
    // Get the medical record with populated data
    const record = await MedicalRecord.findById(id)
      .populate('patient', 'firstName lastName email phone dateOfBirth gender')
      .populate('doctor', 'firstName lastName specialization email');
    
    if (!record) {
      return res.status(404).json({
        status: 'error',
        message: 'Medical record not found'
      });
    }
    
    if (format === 'csv') {
      // Helper function to escape CSV fields
      const escapeCSV = (field) => {
        if (field === null || field === undefined) return 'N/A';
        if (typeof field === 'object') {
          return JSON.stringify(field);
        }
        const str = String(field);
        if (str.includes('"') || str.includes(',') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };
      
      const patientName = record.patient ? `${record.patient.firstName} ${record.patient.lastName}` : 'N/A';
      const doctorName = record.doctor ? `${record.doctor.firstName} ${record.doctor.lastName}` : 'N/A';
      
      let csvContent = '';
      csvContent += '=== MEDICAL RECORD ===\n';
      csvContent += 'Field,Value\n';
      csvContent += `Record ID,${escapeCSV(id)}\n`;
      csvContent += `Title,${escapeCSV(record.title || 'N/A')}\n`;
      csvContent += `Type,${escapeCSV(record.recordType || 'N/A')}\n`;
      csvContent += `Date,${escapeCSV(new Date(record.createdAt).toLocaleDateString())}\n`;
      csvContent += `Status,${escapeCSV(record.status || 'N/A')}\n`;
      csvContent += `Patient,${escapeCSV(patientName)}\n`;
      csvContent += `Patient Email,${escapeCSV(record.patient?.email || 'N/A')}\n`;
      csvContent += `Doctor,${escapeCSV(doctorName)}\n`;
      csvContent += `Doctor Specialization,${escapeCSV(record.doctor?.specialization || 'N/A')}\n`;
      csvContent += `Description,${escapeCSV(record.description || 'N/A')}\n`;
      
      if (record.diagnosis) {
        const diagnosis = Array.isArray(record.diagnosis) 
          ? record.diagnosis.join('; ') 
          : record.diagnosis;
        csvContent += `Diagnosis,${escapeCSV(diagnosis)}\n`;
      }
      
      if (record.symptoms) {
        const symptoms = Array.isArray(record.symptoms) 
          ? record.symptoms.join('; ') 
          : record.symptoms;
        csvContent += `Symptoms,${escapeCSV(symptoms)}\n`;
      }
      
      if (record.treatment) {
        csvContent += `Treatment,${escapeCSV(record.treatment)}\n`;
      }
      
      if (record.medications && Array.isArray(record.medications) && record.medications.length > 0) {
        const medications = record.medications.map(med => {
          const parts = [];
          if (med.name) parts.push(med.name);
          if (med.dosage) parts.push(med.dosage);
          if (med.frequency) parts.push(med.frequency);
          return parts.join(' ');
        }).join('; ');
        csvContent += `Medications,${escapeCSV(medications)}\n`;
      }
      
      if (record.followUpDate) {
        csvContent += `Follow-up Date,${escapeCSV(new Date(record.followUpDate).toLocaleDateString())}\n`;
      }
      
      if (record.followUpNotes) {
        csvContent += `Follow-up Notes,${escapeCSV(record.followUpNotes)}\n`;
      }
      
      if (record.notes) {
        csvContent += `Notes,${escapeCSV(record.notes)}\n`;
      }
      
      csvContent += `Export Date,${escapeCSV(new Date().toLocaleString())}\n`;
      
      const csvWithBOM = '\ufeff' + csvContent;
      const csvBuffer = Buffer.from(csvWithBOM, 'utf8');
      
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="medical-record-${record.title || 'record'}-${new Date().toISOString().split('T')[0]}.csv"`);
      res.setHeader('Content-Length', csvBuffer.length);
      res.setHeader('Cache-Control', 'no-cache');
      
      res.send(csvBuffer);
    } else if (format === 'pdf') {
      pdfDoc = new PDFDocument({ margin: 50 });
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="medical-record-${record.title || 'record'}-${new Date().toISOString().split('T')[0]}.pdf"`);
      res.setHeader('Cache-Control', 'no-cache');
      
      pdfDoc.on('error', (error) => {
        console.error('PDF generation error:', error);
        if (!res.headersSent) {
          res.status(500).json({
            status: 'error',
            message: 'Failed to generate PDF. Please try again.'
          });
        } else {
          res.end();
        }
        if (pdfDoc) {
          pdfDoc.destroy();
        }
      });
      
      res.on('error', (error) => {
        console.error('Response stream error:', error);
        if (pdfDoc) {
          pdfDoc.destroy();
        }
      });
      
      pdfDoc.pipe(res);
      
      const patientName = record.patient ? `${record.patient.firstName} ${record.patient.lastName}` : 'N/A';
      const doctorName = record.doctor ? `${record.doctor.firstName} ${record.doctor.lastName}` : 'N/A';
      
      // Header
      pdfDoc.fontSize(20).text('Medical Record', { align: 'center' });
      pdfDoc.moveDown();
      pdfDoc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
      pdfDoc.moveDown(1);
      
      // Record Information
      pdfDoc.fontSize(16).text('Record Information', { underline: true });
      pdfDoc.moveDown(0.5);
      pdfDoc.fontSize(11);
      pdfDoc.text(`Title: ${record.title || 'N/A'}`);
      pdfDoc.text(`Type: ${record.recordType || 'N/A'}`);
      pdfDoc.text(`Date: ${new Date(record.createdAt).toLocaleDateString()}`);
      pdfDoc.text(`Status: ${record.status || 'N/A'}`);
      pdfDoc.moveDown(1);
      
      // Patient Information
      pdfDoc.fontSize(16).text('Patient Information', { underline: true });
      pdfDoc.moveDown(0.5);
      pdfDoc.fontSize(11);
      pdfDoc.text(`Name: ${patientName}`);
      if (record.patient?.email) {
        pdfDoc.text(`Email: ${record.patient.email}`);
      }
      if (record.patient?.phone) {
        pdfDoc.text(`Phone: ${record.patient.phone}`);
      }
      pdfDoc.moveDown(1);
      
      // Doctor Information
      pdfDoc.fontSize(16).text('Doctor Information', { underline: true });
      pdfDoc.moveDown(0.5);
      pdfDoc.fontSize(11);
      pdfDoc.text(`Name: ${doctorName}`);
      if (record.doctor?.specialization) {
        pdfDoc.text(`Specialization: ${record.doctor.specialization}`);
      }
      if (record.doctor?.email) {
        pdfDoc.text(`Email: ${record.doctor.email}`);
      }
      pdfDoc.moveDown(1);
      
      // Medical Details
      pdfDoc.fontSize(16).text('Medical Details', { underline: true });
      pdfDoc.moveDown(0.5);
      pdfDoc.fontSize(11);
      
      if (record.description) {
        pdfDoc.text(`Description: ${record.description}`);
        pdfDoc.moveDown(0.5);
      }
      
      if (record.diagnosis) {
        const diagnosis = Array.isArray(record.diagnosis) 
          ? record.diagnosis.join(', ') 
          : record.diagnosis;
        pdfDoc.text(`Diagnosis: ${diagnosis}`);
        pdfDoc.moveDown(0.5);
      }
      
      if (record.symptoms) {
        const symptoms = Array.isArray(record.symptoms) 
          ? record.symptoms.join(', ') 
          : record.symptoms;
        pdfDoc.text(`Symptoms: ${symptoms}`);
        pdfDoc.moveDown(0.5);
      }
      
      if (record.treatment) {
        pdfDoc.text(`Treatment: ${record.treatment}`);
        pdfDoc.moveDown(0.5);
      }
      
      if (record.medications && Array.isArray(record.medications) && record.medications.length > 0) {
        pdfDoc.text('Medications:');
        record.medications.forEach(med => {
          const medParts = [];
          if (med.name) medParts.push(med.name);
          if (med.dosage) medParts.push(`(${med.dosage})`);
          if (med.frequency) medParts.push(`- ${med.frequency}`);
          pdfDoc.text(`  • ${medParts.join(' ')}`, { indent: 20 });
        });
        pdfDoc.moveDown(0.5);
      }
      
      if (record.followUpDate) {
        pdfDoc.text(`Follow-up Date: ${new Date(record.followUpDate).toLocaleDateString()}`);
        pdfDoc.moveDown(0.5);
      }
      
      if (record.followUpNotes) {
        pdfDoc.text(`Follow-up Notes: ${record.followUpNotes}`);
        pdfDoc.moveDown(0.5);
      }
      
      if (record.notes) {
        pdfDoc.text(`Notes: ${record.notes}`);
      }
      
      pdfDoc.moveDown(1);
      
      // Footer
      pdfDoc.fontSize(8).text(
        'This is a confidential medical document. Unauthorized distribution is prohibited.',
        50,
        pdfDoc.page.height - 50,
        { align: 'center', width: pdfDoc.page.width - 100 }
      );
      
      pdfDoc.end();
    }
  } catch (error) {
    console.error('Export medical record error:', error);
    
    if (pdfDoc) {
      try {
        pdfDoc.destroy();
      } catch (destroyError) {
        console.error('Error destroying PDF document:', destroyError);
      }
    }
    
    if (!res.headersSent) {
      res.status(500).json({
        status: 'error',
        message: 'Server error during export',
        ...(process.env.NODE_ENV === 'development' && { error: error.message })
      });
    } else {
      res.end();
    }
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
  updateRecordStatus,
  exportMedicalRecord
};

