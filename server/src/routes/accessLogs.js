const express = require('express');
const router = express.Router();
const { auth, requirePermission } = require('../middleware/auth');
const db = require('../config/database');

// GET /api/access-logs - Lấy danh sách access logs với filter
router.get('/', auth, requirePermission('audit_logs'), async (req, res) => {
    try {
        const {
            page = 1,
            limit = 50,
            node_id,
            content_id,
            client_ip,
            start_date,
            end_date,
            cache_hit,
            response_status
        } = req.query;

        let whereConditions = [];
        let params = [];

        // Filter theo node_id
        if (node_id) {
            whereConditions.push('al.node_id = ?');
            params.push(node_id);
        }

        // Filter theo content_id
        if (content_id) {
            whereConditions.push('al.content_id = ?');
            params.push(content_id);
        }

        // Filter theo client_ip
        if (client_ip) {
            whereConditions.push('al.client_ip LIKE ?');
            params.push(`%${client_ip}%`);
        }

        // Filter theo thời gian
        if (start_date) {
            whereConditions.push('al.timestamp >= ?');
            params.push(start_date);
        }

        if (end_date) {
            whereConditions.push('al.timestamp <= ?');
            params.push(end_date);
        }

        // Filter theo cache_hit
        if (cache_hit !== undefined) {
            whereConditions.push('al.cache_hit = ?');
            params.push(cache_hit === 'true' ? 1 : 0);
        }

        // Filter theo response_status
        if (response_status) {
            whereConditions.push('al.response_status = ?');
            params.push(response_status);
        }

        const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

        // Count total records
        const countQuery = `
            SELECT COUNT(*) as total
            FROM access_logs al
            LEFT JOIN cdn_nodes n ON al.node_id = n.id
            LEFT JOIN content c ON al.content_id = c.id
            ${whereClause}
        `;

        const [countResult] = await db.execute(countQuery, params);
        const total = countResult[0].total;

        // Calculate pagination
        const offset = (page - 1) * limit;
        const totalPages = Math.ceil(total / limit);

        // Get access logs with pagination
        const query = `
            SELECT 
                al.*,
                n.name as node_name,
                n.hostname as node_hostname,
                c.filename as content_filename,
                c.original_filename as content_original_filename
            FROM access_logs al
            LEFT JOIN cdn_nodes n ON al.node_id = n.id
            LEFT JOIN content c ON al.content_id = c.id
            ${whereClause}
            ORDER BY al.timestamp DESC
            LIMIT ? OFFSET ?
        `;

        const [logs] = await db.execute(query, [...params, parseInt(limit), offset]);

        res.json({
            success: true,
            data: {
                logs,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: totalPages
                }
            }
        });

    } catch (error) {
        console.error('Error fetching access logs:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch access logs'
        });
    }
});

// GET /api/access-logs/summary - Thống kê tổng quan
router.get('/summary', auth, requirePermission('audit_logs'), async (req, res) => {
    try {
        const { days = 7 } = req.query;
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - parseInt(days));

        // Tổng số access logs
        const [totalResult] = await db.execute(
            'SELECT COUNT(*) as total FROM access_logs WHERE timestamp >= ?',
            [daysAgo]
        );

        // Access logs hôm nay
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const [todayResult] = await db.execute(
            'SELECT COUNT(*) as total FROM access_logs WHERE timestamp >= ?',
            [today]
        );

        // Top content được truy cập
        const [topContentResult] = await db.execute(`
            SELECT 
                c.filename,
                c.original_filename,
                COUNT(*) as access_count
            FROM access_logs al
            LEFT JOIN content c ON al.content_id = c.id
            WHERE al.timestamp >= ? AND al.content_id IS NOT NULL
            GROUP BY al.content_id
            ORDER BY access_count DESC
            LIMIT 10
        `, [daysAgo]);

        // Top nodes được truy cập
        const [topNodesResult] = await db.execute(`
            SELECT 
                n.name as node_name,
                n.hostname,
                COUNT(*) as access_count
            FROM access_logs al
            LEFT JOIN cdn_nodes n ON al.node_id = n.id
            WHERE al.timestamp >= ?
            GROUP BY al.node_id
            ORDER BY access_count DESC
            LIMIT 10
        `, [daysAgo]);

        // Cache hit rate
        const [cacheHitResult] = await db.execute(`
            SELECT 
                COUNT(CASE WHEN cache_hit = 1 THEN 1 END) as cache_hits,
                COUNT(*) as total_requests
            FROM access_logs 
            WHERE timestamp >= ?
        `, [daysAgo]);

        const cacheHitRate = cacheHitResult[0].total_requests > 0 
            ? (cacheHitResult[0].cache_hits / cacheHitResult[0].total_requests * 100).toFixed(2)
            : 0;

        // Average response time
        const [avgResponseResult] = await db.execute(`
            SELECT AVG(response_time_ms) as avg_response_time
            FROM access_logs 
            WHERE timestamp >= ? AND response_time_ms IS NOT NULL
        `, [daysAgo]);

        res.json({
            success: true,
            data: {
                total_access_logs: totalResult[0].total,
                today_access_logs: todayResult[0].total,
                top_content: topContentResult,
                top_nodes: topNodesResult,
                cache_hit_rate: parseFloat(cacheHitRate),
                avg_response_time: avgResponseResult[0].avg_response_time || 0
            }
        });

    } catch (error) {
        console.error('Error fetching access logs summary:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch access logs summary'
        });
    }
});

