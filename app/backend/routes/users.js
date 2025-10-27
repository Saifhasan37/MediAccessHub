const express = require('express');
const { body, query } = require('express-validator');
const { protect, restrictTo, canAccessPatientData } = require('../middleware/auth');
const {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getDoctors,
  getPatients,
  searchUsers
} = require('../controllers/userController');

const router = express.Router();

// Validation middleware
const updateUserValidation = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('First name cannot exceed 50 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Last name cannot exceed 50 characters'),
  body('phone')
    .optional()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please provide a valid phone number'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value')
];

// All routes are protected
router.use(protect);

// Admin only routes
router.get('/', restrictTo('admin'), getAllUsers);
router.get('/search', restrictTo('admin'), searchUsers);
router.put('/:id', restrictTo('admin'), updateUserValidation, updateUser);
router.delete('/:id', restrictTo('admin'), deleteUser);

// Public routes for all authenticated users
router.get('/doctors', getDoctors);
router.get('/patients', restrictTo('admin'), getPatients);
router.get('/:id', canAccessPatientData, getUserById);

module.exports = router;

