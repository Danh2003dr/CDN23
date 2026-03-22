const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - fullName
 *       properties:
 *         _id:
 *           type: string
 *           description: ID người dùng
 *         email:
 *           type: string
 *           format: email
 *           description: Email người dùng
 *         password:
 *           type: string
 *           description: Mật khẩu (đã mã hóa)
 *         fullName:
 *           type: string
 *           description: Họ và tên
 *         avatar:
 *           type: string
 *           description: URL avatar
 *         bio:
 *           type: string
 *           description: Mô tả bản thân
 *         location:
 *           type: string
 *           description: Vị trí hiện tại
 *         dateOfBirth:
 *           type: string
 *           format: date
 *           description: Ngày sinh
 *         gender:
 *           type: string
 *           enum: [male, female, other]
 *           description: Giới tính
 *         interests:
 *           type: array
 *           items:
 *             type: string
 *           description: Sở thích du lịch
 *         socialLinks:
 *           type: object
 *           properties:
 *             facebook:
 *               type: string
 *             instagram:
 *               type: string
 *             twitter:
 *               type: string
 *         stats:
 *           type: object
 *           properties:
 *             reviewsCount:
 *               type: number
 *             followersCount:
 *               type: number
 *             followingCount:
 *               type: number
 *             likesReceived:
 *               type: number
 *         settings:
 *           type: object
 *           properties:
 *             isPrivate:
 *               type: boolean
 *             allowNotifications:
 *               type: boolean
 *             language:
 *               type: string
 *             theme:
 *               type: string
 *         isVerified:
 *           type: boolean
 *           description: Tài khoản đã xác thực
 *         isActive:
 *           type: boolean
 *           description: Tài khoản đang hoạt động
 *         lastLogin:
 *           type: string
 *           format: date-time
 *           description: Lần đăng nhập cuối
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Ngày tạo tài khoản
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Ngày cập nhật cuối
 */

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email là bắt buộc'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Email không hợp lệ'
    ]
  },
  password: {
    type: String,
    required: [true, 'Mật khẩu là bắt buộc'],
    minlength: [6, 'Mật khẩu phải có ít nhất 6 ký tự'],
    select: false
  },
  fullName: {
    type: String,
    required: [true, 'Họ tên là bắt buộc'],
    trim: true,
    maxlength: [50, 'Họ tên không được quá 50 ký tự']
  },
  avatar: {
    type: String,
    default: null
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio không được quá 500 ký tự'],
    default: ''
  },
  location: {
    type: String,
    maxlength: [100, 'Vị trí không được quá 100 ký tự'],
    default: ''
  },
  dateOfBirth: {
    type: Date,
    default: null
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    default: 'other'
  },
  interests: [{
    type: String,
    enum: [
      'beach', 'mountain', 'city', 'culture', 'food', 'adventure',
      'luxury', 'budget', 'family', 'solo', 'photography', 'history',
      'nature', 'nightlife', 'shopping', 'wellness'
    ]
  }],
  socialLinks: {
    facebook: { type: String, default: '' },
    instagram: { type: String, default: '' },
    twitter: { type: String, default: '' }
  },
  stats: {
    reviewsCount: { type: Number, default: 0 },
    followersCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 },
    likesReceived: { type: Number, default: 0 }
  },
  settings: {
    isPrivate: { type: Boolean, default: false },
    allowNotifications: { type: Boolean, default: true },
    language: { type: String, default: 'vi' },
    theme: { type: String, enum: ['light', 'dark', 'auto'], default: 'auto' }
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  emailVerificationToken: String,
  emailVerificationExpire: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ fullName: 'text' });
userSchema.index({ 'stats.reviewsCount': -1 });
userSchema.index({ createdAt: -1 });

// Virtual populate reviews
userSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'author'
});

// Virtual populate followers
userSchema.virtual('followers', {
  ref: 'Follow',
  localField: '_id',
  foreignField: 'following'
});

// Virtual populate following
userSchema.virtual('following', {
  ref: 'Follow',
  localField: '_id',
  foreignField: 'follower'
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to check password
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to generate JWT token
userSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    { id: this._id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

// Method to generate refresh token
userSchema.methods.getRefreshToken = function() {
  return jwt.sign(
    { id: this._id, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE }
  );
};

// Method to generate reset password token
userSchema.methods.getResetPasswordToken = function() {
  const resetToken = require('crypto').randomBytes(20).toString('hex');
  
  this.resetPasswordToken = require('crypto')
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
    
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  return resetToken;
};

// Method to generate email verification token
userSchema.methods.getEmailVerificationToken = function() {
  const verificationToken = require('crypto').randomBytes(20).toString('hex');
  
  this.emailVerificationToken = require('crypto')
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');
    
  this.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  
  return verificationToken;
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.resetPasswordToken;
  delete userObject.resetPasswordExpire;
  delete userObject.emailVerificationToken;
  delete userObject.emailVerificationExpire;
  return userObject;
};

module.exports = mongoose.model('User', userSchema);