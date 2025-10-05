const express = require('express');
const { body } = require('express-validator');
const {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
  logout
} = require('../controllers/authController');
const { authenticate, sensitiveOperationLimit } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/errorHandler');
const { uploadConfigs } = require('../middleware/upload');

const router = express.Router();

/**
 * @desc    Register new user
 * @route   POST /api/auth/register
 * @access  Public
 */
router.post('/register', [
  body('walletAddress')
    .isLength({ min: 42, max: 42 })
    .matches(/^0x[a-fA-F0-9]{40}$/)
    .withMessage('Invalid wallet address format'),
  body('username')
    .isLength({ min: 3, max: 50 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username must be 3-50 characters and contain only letters, numbers, and underscores'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('fullName')
    .isLength({ min: 2, max: 100 })
    .trim()
    .withMessage('Full name must be 2-100 characters'),
  body('role')
    .isIn(['PATIENT', 'MANUFACTURER', 'DISTRIBUTOR', 'HOSPITAL'])
    .withMessage('Invalid role'),
  handleValidationErrors
], register);

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
router.post('/login', [
  body('identifier')
    .notEmpty()
    .withMessage('Email or username is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors,
  sensitiveOperationLimit(5, 15 * 60 * 1000) // 5 attempts per 15 minutes
], login);

/**
 * @desc    Get current user
 * @route   GET /api/auth/me
 * @access  Private
 */
router.get('/me', authenticate, getMe);

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/profile
 * @access  Private
 */
router.put('/profile', [
  authenticate,
  uploadConfigs.profileImage,
  body('fullName')
    .optional()
    .isLength({ min: 2, max: 100 })
    .trim()
    .withMessage('Full name must be 2-100 characters'),
  body('phoneNumber')
    .optional()
    .matches(/^[0-9+\-\s()]+$/)
    .withMessage('Invalid phone number format'),
  handleValidationErrors
], updateProfile);

/**
 * @desc    Change password
 * @route   PUT /api/auth/change-password
 * @access  Private
 */
router.put('/change-password', [
  authenticate,
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters'),
  body('currentPassword')
    .optional()
    .notEmpty()
    .withMessage('Current password is required for existing users'),
  handleValidationErrors,
  sensitiveOperationLimit(3, 60 * 60 * 1000) // 3 attempts per hour
], changePassword);

/**
 * @desc    Forgot password
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
router.post('/forgot-password', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  handleValidationErrors,
  sensitiveOperationLimit(3, 60 * 60 * 1000) // 3 attempts per hour
], forgotPassword);

/**
 * @desc    Reset password
 * @route   PUT /api/auth/reset-password/:resetToken
 * @access  Public
 */
router.put('/reset-password/:resetToken', [
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  handleValidationErrors,
  sensitiveOperationLimit(3, 60 * 60 * 1000) // 3 attempts per hour
], resetPassword);

/**
 * @desc    Verify email
 * @route   PUT /api/auth/verify-email/:verificationToken
 * @access  Public
 */
router.put('/verify-email/:verificationToken', verifyEmail);

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Private
 */
router.post('/logout', authenticate, logout);

module.exports = router;