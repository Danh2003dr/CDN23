const mongoose = require('mongoose');

const drugBatchSchema = new mongoose.Schema({
  // Blockchain info
  blockchainId: {
    type: Number,
    required: true,
    unique: true
  },
  transactionHash: {
    type: String,
    required: true
  },
  
  // Thông tin lô thuốc cơ bản
  batchCode: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
    match: /^[A-Z0-9\-]+$/
  },
  drugName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  genericName: {
    type: String,
    trim: true,
    maxlength: 200
  },
  drugForm: {
    type: String,
    enum: ['TABLET', 'CAPSULE', 'SYRUP', 'INJECTION', 'CREAM', 'DROPS', 'OTHER'],
    required: true
  },
  strength: {
    value: Number,
    unit: {
      type: String,
      enum: ['mg', 'g', 'ml', 'mcg', '%', 'IU']
    }
  },
  
  // Thông tin sản xuất
  manufacturer: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    address: String,
    licenseNumber: String,
    walletAddress: {
      type: String,
      required: true,
      match: /^0x[a-fA-F0-9]{40}$/
    }
  },
  manufactureDate: {
    type: Date,
    required: true
  },
  expiryDate: {
    type: Date,
    required: true,
    validate: {
      validator: function(v) {
        return v > this.manufactureDate;
      },
      message: 'Expiry date must be after manufacture date'
    }
  },
  
  // Thông tin thành phần và chất lượng
  ingredients: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    concentration: String,
    purpose: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'PRESERVATIVE', 'EXCIPIENT']
    }
  }],
  
  // Kiểm định chất lượng
  qualityTests: [{
    testType: {
      type: String,
      enum: ['ASSAY', 'DISSOLUTION', 'MICROBIAL', 'STABILITY', 'IMPURITY'],
      required: true
    },
    result: {
      type: String,
      enum: ['PASS', 'FAIL', 'PENDING'],
      required: true
    },
    testDate: {
      type: Date,
      required: true
    },
    laboratory: String,
    certificateNumber: String,
    notes: String
  }],
  
  // Trạng thái và vị trí
  currentStatus: {
    type: String,
    enum: ['MANUFACTURED', 'IN_TRANSIT', 'DELIVERED', 'IN_HOSPITAL', 'DISPENSED', 'EXPIRED', 'RECALLED'],
    default: 'MANUFACTURED'
  },
  currentHolder: {
    walletAddress: {
      type: String,
      required: true,
      match: /^0x[a-fA-F0-9]{40}$/
    },
    name: String,
    role: {
      type: String,
      enum: ['MANUFACTURER', 'DISTRIBUTOR', 'HOSPITAL']
    }
  },
  location: {
    facility: String,
    address: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  
  // QR Code và tracking
  qrCode: {
    data: String,
    imageUrl: String,
    generatedAt: Date
  },
  
  // Thông tin bổ sung
  packageInfo: {
    packageType: {
      type: String,
      enum: ['BLISTER', 'BOTTLE', 'VIAL', 'TUBE', 'BOX']
    },
    unitsPerPackage: Number,
    totalPackages: Number,
    packageSize: String
  },
  
  // Điều kiện bảo quản
  storageConditions: {
    temperature: {
      min: Number,
      max: Number,
      unit: {
        type: String,
        enum: ['C', 'F'],
        default: 'C'
      }
    },
    humidity: {
      min: Number,
      max: Number
    },
    lightCondition: {
      type: String,
      enum: ['PROTECT_FROM_LIGHT', 'NORMAL', 'DARK']
    },
    specialConditions: [String]
  },
  
  // Verification và compliance
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationDate: Date,
  verifiedBy: {
    walletAddress: String,
    name: String,
    authority: String
  },
  
  regulatoryInfo: {
    registrationNumber: String,
    approvalDate: Date,
    regulatoryAuthority: String,
    classification: {
      type: String,
      enum: ['OTC', 'PRESCRIPTION', 'CONTROLLED']
    }
  },
  
  // Recall information
  recallInfo: {
    isRecalled: {
      type: Boolean,
      default: false
    },
    recallDate: Date,
    reason: String,
    severity: {
      type: String,
      enum: ['LOW', 'MODERATE', 'HIGH', 'CRITICAL']
    },
    recalledBy: String
  },
  
  // Metadata
  notes: String,
  tags: [String],
  attachments: [{
    filename: String,
    originalName: String,
    mimetype: String,
    path: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
drugBatchSchema.index({ batchCode: 1 });
drugBatchSchema.index({ blockchainId: 1 });
drugBatchSchema.index({ drugName: 1 });
drugBatchSchema.index({ 'manufacturer.walletAddress': 1 });
drugBatchSchema.index({ 'currentHolder.walletAddress': 1 });
drugBatchSchema.index({ currentStatus: 1 });
drugBatchSchema.index({ manufactureDate: 1 });
drugBatchSchema.index({ expiryDate: 1 });
drugBatchSchema.index({ isVerified: 1 });
drugBatchSchema.index({ 'recallInfo.isRecalled': 1 });

// Compound indexes
drugBatchSchema.index({ drugName: 1, 'manufacturer.name': 1 });
drugBatchSchema.index({ currentStatus: 1, expiryDate: 1 });

// Virtual cho trạng thái hết hạn
drugBatchSchema.virtual('isExpired').get(function() {
  return this.expiryDate < new Date();
});

// Virtual cho số ngày còn lại
drugBatchSchema.virtual('daysUntilExpiry').get(function() {
  const now = new Date();
  const diffTime = this.expiryDate - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual cho tổng số units
drugBatchSchema.virtual('totalUnits').get(function() {
  return (this.packageInfo.unitsPerPackage || 0) * (this.packageInfo.totalPackages || 0);
});

// Pre-save middleware
drugBatchSchema.pre('save', function(next) {
  // Auto-generate QR code data if not provided
  if (!this.qrCode.data) {
    this.qrCode.data = JSON.stringify({
      batchCode: this.batchCode,
      drugName: this.drugName,
      manufacturer: this.manufacturer.name,
      expiryDate: this.expiryDate,
      blockchainId: this.blockchainId
    });
    this.qrCode.generatedAt = new Date();
  }
  
  next();
});

// Static method tìm batch sắp hết hạn
drugBatchSchema.statics.findExpiringBatches = function(days = 30) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  
  return this.find({
    expiryDate: { $lte: futureDate, $gte: new Date() },
    'recallInfo.isRecalled': false,
    currentStatus: { $in: ['IN_HOSPITAL', 'DELIVERED'] }
  });
};

// Static method tìm batch theo manufacturer
drugBatchSchema.statics.findByManufacturer = function(walletAddress) {
  return this.find({ 'manufacturer.walletAddress': walletAddress });
};

// Static method tìm batch theo holder hiện tại
drugBatchSchema.statics.findByCurrentHolder = function(walletAddress) {
  return this.find({ 'currentHolder.walletAddress': walletAddress });
};

// Method kiểm tra quyền truy cập
drugBatchSchema.methods.canAccess = function(userWalletAddress, userRole) {
  // Admin có thể access tất cả
  if (userRole === 'ADMIN') return true;
  
  // Manufacturer có thể access batch của mình
  if (this.manufacturer.walletAddress === userWalletAddress) return true;
  
  // Current holder có thể access
  if (this.currentHolder.walletAddress === userWalletAddress) return true;
  
  // Patient chỉ có thể xem thông tin cơ bản thông qua QR
  return false;
};

// Method để lấy thông tin công khai cho patient
drugBatchSchema.methods.getPublicInfo = function() {
  return {
    batchCode: this.batchCode,
    drugName: this.drugName,
    genericName: this.genericName,
    manufacturer: {
      name: this.manufacturer.name,
      address: this.manufacturer.address
    },
    manufactureDate: this.manufactureDate,
    expiryDate: this.expiryDate,
    isExpired: this.isExpired,
    daysUntilExpiry: this.daysUntilExpiry,
    currentStatus: this.currentStatus,
    isVerified: this.isVerified,
    verificationDate: this.verificationDate,
    storageConditions: this.storageConditions,
    recallInfo: this.recallInfo.isRecalled ? {
      isRecalled: true,
      recallDate: this.recallInfo.recallDate,
      reason: this.recallInfo.reason,
      severity: this.recallInfo.severity
    } : { isRecalled: false }
  };
};

module.exports = mongoose.model('DrugBatch', drugBatchSchema);