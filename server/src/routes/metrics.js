const express = require('express');
const { param, query } = require('express-validator');
const { auth, requirePermission } = require('../middleware/auth');
const NodeMetrics = require('../models/NodeMetrics');
const db = require('../config/database');

const router = express.Router();

// GET /api/metrics/overview - Lấy tổng quan hệ thống
router.get('/overview', auth, requirePermission('monitor'), async (req, res) => {
    try {
        const overview = await NodeMetrics.getSystemOverview();
        
        res.json({
            success: true,
            data: overview
        });
    } catch (error) {
        console.error('Get metrics overview error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch metrics overview'
        });
    }
});

// Helper function to calculate system health score
function calculateHealthScore(overview) {
    let score = 100;
    
    // Deduct points for high error rates
    if (overview.avg_error_rate > 5) {
        score -= 20;
    } else if (overview.avg_error_rate > 2) {
        score -= 10;
    }
    
    // Deduct points for high CPU usage
    if (overview.avg_cpu_usage > 90) {
        score -= 15;
    } else if (overview.avg_cpu_usage > 80) {
        score -= 10;
    }
    
    // Deduct points for high memory usage
    if (overview.avg_memory_usage > 90) {
        score -= 15;
    } else if (overview.avg_memory_usage > 80) {
        score -= 10;
    }
    
    // Deduct points for offline nodes
    const offlinePercentage = (overview.offline_nodes / overview.total_nodes) * 100;
    if (offlinePercentage > 20) {
        score -= 20;
    } else if (offlinePercentage > 10) {
        score -= 10;
    }
    
    // Add points for good cache hit rate
    if (overview.avg_cache_hit_rate > 90) {
        score += 10;
    } else if (overview.avg_cache_hit_rate > 80) {
        score += 5;
    }
    
    return Math.max(0, Math.min(100, score));
}

// GET /api/metrics/dashboard - Lấy dữ liệu chi tiết cho Dashboard
router.get('/dashboard', auth, requirePermission('monitor'), async (req, res) => {
    try {
        const overview = await NodeMetrics.getSystemOverview();
        
        // Get recent activities from alerts
        const recentActivitiesQuery = `
            SELECT 
                id,
                alert_type as type,
                message,
                created_at as timestamp,
                node_id
            FROM alerts 
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
            ORDER BY created_at DESC 
            LIMIT 10
        `;
        const [activitiesResult] = await db.execute(recentActivitiesQuery);
        
        // Get top performing nodes
        const topNodesQuery = `
            SELECT 
                n.id,
                n.name,
                n.status,
                n.location,
                AVG(nm.cpu_usage) as avg_cpu,
                AVG(nm.memory_usage) as avg_memory,
                AVG(nm.response_time_ms) as avg_response_time,
                AVG(nm.cache_hit_rate) as avg_cache_hit_rate
            FROM cdn_nodes n
            LEFT JOIN node_metrics nm ON n.id = nm.node_id
            WHERE nm.timestamp >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
            GROUP BY n.id, n.name, n.status, n.location
            ORDER BY avg_cache_hit_rate DESC
            LIMIT 5
        `;
        const [topNodesResult] = await db.execute(topNodesQuery);
        
        // Get system health score
        const healthScore = calculateHealthScore(overview);
        
        res.json({
            success: true,
            data: {
                overview,
                recentActivities: activitiesResult,
                topNodes: topNodesResult,
                healthScore,
                lastUpdated: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Get dashboard data error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard data'
        });
    }
});

// GET /api/metrics/node/:nodeId - Lấy metrics cho node cụ thể
router.get('/node/:nodeId', auth, requirePermission('monitor'), async (req, res) => {
    try {
        const { nodeId } = req.params;
        const { limit = 100, startTime, endTime } = req.query;
        
        let metrics;
        if (startTime && endTime) {
            metrics = await NodeMetrics.getMetricsByTimeRange(nodeId, startTime, endTime);
        } else {
            metrics = await NodeMetrics.findByNodeId(nodeId, parseInt(limit));
        }
        
        res.json({
            success: true,
            data: {
                nodeId,
                metrics,
                count: metrics.length
            }
        });
    } catch (error) {
        console.error('Get node metrics error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch node metrics'
        });
    }
});

