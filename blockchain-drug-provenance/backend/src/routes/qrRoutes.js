const express = require('express');
const { param } = require('express-validator');
const { handleValidationErrors } = require('../middleware/errorHandler');
const qrService = require('../services/qrService');
const DrugBatch = require('../models/DrugBatch');
const blockchainService = require('../services/blockchainService');

const router = express.Router();

/**
 * @desc    Verify QR code data
 * @route   POST /api/qr/verify
 * @access  Public
 */
router.post('/verify', async (req, res) => {
  try {
    const { qrData } = req.body;

    if (!qrData) {
      return res.status(400).json({
        success: false,
        message: 'QR data is required'
      });
    }

    const verification = qrService.verifyQRData(qrData);

    if (!verification.isValid) {
      return res.status(400).json({
        success: false,
        message: verification.error || 'Invalid QR code'
      });
    }

    const qrInfo = verification.data;

    if (qrInfo.type === 'DRUG_BATCH') {
      // Get additional batch information
      const batch = await DrugBatch.findOne({ batchCode: qrInfo.batchCode });
      
      if (batch) {
        const publicInfo = batch.getPublicInfo();
        
        return res.json({
          success: true,
          data: {
            qrInfo: qrInfo,
            batchInfo: publicInfo,
            verification: {
              isValid: true,
              isExpired: verification.isExpired,
              isAuthentic: batch.isVerified && !batch.recallInfo.isRecalled,
              verifiedOnBlockchain: batch.isVerified
            }
          }
        });
      }
    }

    res.json({
      success: true,
      data: {
        qrInfo: qrInfo,
        verification: verification
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error verifying QR code',
      error: error.message
    });
  }
});

/**
 * @desc    Get batch info by QR scan
 * @route   GET /api/qr/batch/:batchCode
 * @access  Public
 */
router.get('/batch/:batchCode', [
  param('batchCode')
    .isLength({ min: 3, max: 50 })
    .matches(/^[A-Z0-9\-]+$/i)
    .withMessage('Invalid batch code format'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { batchCode } = req.params;

    // Find batch in database
    const batch = await DrugBatch.findOne({ 
      batchCode: batchCode.toUpperCase() 
    });

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Drug batch not found',
        verification: {
          isValid: false,
          isAuthentic: false,
          reason: 'Batch not found in system'
        }
      });
    }

    // Verify on blockchain
    let blockchainVerification = null;
    try {
      blockchainVerification = await blockchainService.verifyBatchAuthenticity(batchCode);
    } catch (error) {
      console.warn('Blockchain verification failed:', error.message);
    }

    // Get public information
    const publicInfo = batch.getPublicInfo();

    // Determine authenticity
    const isAuthentic = batch.isVerified && 
                       !batch.recallInfo.isRecalled && 
                       !batch.isExpired &&
                       (blockchainVerification ? blockchainVerification.authentic : true);

    res.json({
      success: true,
      data: {
        batch: publicInfo,
        verification: {
          isValid: true,
          isAuthentic: isAuthentic,
          isVerified: batch.isVerified,
          isRecalled: batch.recallInfo.isRecalled,
          isExpired: batch.isExpired,
          daysUntilExpiry: batch.daysUntilExpiry,
          blockchainVerification: blockchainVerification
        },
        qrInfo: {
          scanTime: new Date().toISOString(),
          batchCode: batch.batchCode,
          drugName: batch.drugName,
          manufacturer: batch.manufacturer.name
        }
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error processing QR scan',
      error: error.message
    });
  }
});

/**
 * @desc    Generate QR code for batch
 * @route   POST /api/qr/generate/batch
 * @access  Private (MANUFACTURER, ADMIN)
 */
router.post('/generate/batch', async (req, res) => {
  try {
    const { batchData } = req.body;

    if (!batchData || !batchData.batchCode) {
      return res.status(400).json({
        success: false,
        message: 'Batch data with batchCode is required'
      });
    }

    const qrResult = await qrService.generateBatchQR(batchData);

    res.json({
      success: true,
      message: 'QR code generated successfully',
      data: qrResult
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating QR code',
      error: error.message
    });
  }
});

/**
 * @desc    Generate simple QR code
 * @route   POST /api/qr/generate/simple
 * @access  Private
 */
router.post('/generate/simple', async (req, res) => {
  try {
    const { url, filename } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'URL is required'
      });
    }

    const qrFilename = filename || `qr-${Date.now()}.png`;
    const qrResult = await qrService.generateSimpleQR(url, qrFilename);

    res.json({
      success: true,
      message: 'QR code generated successfully',
      data: qrResult
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating simple QR code',
      error: error.message
    });
  }
});

/**
 * @desc    Get QR code as data URL
 * @route   POST /api/qr/dataurl
 * @access  Private
 */
router.post('/dataurl', async (req, res) => {
  try {
    const { data, options } = req.body;

    if (!data) {
      return res.status(400).json({
        success: false,
        message: 'Data is required'
      });
    }

    const result = await qrService.generateQRDataURL(data, options);

    res.json({
      success: true,
      message: 'QR data URL generated successfully',
      data: result
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating QR data URL',
      error: error.message
    });
  }
});

/**
 * @desc    Get QR code statistics
 * @route   GET /api/qr/stats
 * @access  Private (ADMIN)
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = qrService.getQRStats();

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error getting QR statistics',
      error: error.message
    });
  }
});

module.exports = router;