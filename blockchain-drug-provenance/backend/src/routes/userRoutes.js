const express = require('express');
const { body, param, query } = require('express-validator');
const User = require('../models/User');
const { authenticate, authorize, checkOwnership } = require('../middleware/auth');
const { handleValidationErrors, asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @desc    Get all users
 * @route   GET /api/users
 * @access  Private (ADMIN)
 */
router.get('/', [
  authenticate,
  authorize('ADMIN'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('role')
    .optional()
    .isIn(['PATIENT', 'MANUFACTURER', 'DISTRIBUTOR', 'HOSPITAL', 'ADMIN'])
    .withMessage('Invalid role'),
  handleValidationErrors
], asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    role,
    isActive,
    search
  } = req.query;

  const query = {};
  
  if (role) query.role = role;
  if (isActive !== undefined) query.isActive = isActive === 'true';
  
  if (search) {
    query.$or = [
      { fullName: new RegExp(search, 'i') },
      { username: new RegExp(search, 'i') },
      { email: new RegExp(search, 'i') }
    ];
  }

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { createdAt: -1 },
    select: '-password -emailVerificationToken -passwordResetToken'
  };

  const users = await User.find(query)
    .select(options.select)
    .sort(options.sort)
    .limit(options.limit)
    .skip((options.page - 1) * options.limit);

  const total = await User.countDocuments(query);

  res.json({
    success: true,
    data: {
      users,
      pagination: {
        currentPage: options.page,
        totalPages: Math.ceil(total / options.limit),
        totalItems: total,
        itemsPerPage: options.limit
      }
    }
  });
}));

/**
 * @desc    Get single user
 * @route   GET /api/users/:id
 * @access  Private (ADMIN or own profile)
 */
router.get('/:id', [
  authenticate,
  param('id').isMongoId().withMessage('Invalid user ID'),
  handleValidationErrors
], asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Check if user can view this profile
  if (req.user.role !== 'ADMIN' && req.user._id.toString() !== req.params.id) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  res.json({
    success: true,
    data: { user }
  });
}));

/**
 * @desc    Create new user
 * @route   POST /api/users
 * @access  Private (ADMIN)
 */
