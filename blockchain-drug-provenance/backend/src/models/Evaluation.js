const mongoose = require('mongoose');

const evaluationSchema = new mongoose.Schema({
  // Thông tin đánh giá
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  
  // Người đánh giá (ẩn danh)
  evaluator: {
    // Không lưu thông tin định danh để đảm bảo ẩn danh
    hashedId: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ['PATIENT', 'HOSPITAL', 'DISTRIBUTOR'],
      required: true
    },
    // Thông tin mờ để phân tích
    location: {
      city: String,
      region: String
    }
  },
  
  // Đối tượng được đánh giá
  target: {
    type: {
      type: String,
      enum: ['DRUG_BATCH', 'MANUFACTURER', 'DISTRIBUTOR', 'HOSPITAL', 'SUPPLY_CHAIN'],
      required: true
    },
    id: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    name: String,
    reference: String
  },
  
  // Điểm đánh giá chi tiết
  ratings: {
    overall: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    quality: {
      type: Number,
      min: 1,
      max: 5
    },
    deliveryTime: {
      type: Number,
      min: 1,
      max: 5
    },
    packaging: {
      type: Number,
      min: 1,
      max: 5
    },
    customerSupport: {
      type: Number,
      min: 1,
      max: 5
    },
    transparency: {
      type: Number,
      min: 1,
      max: 5
    },
    compliance: {
      type: Number,
      min: 1,
      max: 5
    }
  },
  
  // Đánh giá chất lượng thuốc (nếu là drug batch)
  drugQualityAssessment: {
    effectiveness: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      comments: String
    },
    sideEffects: {
      experienced: {
        type: Boolean,
        default: false
      },
      severity: {
        type: String,
        enum: ['NONE', 'MILD', 'MODERATE', 'SEVERE']
      },
      description: String
    },
    packaging: {
      condition: {
        type: String,
        enum: ['EXCELLENT', 'GOOD', 'FAIR', 'POOR']
      },
      tamperProof: Boolean,
      labeling: {
        type: String,
        enum: ['CLEAR', 'UNCLEAR', 'MISSING']
      }
    }
  },
  
  // Góp ý chi tiết
  feedback: {
    positive: String,
    negative: String,
    suggestions: String,
    wouldRecommend: Boolean
  },
  
  // Danh mục đánh giá cụ thể
  categories: [{
    name: {
      type: String,
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: String,
    weight: {
      type: Number,
      default: 1
    }
  }],
  
  // Trạng thái và metadata
  status: {
    type: String,
    enum: ['DRAFT', 'SUBMITTED', 'VERIFIED', 'FLAGGED', 'HIDDEN'],
    default: 'DRAFT'
  },
  
  isVerified: {
    type: Boolean,
    default: false
  },
  
  verificationInfo: {
    method: {
      type: String,
      enum: ['AUTOMATIC', 'MANUAL', 'BLOCKCHAIN']
    },
    verifiedAt: Date,
    verifiedBy: String,
    notes: String
  },
  
  // Flags cho moderation
  flags: [{
    type: {
      type: String,
      enum: ['SPAM', 'INAPPROPRIATE', 'FAKE', 'OFFENSIVE', 'OTHER']
    },
    reason: String,
    flaggedBy: String,
    flaggedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Thông tin bổ sung
  contextInfo: {
    purchaseDate: Date,
    usageDuration: String, // "1 week", "2 months", etc.
    dosageFollowed: Boolean,
    prescriptionFollowed: Boolean,
    additionalMedications: [String]
  },
  
  // Tệp đính kèm (ảnh sản phẩm, đơn thuốc, etc.)
  attachments: [{
    type: {
      type: String,
      enum: ['IMAGE', 'DOCUMENT', 'RECEIPT', 'PRESCRIPTION']
    },
    filename: String,
    path: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    verified: Boolean
  }],
  
  // Thống kê tương tác
  interactions: {
    helpfulVotes: {
      type: Number,
      default: 0
    },
    notHelpfulVotes: {
      type: Number,
      default: 0
    },
    reportCount: {
      type: Number,
      default: 0
    },
    views: {
      type: Number,
      default: 0
    }
  },
  
  // Response từ nhà cung cấp
  providerResponse: {
    responded: {
      type: Boolean,
      default: false
    },
    response: String,
    respondedAt: Date,
    respondedBy: String
  },
  
  submittedAt: Date,
  lastUpdatedAt: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
evaluationSchema.index({ 'target.type': 1, 'target.id': 1 });
evaluationSchema.index({ 'evaluator.hashedId': 1 });
evaluationSchema.index({ 'evaluator.role': 1 });
evaluationSchema.index({ status: 1 });
evaluationSchema.index({ submittedAt: -1 });
evaluationSchema.index({ 'ratings.overall': 1 });
evaluationSchema.index({ isVerified: 1 });

// Compound indexes
evaluationSchema.index({ 'target.type': 1, 'ratings.overall': -1 });
evaluationSchema.index({ status: 1, submittedAt: -1 });

// Virtuals
evaluationSchema.virtual('averageRating').get(function() {
  const ratings = this.ratings;
  const values = Object.values(ratings).filter(val => typeof val === 'number' && val > 0);
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
});

evaluationSchema.virtual('categoryAverageRating').get(function() {
  if (this.categories.length === 0) return 0;
  const totalWeightedScore = this.categories.reduce((sum, cat) => sum + (cat.rating * cat.weight), 0);
  const totalWeight = this.categories.reduce((sum, cat) => sum + cat.weight, 0);
  return totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
});

evaluationSchema.virtual('helpfulnessRatio').get(function() {
  const total = this.interactions.helpfulVotes + this.interactions.notHelpfulVotes;
  if (total === 0) return 0;
  return this.interactions.helpfulVotes / total;
});

evaluationSchema.virtual('isHighQuality').get(function() {
  return this.isVerified && 
         this.feedback.positive && 
         this.helpfulnessRatio > 0.7 &&
         this.interactions.reportCount === 0;
});

// Pre-save middleware
evaluationSchema.pre('save', function(next) {
  // Set submitted date when status changes to SUBMITTED
  if (this.status === 'SUBMITTED' && !this.submittedAt) {
    this.submittedAt = new Date();
  }
  
  // Update lastUpdatedAt
  this.lastUpdatedAt = new Date();
  
  // Auto-verify if meets criteria
  if (this.status === 'SUBMITTED' && !this.isVerified) {
    const hasMinimumContent = this.feedback.positive || this.feedback.negative;
    const hasValidRating = this.ratings.overall >= 1 && this.ratings.overall <= 5;
    const noFlags = this.flags.length === 0;
    
    if (hasMinimumContent && hasValidRating && noFlags) {
      this.isVerified = true;
      this.verificationInfo = {
        method: 'AUTOMATIC',
        verifiedAt: new Date(),
        notes: 'Auto-verified based on content quality'
      };
    }
  }
  
  next();
});

// Static methods
evaluationSchema.statics.findByTarget = function(targetType, targetId) {
  return this.find({ 
    'target.type': targetType,
    'target.id': targetId,
    status: { $in: ['SUBMITTED', 'VERIFIED'] }
  }).sort({ submittedAt: -1 });
};

evaluationSchema.statics.getAverageRatingByTarget = function(targetType, targetId) {
  return this.aggregate([
    {
      $match: {
        'target.type': targetType,
        'target.id': targetId,
        status: { $in: ['SUBMITTED', 'VERIFIED'] },
        isVerified: true
      }
    },
    {
      $group: {
        _id: null,
        averageOverall: { $avg: '$ratings.overall' },
        averageQuality: { $avg: '$ratings.quality' },
        averageDeliveryTime: { $avg: '$ratings.deliveryTime' },
        averagePackaging: { $avg: '$ratings.packaging' },
        averageSupport: { $avg: '$ratings.customerSupport' },
        averageTransparency: { $avg: '$ratings.transparency' },
        averageCompliance: { $avg: '$ratings.compliance' },
        totalCount: { $sum: 1 },
        recommendationRate: {
          $avg: {
            $cond: ['$feedback.wouldRecommend', 1, 0]
          }
        }
      }
    }
  ]);
};

evaluationSchema.statics.findTopRated = function(targetType, limit = 10) {
  return this.aggregate([
    {
      $match: {
        'target.type': targetType,
        status: { $in: ['SUBMITTED', 'VERIFIED'] },
        isVerified: true
      }
    },
    {
      $group: {
        _id: '$target.id',
        targetName: { $first: '$target.name' },
        averageRating: { $avg: '$ratings.overall' },
        totalEvaluations: { $sum: 1 }
      }
    },
    {
      $match: {
        totalEvaluations: { $gte: 3 } // At least 3 evaluations
      }
    },
    { $sort: { averageRating: -1 } },
    { $limit: limit }
  ]);
};

evaluationSchema.statics.findByEvaluator = function(hashedId) {
  return this.find({ 'evaluator.hashedId': hashedId }).sort({ submittedAt: -1 });
};

evaluationSchema.statics.getFlaggedEvaluations = function() {
  return this.find({ 
    flags: { $exists: true, $not: { $size: 0 } },
    status: { $ne: 'HIDDEN' }
  });
};

evaluationSchema.statics.getEvaluationStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$target.type',
        totalEvaluations: { $sum: 1 },
        averageRating: { $avg: '$ratings.overall' },
        verifiedCount: {
          $sum: { $cond: ['$isVerified', 1, 0] }
        }
      }
    }
  ]);
};

