const express = require('express');
const { auth, requirePermission } = require('../middleware/auth');
const NodeMetrics = require('../models/NodeMetrics');
const db = require('../config/database');

const router = express.Router();

// GET /api/analytics/performance-trends - Performance trends over time
router.get('/performance-trends', auth, requirePermission('monitor'), async (req, res) => {
    try {
        const { days = 7, nodeId, metric = 'all' } = req.query;
        
        let query = `
            SELECT 
                DATE(timestamp) as date,
                AVG(cpu_usage) as avg_cpu,
                AVG(memory_usage) as avg_memory,
                AVG(disk_usage) as avg_disk,
                AVG(response_time_ms) as avg_response_time,
                AVG(error_rate) as avg_error_rate,
                AVG(cache_hit_rate) as avg_cache_hit_rate,
                SUM(network_in_mbps) as total_network_in,
                SUM(network_out_mbps) as total_network_out,
                COUNT(*) as data_points,
                MAX(cpu_usage) as max_cpu,
                MAX(memory_usage) as max_memory,
                MIN(cpu_usage) as min_cpu,
                MIN(memory_usage) as min_memory
            FROM node_metrics 
            WHERE timestamp >= DATE_SUB(NOW(), INTERVAL ? DAY)
        `;
        
        const params = [parseInt(days)];
        
        if (nodeId) {
            query += ' AND node_id = ?';
            params.push(parseInt(nodeId));
        }
        
        query += ' GROUP BY DATE(timestamp) ORDER BY date ASC';
        
        const [result] = await db.execute(query, params);
        
        // Transform data for charts
        const trends = result.map(row => ({
            date: row.date,
            cpu: {
                avg: parseFloat(row.avg_cpu || 0),
                max: parseFloat(row.max_cpu || 0),
                min: parseFloat(row.min_cpu || 0)
            },
            memory: {
                avg: parseFloat(row.avg_memory || 0),
                max: parseFloat(row.max_memory || 0),
                min: parseFloat(row.min_memory || 0)
            },
            disk: parseFloat(row.avg_disk || 0),
            responseTime: parseFloat(row.avg_response_time || 0),
            errorRate: parseFloat(row.avg_error_rate || 0),
            cacheHitRate: parseFloat(row.avg_cache_hit_rate || 0),
            networkIn: parseFloat(row.total_network_in || 0),
            networkOut: parseFloat(row.total_network_out || 0),
            dataPoints: parseInt(row.data_points || 0)
        }));
        
        res.json({
            success: true,
            data: {
                trends,
                period: `${days} days`,
                nodeId: nodeId || 'all',
                metric: metric
            }
        });
    } catch (error) {
        console.error('Get performance trends error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch performance trends'
        });
    }
});

