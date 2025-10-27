const User = require('../models/User');
const { generateUserToken, generateRefreshToken } = require('../utils/jwt');
const { validationResult } = require('express-validator');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
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

    const { firstName, lastName, email, password, phone, dateOfBirth, gender, role, ...additionalFields } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'User already exists with this email'
      });
    }

    // Create user data object
    const userData = {
      firstName,
      lastName,
      email,
      password,
      phone,
      dateOfBirth,
      gender,
      role: role || 'patient'
    };

    // Add role-specific fields
    if (role === 'doctor') {
      userData.specialization = additionalFields.specialization;
      userData.licenseNumber = additionalFields.licenseNumber;
      userData.yearsOfExperience = additionalFields.yearsOfExperience;
      userData.consultationFee = additionalFields.consultationFee;
      userData.bio = additionalFields.bio;
    }

    if (role === 'patient') {
      userData.emergencyContactName = additionalFields.emergencyContactName;
      userData.emergencyContactPhone = additionalFields.emergencyContactPhone;
      userData.emergencyContactRelationship = additionalFields.emergencyContactRelationship;
      userData.insuranceProvider = additionalFields.insuranceProvider;
      userData.insuranceNumber = additionalFields.insuranceNumber;
      userData.allergies = additionalFields.allergies || [];
      userData.currentMedications = additionalFields.currentMedications || [];
      userData.medicalHistory = additionalFields.medicalHistory || [];
    }

    // Create user
    const user = await User.create(userData);

    // Generate tokens
    const token = generateUserToken(user);
    const refreshToken = generateRefreshToken(user);

    // Remove password from response
    user.password = undefined;

    res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      data: {
        user,
        token,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error during registration',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
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

    const { email, password } = req.body;

    // Find user and include password
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        status: 'error',
        message: 'Account is deactivated. Please contact support.'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }

    // Generate tokens
    const token = generateUserToken(user);
    const refreshToken = generateRefreshToken(user);

    // Remove password from response
    user.password = undefined;

    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      data: {
        user,
        token,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error during login',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
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

    const allowedUpdates = ['firstName', 'lastName', 'phone', 'address', 'bio'];
    const updates = {};

    // Filter allowed updates
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    // Add role-specific updates
    if (req.user.role === 'doctor') {
      const doctorUpdates = ['specialization', 'consultationFee', 'bio'];
      doctorUpdates.forEach(key => {
        if (req.body[key] !== undefined) {
          updates[key] = req.body[key];
        }
      });
    }

    if (req.user.role === 'patient') {
      const patientUpdates = ['emergencyContact', 'insuranceProvider', 'insuranceNumber', 'allergies', 'currentMedications', 'medicalHistory'];
      patientUpdates.forEach(key => {
        if (req.body[key] !== undefined) {
          updates[key] = req.body[key];
        }
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully',
      data: {
        user
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error during profile update',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
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

    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        status: 'error',
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error during password change',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};

// @desc    Logout user (client-side token removal)
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
  try {
    // In a real application, you might want to blacklist the token
    // For now, we'll just send a success response
    res.status(200).json({
      status: 'success',
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error during logout'
    });
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  logout
};

