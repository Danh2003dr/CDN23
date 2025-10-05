const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

/**
 * @desc    Register new user
 * @route   POST /api/auth/register
 * @access  Public (Admin only in production)
 */
const register = asyncHandler(async (req, res) => {
  const {
    walletAddress,
    username,
    email,
    password,
    fullName,
    phoneNumber,
    role,
    organizationInfo
  } = req.body;

  // Check if user exists
  const existingUser = await User.findOne({
    $or: [
      { email: email.toLowerCase() },
      { username },
      { walletAddress: walletAddress.toLowerCase() }
    ]
  });

  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'User already exists with this email, username, or wallet address'
    });
  }

  // Create user
  const userData = {
    walletAddress: walletAddress.toLowerCase(),
    username,
    email: email.toLowerCase(),
    password,
    fullName,
    phoneNumber,
    role: role || 'PATIENT'
  };

  // Add organization info for business roles
  if (['MANUFACTURER', 'DISTRIBUTOR', 'HOSPITAL'].includes(role) && organizationInfo) {
    userData.organizationInfo = organizationInfo;
  }

  const user = await User.create(userData);

  // Generate email verification token
  const verificationToken = user.generateVerificationToken();
  await user.save();

  // Generate JWT
  const token = generateToken(user._id);

  logger.info(`New user registered: ${user.email} (${user.role})`);

  res.status(201).json({
    success: true,
    message: 'User registered successfully. Please verify your email.',
    data: {
      user: {
        id: user._id,
        walletAddress: user.walletAddress,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        isFirstLogin: user.isFirstLogin
      },
      token,
      verificationToken // In production, this should be sent via email
    }
  });
});

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body; // identifier can be email or username

  if (!identifier || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide email/username and password'
    });
  }

  // Find user and include password for comparison
  const user = await User.findByCredentials(identifier, password);

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  const token = generateToken(user._id);

  logger.info(`User logged in: ${user.email} (${user.role})`);

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user._id,
        walletAddress: user.walletAddress,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        permissions: user.getRolePermissions(),
        isEmailVerified: user.isEmailVerified,
        isFirstLogin: user.isFirstLogin,
        lastLogin: user.lastLogin
      },
      token,
      requirePasswordChange: user.isFirstLogin
    }
  });
});

/**
 * @desc    Get current logged in user
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = asyncHandler(async (req, res) => {
  const user = req.user;

  res.json({
    success: true,
    data: {
      user: {
        id: user._id,
        walletAddress: user.walletAddress,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        address: user.address,
        role: user.role,
        permissions: user.getRolePermissions(),
        organizationInfo: user.organizationInfo,
        isEmailVerified: user.isEmailVerified,
        isFirstLogin: user.isFirstLogin,
        preferences: user.preferences,
        profileImage: user.profileImage,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
    }
  });
});

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/profile
 * @access  Private
 */
const updateProfile = asyncHandler(async (req, res) => {
  const {
    fullName,
    phoneNumber,
    address,
    organizationInfo,
    preferences
  } = req.body;

  const user = await User.findById(req.user._id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Update allowed fields
  if (fullName) user.fullName = fullName;
  if (phoneNumber) user.phoneNumber = phoneNumber;
  if (address) user.address = address;
  if (preferences) user.preferences = { ...user.preferences, ...preferences };

  // Update organization info for business roles
  if (['MANUFACTURER', 'DISTRIBUTOR', 'HOSPITAL'].includes(user.role) && organizationInfo) {
    user.organizationInfo = { ...user.organizationInfo, ...organizationInfo };
  }

  await user.save();

  logger.info(`User profile updated: ${user.email}`);

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user: user.toJSON()
    }
  });
});

/**
 * @desc    Change password
 * @route   PUT /api/auth/change-password
 * @access  Private
 */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Please provide current and new passwords'
    });
  }

  const user = await User.findById(req.user._id);

  // Verify current password (except for first login)
  if (!user.isFirstLogin) {
    const isValidPassword = await user.comparePassword(currentPassword);
    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }
  }

  // Validate new password strength
  if (newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'New password must be at least 6 characters long'
    });
  }

  // Update password
  user.password = newPassword;
  user.isFirstLogin = false;
  await user.save();

  logger.info(`Password changed for user: ${user.email}`);

  res.json({
    success: true,
    message: 'Password changed successfully',
    data: {
      requirePasswordChange: false
    }
  });
});

/**
 * @desc    Forgot password
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found with this email'
    });
  }

  // Generate reset token
  const resetToken = user.generatePasswordResetToken();
  await user.save();

  logger.info(`Password reset requested for user: ${user.email}`);

  res.json({
    success: true,
    message: 'Password reset token generated',
    data: {
      resetToken // In production, send via email instead
    }
  });
});

/**
 * @desc    Reset password
 * @route   PUT /api/auth/reset-password/:resetToken
 * @access  Public
 */
const resetPassword = asyncHandler(async (req, res) => {
  const { resetToken } = req.params;
  const { password } = req.body;

  const user = await User.findOne({
    passwordResetToken: resetToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  if (!user) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired reset token'
    });
  }

  // Set new password
  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  logger.info(`Password reset completed for user: ${user.email}`);

  res.json({
    success: true,
    message: 'Password reset successful'
  });
});

/**
 * @desc    Verify email
 * @route   PUT /api/auth/verify-email/:verificationToken
 * @access  Public
 */
const verifyEmail = asyncHandler(async (req, res) => {
  const { verificationToken } = req.params;

  const user = await User.findOne({
    emailVerificationToken: verificationToken,
    emailVerificationExpires: { $gt: Date.now() }
  });

  if (!user) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired verification token'
    });
  }

  // Verify email
  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();

  logger.info(`Email verified for user: ${user.email}`);

  res.json({
    success: true,
    message: 'Email verified successfully'
  });
});

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = asyncHandler(async (req, res) => {
  // In a more sophisticated app, you'd maintain a blacklist of tokens
  logger.info(`User logged out: ${req.user.email}`);

  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

/**
 * Generate JWT Token
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
  logout
};