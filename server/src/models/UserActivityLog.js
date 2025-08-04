const db = require('../config/database');

class UserActivityLog {
    static async create(logData) {
        const {
            user_id,
            action,
            resource_type = null,
            resource_id = null,
            details = null,
            ip_address = null,
            user_agent = null,
            success = true,
            error_message = null
        } = logData;

        const query = `
            INSERT INTO user_activity_logs (
                user_id, action, resource_type, resource_id, details,
                ip_address, user_agent, success, error_message
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            user_id, action, resource_type, resource_id,
            details ? JSON.stringify(details) : null,
            ip_address, user_agent, success, error_message
        ];

        try {
            const [result] = await db.execute(query, values);
            return result.insertId;
        } catch (error) {
            console.error('Error creating user activity log:', error);
            throw error;
        }
    }

    static async findByUserId(userId, limit = 50, offset = 0) {
        const query = `
            SELECT * FROM user_activity_logs 
            WHERE user_id = ? 
            ORDER BY created_at DESC 
            LIMIT ? OFFSET ?
        `;

        try {
            const [rows] = await db.execute(query, [userId, limit, offset]);
            return rows;
        } catch (error) {
            console.error('Error finding user activity logs:', error);
            throw error;
        }
    }

    static async findByAction(action, limit = 50, offset = 0) {
        const query = `
            SELECT ual.*, u.username, u.email, u.role_name 
            FROM user_activity_logs ual
            LEFT JOIN users u ON ual.user_id = u.id
            WHERE ual.action = ? 
            ORDER BY ual.created_at DESC 
            LIMIT ? OFFSET ?
        `;

        try {
            const [rows] = await db.execute(query, [action, limit, offset]);
            return rows;
        } catch (error) {
            console.error('Error finding activity logs by action:', error);
            throw error;
        }
    }

    static async findByResourceType(resourceType, limit = 50, offset = 0) {
        const query = `
            SELECT ual.*, u.username, u.email, u.role_name 
            FROM user_activity_logs ual
            LEFT JOIN users u ON ual.user_id = u.id
            WHERE ual.resource_type = ? 
            ORDER BY ual.created_at DESC 
            LIMIT ? OFFSET ?
        `;

        try {
            const [rows] = await db.execute(query, [resourceType, limit, offset]);
            return rows;
        } catch (error) {
            console.error('Error finding activity logs by resource type:', error);
            throw error;
        }
    }

    static async getSummary(limit = 100) {
        const query = `
            SELECT 
                ual.id,
                u.username,
                u.email,
                u.first_name,
                u.last_name,
                u.role_name,
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
            ORDER BY ual.created_at DESC
            LIMIT ?
        `;

        try {
            const [rows] = await db.execute(query, [limit]);
            return rows;
        } catch (error) {
            console.error('Error getting activity log summary:', error);
            throw error;
        }
    }

    static async getActivityStats(days = 7) {
        const query = `
            SELECT 
                DATE(created_at) as date,
                action,
                COUNT(*) as count,
                COUNT(CASE WHEN success = 1 THEN 1 END) as success_count,
                COUNT(CASE WHEN success = 0 THEN 1 END) as error_count
            FROM user_activity_logs 
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
            GROUP BY DATE(created_at), action
            ORDER BY date DESC, count DESC
        `;

        try {
            const [rows] = await db.execute(query, [days]);
            return rows;
        } catch (error) {
            console.error('Error getting activity stats:', error);
            throw error;
        }
    }

    static async getTopUsers(limit = 10, days = 7) {
        const query = `
            SELECT 
                u.username,
                u.email,
                u.role_name,
                COUNT(*) as activity_count,
                COUNT(CASE WHEN ual.success = 1 THEN 1 END) as success_count,
                COUNT(CASE WHEN ual.success = 0 THEN 1 END) as error_count
            FROM user_activity_logs ual
            LEFT JOIN users u ON ual.user_id = u.id
            WHERE ual.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
            GROUP BY ual.user_id, u.username, u.email, u.role_name
            ORDER BY activity_count DESC
            LIMIT ?
        `;

        try {
            const [rows] = await db.execute(query, [days, limit]);
            return rows;
        } catch (error) {
            console.error('Error getting top users:', error);
            throw error;
        }
    }

    static async getRecentActivity(limit = 20) {
        const query = `
            SELECT 
                ual.id,
                u.username,
                u.email,
                u.role_name,
                ual.action,
                ual.resource_type,
                ual.resource_id,
                ual.details,
                ual.ip_address,
                ual.success,
                ual.created_at
            FROM user_activity_logs ual
            LEFT JOIN users u ON ual.user_id = u.id
            ORDER BY ual.created_at DESC
            LIMIT ?
        `;

        try {
            const [rows] = await db.execute(query, [limit]);
            return rows;
        } catch (error) {
            console.error('Error getting recent activity:', error);
            throw error;
        }
    }
}

module.exports = UserActivityLog; 