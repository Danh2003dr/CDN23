const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Thông tin cơ bản
  walletAddress: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: /^0x[a-fA-F0-9]{40}$/
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  
  // Thông tin cá nhân
  fullName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  phoneNumber: {
    type: String,
    trim: true,
    match: /^[0-9+\-\s()]+$/
  },
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  },
  
  // Vai trò và quyền hạn
  role: {
    type: String,
    enum: ['PATIENT', 'MANUFACTURER', 'DISTRIBUTOR', 'HOSPITAL', 'ADMIN'],
    required: true,
    default: 'PATIENT'
  },
  permissions: [{
    type: String,
    enum: [
      'CREATE_BATCH',
      'UPDATE_BATCH', 
      'VERIFY_BATCH',
      'TRANSFER_BATCH',
      'VIEW_REPORTS',
      'MANAGE_USERS',
      'MANAGE_NOTIFICATIONS',
      'RECALL_BATCH'
    ]
  }],
  
  // Thông tin tổ chức (cho manufacturer, distributor, hospital)
  organizationInfo: {
    name: String,
    registrationNumber: String,
    licenseNumber: String,
    establishedDate: Date,
    description: String,
    website: String,
    verificationStatus: {
      type: String,
      enum: ['PENDING', 'VERIFIED', 'REJECTED'],
      default: 'PENDING'
    }
  },
  
  // Trạng thái tài khoản
  isActive: {
    type: Boolean,
    default: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  isFirstLogin: {
    type: Boolean,
    default: true
  },
  lastLogin: Date,
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date,
  
  // Tokens và bảo mật
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  twoFactorSecret: String,
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  
  // Metadata
  profileImage: String,
  preferences: {
    language: {
      type: String,
      enum: ['vi', 'en'],
      default: 'vi'
    },
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      push: { type: Boolean, default: true }
    },
    timezone: {
      type: String,
      default: 'Asia/Ho_Chi_Minh'
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
userSchema.index({ walletAddress: 1 });
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ 'organizationInfo.registrationNumber': 1 });

// Virtual for account locked status
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Pre-save middleware để hash password
userSchema.pre('save', async function(next) {
  // Chỉ hash password nếu nó được modify
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method để kiểm tra password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method để tăng login attempts
userSchema.methods.incLoginAttempts = function() {
  // Nếu có lockUntil và đã hết hạn, reset attempts
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Nếu đạt max attempts và chưa bị lock, set lockUntil
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }
  
  return this.updateOne(updates);
};

// Method để reset login attempts
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  });
};

// Method để generate verification token
userSchema.methods.generateVerificationToken = function() {
  const crypto = require('crypto');
  const token = crypto.randomBytes(20).toString('hex');
  
  this.emailVerificationToken = token;
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  
  return token;
};

// Method để generate password reset token
userSchema.methods.generatePasswordResetToken = function() {
  const crypto = require('crypto');
  const token = crypto.randomBytes(20).toString('hex');
  
  this.passwordResetToken = token;
  this.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
  
  return token;
};

// Method để check permissions
userSchema.methods.hasPermission = function(permission) {
  return this.permissions.includes(permission);
};

// Method để get role permissions
userSchema.methods.getRolePermissions = function() {
  const rolePermissions = {
    ADMIN: [
      'CREATE_BATCH', 'UPDATE_BATCH', 'VERIFY_BATCH', 'TRANSFER_BATCH',
      'VIEW_REPORTS', 'MANAGE_USERS', 'MANAGE_NOTIFICATIONS', 'RECALL_BATCH'
    ],
    MANUFACTURER: ['CREATE_BATCH', 'UPDATE_BATCH', 'TRANSFER_BATCH'],
    DISTRIBUTOR: ['UPDATE_BATCH', 'TRANSFER_BATCH'],
    HOSPITAL: ['UPDATE_BATCH', 'TRANSFER_BATCH', 'VIEW_REPORTS'],
    PATIENT: []
  };
  
  return rolePermissions[this.role] || [];
};

// Static method để tìm user by email hoặc username
userSchema.statics.findByCredentials = async function(identifier, password) {
  const user = await this.findOne({
    $or: [
      { email: identifier.toLowerCase() },
      { username: identifier }
    ],
    isActive: true
  });
  
  if (!user) {
    throw new Error('Invalid credentials');
  }
  
  if (user.isLocked) {
    throw new Error('Account temporarily locked due to too many failed login attempts');
  }
  
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    await user.incLoginAttempts();
    throw new Error('Invalid credentials');
  }
  
  // Reset login attempts on successful login
  if (user.loginAttempts > 0) {
    await user.resetLoginAttempts();
  }
  
  // Update last login
  user.lastLogin = new Date();
  await user.save();
  
  return user;
};

// Remove sensitive data from JSON output
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  
  delete user.password;
  delete user.emailVerificationToken;
  delete user.emailVerificationExpires;
  delete user.passwordResetToken;
  delete user.passwordResetExpires;
  delete user.twoFactorSecret;
  delete user.loginAttempts;
  delete user.lockUntil;
  
  return user;
};

module.exports = mongoose.model('User', userSchema);