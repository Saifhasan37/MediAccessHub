const Appointment = require('../models/Appointment');
const MedicalRecord = require('../models/MedicalRecord');
const User = require('../models/User');

// Get doctor's appointments
const getDoctorAppointments = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const { status, date, limit = 50, page = 1 } = req.query;

    const query = { doctor: doctorId };
    
    if (status) {
      query.status = status;
    }
    
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      query.appointmentDate = { $gte: startDate, $lt: endDate };
    }

    const appointments = await Appointment.find(query)
      .populate('patient', 'firstName lastName email phone')
      .populate('doctor', 'firstName lastName specialization')
      .sort({ appointmentDate: 1, appointmentTime: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Appointment.countDocuments(query);

    res.status(200).json({
      status: 'success',
      data: {
        appointments,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
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

// Get doctor's medical records
const getDoctorMedicalRecords = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const { patientId, status, limit = 50, page = 1 } = req.query;

    const query = { doctor: doctorId };
    
    if (patientId) {
      query.patient = patientId;
    }
    
    if (status) {
      query.status = status;
    }

    const records = await MedicalRecord.find(query)
      .populate('patient', 'firstName lastName email phone dateOfBirth gender')
      .populate('doctor', 'firstName lastName specialization')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await MedicalRecord.countDocuments(query);

    res.status(200).json({
      status: 'success',
      data: {
        records,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
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

// Update appointment status
const updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const doctorId = req.user.id;

    // Verify the appointment belongs to this doctor
    const appointment = await Appointment.findOne({ _id: id, doctor: doctorId });
    
    if (!appointment) {
      return res.status(404).json({
        status: 'error',
        message: 'Appointment not found or not authorized'
      });
    }

    appointment.status = status;
    appointment.updatedAt = new Date();
    
    await appointment.save();

    const updatedAppointment = await Appointment.findById(id)
      .populate('patient', 'firstName lastName email phone')
      .populate('doctor', 'firstName lastName specialization');

    res.status(200).json({
      status: 'success',
      message: 'Appointment status updated successfully',
      data: {
        appointment: updatedAppointment
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

// Create medical record
const createMedicalRecord = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const {
      patient,
      diagnosis,
      notes,
      symptoms = [],
      prescription,
      followUpDate,
      followUpNotes,
      status = 'active'
    } = req.body;

    // Verify patient exists
    const patientExists = await User.findById(patient);
    if (!patientExists) {
      return res.status(400).json({
        status: 'error',
        message: 'Patient not found'
      });
    }

    // Verify that patient has a completed appointment with this doctor
    const Appointment = require('../models/Appointment');
    const hasCompletedAppointment = await Appointment.findOne({
      doctor: doctorId,
      patient: patient,
      status: 'completed'
    });

    if (!hasCompletedAppointment) {
      return res.status(403).json({
        status: 'error',
        message: 'You can only create medical records for patients who have completed appointments with you. Please complete an appointment with this patient first.'
      });
    }

    const medicalRecord = new MedicalRecord({
      patient,
      doctor: doctorId,
      diagnosis,
      notes,
      symptoms,
      prescription,
      followUpDate,
      followUpNotes,
      status
    });

    await medicalRecord.save();

    const populatedRecord = await MedicalRecord.findById(medicalRecord._id)
      .populate('patient', 'firstName lastName email phone dateOfBirth gender')
      .populate('doctor', 'firstName lastName specialization');

    res.status(201).json({
      status: 'success',
      message: 'Medical record created successfully',
      data: {
        record: populatedRecord
      }
    });
  } catch (error) {
    console.error('Create medical record error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};

// Update medical record
const updateMedicalRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const doctorId = req.user.id;
    const updateData = req.body;

    // Verify the record belongs to this doctor
    const record = await MedicalRecord.findOne({ _id: id, doctor: doctorId });
    
    if (!record) {
      return res.status(404).json({
        status: 'error',
        message: 'Medical record not found or not authorized'
      });
    }

    // Update the record
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        record[key] = updateData[key];
      }
    });

    record.updatedAt = new Date();
    await record.save();

    const updatedRecord = await MedicalRecord.findById(id)
      .populate('patient', 'firstName lastName email phone dateOfBirth gender')
      .populate('doctor', 'firstName lastName specialization');

    res.status(200).json({
      status: 'success',
      message: 'Medical record updated successfully',
      data: {
        record: updatedRecord
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

// Delete medical record
const deleteMedicalRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const doctorId = req.user.id;

    // Verify the record belongs to this doctor
    const record = await MedicalRecord.findOne({ _id: id, doctor: doctorId });
    
    if (!record) {
      return res.status(404).json({
        status: 'error',
        message: 'Medical record not found or not authorized'
      });
    }

    await MedicalRecord.findByIdAndDelete(id);

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

module.exports = {
  getDoctorAppointments,
  getDoctorMedicalRecords,
  updateAppointmentStatus,
  createMedicalRecord,
  updateMedicalRecord,
  deleteMedicalRecord
};