router.post('/', [
  authenticate,
  authorize('ADMIN'),
  body('walletAddress')
    .matches(/^0x[a-fA-F0-9]{40}$/)
    .withMessage('Invalid wallet address format'),
  body('username')
    .isLength({ min: 3, max: 50 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username must be 3-50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('fullName')
    .isLength({ min: 2, max: 100 })
    .trim()
    .withMessage('Full name must be 2-100 characters'),
  body('role')
    .isIn(['PATIENT', 'MANUFACTURER', 'DISTRIBUTOR', 'HOSPITAL', 'ADMIN'])
    .withMessage('Invalid role'),
  handleValidationErrors
], asyncHandler(async (req, res) => {
  const {
    walletAddress,
    username,
    email,
    fullName,
    phoneNumber,
    role,
    organizationInfo
  } = req.body;

  // Check if user already exists
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

  // Create user with default password
  const userData = {
    walletAddress: walletAddress.toLowerCase(),
    username,
    email: email.toLowerCase(),
    password: 'DefaultPass123!', // Should be changed on first login
    fullName,
    phoneNumber,
    role,
    isFirstLogin: true
  };

  // Add organization info for business roles
  if (['MANUFACTURER', 'DISTRIBUTOR', 'HOSPITAL'].includes(role) && organizationInfo) {
    userData.organizationInfo = organizationInfo;
  }

  const user = await User.create(userData);

  logger.info(`New user created by admin: ${user.email} (${user.role})`);

  res.status(201).json({
    success: true,
    message: 'User created successfully',
    data: {
      user: user.toJSON()
    }
  });
}));

/**
 * @desc    Update user
 * @route   PUT /api/users/:id
 * @access  Private (ADMIN or own profile)
 */
router.put('/:id', [
  authenticate,
  param('id').isMongoId().withMessage('Invalid user ID'),
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
], asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Check permissions
  const isOwnProfile = req.user._id.toString() === req.params.id;
  const isAdmin = req.user.role === 'ADMIN';

  if (!isOwnProfile && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  // Update allowed fields
  const allowedUpdates = ['fullName', 'phoneNumber', 'address', 'preferences'];
  const adminOnlyUpdates = ['role', 'isActive', 'organizationInfo'];

  const updates = {};
  
  // Regular user updates
  allowedUpdates.forEach(field => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  // Admin-only updates
  if (isAdmin) {
    adminOnlyUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.params.id,
    updates,
    { new: true, runValidators: true }
  ).select('-password');

  logger.info(`User updated: ${user.email} by ${req.user.email}`);

  res.json({
    success: true,
    message: 'User updated successfully',
    data: { user: updatedUser }
  });
}));

/**
 * @desc    Update user role
 * @route   PUT /api/users/:id/role
 * @access  Private (ADMIN)
 */
router.put('/:id/role', [
  authenticate,
  authorize('ADMIN'),
  param('id').isMongoId().withMessage('Invalid user ID'),
  body('role')
    .isIn(['PATIENT', 'MANUFACTURER', 'DISTRIBUTOR', 'HOSPITAL', 'ADMIN'])
    .withMessage('Invalid role'),
  handleValidationErrors
], asyncHandler(async (req, res) => {
  const { role } = req.body;

  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  const oldRole = user.role;
  user.role = role;
  
  // Update permissions based on new role
  user.permissions = user.getRolePermissions();
  
  await user.save();

  logger.info(`User role updated: ${user.email} from ${oldRole} to ${role} by ${req.user.email}`);

  res.json({
    success: true,
    message: 'User role updated successfully',
    data: {
      user: user.toJSON(),
      oldRole,
      newRole: role
    }
  });
}));

/**
 * @desc    Activate/Deactivate user
 * @route   PUT /api/users/:id/status
 * @access  Private (ADMIN)
 */
router.put('/:id/status', [
  authenticate,
  authorize('ADMIN'),
  param('id').isMongoId().withMessage('Invalid user ID'),
  body('isActive')
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  handleValidationErrors
], asyncHandler(async (req, res) => {
  const { isActive } = req.body;

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { isActive },
    { new: true }
  ).select('-password');

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  const action = isActive ? 'activated' : 'deactivated';
  logger.info(`User ${action}: ${user.email} by ${req.user.email}`);

  res.json({
    success: true,
    message: `User ${action} successfully`,
    data: { user }
  });
}));

/**
 * @desc    Delete user
 * @route   DELETE /api/users/:id
 * @access  Private (ADMIN)
 */
router.delete('/:id', [
  authenticate,
  authorize('ADMIN'),
  param('id').isMongoId().withMessage('Invalid user ID'),
  handleValidationErrors
], asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Prevent deleting the last admin
  if (user.role === 'ADMIN') {
    const adminCount = await User.countDocuments({ role: 'ADMIN', isActive: true });
    if (adminCount <= 1) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete the last active admin user'
      });
    }
  }

  await User.findByIdAndDelete(req.params.id);

  logger.warn(`User deleted: ${user.email} by ${req.user.email}`);

  res.json({
    success: true,
    message: 'User deleted successfully'
  });
}));

/**
 * @desc    Get user statistics
 * @route   GET /api/users/stats
 * @access  Private (ADMIN)
 */
router.get('/stats', [
  authenticate,
  authorize('ADMIN')
], asyncHandler(async (req, res) => {
  const stats = await User.aggregate([
    {
      $group: {
        _id: '$role',
        count: { $sum: 1 },
        active: {
          $sum: { $cond: ['$isActive', 1, 0] }
        },
        verified: {
          $sum: { $cond: ['$isEmailVerified', 1, 0] }
        }
      }
    }
  ]);

  const totalUsers = await User.countDocuments();
  const activeUsers = await User.countDocuments({ isActive: true });
  const verifiedUsers = await User.countDocuments({ isEmailVerified: true });

  res.json({
    success: true,
    data: {
      totalUsers,
      activeUsers,
      verifiedUsers,
      roleStats: stats,
      summary: {
        activationRate: ((activeUsers / totalUsers) * 100).toFixed(2) + '%',
        verificationRate: ((verifiedUsers / totalUsers) * 100).toFixed(2) + '%'
      }
    }
  });
}));

module.exports = router;