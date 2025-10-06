const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Location:
 *       type: object
 *       required:
 *         - name
 *         - address
 *         - coordinates
 *         - category
 *       properties:
 *         _id:
 *           type: string
 *           description: ID địa điểm
 *         name:
 *           type: string
 *           description: Tên địa điểm
 *         description:
 *           type: string
 *           description: Mô tả địa điểm
 *         address:
 *           type: string
 *           description: Địa chỉ chi tiết
 *         coordinates:
 *           type: object
 *           properties:
 *             latitude:
 *               type: number
 *               description: Vĩ độ
 *             longitude:
 *               type: number
 *               description: Kinh độ
 *         category:
 *           type: string
 *           enum: [restaurant, hotel, attraction, beach, mountain, museum, park, shopping, nightlife, cultural, adventure, wellness]
 *           description: Loại địa điểm
 *         subcategory:
 *           type: string
 *           description: Phân loại con
 *         images:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               url:
 *                 type: string
 *               caption:
 *                 type: string
 *               uploadedBy:
 *                 type: string
 *         contact:
 *           type: object
 *           properties:
 *             phone:
 *               type: string
 *             email:
 *               type: string
 *             website:
 *               type: string
 *         businessHours:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               day:
 *                 type: string
 *               open:
 *                 type: string
 *               close:
 *                 type: string
 *               isClosed:
 *                 type: boolean
 *         priceRange:
 *           type: object
 *           properties:
 *             min:
 *               type: number
 *             max:
 *               type: number
 *             currency:
 *               type: string
 *         amenities:
 *           type: array
 *           items:
 *             type: string
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *         ratings:
 *           type: object
 *           properties:
 *             average:
 *               type: number
 *             total:
 *               type: number
 *             breakdown:
 *               type: object
 *         stats:
 *           type: object
 *           properties:
 *             reviewsCount:
 *               type: number
 *             visitorsCount:
 *               type: number
 *             favoritesCount:
 *               type: number
 *         isVerified:
 *           type: boolean
 *           description: Địa điểm đã được xác thực
 *         isActive:
 *           type: boolean
 *           description: Địa điểm đang hoạt động
 *         addedBy:
 *           type: string
 *           description: ID người thêm địa điểm
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

const locationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Tên địa điểm là bắt buộc'],
    trim: true,
    maxlength: [100, 'Tên địa điểm không được quá 100 ký tự']
  },
  description: {
    type: String,
    maxlength: [2000, 'Mô tả không được quá 2000 ký tự'],
    default: ''
  },
  address: {
    type: String,
    required: [true, 'Địa chỉ là bắt buộc'],
    maxlength: [200, 'Địa chỉ không được quá 200 ký tự']
  },
  coordinates: {
    latitude: {
      type: Number,
      required: [true, 'Vĩ độ là bắt buộc'],
      min: [-90, 'Vĩ độ phải từ -90 đến 90'],
      max: [90, 'Vĩ độ phải từ -90 đến 90']
    },
    longitude: {
      type: Number,
      required: [true, 'Kinh độ là bắt buộc'],
      min: [-180, 'Kinh độ phải từ -180 đến 180'],
      max: [180, 'Kinh độ phải từ -180 đến 180']
    }
  },
  category: {
    type: String,
    required: [true, 'Loại địa điểm là bắt buộc'],
    enum: [
      'restaurant', 'hotel', 'attraction', 'beach', 'mountain', 
      'museum', 'park', 'shopping', 'nightlife', 'cultural', 
      'adventure', 'wellness', 'transport', 'service'
    ]
  },
  subcategory: {
    type: String,
    maxlength: [50, 'Phân loại con không được quá 50 ký tự']
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
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  contact: {
    phone: {
      type: String,
      match: [/^[\+]?[0-9\-\(\)\s]+$/, 'Số điện thoại không hợp lệ']
    },
    email: {
      type: String,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email không hợp lệ']
    },
    website: {
      type: String,
      match: [/^https?:\/\/.+/, 'Website phải bắt đầu bằng http:// hoặc https://']
    }
  },
  businessHours: [{
    day: {
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      required: true
    },
    open: {
      type: String,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Giờ mở cửa không hợp lệ (HH:MM)']
    },
    close: {
      type: String,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Giờ đóng cửa không hợp lệ (HH:MM)']
    },
    isClosed: {
      type: Boolean,
      default: false
    }
  }],
  priceRange: {
    min: {
      type: Number,
      min: [0, 'Giá tối thiểu phải >= 0']
    },
    max: {
      type: Number,
      min: [0, 'Giá tối đa phải >= 0']
    },
    currency: {
      type: String,
      enum: ['VND', 'USD', 'EUR', 'JPY', 'KRW', 'THB'],
      default: 'VND'
    }
  },
  amenities: [{
    type: String,
    enum: [
      'wifi', 'parking', 'ac', 'pool', 'gym', 'spa', 'restaurant',
      'bar', 'room_service', 'laundry', 'pet_friendly', 'wheelchair_accessible',
      'family_friendly', 'outdoor_seating', 'delivery', 'takeaway',
      'credit_card', 'cash_only', 'reservation_required'
    ]
  }],
  tags: [{
    type: String,
    maxlength: [30, 'Tag không được quá 30 ký tự']
  }],
  ratings: {
    average: {
      type: Number,
      min: [0, 'Đánh giá trung bình phải >= 0'],
      max: [5, 'Đánh giá trung bình phải <= 5'],
      default: 0
    },
    total: {
      type: Number,
      default: 0
    },
    breakdown: {
      service: { type: Number, default: 0 },
      cleanliness: { type: Number, default: 0 },
      value: { type: Number, default: 0 },
      location: { type: Number, default: 0 },
      facilities: { type: Number, default: 0 }
    }
  },
  stats: {
    reviewsCount: { type: Number, default: 0 },
    visitorsCount: { type: Number, default: 0 },
    favoritesCount: { type: Number, default: 0 },
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
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
locationSchema.index({ 'coordinates.latitude': 1, 'coordinates.longitude': 1 });
locationSchema.index({ category: 1 });
locationSchema.index({ name: 'text', description: 'text', address: 'text' });
locationSchema.index({ 'ratings.average': -1 });
locationSchema.index({ 'stats.reviewsCount': -1 });
locationSchema.index({ createdAt: -1 });
locationSchema.index({ isActive: 1, isVerified: 1 });

// Geospatial index for location-based queries
locationSchema.index({
  'coordinates.latitude': '2dsphere',
  'coordinates.longitude': '2dsphere'
});

// Virtual populate reviews
locationSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'location'
});

// Virtual populate favorites
locationSchema.virtual('favorites', {
  ref: 'Favorite',
  localField: '_id',
  foreignField: 'location'
});

// Method to calculate distance from a point
locationSchema.methods.calculateDistance = function(lat, lng) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat - this.coordinates.latitude) * Math.PI / 180;
  const dLng = (lng - this.coordinates.longitude) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(this.coordinates.latitude * Math.PI / 180) * Math.cos(lat * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
};

// Method to update ratings
locationSchema.methods.updateRatings = async function() {
  const Review = mongoose.model('Review');
  const reviews = await Review.find({ location: this._id });
  
  if (reviews.length === 0) {
    this.ratings.average = 0;
    this.ratings.total = 0;
    this.ratings.breakdown = {
      service: 0,
      cleanliness: 0,
      value: 0,
      location: 0,
      facilities: 0
    };
    this.stats.reviewsCount = 0;
  } else {
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    this.ratings.average = totalRating / reviews.length;
    this.ratings.total = reviews.length;
    
    // Calculate breakdown averages
    const breakdown = {
      service: 0,
      cleanliness: 0,
      value: 0,
      location: 0,
      facilities: 0
    };
    
    reviews.forEach(review => {
      if (review.detailedRatings) {
        Object.keys(breakdown).forEach(key => {
          if (review.detailedRatings[key]) {
            breakdown[key] += review.detailedRatings[key];
          }
        });
      }
    });
    
    Object.keys(breakdown).forEach(key => {
      breakdown[key] = breakdown[key] / reviews.length;
    });
    
    this.ratings.breakdown = breakdown;
    this.stats.reviewsCount = reviews.length;
  }
  
  await this.save();
};

module.exports = mongoose.model('Location', locationSchema);