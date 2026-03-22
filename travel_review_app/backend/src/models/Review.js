const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Review:
 *       type: object
 *       required:
 *         - author
 *         - location
 *         - rating
 *         - content
 *       properties:
 *         _id:
 *           type: string
 *           description: ID review
 *         author:
 *           type: string
 *           description: ID tác giả
 *         location:
 *           type: string
 *           description: ID địa điểm
 *         rating:
 *           type: number
 *           minimum: 1
 *           maximum: 5
 *           description: Đánh giá tổng thể (1-5 sao)
 *         content:
 *           type: string
 *           description: Nội dung review
 *         title:
 *           type: string
 *           description: Tiêu đề review
 *         images:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               url:
 *                 type: string
 *               caption:
 *                 type: string
 *         detailedRatings:
 *           type: object
 *           properties:
 *             service:
 *               type: number
 *             cleanliness:
 *               type: number
 *             value:
 *               type: number
 *             location:
 *               type: number
 *             facilities:
 *               type: number
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *         visitDate:
 *           type: string
 *           format: date
 *           description: Ngày ghé thăm
 *         tripType:
 *           type: string
 *           enum: [solo, couple, family, friends, business]
 *           description: Loại chuyến đi
 *         likes:
 *           type: array
 *           items:
 *             type: string
 *           description: Danh sách user đã like
 *         stats:
 *           type: object
 *           properties:
 *             likesCount:
 *               type: number
 *             commentsCount:
 *               type: number
 *             sharesCount:
 *               type: number
 *             viewsCount:
 *               type: number
 *         isVerified:
 *           type: boolean
 *           description: Review đã được xác thực
 *         isActive:
 *           type: boolean
 *           description: Review đang hoạt động
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

const reviewSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Tác giả review là bắt buộc']
  },
  location: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location',
    required: [true, 'Địa điểm review là bắt buộc']
  },
  rating: {
    type: Number,
    required: [true, 'Đánh giá là bắt buộc'],
    min: [1, 'Đánh giá phải từ 1 đến 5'],
    max: [5, 'Đánh giá phải từ 1 đến 5']
  },
  title: {
    type: String,
    maxlength: [100, 'Tiêu đề không được quá 100 ký tự'],
    trim: true
  },
  content: {
    type: String,
    required: [true, 'Nội dung review là bắt buộc'],
    minlength: [10, 'Nội dung phải có ít nhất 10 ký tự'],
    maxlength: [2000, 'Nội dung không được quá 2000 ký tự']
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    caption: {
      type: String,
      maxlength: [200, 'Caption không được quá 200 ký tự']
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  detailedRatings: {
    service: {
      type: Number,
      min: [1, 'Đánh giá dịch vụ phải từ 1 đến 5'],
      max: [5, 'Đánh giá dịch vụ phải từ 1 đến 5']
    },
    cleanliness: {
      type: Number,
      min: [1, 'Đánh giá vệ sinh phải từ 1 đến 5'],
      max: [5, 'Đánh giá vệ sinh phải từ 1 đến 5']
    },
    value: {
      type: Number,
      min: [1, 'Đánh giá giá trị phải từ 1 đến 5'],
      max: [5, 'Đánh giá giá trị phải từ 1 đến 5']
    },
    location: {
      type: Number,
      min: [1, 'Đánh giá vị trí phải từ 1 đến 5'],
      max: [5, 'Đánh giá vị trí phải từ 1 đến 5']
    },
    facilities: {
      type: Number,
      min: [1, 'Đánh giá tiện nghi phải từ 1 đến 5'],
      max: [5, 'Đánh giá tiện nghi phải từ 1 đến 5']
    }
  },
  tags: [{
    type: String,
    maxlength: [30, 'Tag không được quá 30 ký tự']
  }],
  visitDate: {
    type: Date,
    validate: {
      validator: function(date) {
        return date <= new Date();
      },
      message: 'Ngày ghé thăm không thể trong tương lai'
    }
  },
  tripType: {
    type: String,
    enum: ['solo', 'couple', 'family', 'friends', 'business'],
    default: 'solo'
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  stats: {
    likesCount: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
    sharesCount: { type: Number, default: 0 },
    viewsCount: { type: Number, default: 0 }
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  reportCount: {
    type: Number,
    default: 0
  },
  moderationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'flagged'],
    default: 'pending'
  },
  moderatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  moderatedAt: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
reviewSchema.index({ author: 1 });
reviewSchema.index({ location: 1 });
reviewSchema.index({ rating: -1 });
reviewSchema.index({ createdAt: -1 });
reviewSchema.index({ 'stats.likesCount': -1 });
reviewSchema.index({ isActive: 1, moderationStatus: 1 });
reviewSchema.index({ content: 'text', title: 'text' });

// Compound indexes
reviewSchema.index({ location: 1, rating: -1 });
reviewSchema.index({ author: 1, createdAt: -1 });

// Virtual populate comments
reviewSchema.virtual('comments', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'review'
});

// Pre-save middleware to update stats
reviewSchema.pre('save', function(next) {
  if (this.isModified('likes')) {
    this.stats.likesCount = this.likes.length;
  }
  next();
});

// Post-save middleware to update location ratings
reviewSchema.post('save', async function(doc) {
  const Location = mongoose.model('Location');
  const location = await Location.findById(doc.location);
  if (location) {
    await location.updateRatings();
  }
});

// Post-remove middleware to update location ratings
reviewSchema.post('remove', async function(doc) {
  const Location = mongoose.model('Location');
  const location = await Location.findById(doc.location);
  if (location) {
    await location.updateRatings();
  }
});

// Method to check if user liked this review
reviewSchema.methods.isLikedBy = function(userId) {
  return this.likes.includes(userId);
};

// Method to toggle like
reviewSchema.methods.toggleLike = async function(userId) {
  const index = this.likes.indexOf(userId);
  if (index > -1) {
    this.likes.splice(index, 1);
  } else {
    this.likes.push(userId);
  }
  this.stats.likesCount = this.likes.length;
  await this.save();
  return this.stats.likesCount;
};

// Method to increment view count
reviewSchema.methods.incrementViews = async function() {
  this.stats.viewsCount += 1;
  await this.save();
};

// Static method to get trending reviews
reviewSchema.statics.getTrending = function(limit = 10) {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  return this.aggregate([
    {
      $match: {
        isActive: true,
        moderationStatus: 'approved',
        createdAt: { $gte: oneDayAgo }
      }
    },
    {
      $addFields: {
        trendingScore: {
          $add: [
            { $multiply: ['$stats.likesCount', 3] },
            { $multiply: ['$stats.commentsCount', 2] },
            '$stats.sharesCount',
            { $divide: ['$stats.viewsCount', 10] }
          ]
        }
      }
    },
    { $sort: { trendingScore: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'users',
        localField: 'author',
        foreignField: '_id',
        as: 'author'
      }
    },
    {
      $lookup: {
        from: 'locations',
        localField: 'location',
        foreignField: '_id',
        as: 'location'
      }
    },
    { $unwind: '$author' },
    { $unwind: '$location' }
  ]);
};

// Static method to get reviews by location with filters
reviewSchema.statics.getByLocation = function(locationId, filters = {}) {
  const query = {
    location: locationId,
    isActive: true,
    moderationStatus: 'approved'
  };

  if (filters.rating) {
    query.rating = filters.rating;
  }

  if (filters.tripType) {
    query.tripType = filters.tripType;
  }

  if (filters.dateFrom || filters.dateTo) {
    query.createdAt = {};
    if (filters.dateFrom) query.createdAt.$gte = new Date(filters.dateFrom);
    if (filters.dateTo) query.createdAt.$lte = new Date(filters.dateTo);
  }

  return this.find(query)
    .populate('author', 'fullName avatar stats.reviewsCount')
    .sort({ [filters.sortBy || 'createdAt']: filters.sortOrder || -1 });
};

module.exports = mongoose.model('Review', reviewSchema);