// GET /api/access-logs/analytics - Phân tích chi tiết
router.get('/analytics', auth, requirePermission('audit_logs'), async (req, res) => {
    try {
        const { days = 7, group_by = 'hour' } = req.query;
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - parseInt(days));

        let timeFormat, groupByClause;

        if (group_by === 'hour') {
            timeFormat = '%Y-%m-%d %H:00:00';
            groupByClause = 'DATE(timestamp), HOUR(timestamp)';
        } else if (group_by === 'day') {
            timeFormat = '%Y-%m-%d';
            groupByClause = 'DATE(timestamp)';
        } else {
            timeFormat = '%Y-%m-%d %H:00:00';
            groupByClause = 'DATE(timestamp), HOUR(timestamp)';
        }

        // Traffic theo thời gian
        const [trafficResult] = await db.execute(`
            SELECT 
                DATE_FORMAT(timestamp, ?) as time_period,
                COUNT(*) as request_count,
                AVG(response_time_ms) as avg_response_time,
                COUNT(CASE WHEN cache_hit = 1 THEN 1 END) as cache_hits,
                COUNT(CASE WHEN cache_hit = 0 THEN 1 END) as cache_misses
            FROM access_logs 
            WHERE timestamp >= ?
            GROUP BY ${groupByClause}
            ORDER BY timestamp
        `, [timeFormat, daysAgo]);

        // Traffic theo node
        const [nodeTrafficResult] = await db.execute(`
            SELECT 
                n.name as node_name,
                n.hostname,
                COUNT(*) as request_count,
                AVG(al.response_time_ms) as avg_response_time,
                COUNT(CASE WHEN al.cache_hit = 1 THEN 1 END) as cache_hits
            FROM access_logs al
            LEFT JOIN cdn_nodes n ON al.node_id = n.id
            WHERE al.timestamp >= ?
            GROUP BY al.node_id
            ORDER BY request_count DESC
        `, [daysAgo]);

        // Response status distribution
        const [statusResult] = await db.execute(`
            SELECT 
                response_status,
                COUNT(*) as count
            FROM access_logs 
            WHERE timestamp >= ?
            GROUP BY response_status
            ORDER BY count DESC
        `, [daysAgo]);

        res.json({
            success: true,
            data: {
                traffic_by_time: trafficResult,
                traffic_by_node: nodeTrafficResult,
                status_distribution: statusResult
            }
        });

    } catch (error) {
        console.error('Error fetching access logs analytics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch access logs analytics'
        });
    }
});

// POST /api/access-logs - Node gửi access log
router.post('/', async (req, res) => {
    try {
        const {
            node_id,
            content_id,
            client_ip,
            user_agent,
            request_method,
            request_url,
            response_status,
            response_size,
            response_time_ms,
            cache_hit
        } = req.body;

        // Validate required fields
        if (!node_id || !client_ip || !request_url) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: node_id, client_ip, request_url'
            });
        }

        const query = `
            INSERT INTO access_logs (
                node_id, content_id, client_ip, user_agent, 
                request_method, request_url, response_status, 
                response_size, response_time_ms, cache_hit
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const [result] = await db.execute(query, [
            node_id,
            content_id || null,
            client_ip,
            user_agent || null,
            request_method || 'GET',
            request_url,
            response_status || 200,
            response_size || null,
            response_time_ms || null,
            cache_hit ? 1 : 0
        ]);

        res.json({
            success: true,
            message: 'Access log recorded successfully',
            data: { id: result.insertId }
        });

    } catch (error) {
        console.error('Error recording access log:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to record access log'
        });
    }
});

// GET /api/access-logs/export - Export access logs
router.get('/export', auth, requirePermission('audit_logs'), async (req, res) => {
    try {
        const { format = 'csv' } = req.query;

        const query = `
            SELECT 
                al.timestamp,
                n.name as node_name,
                c.filename as content_filename,
                al.client_ip,
                al.request_method,
                al.request_url,
                al.response_status,
                al.response_size,
                al.response_time_ms,
                al.cache_hit
            FROM access_logs al
            LEFT JOIN cdn_nodes n ON al.node_id = n.id
            LEFT JOIN content c ON al.content_id = c.id
            ORDER BY al.timestamp DESC
            LIMIT 10000
        `;

        const [logs] = await db.execute(query);

        if (format === 'csv') {
            const csvHeader = 'Timestamp,Node,Content,Client IP,Method,URL,Status,Size,Response Time,Cache Hit\n';
            const csvData = logs.map(log => 
                `${log.timestamp},"${log.node_name || ''}","${log.content_filename || ''}","${log.client_ip}","${log.request_method}","${log.request_url}",${log.response_status},${log.response_size || ''},${log.response_time_ms || ''},${log.cache_hit ? 'Yes' : 'No'}`
            ).join('\n');

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=access-logs.csv');
            res.send(csvHeader + csvData);
        } else {
            res.json({
                success: true,
                data: logs
            });
        }

    } catch (error) {
        console.error('Error exporting access logs:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to export access logs'
        });
    }
});

module.exports = router; 