// GET /api/metrics/node/:nodeId/latest - Lấy metrics mới nhất cho node
router.get('/node/:nodeId/latest', auth, requirePermission('monitor'), async (req, res) => {
    try {
        const { nodeId } = req.params;
        const latestMetrics = await NodeMetrics.getLatestByNodeId(nodeId);
        
        res.json({
            success: true,
            data: latestMetrics
        });
    } catch (error) {
        console.error('Get latest metrics error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch latest metrics'
        });
    }
});

// GET /api/metrics/node/:nodeId/aggregated - Lấy metrics tổng hợp
router.get('/node/:nodeId/aggregated', auth, requirePermission('monitor'), async (req, res) => {
    try {
        const { nodeId } = req.params;
        const { interval = '1 hour' } = req.query;
        
        const aggregatedMetrics = await NodeMetrics.getAggregatedMetrics(nodeId, interval);
        
        res.json({
            success: true,
            data: {
                nodeId,
                interval,
                metrics: aggregatedMetrics
            }
        });
    } catch (error) {
        console.error('Get aggregated metrics error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch aggregated metrics'
        });
    }
});

// GET /api/metrics/node/:nodeId/trends - Lấy trends performance
router.get('/node/:nodeId/trends', auth, requirePermission('monitor'), async (req, res) => {
    try {
        const { nodeId } = req.params;
        const { days = 7 } = req.query;
        
        const trends = await NodeMetrics.getPerformanceTrends(nodeId, parseInt(days));
        
        res.json({
            success: true,
            data: {
                nodeId,
                days: parseInt(days),
                trends
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

// GET /api/metrics/top/:metric - Lấy top nodes theo metric
router.get('/top/:metric', auth, requirePermission('monitor'), async (req, res) => {
    try {
        const { metric } = req.params;
        const { limit = 10 } = req.query;
        
        const topNodes = await NodeMetrics.getTopNodesByMetric(metric, parseInt(limit));
        
        res.json({
            success: true,
            data: {
                metric,
                limit: parseInt(limit),
                nodes: topNodes
            }
        });
    } catch (error) {
        console.error('Get top nodes error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch top nodes'
        });
    }
});

// GET /api/metrics/anomaly/:nodeId - Phát hiện anomaly
router.get('/anomaly/:nodeId', auth, requirePermission('monitor'), async (req, res) => {
    try {
        const { nodeId } = req.params;
        const { threshold = 2 } = req.query;
        
        const anomalies = await NodeMetrics.getAnomalyDetection(nodeId, parseFloat(threshold));
        
        res.json({
            success: true,
            data: {
                nodeId,
                threshold: parseFloat(threshold),
                anomalies
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

// GET /api/metrics/summary - Lấy summary metrics
router.get('/summary', auth, requirePermission('monitor'), async (req, res) => {
    try {
        const summary = await NodeMetrics.getMetricsSummary();
        
        res.json({
            success: true,
            data: summary
        });
    } catch (error) {
        console.error('Get metrics summary error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch metrics summary'
        });
    }
});

// GET /api/metrics/dashboard - Lấy dữ liệu chi tiết cho Dashboard
router.get('/dashboard', auth, requirePermission('monitor'), async (req, res) => {
    try {
        const overview = await NodeMetrics.getSystemOverview();
        
        // Get recent activities from alerts
        const recentActivitiesQuery = `
            SELECT 
                id,
                alert_type as type,
                message,
                created_at as timestamp,
                node_id
            FROM alerts 
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
            ORDER BY created_at DESC 
            LIMIT 10
        `;
        const [activitiesResult] = await db.execute(recentActivitiesQuery);
        
        // Get top performing nodes
        const topNodesQuery = `
            SELECT 
                n.id,
                n.name,
                n.status,
                n.location,
                AVG(nm.cpu_usage) as avg_cpu,
                AVG(nm.memory_usage) as avg_memory,
                AVG(nm.response_time_ms) as avg_response_time,
                AVG(nm.cache_hit_rate) as avg_cache_hit_rate
            FROM cdn_nodes n
            LEFT JOIN node_metrics nm ON n.id = nm.node_id
            WHERE nm.timestamp >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
            GROUP BY n.id, n.name, n.status, n.location
            ORDER BY avg_cache_hit_rate DESC
            LIMIT 5
        `;
        const [topNodesResult] = await db.execute(topNodesQuery);
        
        // Get system health score
        const healthScore = calculateHealthScore(overview);
        
        res.json({
            success: true,
            data: {
                overview,
                recentActivities: activitiesResult,
                topNodes: topNodesResult,
                healthScore,
                lastUpdated: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Get dashboard data error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard data'
        });
    }
});

module.exports = router; 