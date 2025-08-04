const express = require('express');
const router = express.Router();
const { auth, requirePermission } = require('../middleware/auth');
const UserActivityLog = require('../models/UserActivityLog');
const db = require('../config/database');

// GET /api/activity-logs - Lấy danh sách activity logs
router.get('/', auth, requirePermission('audit_logs'), async (req, res) => {
    try {
        const { page = 1, limit = 50, action, resource_type, user_id, success } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT 
                ual.id,
                u.username,
                u.email,
                u.first_name,
                u.last_name,
                r.name as role_name,
                ual.action,
                ual.resource_type,
                ual.resource_id,
                ual.details,
                ual.ip_address,
                ual.success,
                ual.error_message,
                ual.created_at
            FROM user_activity_logs ual
            LEFT JOIN users u ON ual.user_id = u.id
            LEFT JOIN roles r ON u.role_id = r.id
            WHERE 1=1
        `;

        const params = [];

        if (action) {
            query += ' AND ual.action = ?';
            params.push(action);
        }

        if (resource_type) {
            query += ' AND ual.resource_type = ?';
            params.push(resource_type);
        }

        if (user_id) {
            query += ' AND ual.user_id = ?';
            params.push(user_id);
        }

        if (success !== undefined) {
            query += ' AND ual.success = ?';
            params.push(success === 'true' ? 1 : 0);
        }

        query += ' ORDER BY ual.created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), offset);

        const [rows] = await db.execute(query, params);

        // Count total records
        let countQuery = `
            SELECT COUNT(*) as total
            FROM user_activity_logs ual
            WHERE 1=1
        `;
        const countParams = [];

        if (action) {
            countQuery += ' AND ual.action = ?';
            countParams.push(action);
        }

        if (resource_type) {
            countQuery += ' AND ual.resource_type = ?';
            countParams.push(resource_type);
        }

        if (user_id) {
            countQuery += ' AND ual.user_id = ?';
            countParams.push(user_id);
        }

        if (success !== undefined) {
            countQuery += ' AND ual.success = ?';
            countParams.push(success === 'true' ? 1 : 0);
        }

        const [countResult] = await db.execute(countQuery, countParams);
        const total = countResult[0].total;

        res.json({
            success: true,
            data: {
                logs: rows,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });

    } catch (error) {
        console.error('Get activity logs error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch activity logs'
        });
    }
});

// GET /api/activity-logs/summary - Lấy summary của activity logs
router.get('/summary', auth, requirePermission('audit_logs'), async (req, res) => {
    try {
        const { days = 7 } = req.query;

        const stats = await UserActivityLog.getActivityStats(days);
        const topUsers = await UserActivityLog.getTopUsers(10, days);
        const recentActivity = await UserActivityLog.getRecentActivity(20);

        res.json({
            success: true,
            data: {
                stats,
                topUsers,
                recentActivity,
                period: `${days} days`
            }
        });

    } catch (error) {
        console.error('Get activity logs summary error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch activity logs summary'
        });
    }
});

// GET /api/activity-logs/user/:userId - Lấy logs của user cụ thể
router.get('/user/:userId', auth, requirePermission('audit_logs'), async (req, res) => {
    try {
        const { userId } = req.params;
        const { page = 1, limit = 50 } = req.query;
        const offset = (page - 1) * limit;

        const logs = await UserActivityLog.findByUserId(userId, limit, offset);

        res.json({
            success: true,
            data: {
                logs,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: logs.length
                }
            }
        });

    } catch (error) {
        console.error('Get user activity logs error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user activity logs'
        });
    }
});

// GET /api/activity-logs/action/:action - Lấy logs theo action
router.get('/action/:action', auth, requirePermission('audit_logs'), async (req, res) => {
    try {
        const { action } = req.params;
        const { page = 1, limit = 50 } = req.query;
        const offset = (page - 1) * limit;

        const logs = await UserActivityLog.findByAction(action, limit, offset);

        res.json({
            success: true,
            data: {
                logs,
                action,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: logs.length
                }
            }
        });

    } catch (error) {
        console.error('Get action logs error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch action logs'
        });
    }
});

// GET /api/activity-logs/resource/:resourceType - Lấy logs theo resource type
router.get('/resource/:resourceType', auth, requirePermission('audit_logs'), async (req, res) => {
    try {
        const { resourceType } = req.params;
        const { page = 1, limit = 50 } = req.query;
        const offset = (page - 1) * limit;

        const logs = await UserActivityLog.findByResourceType(resourceType, limit, offset);

        res.json({
            success: true,
            data: {
                logs,
                resourceType,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: logs.length
                }
            }
        });

    } catch (error) {
        console.error('Get resource logs error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch resource logs'
        });
    }
});

// GET /api/activity-logs/export - Export activity logs
router.get('/export', auth, requirePermission('audit_logs'), async (req, res) => {
    try {
        const { format = 'csv', days = 30 } = req.query;

        const logs = await UserActivityLog.getSummary(1000); // Lấy 1000 records gần nhất

        if (format === 'csv') {
            const csvHeader = 'ID,Username,Email,Role,Action,Resource Type,Resource ID,IP Address,Success,Error Message,Created At\n';
            const csvData = logs.map(log => {
                return `${log.id},"${log.username || ''}","${log.email || ''}","${log.role_name || ''}","${log.action}","${log.resource_type || ''}","${log.resource_id || ''}","${log.ip_address || ''}","${log.success}","${log.error_message || ''}","${log.created_at}"`;
            }).join('\n');

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="activity-logs-${new Date().toISOString().split('T')[0]}.csv"`);
            res.send(csvHeader + csvData);
        } else {
            res.json({
                success: true,
                data: logs
            });
        }

    } catch (error) {
        console.error('Export activity logs error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to export activity logs'
        });
    }
});

module.exports = router; 