// GET /api/analytics/node-comparison - Compare nodes performance
router.get('/node-comparison', auth, requirePermission('monitor'), async (req, res) => {
    try {
        const { period = 7, metric = 'cpu' } = req.query;
        
        const query = `
            SELECT 
                n.id as node_id,
                n.name as node_name,
                n.location,
                n.node_type,
                n.status,
                AVG(nm.cpu_usage) as avg_cpu,
                AVG(nm.memory_usage) as avg_memory,
                AVG(nm.disk_usage) as avg_disk,
                AVG(nm.response_time_ms) as avg_response_time,
                AVG(nm.error_rate) as avg_error_rate,
                AVG(nm.cache_hit_rate) as avg_cache_hit_rate,
                SUM(nm.network_in_mbps) as total_network_in,
                SUM(nm.network_out_mbps) as total_network_out,
                COUNT(nm.id) as metrics_count,
                MAX(nm.cpu_usage) as max_cpu,
                MAX(nm.memory_usage) as max_memory,
                MIN(nm.cpu_usage) as min_cpu,
                MIN(nm.memory_usage) as min_memory
            FROM cdn_nodes n
            LEFT JOIN node_metrics nm ON n.id = nm.node_id 
                AND nm.timestamp >= DATE_SUB(NOW(), INTERVAL ? DAY)
            GROUP BY n.id, n.name, n.location, n.node_type, n.status
            ORDER BY avg_cpu DESC
        `;
        
        const [result] = await db.execute(query, [parseInt(period)]);
        
        const nodes = result.map(row => ({
            nodeId: row.node_id,
            nodeName: row.node_name,
            location: row.location,
            nodeType: row.node_type,
            status: row.status,
            metrics: {
                avgCpu: parseFloat(row.avg_cpu || 0),
                avgMemory: parseFloat(row.avg_memory || 0),
                avgDisk: parseFloat(row.avg_disk || 0),
                avgResponseTime: parseFloat(row.avg_response_time || 0),
                avgErrorRate: parseFloat(row.avg_error_rate || 0),
                avgCacheHitRate: parseFloat(row.avg_cache_hit_rate || 0),
                totalNetworkIn: parseFloat(row.total_network_in || 0),
                totalNetworkOut: parseFloat(row.total_network_out || 0),
                maxCpu: parseFloat(row.max_cpu || 0),
                maxMemory: parseFloat(row.max_memory || 0),
                minCpu: parseFloat(row.min_cpu || 0),
                minMemory: parseFloat(row.min_memory || 0)
            },
            metricsCount: parseInt(row.metrics_count || 0),
            performance: {
                score: calculatePerformanceScore(row),
                grade: getPerformanceGrade(calculatePerformanceScore(row))
            }
        }));
        
        res.json({
            success: true,
            data: {
                nodes,
                period: `${period} days`,
                metric: metric
            }
        });
    } catch (error) {
        console.error('Get node comparison error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch node comparison'
        });
    }
});

// GET /api/analytics/geographic-distribution - Geographic performance distribution
router.get('/geographic-distribution', auth, requirePermission('monitor'), async (req, res) => {
    try {
        const { period = 7 } = req.query;
        
        const query = `
            SELECT 
                n.location,
                n.region,
                n.country,
                COUNT(DISTINCT n.id) as node_count,
                AVG(nm.cpu_usage) as avg_cpu,
                AVG(nm.memory_usage) as avg_memory,
                AVG(nm.disk_usage) as avg_disk,
                AVG(nm.response_time_ms) as avg_response_time,
                AVG(nm.error_rate) as avg_error_rate,
                AVG(nm.cache_hit_rate) as avg_cache_hit_rate,
                SUM(nm.network_in_mbps) as total_network_in,
                SUM(nm.network_out_mbps) as total_network_out,
                COUNT(nm.id) as metrics_count
            FROM cdn_nodes n
            LEFT JOIN node_metrics nm ON n.id = nm.node_id 
                AND nm.timestamp >= DATE_SUB(NOW(), INTERVAL ? DAY)
            GROUP BY n.location, n.region, n.country
            ORDER BY node_count DESC, avg_cpu DESC
        `;
        
        const [result] = await db.execute(query, [parseInt(period)]);
        
        const locations = result.map(row => ({
            location: row.location,
            region: row.region || 'Unknown',
            country: row.country || 'Unknown',
            nodeCount: parseInt(row.node_count || 0),
            metrics: {
                avgCpu: parseFloat(row.avg_cpu || 0),
                avgMemory: parseFloat(row.avg_memory || 0),
                avgDisk: parseFloat(row.avg_disk || 0),
                avgResponseTime: parseFloat(row.avg_response_time || 0),
                avgErrorRate: parseFloat(row.avg_error_rate || 0),
                avgCacheHitRate: parseFloat(row.avg_cache_hit_rate || 0),
                totalNetworkIn: parseFloat(row.total_network_in || 0),
                totalNetworkOut: parseFloat(row.total_network_out || 0)
            },
            metricsCount: parseInt(row.metrics_count || 0),
            performance: {
                score: calculateLocationPerformanceScore(row),
                grade: getPerformanceGrade(calculateLocationPerformanceScore(row))
            }
        }));
        
        res.json({
            success: true,
            data: {
                locations,
                period: `${period} days`
            }
        });
    } catch (error) {
        console.error('Get geographic distribution error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch geographic distribution'
        });
    }
});

