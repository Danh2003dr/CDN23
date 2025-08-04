const express = require('express');
const router = express.Router();
const { auth, requirePermission, requireRole } = require('../middleware/auth');
const { 
    PERMISSIONS, 
    ROLE_PERMISSIONS, 
    getAllRoles, 
    getRoleInfo, 
    getUserPermissions,
    hasPermission 
} = require('../config/permissions');

// GET /api/permissions - Lấy danh sách tất cả permissions
router.get('/', auth, requirePermission('user_management'), async (req, res) => {
    try {
        res.json({
            success: true,
            data: {
                permissions: PERMISSIONS,
                total: Object.keys(PERMISSIONS).length
            }
        });
    } catch (error) {
        console.error('Get permissions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch permissions'
        });
    }
});

// GET /api/permissions/roles - Lấy danh sách tất cả roles và permissions
router.get('/roles', auth, requirePermission('user_management'), async (req, res) => {
    try {
        const roles = getAllRoles();
        res.json({
            success: true,
            data: {
                roles,
                total: roles.length
            }
        });
    } catch (error) {
        console.error('Get roles error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch roles'
        });
    }
});

// GET /api/permissions/roles/:roleName - Lấy thông tin chi tiết của một role
router.get('/roles/:roleName', auth, requirePermission('user_management'), async (req, res) => {
    try {
        const { roleName } = req.params;
        const roleInfo = getRoleInfo(roleName);
        
        if (!roleInfo) {
            return res.status(404).json({
                success: false,
                message: 'Role not found'
            });
        }
        
        res.json({
            success: true,
            data: roleInfo
        });
    } catch (error) {
        console.error('Get role info error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch role information'
        });
    }
});

// GET /api/permissions/user/:userId - Lấy permissions của một user
router.get('/user/:userId', auth, requirePermission('user_management'), async (req, res) => {
    try {
        const { userId } = req.params;
        const User = require('../models/User');
        
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        const userPermissions = getUserPermissions(user.role_name);
        const roleInfo = getRoleInfo(user.role_name);
        
        res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role_name: user.role_name
                },
                permissions: userPermissions,
                role_info: roleInfo
            }
        });
    } catch (error) {
        console.error('Get user permissions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user permissions'
        });
    }
});

// POST /api/permissions/check - Kiểm tra permission của user
router.post('/check', auth, async (req, res) => {
    try {
        const { permissions } = req.body;
        
        if (!permissions || !Array.isArray(permissions)) {
            return res.status(400).json({
                success: false,
                message: 'Permissions array is required'
            });
        }
        
        const userPermissions = req.user.permissions;
        const results = {};
        
        permissions.forEach(permission => {
            results[permission] = hasPermission(userPermissions, permission);
        });
        
        res.json({
            success: true,
            data: {
                user: {
                    id: req.user.id,
                    username: req.user.username,
                    role_name: req.user.role_name
                },
                permissions: results,
                has_all: permissions.every(p => results[p]),
                has_any: permissions.some(p => results[p])
            }
        });
    } catch (error) {
        console.error('Check permissions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check permissions'
        });
    }
});

// GET /api/permissions/current-user - Lấy permissions của user hiện tại
router.get('/current-user', auth, async (req, res) => {
    try {
        const userPermissions = req.user.permissions;
        const roleInfo = getRoleInfo(req.user.role_name);
        
        // Lấy danh sách permissions có sẵn
        const availablePermissions = Object.keys(PERMISSIONS).map(key => ({
            name: key,
            description: PERMISSIONS[key],
            granted: hasPermission(userPermissions, key)
        }));
        
        res.json({
            success: true,
            data: {
                user: {
                    id: req.user.id,
                    username: req.user.username,
                    email: req.user.email,
                    role_name: req.user.role_name
                },
                permissions: userPermissions,
                available_permissions: availablePermissions,
                role_info: roleInfo,
                summary: {
                    total_permissions: Object.keys(PERMISSIONS).length,
                    granted_permissions: Object.keys(userPermissions).filter(p => userPermissions[p]).length,
                    denied_permissions: Object.keys(userPermissions).filter(p => !userPermissions[p]).length
                }
            }
        });
    } catch (error) {
        console.error('Get current user permissions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch current user permissions'
        });
    }
});

// GET /api/permissions/endpoints - Lấy danh sách API endpoints và permissions required
router.get('/endpoints', auth, requirePermission('user_management'), async (req, res) => {
    try {
        const { API_PERMISSIONS } = require('../config/permissions');
        
        const endpoints = Object.entries(API_PERMISSIONS).map(([endpoint, permission]) => ({
            endpoint,
            required_permission: permission,
            permission_description: PERMISSIONS[permission] || 'Unknown permission'
        }));
        
        res.json({
            success: true,
            data: {
                endpoints,
                total: endpoints.length
            }
        });
    } catch (error) {
        console.error('Get endpoints permissions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch endpoints permissions'
        });
    }
});

module.exports = router; 