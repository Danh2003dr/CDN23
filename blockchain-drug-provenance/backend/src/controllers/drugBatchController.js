const DrugBatch = require('../models/DrugBatch');
const SupplyChainEvent = require('../models/SupplyChainEvent');
const { asyncHandler } = require('../middleware/errorHandler');
const blockchainService = require('../services/blockchainService');
const qrService = require('../services/qrService');
const logger = require('../utils/logger');

/**
 * @desc    Create new drug batch
 * @route   POST /api/drug-batches
 * @access  Private (MANUFACTURER, ADMIN)
 */
const createBatch = asyncHandler(async (req, res) => {
  const {
    batchCode,
    drugName,
    genericName,
    drugForm,
    strength,
    expiryDate,
    ingredients,
    qualityTests,
    packageInfo,
    storageConditions,
    regulatoryInfo
  } = req.body;

  // Check if batch code already exists
  const existingBatch = await DrugBatch.findOne({ batchCode });
  if (existingBatch) {
    return res.status(400).json({
      success: false,
      message: 'Batch code already exists'
    });
  }

  try {
    // Create batch on blockchain first
    const blockchainResult = await blockchainService.createBatch({
      batchCode,
      drugName,
      manufacturer: req.user.organizationInfo?.name || req.user.fullName,
      expiryDate: new Date(expiryDate).getTime() / 1000, // Convert to Unix timestamp
      ingredients: JSON.stringify(ingredients),
      qualityReport: qualityTests ? JSON.stringify(qualityTests) : '',
      qrCode: '' // Will be generated after DB creation
    }, req.user.walletAddress);

    // Generate QR code
    const qrCodeResult = await qrService.generateBatchQR({
      batchCode,
      drugName,
      manufacturer: req.user.organizationInfo?.name || req.user.fullName,
      expiryDate,
      blockchainId: blockchainResult.batchId
    });

    // Create batch in database
    const batchData = {
      blockchainId: blockchainResult.batchId,
      transactionHash: blockchainResult.transactionHash,
      batchCode,
      drugName,
      genericName,
      drugForm,
      strength,
      manufacturer: {
        name: req.user.organizationInfo?.name || req.user.fullName,
        address: req.user.organizationInfo?.address || req.user.address?.street,
        licenseNumber: req.user.organizationInfo?.licenseNumber,
        walletAddress: req.user.walletAddress
      },
      manufactureDate: new Date(),
      expiryDate: new Date(expiryDate),
      ingredients: ingredients || [],
      qualityTests: qualityTests || [],
      packageInfo: packageInfo || {},
      storageConditions: storageConditions || {},
      regulatoryInfo: regulatoryInfo || {},
      currentHolder: {
        walletAddress: req.user.walletAddress,
        name: req.user.organizationInfo?.name || req.user.fullName,
        role: req.user.role
      },
      qrCode: {
        data: qrCodeResult.data,
        imageUrl: qrCodeResult.imageUrl,
        generatedAt: new Date()
      }
    };

    const batch = await DrugBatch.create(batchData);

    // Create initial supply chain event
    await SupplyChainEvent.create({
      batchId: batch.blockchainId,
      blockchainEventId: 0, // First event
      transactionHash: blockchainResult.transactionHash,
      toAddress: req.user.walletAddress,
      toEntity: {
        name: req.user.organizationInfo?.name || req.user.fullName,
        type: req.user.role,
        address: req.user.organizationInfo?.address || req.user.address?.street
      },
      eventType: 'MANUFACTURE',
      description: 'Drug batch manufactured',
      newStatus: 'MANUFACTURED',
      location: {
        name: 'Manufacturing Facility',
        address: req.user.organizationInfo?.address || req.user.address?.street,
        facilityType: 'MANUFACTURING'
      },
      verification: {
        isVerified: true,
        verifiedBy: {
          name: req.user.fullName,
          walletAddress: req.user.walletAddress,
          timestamp: new Date()
        }
      },
      blockchainTimestamp: new Date()
    });

    logger.info(`New drug batch created: ${batchCode} by ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Drug batch created successfully',
      data: {
        batch: batch.toJSON(),
        qrCode: qrCodeResult
      }
    });

  } catch (error) {
    logger.error('Error creating drug batch:', error);
    
    if (error.message.includes('blockchain')) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create batch on blockchain',
        error: error.message
      });
    }
    
    throw error;
  }
});

/**
 * @desc    Get all drug batches
 * @route   GET /api/drug-batches
 * @access  Private
 */
const getBatches = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    status,
    manufacturer,
    drugName,
    expiryDateFrom,
    expiryDateTo,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  const query = {};

  // Build filter query
  if (status) query.currentStatus = status;
  if (manufacturer) query['manufacturer.name'] = new RegExp(manufacturer, 'i');
  if (drugName) query.drugName = new RegExp(drugName, 'i');
  
  // Date range filter
  if (expiryDateFrom || expiryDateTo) {
    query.expiryDate = {};
    if (expiryDateFrom) query.expiryDate.$gte = new Date(expiryDateFrom);
    if (expiryDateTo) query.expiryDate.$lte = new Date(expiryDateTo);
  }

  // Role-based filtering
  if (req.user.role === 'MANUFACTURER') {
    query['manufacturer.walletAddress'] = req.user.walletAddress;
  } else if (req.user.role === 'DISTRIBUTOR' || req.user.role === 'HOSPITAL') {
    // Show batches assigned to this user or available for transfer
    query.$or = [
      { 'currentHolder.walletAddress': req.user.walletAddress },
      { currentStatus: { $in: ['MANUFACTURED', 'IN_TRANSIT', 'DELIVERED'] } }
    ];
  } else if (req.user.role === 'PATIENT') {
    // Patients can only see verified, non-recalled batches
    query.isVerified = true;
    query['recallInfo.isRecalled'] = false;
  }

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 }
  };

  const result = await DrugBatch.paginate ? 
    await DrugBatch.paginate(query, options) :
    {
      docs: await DrugBatch.find(query)
        .sort(options.sort)
        .limit(options.limit)
        .skip((options.page - 1) * options.limit),
      totalDocs: await DrugBatch.countDocuments(query),
      page: options.page,
      limit: options.limit
    };

  res.json({
    success: true,
    data: {
      batches: result.docs,
      pagination: {
        currentPage: result.page,
        totalPages: Math.ceil(result.totalDocs / result.limit),
        totalItems: result.totalDocs,
        itemsPerPage: result.limit
      }
    }
  });
});

/**
 * @desc    Get single drug batch
 * @route   GET /api/drug-batches/:id
 * @access  Private
 */
const getBatch = asyncHandler(async (req, res) => {
  const batch = await DrugBatch.findById(req.params.id);

  if (!batch) {
    return res.status(404).json({
      success: false,
      message: 'Drug batch not found'
    });
  }

  // Check access permissions
  if (!batch.canAccess(req.user.walletAddress, req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied to this batch'
    });
  }

  // Get supply chain history
  const supplyChainHistory = await SupplyChainEvent.getHistoryByBatch(batch.blockchainId);

  // Return appropriate data based on user role
  let responseData = batch.toJSON();
  
  if (req.user.role === 'PATIENT') {
    responseData = batch.getPublicInfo();
  }

  res.json({
    success: true,
    data: {
      batch: responseData,
      supplyChain: supplyChainHistory
    }
  });
});

/**
 * @desc    Get batch by code or QR scan
 * @route   GET /api/drug-batches/code/:batchCode
 * @access  Public
 */
const getBatchByCode = asyncHandler(async (req, res) => {
  const { batchCode } = req.params;

  const batch = await DrugBatch.findOne({ batchCode: batchCode.toUpperCase() });

  if (!batch) {
    return res.status(404).json({
      success: false,
      message: 'Drug batch not found',
      isAuthentic: false
    });
  }

  // Get supply chain history for verification
  const supplyChainHistory = await SupplyChainEvent.getHistoryByBatch(batch.blockchainId);

  // Verify authenticity
  const isAuthentic = batch.isVerified && 
                     !batch.recallInfo.isRecalled && 
                     !batch.isExpired;

  // Return public information (for QR code scans)
  const publicInfo = batch.getPublicInfo();

  res.json({
    success: true,
    data: {
      batch: publicInfo,
      supplyChain: supplyChainHistory.map(event => ({
        eventType: event.eventType,
        description: event.description,
        location: event.location?.name,
        timestamp: event.blockchainTimestamp,
        status: event.newStatus
      })),
      verification: {
        isAuthentic,
        isVerified: batch.isVerified,
        isRecalled: batch.recallInfo.isRecalled,
        isExpired: batch.isExpired,
        daysUntilExpiry: batch.daysUntilExpiry
      }
    }
  });
});

/**
 * @desc    Update drug batch
 * @route   PUT /api/drug-batches/:id
 * @access  Private (MANUFACTURER, ADMIN)
 */
const updateBatch = asyncHandler(async (req, res) => {
  const batch = await DrugBatch.findById(req.params.id);

  if (!batch) {
    return res.status(404).json({
      success: false,
      message: 'Drug batch not found'
    });
  }

  // Check permissions
  if (req.user.role !== 'ADMIN' && batch.manufacturer.walletAddress !== req.user.walletAddress) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this batch'
    });
  }

  // Update allowed fields
  const allowedUpdates = [
    'ingredients', 'qualityTests', 'packageInfo', 
    'storageConditions', 'regulatoryInfo', 'notes', 'tags'
  ];

  const updates = {};
  allowedUpdates.forEach(field => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  // Update batch
  const updatedBatch = await DrugBatch.findByIdAndUpdate(
    req.params.id,
    updates,
    { new: true, runValidators: true }
  );

  logger.info(`Drug batch updated: ${batch.batchCode} by ${req.user.email}`);

  res.json({
    success: true,
    message: 'Drug batch updated successfully',
    data: {
      batch: updatedBatch
    }
  });
});

/**
 * @desc    Transfer drug batch
 * @route   POST /api/drug-batches/:id/transfer
 * @access  Private (Current holder)
 */
const transferBatch = asyncHandler(async (req, res) => {
  const { toAddress, toName, location, description, transportInfo } = req.body;

  const batch = await DrugBatch.findById(req.params.id);

  if (!batch) {
    return res.status(404).json({
      success: false,
      message: 'Drug batch not found'
    });
  }

  // Check if user is current holder
  if (batch.currentHolder.walletAddress !== req.user.walletAddress) {
    return res.status(403).json({
      success: false,
      message: 'Only current holder can transfer this batch'
    });
  }

  try {
    // Transfer on blockchain
    const blockchainResult = await blockchainService.transferBatch(
      batch.blockchainId,
      toAddress,
      location || 'In Transit',
      description || 'Batch transfer',
      req.user.walletAddress
    );

    // Update batch in database
    const previousHolder = { ...batch.currentHolder };
    
    batch.currentHolder = {
      walletAddress: toAddress,
      name: toName,
      role: 'DISTRIBUTOR' // This should be determined by the recipient's role
    };
    
    // Update status based on transfer type
    if (batch.currentStatus === 'MANUFACTURED') {
      batch.currentStatus = 'IN_TRANSIT';
    } else if (batch.currentStatus === 'IN_TRANSIT') {
      batch.currentStatus = 'DELIVERED';
    }

    await batch.save();

    // Create supply chain event
    await SupplyChainEvent.create({
      batchId: batch.blockchainId,
      blockchainEventId: blockchainResult.eventId || Date.now(),
      transactionHash: blockchainResult.transactionHash,
      fromAddress: req.user.walletAddress,
      toAddress: toAddress,
      fromEntity: {
        name: previousHolder.name,
        type: req.user.role,
        address: req.user.organizationInfo?.address
      },
      toEntity: {
        name: toName,
        type: 'DISTRIBUTOR', // Should be dynamic
        address: location
      },
      eventType: 'TRANSFER',
      description: description || 'Batch transferred',
      newStatus: batch.currentStatus,
      previousStatus: 'MANUFACTURED', // Should track previous status
      location: {
        name: location,
        address: location
      },
      transportInfo: transportInfo || {},
      verification: {
        isVerified: true,
        verifiedBy: {
          name: req.user.fullName,
          walletAddress: req.user.walletAddress,
          timestamp: new Date()
        }
      },
      blockchainTimestamp: new Date()
    });

    logger.info(`Batch transferred: ${batch.batchCode} from ${req.user.email} to ${toAddress}`);

    res.json({
      success: true,
      message: 'Batch transferred successfully',
      data: {
        batch: batch.toJSON(),
        transactionHash: blockchainResult.transactionHash
      }
    });

  } catch (error) {
    logger.error('Error transferring batch:', error);
    
    if (error.message.includes('blockchain')) {
      return res.status(500).json({
        success: false,
        message: 'Failed to transfer batch on blockchain',
        error: error.message
      });
    }
    
    throw error;
  }
});

/**
 * @desc    Verify drug batch
 * @route   PUT /api/drug-batches/:id/verify
 * @access  Private (ADMIN)
 */
const verifyBatch = asyncHandler(async (req, res) => {
  const batch = await DrugBatch.findById(req.params.id);

  if (!batch) {
    return res.status(404).json({
      success: false,
      message: 'Drug batch not found'
    });
  }

  try {
    // Verify on blockchain
    await blockchainService.verifyBatch(batch.blockchainId, req.user.walletAddress);

    // Update batch in database
    batch.isVerified = true;
    batch.verificationDate = new Date();
    batch.verifiedBy = {
      walletAddress: req.user.walletAddress,
      name: req.user.fullName,
      authority: req.user.organizationInfo?.name || 'System Administrator'
    };

    await batch.save();

    logger.info(`Batch verified: ${batch.batchCode} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Batch verified successfully',
      data: {
        batch: batch.toJSON()
      }
    });

  } catch (error) {
    logger.error('Error verifying batch:', error);
    throw error;
  }
});