// GET /api/analytics/real-time-metrics - Real-time metrics for charts
router.get('/real-time-metrics', auth, requirePermission('monitor'), async (req, res) => {
    try {
        const { hours = 24, interval = 1 } = req.query;
        
        const query = `
            SELECT 
                DATE_FORMAT(timestamp, '%Y-%m-%d %H:00:00') as time_bucket,
                AVG(cpu_usage) as avg_cpu,
                AVG(memory_usage) as avg_memory,
                AVG(disk_usage) as avg_disk,
                AVG(response_time_ms) as avg_response_time,
                AVG(error_rate) as avg_error_rate,
                AVG(cache_hit_rate) as avg_cache_hit_rate,
                SUM(network_in_mbps) as total_network_in,
                SUM(network_out_mbps) as total_network_out,
                COUNT(DISTINCT node_id) as active_nodes,
                MAX(cpu_usage) as max_cpu,
                MAX(memory_usage) as max_memory,
                MIN(cpu_usage) as min_cpu,
                MIN(memory_usage) as min_memory
            FROM node_metrics 
            WHERE timestamp >= DATE_SUB(NOW(), INTERVAL ? HOUR)
            GROUP BY time_bucket
            ORDER BY time_bucket ASC
        `;
        
        const [result] = await db.execute(query, [parseInt(hours)]);
        
        const metrics = result.map(row => ({
            timestamp: row.time_bucket,
            cpu: {
                avg: parseFloat(row.avg_cpu || 0),
                max: parseFloat(row.max_cpu || 0),
                min: parseFloat(row.min_cpu || 0)
            },
            memory: {
                avg: parseFloat(row.avg_memory || 0),
                max: parseFloat(row.max_memory || 0),
                min: parseFloat(row.min_memory || 0)
            },
            disk: parseFloat(row.avg_disk || 0),
            responseTime: parseFloat(row.avg_response_time || 0),
            errorRate: parseFloat(row.avg_error_rate || 0),
            cacheHitRate: parseFloat(row.avg_cache_hit_rate || 0),
            networkIn: parseFloat(row.total_network_in || 0),
            networkOut: parseFloat(row.total_network_out || 0),
            activeNodes: parseInt(row.active_nodes || 0)
        }));
        
        res.json({
            success: true,
            data: {
                metrics,
                period: `${hours} hours`,
                interval: `${interval} hour(s)`
            }
        });
    } catch (error) {
        console.error('Get real-time metrics error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch real-time metrics'
        });
    }
});

// GET /api/analytics/anomaly-detection - Anomaly detection results
router.get('/anomaly-detection', auth, requirePermission('monitor'), async (req, res) => {
    try {
        const { nodeId, threshold = 2, hours = 24 } = req.query;
        
        // Simplified anomaly detection query
        let query = `
            SELECT 
                nm.*,
                n.name as node_name,
                n.location,
                n.node_type,
                CASE 
                    WHEN nm.cpu_usage > 80 THEN 'high_cpu'
                    WHEN nm.memory_usage > 85 THEN 'high_memory'
                    WHEN nm.disk_usage > 90 THEN 'high_disk'
                    WHEN nm.error_rate > 5 THEN 'high_error'
                    WHEN nm.response_time_ms > 100 THEN 'high_response_time'
                    ELSE 'normal'
                END as anomaly_type,
                CASE 
                    WHEN nm.cpu_usage > 90 OR nm.memory_usage > 95 OR nm.disk_usage > 95 OR nm.error_rate > 10 THEN 'critical'
                    WHEN nm.cpu_usage > 80 OR nm.memory_usage > 85 OR nm.disk_usage > 90 OR nm.error_rate > 5 THEN 'warning'
                    ELSE 'normal'
                END as severity
            FROM node_metrics nm
            JOIN cdn_nodes n ON nm.node_id = n.id
            WHERE nm.timestamp >= DATE_SUB(NOW(), INTERVAL ? HOUR)
        `;
        
        const params = [parseInt(hours)];
        
        if (nodeId) {
            query += ' AND nm.node_id = ?';
            params.push(parseInt(nodeId));
        }
        
        query += ' AND (nm.cpu_usage > 80 OR nm.memory_usage > 85 OR nm.disk_usage > 90 OR nm.error_rate > 5 OR nm.response_time_ms > 100) ORDER BY nm.timestamp DESC LIMIT 100';
        
        const [result] = await db.execute(query, params);
        
        const anomalies = result.map(row => ({
            timestamp: row.timestamp,
            nodeId: row.node_id,
            nodeName: row.node_name,
            location: row.location,
            nodeType: row.node_type,
            metrics: {
                cpuUsage: parseFloat(row.cpu_usage || 0),
                memoryUsage: parseFloat(row.memory_usage || 0),
                diskUsage: parseFloat(row.disk_usage || 0),
                errorRate: parseFloat(row.error_rate || 0),
                responseTime: parseFloat(row.response_time_ms || 0),
                cacheHitRate: parseFloat(row.cache_hit_rate || 0),
                networkIn: parseFloat(row.network_in_mbps || 0),
                networkOut: parseFloat(row.network_out_mbps || 0)
            },
            anomalyType: row.anomaly_type,
            severity: row.severity,
            description: getAnomalyDescription(row.anomaly_type, row.severity)
        }));
        
        res.json({
            success: true,
            data: {
                anomalies,
                threshold: parseFloat(threshold),
                period: `${hours} hours`
            }
        });
    } catch (error) {
        console.error('Get anomaly detection error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch anomaly detection'
        });
    }
});

