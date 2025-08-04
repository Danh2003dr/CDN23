const express = require('express');
const { body } = require('express-validator');
const AuthController = require('../controllers/authController');
const { auth, requireRole, requirePermission } = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const loginValidation = [
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

const registerValidation = [
    body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('first_name').optional().isLength({ min: 2 }).withMessage('First name must be at least 2 characters'),
    body('last_name').optional().isLength({ min: 2 }).withMessage('Last name must be at least 2 characters'),
    body('role_id').optional().isInt({ min: 1, max: 5 }).withMessage('Invalid role ID')
];

const updateProfileValidation = [
    body('first_name').optional().isLength({ min: 2 }).withMessage('First name must be at least 2 characters'),
    body('last_name').optional().isLength({ min: 2 }).withMessage('Last name must be at least 2 characters'),
    body('email').optional().isEmail().withMessage('Please enter a valid email')
];

const changePasswordValidation = [
    body('currentPassword').isLength({ min: 6 }).withMessage('Current password must be at least 6 characters'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
];

const updateUserValidation = [
    body('username').optional().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
    body('email').optional().isEmail().withMessage('Please enter a valid email'),
    body('first_name').optional().isLength({ min: 2 }).withMessage('First name must be at least 2 characters'),
    body('last_name').optional().isLength({ min: 2 }).withMessage('Last name must be at least 2 characters'),
    body('role_id').optional().isInt({ min: 1, max: 5 }).withMessage('Invalid role ID'),
    body('is_active').optional().isBoolean().withMessage('is_active must be boolean')
];

// Public routes
router.post('/login', loginValidation, AuthController.login);
router.post('/register', registerValidation, AuthController.register);

// Protected routes
router.get('/profile', auth, AuthController.profile);
router.put('/profile', auth, updateProfileValidation, AuthController.updateProfile);
router.put('/change-password', auth, changePasswordValidation, AuthController.changePassword);
router.post('/logout', auth, AuthController.logout);
router.post('/refresh-token', auth, AuthController.refreshToken);

// Admin routes - User Management
router.post('/users', auth, requirePermission('user_management'), registerValidation, AuthController.createUser);
router.get('/users', auth, requirePermission('user_management'), AuthController.getAllUsers);
router.get('/users/roles', auth, requirePermission('user_management'), AuthController.getRoles);
router.get('/users/:id', auth, requirePermission('user_management'), AuthController.getUserById);
router.put('/users/:id', auth, requirePermission('user_management'), updateUserValidation, AuthController.updateUser);
router.delete('/users/:id', auth, requireRole('admin'), AuthController.deleteUser);
router.put('/users/:id/activate', auth, requirePermission('user_management'), AuthController.activateUser);
router.put('/users/:id/deactivate', auth, requirePermission('user_management'), AuthController.deactivateUser);

module.exports = router; 