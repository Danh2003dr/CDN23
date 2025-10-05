const express = require('express');
const { body, param, query } = require('express-validator');
const {
  createBatch,
  getBatches,
  getBatch,
  getBatchByCode,
  updateBatch,
  transferBatch,
  verifyBatch,
  recallBatch,
  deleteBatch
} = require('../controllers/drugBatchController');
const {
  authenticate,
  authorize,
  checkPermission,
  validateBlockchainAddress,
  logUserActivity
} = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/errorHandler');
const { uploadConfigs } = require('../middleware/upload');

const router = express.Router();

/**
 * @desc    Create new drug batch
 * @route   POST /api/drug-batches
 * @access  Private (MANUFACTURER, ADMIN)
 */
router.post('/', [
  authenticate,
  authorize('MANUFACTURER', 'ADMIN'),
  checkPermission('CREATE_BATCH'),
  uploadConfigs.documents,
  body('batchCode')
    .isLength({ min: 3, max: 50 })
    .matches(/^[A-Z0-9\-]+$/)
    .withMessage('Batch code must be 3-50 characters, uppercase letters, numbers, and hyphens only'),
  body('drugName')
    .isLength({ min: 2, max: 200 })
    .trim()
    .withMessage('Drug name must be 2-200 characters'),
  body('drugForm')
    .isIn(['TABLET', 'CAPSULE', 'SYRUP', 'INJECTION', 'CREAM', 'DROPS', 'OTHER'])
    .withMessage('Invalid drug form'),
  body('expiryDate')
    .isISO8601()
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Expiry date must be in the future');
      }
      return true;
    })
    .withMessage('Valid future expiry date is required'),
  body('ingredients')
    .isArray({ min: 1 })
    .withMessage('At least one ingredient is required'),
  body('ingredients.*.name')
    .notEmpty()
    .trim()
    .withMessage('Ingredient name is required'),
  handleValidationErrors,
  logUserActivity('CREATE_BATCH')
], createBatch);

/**
 * @desc    Get all drug batches
 * @route   GET /api/drug-batches
 * @access  Private
 */
router.get('/', [
  authenticate,
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('status')
    .optional()
    .isIn(['MANUFACTURED', 'IN_TRANSIT', 'DELIVERED', 'IN_HOSPITAL', 'DISPENSED', 'EXPIRED', 'RECALLED'])
    .withMessage('Invalid status'),
  handleValidationErrors
], getBatches);

/**
 * @desc    Get single drug batch
 * @route   GET /api/drug-batches/:id
 * @access  Private
 */
router.get('/:id', [
  authenticate,
  param('id')
    .isMongoId()
    .withMessage('Invalid batch ID'),
  handleValidationErrors
], getBatch);

/**
 * @desc    Get batch by code (QR scan)
 * @route   GET /api/drug-batches/code/:batchCode
 * @access  Public (for QR scanning)
 */
router.get('/code/:batchCode', [
  param('batchCode')
    .isLength({ min: 3, max: 50 })
    .matches(/^[A-Z0-9\-]+$/i)
    .withMessage('Invalid batch code format'),
  handleValidationErrors
], getBatchByCode);

/**
 * @desc    Update drug batch
 * @route   PUT /api/drug-batches/:id
 * @access  Private (MANUFACTURER, ADMIN)
 */
router.put('/:id', [
  authenticate,
  authorize('MANUFACTURER', 'ADMIN'),
  checkPermission('UPDATE_BATCH'),
  uploadConfigs.documents,
  param('id')
    .isMongoId()
    .withMessage('Invalid batch ID'),
  body('ingredients')
    .optional()
    .isArray()
    .withMessage('Ingredients must be an array'),
  body('qualityTests')
    .optional()
    .isArray()
    .withMessage('Quality tests must be an array'),
  handleValidationErrors,
  logUserActivity('UPDATE_BATCH')
], updateBatch);

/**
 * @desc    Transfer drug batch
 * @route   POST /api/drug-batches/:id/transfer
 * @access  Private (Current holder)
 */
router.post('/:id/transfer', [
  authenticate,
  checkPermission('TRANSFER_BATCH'),
  param('id')
    .isMongoId()
    .withMessage('Invalid batch ID'),
  body('toAddress')
    .matches(/^0x[a-fA-F0-9]{40}$/)
    .withMessage('Invalid recipient wallet address'),
  body('toName')
    .isLength({ min: 2, max: 100 })
    .trim()
    .withMessage('Recipient name must be 2-100 characters'),
  body('location')
    .optional()
    .isLength({ max: 200 })
    .trim()
    .withMessage('Location must be max 200 characters'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .trim()
    .withMessage('Description must be max 500 characters'),
  handleValidationErrors,
  validateBlockchainAddress('toAddress'),
  logUserActivity('TRANSFER_BATCH')
], transferBatch);

/**
 * @desc    Verify drug batch
 * @route   PUT /api/drug-batches/:id/verify
 * @access  Private (ADMIN)
 */
router.put('/:id/verify', [
  authenticate,
  authorize('ADMIN'),
  checkPermission('VERIFY_BATCH'),
  param('id')
    .isMongoId()
    .withMessage('Invalid batch ID'),
  handleValidationErrors,
  logUserActivity('VERIFY_BATCH')
], verifyBatch);

/**
 * @desc    Recall drug batch
 * @route   PUT /api/drug-batches/:id/recall
 * @access  Private (ADMIN)
 */
router.put('/:id/recall', [
  authenticate,
  authorize('ADMIN'),
  checkPermission('RECALL_BATCH'),
  param('id')
    .isMongoId()
    .withMessage('Invalid batch ID'),
  body('reason')
    .isLength({ min: 10, max: 500 })
    .trim()
    .withMessage('Recall reason must be 10-500 characters'),
  body('severity')
    .isIn(['LOW', 'MODERATE', 'HIGH', 'CRITICAL'])
    .withMessage('Invalid severity level'),
  handleValidationErrors,
  logUserActivity('RECALL_BATCH')
], recallBatch);

/**
 * @desc    Delete drug batch
 * @route   DELETE /api/drug-batches/:id
 * @access  Private (ADMIN only)
 */
router.delete('/:id', [
  authenticate,
  authorize('ADMIN'),
  param('id')
    .isMongoId()
    .withMessage('Invalid batch ID'),
  handleValidationErrors,
  logUserActivity('DELETE_BATCH')
], deleteBatch);

module.exports = router;