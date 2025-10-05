const mongoose = require('mongoose');

const supplyChainEventSchema = new mongoose.Schema({
  // Liên kết với lô thuốc
  batchId: {
    type: Number,
    required: true,
    ref: 'DrugBatch'
  },
  blockchainEventId: {
    type: Number,
    required: true
  },
  transactionHash: {
    type: String,
    required: true
  },
  
  // Thông tin chuyển giao
  fromAddress: {
    type: String,
    match: /^0x[a-fA-F0-9]{40}$/
  },
  toAddress: {
    type: String,
    required: true,
    match: /^0x[a-fA-F0-9]{40}$/
  },
  
  // Chi tiết từ và đến
  fromEntity: {
    name: String,
    type: {
      type: String,
      enum: ['MANUFACTURER', 'DISTRIBUTOR', 'HOSPITAL', 'PATIENT']
    },
    address: String,
    contactInfo: String
  },
  toEntity: {
    name: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['MANUFACTURER', 'DISTRIBUTOR', 'HOSPITAL', 'PATIENT'],
      required: true
    },
    address: String,
    contactInfo: String
  },
  
  // Thông tin sự kiện
  eventType: {
    type: String,
    enum: [
      'MANUFACTURE',      // Sản xuất
      'QUALITY_TEST',     // Kiểm tra chất lượng
      'TRANSFER',         // Chuyển giao
      'RECEIVE',          // Nhận hàng
      'STORE',           // Lưu trữ
      'DISPENSE',        // Cấp phát
      'RECALL',          // Thu hồi
      'DESTROY',         // Hủy
      'QUALITY_ALERT',   // Cảnh báo chất lượng
      'TEMPERATURE_LOG', // Ghi nhận nhiệt độ
      'STATUS_UPDATE'    // Cập nhật trạng thái
    ],
    required: true
  },
  
  description: {
    type: String,
    required: true,
    maxlength: 500
  },
  
  // Trạng thái mới
  newStatus: {
    type: String,
    enum: ['MANUFACTURED', 'IN_TRANSIT', 'DELIVERED', 'IN_HOSPITAL', 'DISPENSED', 'EXPIRED', 'RECALLED'],
    required: true
  },
  previousStatus: {
    type: String,
    enum: ['MANUFACTURED', 'IN_TRANSIT', 'DELIVERED', 'IN_HOSPITAL', 'DISPENSED', 'EXPIRED', 'RECALLED']
  },
  
  // Thông tin địa điểm
  location: {
    name: String,
    address: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    facilityType: {
      type: String,
      enum: ['MANUFACTURING', 'WAREHOUSE', 'DISTRIBUTION_CENTER', 'HOSPITAL', 'PHARMACY']
    }
  },
  
  // Điều kiện vận chuyển/bảo quản
  conditions: {
    temperature: {
      recorded: Number,
      unit: {
        type: String,
        enum: ['C', 'F'],
        default: 'C'
      }
    },
    humidity: Number,
    notes: String,
    complianceStatus: {
      type: String,
      enum: ['COMPLIANT', 'NON_COMPLIANT', 'NOT_MONITORED'],
      default: 'NOT_MONITORED'
    }
  },
  
  // Thông tin vận chuyển
  transportInfo: {
    method: {
      type: String,
      enum: ['TRUCK', 'AIRCRAFT', 'SHIP', 'RAIL', 'COURIER', 'PICKUP']
    },
    carrier: String,
    trackingNumber: String,
    estimatedDelivery: Date,
    actualDelivery: Date,
    vehicleId: String,
    driverInfo: {
      name: String,
      license: String,
      contact: String
    }
  },
  
  // Xác thực và chứng từ
  verification: {
    isVerified: {
      type: Boolean,
      default: false
    },
    verifiedBy: {
      name: String,
      walletAddress: String,
      timestamp: Date
    },
    signature: String,
    documents: [{
      type: {
        type: String,
        enum: ['INVOICE', 'RECEIPT', 'CERTIFICATE', 'PHOTO', 'TEMPERATURE_LOG']
      },
      filename: String,
      path: String,
      uploadedAt: Date
    }]
  },
  
  // Thông tin bổ sung
  quantity: {
    transferred: Number,
    received: Number,
    unit: {
      type: String,
      enum: ['PIECES', 'BOXES', 'PACKAGES', 'KG', 'LITERS']
    },
    notes: String
  },
  
  // Metadata
  additionalData: mongoose.Schema.Types.Mixed,
  notes: String,
  tags: [String],
  
  // Timestamp từ blockchain
  blockchainTimestamp: {
    type: Date,
    required: true
  },
  
  // Flags
  isAutomated: {
    type: Boolean,
    default: false
  },
  hasAlert: {
    type: Boolean,
    default: false
  },
  alertLevel: {
    type: String,
    enum: ['INFO', 'WARNING', 'ERROR', 'CRITICAL']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
supplyChainEventSchema.index({ batchId: 1 });
supplyChainEventSchema.index({ blockchainEventId: 1 });
supplyChainEventSchema.index({ transactionHash: 1 });
supplyChainEventSchema.index({ fromAddress: 1 });
supplyChainEventSchema.index({ toAddress: 1 });
supplyChainEventSchema.index({ eventType: 1 });
supplyChainEventSchema.index({ newStatus: 1 });
supplyChainEventSchema.index({ blockchainTimestamp: -1 });
supplyChainEventSchema.index({ 'verification.isVerified': 1 });

// Compound indexes
supplyChainEventSchema.index({ batchId: 1, blockchainTimestamp: -1 });
supplyChainEventSchema.index({ eventType: 1, blockchainTimestamp: -1 });
supplyChainEventSchema.index({ newStatus: 1, blockchainTimestamp: -1 });

// Virtual cho thời gian từ blockchain
supplyChainEventSchema.virtual('timeFromBlockchain').get(function() {
  return this.blockchainTimestamp;
});

// Virtual cho compliance status
supplyChainEventSchema.virtual('isCompliant').get(function() {
  return this.conditions.complianceStatus === 'COMPLIANT';
});

// Static method để lấy lịch sử theo batch
supplyChainEventSchema.statics.getHistoryByBatch = function(batchId) {
  return this.find({ batchId }).sort({ blockchainTimestamp: 1 });
};

// Static method để lấy events theo address
supplyChainEventSchema.statics.getEventsByAddress = function(walletAddress) {
  return this.find({
    $or: [
      { fromAddress: walletAddress },
      { toAddress: walletAddress }
    ]
  }).sort({ blockchainTimestamp: -1 });
};

// Static method để lấy events chưa verify
supplyChainEventSchema.statics.getUnverifiedEvents = function() {
  return this.find({ 'verification.isVerified': false });
};

// Static method để tìm events có alert
supplyChainEventSchema.statics.getAlertsEvents = function() {
  return this.find({ hasAlert: true }).sort({ blockchainTimestamp: -1 });
};

// Method để verify event
supplyChainEventSchema.methods.verifyEvent = function(verifierName, verifierWallet) {
  this.verification.isVerified = true;
  this.verification.verifiedBy = {
    name: verifierName,
    walletAddress: verifierWallet,
    timestamp: new Date()
  };
  return this.save();
};

// Method để thêm document
supplyChainEventSchema.methods.addDocument = function(docType, filename, path) {
  this.verification.documents.push({
    type: docType,
    filename: filename,
    path: path,
    uploadedAt: new Date()
  });
  return this.save();
};

// Method để check compliance
supplyChainEventSchema.methods.checkCompliance = function(requiredConditions) {
  if (!requiredConditions) return true;
  
  let isCompliant = true;
  let reasons = [];
  
  // Check temperature compliance
  if (requiredConditions.temperature) {
    const temp = this.conditions.temperature.recorded;
    const min = requiredConditions.temperature.min;
    const max = requiredConditions.temperature.max;
    
    if (temp < min || temp > max) {
      isCompliant = false;
      reasons.push(`Temperature out of range: ${temp}°C (required: ${min}-${max}°C)`);
    }
  }
  
  // Check humidity compliance
  if (requiredConditions.humidity) {
    const humidity = this.conditions.humidity;
    const min = requiredConditions.humidity.min;
    const max = requiredConditions.humidity.max;
    
    if (humidity < min || humidity > max) {
      isCompliant = false;
      reasons.push(`Humidity out of range: ${humidity}% (required: ${min}-${max}%)`);
    }
  }
  
  // Update compliance status
  this.conditions.complianceStatus = isCompliant ? 'COMPLIANT' : 'NON_COMPLIANT';
  if (!isCompliant) {
    this.conditions.notes = reasons.join('; ');
    this.hasAlert = true;
    this.alertLevel = 'WARNING';
  }
  
  return { isCompliant, reasons };
};

// Pre-save middleware
supplyChainEventSchema.pre('save', function(next) {
  // Auto-set alert level based on event type and conditions
  if (this.eventType === 'RECALL') {
    this.hasAlert = true;
    this.alertLevel = 'CRITICAL';
  } else if (this.conditions.complianceStatus === 'NON_COMPLIANT') {
    this.hasAlert = true;
    this.alertLevel = this.alertLevel || 'WARNING';
  }
  
  next();
});

module.exports = mongoose.model('SupplyChainEvent', supplyChainEventSchema);