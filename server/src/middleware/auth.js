const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { hasPermission, getUserPermissions, getRoleInfo } = require('../config/permissions');

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'Access denied. No token provided.' 
            });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);
        
        if (!user || !user.is_active) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid token or user inactive.' 
            });
        }
        
        // Lấy permissions từ role của user
        let userPermissions = {};
        try {
            if (user.permissions) {
                // Kiểm tra xem permissions đã là object chưa
                if (typeof user.permissions === 'string') {
                    try {
                        userPermissions = JSON.parse(user.permissions);
                    } catch (parseError) {
                        console.error('Error parsing user permissions JSON:', parseError);
                        userPermissions = getUserPermissions(user.role_name);
                    }
                } else if (typeof user.permissions === 'object') {
                    userPermissions = user.permissions;
                } else {
                    userPermissions = getUserPermissions(user.role_name);
                }
            } else {
                // Fallback: lấy permissions từ role name
                userPermissions = getUserPermissions(user.role_name);
            }
        } catch (error) {
            console.error('Error parsing user permissions:', error);
            userPermissions = getUserPermissions(user.role_name);
        }
        
        // Thêm permissions vào user object
        user.permissions = userPermissions;
        
        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid token.' 
            });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                success: false, 
                message: 'Token expired.' 
            });
        }
        
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error.' 
        });
    }
};

const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Authentication required.' 
            });
        }
        
        const userRole = req.user.role_name;
        const requiredRoles = Array.isArray(roles) ? roles : [roles];
        
        if (!requiredRoles.includes(userRole)) {
            return res.status(403).json({ 
                success: false, 
                message: 'Insufficient role permissions.' 
            });
        }
        
        next();
    };
};

const requirePermission = (permission) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Authentication required.' 
            });
        }
        
        const userPermissions = req.user.permissions;
        
        if (!hasPermission(userPermissions, permission)) {
            return res.status(403).json({ 
                success: false, 
                message: `Permission '${permission}' required.` 
            });
        }
        
        next();
    };
};

const requireAnyPermission = (permissions) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Authentication required.' 
            });
        }
        
        const userPermissions = req.user.permissions;
        const permissionArray = Array.isArray(permissions) ? permissions : [permissions];
        
        const hasAnyPermission = permissionArray.some(permission => 
            hasPermission(userPermissions, permission)
        );
        
        if (!hasAnyPermission) {
            return res.status(403).json({ 
                success: false, 
                message: `At least one of these permissions required: ${permissionArray.join(', ')}` 
            });
        }
        
        next();
    };
};

const requireAllPermissions = (permissions) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Authentication required.' 
            });
        }
        
        const userPermissions = req.user.permissions;
        const permissionArray = Array.isArray(permissions) ? permissions : [permissions];
        
        const hasAllPermissions = permissionArray.every(permission => 
            hasPermission(userPermissions, permission)
        );
        
        if (!hasAllPermissions) {
            return res.status(403).json({ 
                success: false, 
                message: `All these permissions required: ${permissionArray.join(', ')}` 
            });
        }
        
        next();
    };
};

// Middleware để log permission checks (cho debugging)
const logPermissionCheck = (permission) => {
    return (req, res, next) => {
        if (req.user) {
            console.log(`🔐 Permission check: ${req.user.username} (${req.user.role_name}) -> ${permission}`);
        }
        next();
    };
};

module.exports = {
    auth,
    requireRole,
    requirePermission,
    requireAnyPermission,
    requireAllPermissions,
    logPermissionCheck
}; 