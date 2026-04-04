const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  // Thông tin cơ bản
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  
  // Liên kết với lô thuốc (nếu có)
  relatedBatch: {
    batchId: {
      type: Number,
      ref: 'DrugBatch'
    },
    batchCode: String
  },
  
  // Thông tin giao nhiệm vụ
  assignedBy: {
    walletAddress: {
      type: String,
      required: true,
      match: /^0x[a-fA-F0-9]{40}$/
    },
    name: String,
    role: String
  },
  
  assignedTo: {
    walletAddress: {
      type: String,
      required: true,
      match: /^0x[a-fA-F0-9]{40}$/
    },
    name: String,
    role: String
  },
  
  // Trạng thái và tiến độ
  status: {
    type: String,
    enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'OVERDUE'],
    default: 'PENDING'
  },
  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
    default: 'MEDIUM'
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  
  // Thời gian
  dueDate: {
    type: Date,
    required: true
  },
  startedAt: Date,
  completedAt: Date,
  
  // Loại nhiệm vụ
  taskType: {
    type: String,
    enum: [
      'BATCH_TRANSFER',      // Chuyển giao lô thuốc
      'QUALITY_CHECK',       // Kiểm tra chất lượng
      'DELIVERY',           // Giao hàng
      'INVENTORY',          // Kiểm kê
      'COMPLIANCE_CHECK',   // Kiểm tra tuân thủ
      'DOCUMENTATION',      // Hoàn thiện tài liệu
      'TEMPERATURE_MONITOR', // Giám sát nhiệt độ
      'RECALL_PROCESS',     // Xử lý thu hồi
      'VERIFICATION',       // Xác thực
      'OTHER'               // Khác
    ],
    required: true
  },
  
  // Chi tiết nhiệm vụ
  details: {
    location: {
      name: String,
      address: String,
      coordinates: {
        latitude: Number,
        longitude: Number
      }
    },
    instructions: String,
    requirements: [String],
    checklist: [{
      item: String,
      completed: {
        type: Boolean,
        default: false
      },
      completedAt: Date,
      notes: String
    }]
  },
  
  // Tệp đính kèm
  attachments: [{
    filename: String,
    originalName: String,
    mimetype: String,
    path: String,
    size: Number,
    uploadedBy: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Cập nhật tiến độ
  updates: [{
    updatedBy: {
      walletAddress: String,
      name: String
    },
    message: String,
    progress: Number,
    status: String,
    attachments: [{
      filename: String,
      path: String
    }],
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Đánh giá
  evaluation: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    feedback: String,
    evaluatedBy: {
      walletAddress: String,
      name: String
    },
    evaluatedAt: Date,
    criteria: [{
      name: String,
      score: {
        type: Number,
        min: 1,
        max: 5
      }
    }]
  },
  
  // Metadata
  tags: [String],
  notes: String,
  isUrgent: {
    type: Boolean,
    default: false
  },
  requiresApproval: {
    type: Boolean,
    default: false
  },
  approvedBy: {
    walletAddress: String,
    name: String,
    approvedAt: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
taskSchema.index({ 'assignedTo.walletAddress': 1 });
taskSchema.index({ 'assignedBy.walletAddress': 1 });
taskSchema.index({ status: 1 });
taskSchema.index({ priority: 1 });
taskSchema.index({ taskType: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ 'relatedBatch.batchId': 1 });

// Compound indexes
taskSchema.index({ status: 1, dueDate: 1 });
taskSchema.index({ 'assignedTo.walletAddress': 1, status: 1 });
taskSchema.index({ priority: 1, dueDate: 1 });

// Virtuals
taskSchema.virtual('isOverdue').get(function() {
  return this.dueDate < new Date() && this.status !== 'COMPLETED' && this.status !== 'CANCELLED';
});

taskSchema.virtual('timeRemaining').get(function() {
  const now = new Date();
  const remaining = this.dueDate - now;
  return Math.max(0, Math.floor(remaining / (1000 * 60 * 60 * 24))); // days
});

taskSchema.virtual('completionRate').get(function() {
  if (this.details.checklist.length === 0) return this.progress;
  
  const completed = this.details.checklist.filter(item => item.completed).length;
  return Math.floor((completed / this.details.checklist.length) * 100);
});

// Pre-save middleware
taskSchema.pre('save', function(next) {
  // Auto-update status based on conditions
  if (this.isOverdue && this.status === 'PENDING') {
    this.status = 'OVERDUE';
  }
  
  // Set urgent flag for high priority overdue tasks
  if (this.priority === 'URGENT' || (this.priority === 'HIGH' && this.isOverdue)) {
    this.isUrgent = true;
  }
  
  // Auto-set completion date
  if (this.status === 'COMPLETED' && !this.completedAt) {
    this.completedAt = new Date();
  }
  
  // Auto-set started date
  if (this.status === 'IN_PROGRESS' && !this.startedAt) {
    this.startedAt = new Date();
  }
  
  next();
});

// Static methods
taskSchema.statics.findByAssignee = function(walletAddress) {
  return this.find({ 'assignedTo.walletAddress': walletAddress });
};

taskSchema.statics.findOverdueTasks = function() {
  return this.find({
    dueDate: { $lt: new Date() },
    status: { $in: ['PENDING', 'IN_PROGRESS'] }
  });
};

taskSchema.statics.findUrgentTasks = function() {
  return this.find({
    $or: [
      { priority: 'URGENT' },
      { isUrgent: true }
    ],
    status: { $in: ['PENDING', 'IN_PROGRESS'] }
  });
};

taskSchema.statics.findByBatch = function(batchId) {
  return this.find({ 'relatedBatch.batchId': batchId });
};

taskSchema.statics.getTaskStats = function(walletAddress) {
  return this.aggregate([
    { $match: { 'assignedTo.walletAddress': walletAddress } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
};

// Instance methods
taskSchema.methods.addUpdate = function(updatedBy, message, progressUpdate, attachments = []) {
  this.updates.push({
    updatedBy,
    message,
    progress: progressUpdate,
    status: this.status,
    attachments,
    timestamp: new Date()
  });
  
  if (progressUpdate !== undefined) {
    this.progress = progressUpdate;
    if (progressUpdate === 100 && this.status !== 'COMPLETED') {
      this.status = 'COMPLETED';
      this.completedAt = new Date();
    }
  }
  
  return this.save();
};

taskSchema.methods.complete = function(completedBy, feedback) {
  this.status = 'COMPLETED';
  this.progress = 100;
  this.completedAt = new Date();
  
  if (feedback) {
    this.updates.push({
      updatedBy: completedBy,
      message: feedback,
      progress: 100,
      status: 'COMPLETED',
      timestamp: new Date()
    });
  }
  
  return this.save();
};

taskSchema.methods.evaluate = function(evaluator, rating, feedback, criteria) {
  this.evaluation = {
    rating,
    feedback,
    evaluatedBy: evaluator,
    evaluatedAt: new Date(),
    criteria: criteria || []
  };
  
  return this.save();
};

taskSchema.methods.addChecklistItem = function(item) {
  this.details.checklist.push({
    item,
    completed: false
  });
  
  return this.save();
};

taskSchema.methods.completeChecklistItem = function(itemIndex, notes) {
  if (this.details.checklist[itemIndex]) {
    this.details.checklist[itemIndex].completed = true;
    this.details.checklist[itemIndex].completedAt = new Date();
    this.details.checklist[itemIndex].notes = notes;
    
    // Update overall progress based on checklist completion
    const completedItems = this.details.checklist.filter(item => item.completed).length;
    const totalItems = this.details.checklist.length;
    this.progress = Math.floor((completedItems / totalItems) * 100);
  }
  
  return this.save();
};

module.exports = mongoose.model('Task', taskSchema);