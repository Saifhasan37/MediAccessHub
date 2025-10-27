const jwt = require('jsonwebtoken');

// Generate JWT token
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// Generate token for user
const generateUserToken = (user) => {
  const payload = {
    id: user._id,
    email: user.email,
    role: user.role
  };

  return generateToken(payload);
};

// Generate refresh token
const generateRefreshToken = (user) => {
  const payload = {
    id: user._id,
    type: 'refresh'
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// Verify token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
};

// Decode token without verification (for debugging)
const decodeToken = (token) => {
  return jwt.decode(token);
};

// Generate password reset token
const generatePasswordResetToken = (user) => {
  const payload = {
    id: user._id,
    email: user.email,
    type: 'password-reset'
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '1h' // Password reset tokens expire in 1 hour
  });
};

// Generate email verification token
const generateEmailVerificationToken = (user) => {
  const payload = {
    id: user._id,
    email: user.email,
    type: 'email-verification'
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '24h' // Email verification tokens expire in 24 hours
  });
};

module.exports = {
  generateToken,
  generateUserToken,
  generateRefreshToken,
  verifyToken,
  decodeToken,
  generatePasswordResetToken,
  generateEmailVerificationToken
};