// GET /api/analytics/summary - Analytics summary
router.get('/summary', auth, requirePermission('monitor'), async (req, res) => {
    try {
        // Get overall system analytics
        const [nodeCount] = await db.execute('SELECT COUNT(*) as count FROM cdn_nodes');
        const [metricsCount] = await db.execute('SELECT COUNT(*) as count FROM node_metrics WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 24 HOUR)');
        const [alertsCount] = await db.execute('SELECT COUNT(*) as count FROM alerts WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)');
        
        // Get performance averages
        const [performance] = await db.execute(`
            SELECT 
                AVG(cpu_usage) as avg_cpu,
                AVG(memory_usage) as avg_memory,
                AVG(disk_usage) as avg_disk,
                AVG(response_time_ms) as avg_response_time,
                AVG(error_rate) as avg_error_rate,
                AVG(cache_hit_rate) as avg_cache_hit_rate,
                MAX(cpu_usage) as max_cpu,
                MAX(memory_usage) as max_memory,
                MIN(cpu_usage) as min_cpu,
                MIN(memory_usage) as min_memory
            FROM node_metrics 
            WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
        `);
        
        // Get network statistics
        const [networkStats] = await db.execute(`
            SELECT 
                SUM(network_in_mbps) as total_network_in,
                SUM(network_out_mbps) as total_network_out,
                AVG(network_in_mbps) as avg_network_in,
                AVG(network_out_mbps) as avg_network_out
            FROM node_metrics 
            WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
        `);
        
        const summary = {
            nodes: {
                total: nodeCount[0].count,
                online: 0,
                offline: 0,
                maintenance: 0
            },
            metrics: {
                total: metricsCount[0].count,
                last24h: metricsCount[0].count
            },
            alerts: {
                total: alertsCount[0].count,
                last24h: alertsCount[0].count
            },
            performance: {
                avgCpu: parseFloat(performance[0].avg_cpu || 0),
                avgMemory: parseFloat(performance[0].avg_memory || 0),
                avgDisk: parseFloat(performance[0].avg_disk || 0),
                avgResponseTime: parseFloat(performance[0].avg_response_time || 0),
                avgErrorRate: parseFloat(performance[0].avg_error_rate || 0),
                avgCacheHitRate: parseFloat(performance[0].avg_cache_hit_rate || 0),
                maxCpu: parseFloat(performance[0].max_cpu || 0),
                maxMemory: parseFloat(performance[0].max_memory || 0),
                minCpu: parseFloat(performance[0].min_cpu || 0),
                minMemory: parseFloat(performance[0].min_memory || 0)
            },
            network: {
                totalIn: parseFloat(networkStats[0].total_network_in || 0),
                totalOut: parseFloat(networkStats[0].total_network_out || 0),
                avgIn: parseFloat(networkStats[0].avg_network_in || 0),
                avgOut: parseFloat(networkStats[0].avg_network_out || 0)
            }
        };
        
        // Get node status counts
        const [statusCounts] = await db.execute(`
            SELECT status, COUNT(*) as count 
            FROM cdn_nodes 
            GROUP BY status
        `);
        
        statusCounts.forEach(status => {
            summary.nodes[status.status] = status.count;
        });
        
        res.json({
            success: true,
            data: summary
        });
    } catch (error) {
        console.error('Get analytics summary error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get analytics summary'
        });
    }
});

