const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * Middleware xác thực JWT token
 */
const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User not found.'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please login again.'
      });
    }
    
    return res.status(401).json({
      success: false,
      message: 'Invalid token.'
    });
  }
};

/**
 * Middleware phân quyền theo role
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Please authenticate first.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required roles: ${roles.join(', ')}`
      });
    }

    next();
  };
};

/**
 * Middleware kiểm tra permissions cụ thể
 */
const checkPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Please authenticate first.'
      });
    }

    if (!req.user.hasPermission(permission)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required permission: ${permission}`
      });
    }

    next();
  };
};

/**
 * Middleware kiểm tra ownership (người dùng chỉ có thể truy cập tài nguyên của mình)
 */
const checkOwnership = (paramName = 'walletAddress') => {
  return (req, res, next) => {
    const targetAddress = req.params[paramName] || req.body[paramName];
    
    // Admin có thể truy cập tất cả
    if (req.user.role === 'ADMIN') {
      return next();
    }
    
    // Người dùng chỉ có thể truy cập tài nguyên của mình
    if (req.user.walletAddress !== targetAddress) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only access your own resources.'
      });
    }
    
    next();
  };
};

/**
 * Middleware kiểm tra first login (bắt buộc đổi mật khẩu)
 */
const checkFirstLogin = (req, res, next) => {
  if (req.user && req.user.isFirstLogin) {
    // Chỉ cho phép truy cập endpoints đổi mật khẩu và logout
    const allowedPaths = ['/auth/change-password', '/auth/logout', '/auth/profile'];
    
    if (!allowedPaths.some(path => req.path.includes(path))) {
      return res.status(403).json({
        success: false,
        message: 'Please change your password before accessing other features.',
        requirePasswordChange: true
      });
    }
  }
  
  next();
};

/**
 * Middleware rate limiting cho sensitive operations
 */
const sensitiveOperationLimit = (maxAttempts = 5, windowMs = 15 * 60 * 1000) => {
  const attempts = new Map();
  
  return (req, res, next) => {
    const key = `${req.ip}:${req.user ? req.user._id : 'anonymous'}`;
    const now = Date.now();
    const userAttempts = attempts.get(key) || { count: 0, resetTime: now + windowMs };
    
    if (now > userAttempts.resetTime) {
      userAttempts.count = 0;
      userAttempts.resetTime = now + windowMs;
    }
    
    if (userAttempts.count >= maxAttempts) {
      return res.status(429).json({
        success: false,
        message: 'Too many attempts. Please try again later.',
        resetTime: new Date(userAttempts.resetTime).toISOString()
      });
    }
    
    userAttempts.count += 1;
    attempts.set(key, userAttempts);
    
    next();
  };
};

/**
 * Middleware validate blockchain address
 */
const validateBlockchainAddress = (paramName = 'walletAddress') => {
  return (req, res, next) => {
    const address = req.params[paramName] || req.body[paramName];
    
    if (address && !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid blockchain address format.'
      });
    }
    
    next();
  };
};

/**
 * Middleware logging user activities
 */
const logUserActivity = (action) => {
  return (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      // Log successful operations
      if (res.statusCode < 400) {
        logger.info('User Activity', {
          userId: req.user?._id,
          walletAddress: req.user?.walletAddress,
          role: req.user?.role,
          action: action,
          method: req.method,
          path: req.path,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          timestamp: new Date().toISOString()
        });
      }
      
      originalSend.call(this, data);
    };
    
    next();
  };
};

module.exports = {
  authenticate,
  authorize,
  checkPermission,
  checkOwnership,
  checkFirstLogin,
  sensitiveOperationLimit,
  validateBlockchainAddress,
  logUserActivity
};