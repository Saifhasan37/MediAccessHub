const express = require('express');
const { body, query } = require('express-validator');
const { protect, restrictTo, canAccessAppointment } = require('../middleware/auth');
const {
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
} = require('../controllers/appointmentController');

const router = express.Router();

// Validation middleware
const createAppointmentValidation = [
  body('doctor')
    .isMongoId()
    .withMessage('Please provide a valid doctor ID'),
  body('appointmentDate')
    .isISO8601()
    .withMessage('Please provide a valid appointment date'),
  body('appointmentTime')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Please provide a valid time format (HH:MM)'),
  body('reason')
    .trim()
    .notEmpty()
    .withMessage('Appointment reason is required')
    .isLength({ max: 500 })
    .withMessage('Reason cannot exceed 500 characters'),
  body('type')
    .optional()
    .isIn(['consultation', 'follow-up', 'emergency', 'routine-checkup', 'specialist'])
    .withMessage('Invalid appointment type'),
  body('duration')
    .optional()
    .isInt({ min: 15, max: 120 })
    .withMessage('Duration must be between 15 and 120 minutes'),
  body('symptoms')
    .optional()
    .isArray()
    .withMessage('Symptoms must be an array')
];

const updateAppointmentValidation = [
  body('appointmentDate')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid appointment date'),
  body('appointmentTime')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Please provide a valid time format (HH:MM)'),
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Reason cannot exceed 500 characters'),
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters'),
  body('symptoms')
    .optional()
    .isArray()
    .withMessage('Symptoms must be an array'),
  body('diagnosis')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Diagnosis cannot exceed 500 characters'),
  body('prescription')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Prescription cannot exceed 1000 characters')
];

const updateStatusValidation = [
  body('status')
    .isIn(['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'])
    .withMessage('Invalid status'),
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters')
];

// All routes are protected
router.use(protect);

// Public routes for authenticated users
router.get('/available-slots', getAvailableTimeSlots);
router.post('/', createAppointmentValidation, createAppointment);
router.get('/my-appointments', getPatientAppointments);

// Doctor routes
router.get('/doctor-appointments', restrictTo('doctor', 'admin'), getDoctorAppointments);

// Admin routes
router.get('/', restrictTo('admin'), getAllAppointments);

// Appointment-specific routes
router.get('/:id', canAccessAppointment, getAppointmentById);
router.put('/:id', canAccessAppointment, updateAppointmentValidation, updateAppointment);
router.delete('/:id', canAccessAppointment, deleteAppointment);
router.put('/:id/status', canAccessAppointment, updateStatusValidation, updateAppointmentStatus);
router.put('/:id/cancel', canAccessAppointment, cancelAppointment);

module.exports = router;