// POST /api/analytics/export - Export analytics data
router.post('/export', auth, requirePermission('monitor'), async (req, res) => {
    try {
        const { format, dataType, period, filters } = req.body;
        
        // Calculate date range based on period
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(period));
        
        let query = '';
        let params = [];
        
        switch (dataType) {
            case 'performance':
                query = `
                    SELECT 
                        DATE(timestamp) as date,
                        AVG(cpu_usage) as avg_cpu,
                        AVG(memory_usage) as avg_memory,
                        AVG(disk_usage) as avg_disk,
                        AVG(response_time_ms) as avg_response_time,
                        AVG(error_rate) as avg_error_rate,
                        AVG(cache_hit_rate) as avg_cache_hit_rate,
                        SUM(network_in_mbps) as total_network_in,
                        SUM(network_out_mbps) as total_network_out,
                        COUNT(*) as data_points
                    FROM node_metrics 
                    WHERE timestamp >= ? AND timestamp <= ?
                `;
                params = [startDate, endDate];
                
                if (filters?.nodeId) {
                    query += ' AND node_id = ?';
                    params.push(parseInt(filters.nodeId));
                }
                
                query += ' GROUP BY DATE(timestamp) ORDER BY date ASC';
                break;
                
            case 'geographic':
                query = `
                    SELECT 
                        n.location,
                        n.region,
                        n.country,
                        COUNT(DISTINCT n.id) as node_count,
                        AVG(nm.cpu_usage) as avg_cpu,
                        AVG(nm.memory_usage) as avg_memory,
                        AVG(nm.disk_usage) as avg_disk,
                        AVG(nm.response_time_ms) as avg_response_time,
                        AVG(nm.error_rate) as avg_error_rate,
                        AVG(nm.cache_hit_rate) as avg_cache_hit_rate,
                        SUM(nm.network_in_mbps) as total_network_in,
                        SUM(nm.network_out_mbps) as total_network_out
                    FROM cdn_nodes n
                    LEFT JOIN node_metrics nm ON n.id = nm.node_id 
                        AND nm.timestamp >= ? AND nm.timestamp <= ?
                    GROUP BY n.location, n.region, n.country
                    ORDER BY node_count DESC
                `;
                params = [startDate, endDate];
                break;
                
            case 'realtime':
                query = `
                    SELECT 
                        DATE_FORMAT(timestamp, '%Y-%m-%d %H:00:00') as time_bucket,
                        AVG(cpu_usage) as avg_cpu,
                        AVG(memory_usage) as avg_memory,
                        AVG(disk_usage) as avg_disk,
                        AVG(response_time_ms) as avg_response_time,
                        AVG(error_rate) as avg_error_rate,
                        AVG(cache_hit_rate) as avg_cache_hit_rate,
                        SUM(network_in_mbps) as total_network_in,
                        SUM(network_out_mbps) as total_network_out,
                        COUNT(DISTINCT node_id) as active_nodes
                    FROM node_metrics 
                    WHERE timestamp >= ? AND timestamp <= ?
                    GROUP BY time_bucket
                    ORDER BY time_bucket ASC
                `;
                params = [startDate, endDate];
                break;
                
            case 'anomalies':
                query = `
                    SELECT 
                        a.id,
                        a.alert_type,
                        a.severity,
                        a.message,
                        a.created_at,
                        n.name as node_name,
                        n.location,
                        n.node_type
                    FROM alerts a
                    LEFT JOIN cdn_nodes n ON a.node_id = n.id
                    WHERE a.created_at >= ? AND a.created_at <= ?
                    ORDER BY a.created_at DESC
                `;
                params = [startDate, endDate];
                break;
        }
        
        const [result] = await db.execute(query, params);
        
        // Generate CSV content
        let csvContent = '';
        if (result.length > 0) {
            const headers = Object.keys(result[0]);
            csvContent += headers.join(',') + '\n';
            
            result.forEach(row => {
                const values = headers.map(header => {
                    const value = row[header];
                    return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
                });
                csvContent += values.join(',') + '\n';
            });
        }
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="cdn-analytics-${dataType}-${period}days.csv"`);
        res.send(csvContent);
        
    } catch (error) {
        console.error('Export analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to export analytics data'
        });
    }
});

// GET /api/analytics/user-access - Get user access by region
router.get('/user-access', auth, requirePermission('monitor'), async (req, res) => {
    try {
        const { period = 7 } = req.query;
        
        // Simulate user access data by region
        const userAccessData = [
            {
                region: 'Ho Chi Minh City',
                country: 'Vietnam',
                userCount: 15420,
                bandwidthUsage: 1250.5,
                avgResponseTime: 45.2,
                peakHours: '19:00-22:00',
                growthRate: 12.5
            },
            {
                region: 'Hanoi',
                country: 'Vietnam',
                userCount: 12850,
                bandwidthUsage: 980.3,
                avgResponseTime: 52.1,
                peakHours: '18:00-21:00',
                growthRate: 8.7
            },
            {
                region: 'Da Nang',
                country: 'Vietnam',
                userCount: 6850,
                bandwidthUsage: 520.8,
                avgResponseTime: 38.9,
                peakHours: '20:00-23:00',
                growthRate: 15.2
            },
            {
                region: 'Can Tho',
                country: 'Vietnam',
                userCount: 4320,
                bandwidthUsage: 320.1,
                avgResponseTime: 41.5,
                peakHours: '19:30-22:30',
                growthRate: 18.9
            },
            {
                region: 'Hai Phong',
                country: 'Vietnam',
                userCount: 3890,
                bandwidthUsage: 285.7,
                avgResponseTime: 47.8,
                peakHours: '18:30-21:30',
                growthRate: 11.3
            }
        ];
        
        res.json({
            success: true,
            data: {
                userAccess: userAccessData,
                period: `${period} days`,
                totalUsers: userAccessData.reduce((sum, region) => sum + region.userCount, 0),
                totalBandwidth: userAccessData.reduce((sum, region) => sum + region.bandwidthUsage, 0),
                avgResponseTime: userAccessData.reduce((sum, region) => sum + region.avgResponseTime, 0) / userAccessData.length
            }
        });
    } catch (error) {
        console.error('Get user access error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user access data'
        });
    }
});

// Helper functions
function calculatePerformanceScore(row) {
    const cpuScore = 100 - parseFloat(row.avg_cpu || 0);
    const memoryScore = 100 - parseFloat(row.avg_memory || 0);
    const errorScore = 100 - parseFloat(row.avg_error_rate || 0);
    const responseScore = Math.max(0, 100 - parseFloat(row.avg_response_time || 0) / 10);
    
    return (cpuScore + memoryScore + errorScore + responseScore) / 4;
}

function calculateLocationPerformanceScore(row) {
    const cpuScore = 100 - parseFloat(row.avg_cpu || 0);
    const memoryScore = 100 - parseFloat(row.avg_memory || 0);
    const errorScore = 100 - parseFloat(row.avg_error_rate || 0);
    const responseScore = Math.max(0, 100 - parseFloat(row.avg_response_time || 0) / 10);
    const nodeCountBonus = Math.min(20, parseInt(row.node_count || 0) * 2);
    
    return (cpuScore + memoryScore + errorScore + responseScore) / 4 + nodeCountBonus;
}

function getPerformanceGrade(score) {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
}

function getAnomalyDescription(anomalyType, severity) {
    const descriptions = {
        high_cpu: 'High CPU usage detected',
        high_memory: 'High memory usage detected',
        high_disk: 'High disk usage detected',
        high_error: 'High error rate detected',
        high_response_time: 'High response time detected'
    };
    
    const severityText = severity === 'critical' ? 'Critical' : severity === 'warning' ? 'Warning' : 'Info';
    return `${severityText}: ${descriptions[anomalyType] || 'Anomaly detected'}`;
}

module.exports = router; 