// Instance methods
evaluationSchema.methods.submit = function() {
  this.status = 'SUBMITTED';
  this.submittedAt = new Date();
  return this.save();
};

evaluationSchema.methods.flag = function(flagType, reason, flaggedBy) {
  this.flags.push({
    type: flagType,
    reason: reason,
    flaggedBy: flaggedBy,
    flaggedAt: new Date()
  });
  
  // Auto-hide if flagged multiple times
  if (this.flags.length >= 3) {
    this.status = 'FLAGGED';
  }
  
  return this.save();
};

evaluationSchema.methods.addHelpfulVote = function() {
  this.interactions.helpfulVotes += 1;
  return this.save();
};

evaluationSchema.methods.addNotHelpfulVote = function() {
  this.interactions.notHelpfulVotes += 1;
  return this.save();
};

evaluationSchema.methods.addProviderResponse = function(response, respondedBy) {
  this.providerResponse = {
    responded: true,
    response: response,
    respondedAt: new Date(),
    respondedBy: respondedBy
  };
  
  return this.save();
};

evaluationSchema.methods.verify = function(method, verifier, notes) {
  this.isVerified = true;
  this.verificationInfo = {
    method: method,
    verifiedAt: new Date(),
    verifiedBy: verifier,
    notes: notes
  };
  
  if (this.status === 'DRAFT') {
    this.status = 'VERIFIED';
  }
  
  return this.save();
};

module.exports = mongoose.model('Evaluation', evaluationSchema);