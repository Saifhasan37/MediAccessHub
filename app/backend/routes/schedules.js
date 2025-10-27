const express = require('express');
const { body, query } = require('express-validator');
const { protect, restrictTo } = require('../middleware/auth');
const {
  createSchedule,
  getAllSchedules,
  getScheduleById,
  updateSchedule,
  deleteSchedule,
  getDoctorSchedules,
  getAvailableSchedules,
  updateScheduleStatus
} = require('../controllers/scheduleController');

const router = express.Router();

// Validation middleware
const createScheduleValidation = [
  body('date')
    .isISO8601()
    .withMessage('Please provide a valid date'),
  body('timeSlots')
    .isArray({ min: 1 })
    .withMessage('At least one time slot is required'),
  body('timeSlots.*.startTime')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Please provide a valid start time format (HH:MM)'),
  body('timeSlots.*.endTime')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Please provide a valid end time format (HH:MM)'),
  body('appointmentDuration')
    .optional()
    .isInt({ min: 15, max: 120 })
    .withMessage('Appointment duration must be between 15 and 120 minutes'),
  body('consultationFee')
    .isFloat({ min: 0 })
    .withMessage('Consultation fee must be a non-negative number')
];

const updateScheduleValidation = [
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid date'),
  body('timeSlots')
    .optional()
    .isArray({ min: 1 })
    .withMessage('At least one time slot is required'),
  body('appointmentDuration')
    .optional()
    .isInt({ min: 15, max: 120 })
    .withMessage('Appointment duration must be between 15 and 120 minutes'),
  body('consultationFee')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Consultation fee must be a non-negative number'),
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'cancelled'])
    .withMessage('Invalid status')
];

// All routes are protected
router.use(protect);

// Public routes for authenticated users
router.get('/available', getAvailableSchedules);

// Doctor routes
router.post('/', restrictTo('doctor', 'admin'), createScheduleValidation, createSchedule);
router.get('/my-schedules', restrictTo('doctor', 'admin'), getDoctorSchedules);

// Admin routes
router.get('/', restrictTo('admin'), getAllSchedules);

// Schedule-specific routes
router.get('/:id', getScheduleById);
router.put('/:id', restrictTo('doctor', 'admin'), updateScheduleValidation, updateSchedule);
router.delete('/:id', restrictTo('doctor', 'admin'), deleteSchedule);
router.put('/:id/status', restrictTo('doctor', 'admin'), updateScheduleStatus);

module.exports = router;

