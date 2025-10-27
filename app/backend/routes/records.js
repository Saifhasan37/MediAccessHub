const express = require('express');
const { body, query } = require('express-validator');
const { protect, restrictTo, canAccessMedicalRecord } = require('../middleware/auth');
const {
  createMedicalRecord,
  getAllMedicalRecords,
  getMedicalRecordById,
  updateMedicalRecord,
  deleteMedicalRecord,
  getPatientMedicalRecords,
  getDoctorMedicalRecords,
  updateRecordStatus
} = require('../controllers/recordController');

const router = express.Router();

// Validation middleware
const createMedicalRecordValidation = [
  body('patient')
    .isMongoId()
    .withMessage('Please provide a valid patient ID'),
  body('recordType')
    .isIn(['consultation', 'diagnosis', 'prescription', 'lab-result', 'imaging', 'vaccination', 'surgery', 'emergency'])
    .withMessage('Invalid record type'),
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Record title is required')
    .isLength({ max: 200 })
    .withMessage('Title cannot exceed 200 characters'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ max: 2000 })
    .withMessage('Description cannot exceed 2000 characters'),
  body('symptoms')
    .optional()
    .isArray()
    .withMessage('Symptoms must be an array'),
  body('diagnosis')
    .optional()
    .isArray()
    .withMessage('Diagnosis must be an array'),
  body('treatment')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Treatment description cannot exceed 1000 characters')
];

const updateMedicalRecordValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Title cannot exceed 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description cannot exceed 2000 characters'),
  body('symptoms')
    .optional()
    .isArray()
    .withMessage('Symptoms must be an array'),
  body('diagnosis')
    .optional()
    .isArray()
    .withMessage('Diagnosis must be an array'),
  body('treatment')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Treatment description cannot exceed 1000 characters'),
  body('status')
    .optional()
    .isIn(['draft', 'finalized', 'archived'])
    .withMessage('Invalid status')
];

// All routes are protected
router.use(protect);

// Public routes for authenticated users
router.post('/', restrictTo('doctor', 'admin'), createMedicalRecordValidation, createMedicalRecord);
router.get('/patient/:patientId', canAccessMedicalRecord, getPatientMedicalRecords);
router.get('/doctor', restrictTo('doctor', 'admin'), getDoctorMedicalRecords);

// Admin routes
router.get('/', restrictTo('admin'), getAllMedicalRecords);

// Record-specific routes
router.get('/:id', canAccessMedicalRecord, getMedicalRecordById);
router.put('/:id', canAccessMedicalRecord, updateMedicalRecordValidation, updateMedicalRecord);
router.delete('/:id', canAccessMedicalRecord, deleteMedicalRecord);
router.put('/:id/status', canAccessMedicalRecord, updateRecordStatus);

module.exports = router;