/**
 * @desc    Recall drug batch
 * @route   PUT /api/drug-batches/:id/recall
 * @access  Private (ADMIN)
 */
const recallBatch = asyncHandler(async (req, res) => {
  const { reason, severity } = req.body;

  const batch = await DrugBatch.findById(req.params.id);

  if (!batch) {
    return res.status(404).json({
      success: false,
      message: 'Drug batch not found'
    });
  }

  try {
    // Recall on blockchain
    await blockchainService.recallBatch(batch.blockchainId, reason, req.user.walletAddress);

    // Update batch in database
    batch.currentStatus = 'RECALLED';
    batch.recallInfo = {
      isRecalled: true,
      recallDate: new Date(),
      reason: reason,
      severity: severity || 'HIGH',
      recalledBy: req.user.fullName
    };

    await batch.save();

    // Create supply chain event
    await SupplyChainEvent.create({
      batchId: batch.blockchainId,
      blockchainEventId: Date.now(),
      transactionHash: 'recall-transaction',
      toAddress: batch.currentHolder.walletAddress,
      toEntity: {
        name: batch.currentHolder.name,
        type: batch.currentHolder.role
      },
      eventType: 'RECALL',
      description: `Batch recalled: ${reason}`,
      newStatus: 'RECALLED',
      hasAlert: true,
      alertLevel: 'CRITICAL',
      verification: {
        isVerified: true,
        verifiedBy: {
          name: req.user.fullName,
          walletAddress: req.user.walletAddress,
          timestamp: new Date()
        }
      },
      blockchainTimestamp: new Date()
    });

    logger.warn(`Batch recalled: ${batch.batchCode} by ${req.user.email}, reason: ${reason}`);

    res.json({
      success: true,
      message: 'Batch recalled successfully',
      data: {
        batch: batch.toJSON()
      }
    });

  } catch (error) {
    logger.error('Error recalling batch:', error);
    throw error;
  }
});

/**
 * @desc    Delete drug batch
 * @route   DELETE /api/drug-batches/:id
 * @access  Private (ADMIN only)
 */
const deleteBatch = asyncHandler(async (req, res) => {
  const batch = await DrugBatch.findById(req.params.id);

  if (!batch) {
    return res.status(404).json({
      success: false,
      message: 'Drug batch not found'
    });
  }

  await DrugBatch.findByIdAndDelete(req.params.id);
  await SupplyChainEvent.deleteMany({ batchId: batch.blockchainId });

  logger.warn(`Drug batch deleted: ${batch.batchCode} by ${req.user.email}`);

  res.json({
    success: true,
    message: 'Drug batch deleted successfully'
  });
});

module.exports = {
  createBatch,
  getBatches,
  getBatch,
  getBatchByCode,
  updateBatch,
  transferBatch,
  verifyBatch,
  recallBatch,
  deleteBatch
};