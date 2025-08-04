const express = require('express');
const { body, param, query } = require('express-validator');
const { auth, requireRole, requirePermission } = require('../middleware/auth');
const CdnNode = require('../models/CdnNode');
const db = require('../config/database');

const router = express.Router();

// Validation middleware
const createNodeValidation = [
    body('name').isLength({ min: 2 }).withMessage('Node name must be at least 2 characters'),
    body('hostname').isLength({ min: 2 }).withMessage('Hostname must be at least 2 characters'),
    body('ip_address').isIP().withMessage('Please enter a valid IP address'),
    body('location').optional().isLength({ min: 2 }).withMessage('Location must be at least 2 characters'),
    body('region').optional().isLength({ min: 2 }).withMessage('Region must be at least 2 characters'),
    body('country').optional().isLength({ min: 2 }).withMessage('Country must be at least 2 characters'),
    body('node_type').optional().isIn(['edge', 'origin', 'cache']).withMessage('Invalid node type'),
    body('capacity_gb').optional().isInt({ min: 1 }).withMessage('Capacity must be a positive integer'),
    body('bandwidth_mbps').optional().isInt({ min: 1 }).withMessage('Bandwidth must be a positive integer')
];

const updateNodeValidation = [
    param('id').isInt().withMessage('Invalid node ID'),
    body('name').optional().isLength({ min: 2 }).withMessage('Node name must be at least 2 characters'),
    body('hostname').optional().isLength({ min: 2 }).withMessage('Hostname must be at least 2 characters'),
    body('ip_address').optional().isIP().withMessage('Please enter a valid IP address'),
    body('status').optional().isIn(['online', 'offline', 'maintenance']).withMessage('Invalid status'),
    body('node_type').optional().isIn(['edge', 'origin', 'cache']).withMessage('Invalid node type')
];

// Routes
// GET /api/nodes - Lấy danh sách tất cả nodes
router.get('/', auth, requirePermission('view'), async (req, res) => {
    try {
        const { search, status, node_type, page = 1, limit = 20 } = req.query;
        
        let nodes;
        if (search) {
            nodes = await CdnNode.search(search);
        } else if (status) {
            nodes = await CdnNode.findByStatus(status);
        } else {
            nodes = await CdnNode.findAll();
        }
        
        // Filter by node_type if provided
        if (node_type) {
            nodes = nodes.filter(node => node.node_type === node_type);
        }
        
        // Pagination
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const paginatedNodes = nodes.slice(startIndex, endIndex);
        
        res.json({
            success: true,
            data: {
                nodes: paginatedNodes,
                pagination: {
                    current_page: parseInt(page),
                    total_pages: Math.ceil(nodes.length / limit),
                    total_items: nodes.length,
                    items_per_page: parseInt(limit)
                }
            }
        });
    } catch (error) {
        console.error('Get nodes error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch nodes'
        });
    }
});

// GET /api/nodes/stats/summary - Lấy thống kê tổng quan
router.get('/stats/summary', auth, requirePermission('view'), async (req, res) => {
    try {
        const nodes = await CdnNode.findAll();
        
        const stats = {
            total_nodes: nodes.length,
            online_nodes: nodes.filter(n => n.status === 'online').length,
            offline_nodes: nodes.filter(n => n.status === 'offline').length,
            maintenance_nodes: nodes.filter(n => n.status === 'maintenance').length,
            total_capacity: nodes.reduce((sum, n) => sum + (n.capacity_gb || 0), 0),
            total_bandwidth: nodes.reduce((sum, n) => sum + (n.bandwidth_mbps || 0), 0),
            by_type: {
                edge: nodes.filter(n => n.node_type === 'edge').length,
                origin: nodes.filter(n => n.node_type === 'origin').length,
                cache: nodes.filter(n => n.node_type === 'cache').length
            },
            by_region: {}
        };

        // Group by region
        nodes.forEach(node => {
            const region = node.region || 'Unknown';
            if (!stats.by_region[region]) {
                stats.by_region[region] = 0;
            }
            stats.by_region[region]++;
        });

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Get nodes stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch nodes statistics'
        });
    }
});

// GET /api/nodes/:id - Lấy thông tin node cụ thể
router.get('/:id', auth, requirePermission('view'), async (req, res) => {
    try {
        const { id } = req.params;
        const node = await CdnNode.findById(id);
        
        if (!node) {
            return res.status(404).json({
                success: false,
                message: 'Node not found'
            });
        }
        
        res.json({
            success: true,
            data: node
        });
    } catch (error) {
        console.error('Get node error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch node'
        });
    }
});

// POST /api/nodes - Tạo node mới
router.post('/', auth, requirePermission('create'), createNodeValidation, async (req, res) => {
    try {
        const nodeData = {
            ...req.body,
            created_by: req.user.id
        };
        
        const newNode = await CdnNode.create(nodeData);
        
        res.status(201).json({
            success: true,
            message: 'Node created successfully',
            data: newNode
        });
    } catch (error) {
        console.error('Create node error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create node'
        });
    }
});

// PUT /api/nodes/:id - Cập nhật node
router.put('/:id', auth, requirePermission('update'), updateNodeValidation, async (req, res) => {
    try {
        const { id } = req.params;
        const node = await CdnNode.findById(id);
        
        if (!node) {
            return res.status(404).json({
                success: false,
                message: 'Node not found'
            });
        }
        
        const updatedNode = await CdnNode.update(id, req.body);
        
        res.json({
            success: true,
            message: 'Node updated successfully',
            data: updatedNode
        });
    } catch (error) {
        console.error('Update node error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update node'
        });
    }
});

// DELETE /api/nodes/:id - Xóa node
router.delete('/:id', auth, requirePermission('delete'), async (req, res) => {
    try {
        const { id } = req.params;
        const node = await CdnNode.findById(id);
        
        if (!node) {
            return res.status(404).json({
                success: false,
                message: 'Node not found'
            });
        }
        
        await CdnNode.delete(id);
        
        res.json({
            success: true,
            message: 'Node deleted successfully'
        });
    } catch (error) {
        console.error('Delete node error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete node'
        });
    }
});

// GET /api/nodes/:id/performance - Lấy dữ liệu hiệu suất của node
router.get('/:id/performance', auth, requirePermission('view'), async (req, res) => {
    try {
        const { id } = req.params;
        const { hours = 24 } = req.query;

        const node = await CdnNode.findById(id);
        if (!node) {
            return res.status(404).json({
                success: false,
                message: 'Node not found'
            });
        }

        const NodeMetrics = require('../models/NodeMetrics');
        const metrics = await NodeMetrics.getPerformanceByNodeId(id, parseInt(hours));

        const latestMetrics = metrics.length > 0 ? metrics[0] : null;

        res.json({
            success: true,
            data: {
                node_id: parseInt(id),
                metrics: latestMetrics ? {
                    cpu_usage: latestMetrics.cpu_usage,
                    memory_usage: latestMetrics.memory_usage,
                    disk_usage: latestMetrics.disk_usage,
                    network_in: latestMetrics.network_in_mbps,
                    network_out: latestMetrics.network_out_mbps,
                    response_time: latestMetrics.response_time_ms,
                    cache_hit_rate: latestMetrics.cache_hit_rate,
                    connections: latestMetrics.active_connections,
                    timestamp: latestMetrics.timestamp
                } : {
                    cpu_usage: 0,
                    memory_usage: 0,
                    disk_usage: 0,
                    network_in: 0,
                    network_out: 0,
                    response_time: 0,
                    cache_hit_rate: 0,
                    connections: 0,
                    timestamp: new Date().toISOString()
                },
                alerts: [],
                last_updated: metrics.length > 0 ? metrics[0].timestamp : new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Get node performance error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch node performance data'
        });
    }
});

// GET /api/nodes/:id/metrics - Lấy dữ liệu metrics chi tiết
router.get('/:id/metrics', auth, requirePermission('view'), async (req, res) => {
    try {
        const { id } = req.params;
        const { hours = 24, interval = '1h' } = req.query;

        const node = await CdnNode.findById(id);
        if (!node) {
            return res.status(404).json({
                success: false,
                message: 'Node not found'
            });
        }

        const NodeMetrics = require('../models/NodeMetrics');
        const metrics = await NodeMetrics.getMetricsByNodeId(id, parseInt(hours), interval);

        res.json({
            success: true,
            data: {
                node_id: parseInt(id),
                metrics: metrics,
                time_range: `${hours}h`,
                interval: interval
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

// POST /api/nodes/:id/status - Cập nhật trạng thái node
router.post('/:id/status', auth, requirePermission('update'), async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['online', 'offline', 'maintenance'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be online, offline, or maintenance'
            });
        }

        const node = await CdnNode.findById(id);
        if (!node) {
            return res.status(404).json({
                success: false,
                message: 'Node not found'
            });
        }

        await CdnNode.updateStatus(id, status);

        res.json({
            success: true,
            message: `Node status updated to ${status}`,
            data: { nodeId: id, status }
        });
    } catch (error) {
        console.error('Update node status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update node status'
        });
    }
});

// GET /api/nodes/heartbeat/status - Lấy trạng thái heartbeat service
router.get('/heartbeat/status', auth, requirePermission('view'), async (req, res) => {
    try {
        const NodeHeartbeatService = require('../services/nodeHeartbeatService');
        const heartbeatService = new NodeHeartbeatService();
        
        const status = heartbeatService.getNodeStatus();
        
        res.json({
            success: true,
            data: {
                serviceRunning: heartbeatService.isRunning,
                nodeCount: status.length,
                nodes: status
            }
        });
    } catch (error) {
        console.error('Get heartbeat status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get heartbeat status'
        });
    }
});

// POST /api/nodes/heartbeat/test/offline - Test force node offline
router.post('/heartbeat/test/offline/:id', auth, requirePermission('system_admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const NodeHeartbeatService = require('../services/nodeHeartbeatService');
        const heartbeatService = new NodeHeartbeatService();
        
        await heartbeatService.forceNodeOffline(parseInt(id));
        
        res.json({
            success: true,
            message: `Node ${id} forced offline for testing`
        });
    } catch (error) {
        console.error('Force node offline error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to force node offline'
        });
    }
});

// POST /api/nodes/heartbeat/test/online - Test force node online
router.post('/heartbeat/test/online/:id', auth, requirePermission('system_admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const NodeHeartbeatService = require('../services/nodeHeartbeatService');
        const heartbeatService = new NodeHeartbeatService();
        
        await heartbeatService.forceNodeOnline(parseInt(id));
        
        res.json({
            success: true,
            message: `Node ${id} forced online for testing`
        });
    } catch (error) {
        console.error('Force node online error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to force node online'
        });
    }
});

// GET /api/nodes/summary/status - Lấy tổng quan trạng thái nodes
router.get('/summary/status', auth, requirePermission('view'), async (req, res) => {
    try {
        const statusSummary = await CdnNode.getStatusSummary();
        const locationSummary = await CdnNode.getLocationSummary();
        const nodeTypes = await CdnNode.getNodeTypes();
        
        res.json({
            success: true,
            data: {
                statusSummary,
                locationSummary,
                nodeTypes
            }
        });
    } catch (error) {
        console.error('Get nodes summary error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch nodes summary'
        });
    }
});

// GET /api/nodes/:id/status - Lấy trạng thái node
router.get('/:id/status', auth, requirePermission('view'), async (req, res) => {
    try {
        const { id } = req.params;
        
        const node = await CdnNode.findById(id);
        if (!node) {
            return res.status(404).json({
                success: false,
                message: 'Node not found'
            });
        }
        
        // Import NodeMetrics here to avoid circular dependency
        const NodeMetrics = require('../models/NodeMetrics');
        const latestMetrics = await NodeMetrics.getLatestByNodeId(id);
        
        res.json({
            success: true,
            data: {
                node,
                metrics: latestMetrics,
                timestamp: new Date()
            }
        });
    } catch (error) {
        console.error('Get node status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch node status'
        });
    }
});

// GET /api/nodes/online - Lấy danh sách nodes online
router.get('/status/online', auth, requirePermission('view'), async (req, res) => {
    try {
        const onlineNodes = await CdnNode.getOnlineNodes();
        
        res.json({
            success: true,
            data: onlineNodes
        });
    } catch (error) {
        console.error('Get online nodes error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch online nodes'
        });
    }
});

// GET /api/nodes/offline - Lấy danh sách nodes offline
router.get('/status/offline', auth, requirePermission('view'), async (req, res) => {
    try {
        const offlineNodes = await CdnNode.getOfflineNodes();
        
        res.json({
            success: true,
            data: offlineNodes
        });
    } catch (error) {
        console.error('Get offline nodes error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch offline nodes'
        });
    }
});

// GET /api/nodes/:id/performance - Lấy dữ liệu hiệu suất của node
router.get('/:id/performance', auth, requirePermission('view'), async (req, res) => {
    try {
        const { id } = req.params;
        const { hours = 24 } = req.query;
        
        const node = await CdnNode.findById(id);
        if (!node) {
            return res.status(404).json({
                success: false,
                message: 'Node not found'
            });
        }
        
        // Import NodeMetrics here to avoid circular dependency
        const NodeMetrics = require('../models/NodeMetrics');
        
        // Get performance metrics for the specified time period
        const metrics = await NodeMetrics.getPerformanceByNodeId(id, parseInt(hours));
        
        // Calculate performance statistics
        const performanceStats = {
            cpu: {
                current: metrics.length > 0 ? metrics[0].cpu_usage : 0,
                average: metrics.length > 0 ? 
                    metrics.reduce((sum, m) => sum + m.cpu_usage, 0) / metrics.length : 0,
                max: metrics.length > 0 ? Math.max(...metrics.map(m => m.cpu_usage)) : 0,
                min: metrics.length > 0 ? Math.min(...metrics.map(m => m.cpu_usage)) : 0
            },
            memory: {
                current: metrics.length > 0 ? metrics[0].memory_usage : 0,
                average: metrics.length > 0 ? 
                    metrics.reduce((sum, m) => sum + m.memory_usage, 0) / metrics.length : 0,
                max: metrics.length > 0 ? Math.max(...metrics.map(m => m.memory_usage)) : 0,
                min: metrics.length > 0 ? Math.min(...metrics.map(m => m.memory_usage)) : 0
            },
            bandwidth: {
                current: metrics.length > 0 ? metrics[0].bandwidth_usage : 0,
                average: metrics.length > 0 ? 
                    metrics.reduce((sum, m) => sum + m.bandwidth_usage, 0) / metrics.length : 0,
                max: metrics.length > 0 ? Math.max(...metrics.map(m => m.bandwidth_usage)) : 0,
                min: metrics.length > 0 ? Math.min(...metrics.map(m => m.bandwidth_usage)) : 0
            },
            disk: {
                current: metrics.length > 0 ? metrics[0].disk_usage : 0,
                average: metrics.length > 0 ? 
                    metrics.reduce((sum, m) => sum + m.disk_usage, 0) / metrics.length : 0,
                max: metrics.length > 0 ? Math.max(...metrics.map(m => m.disk_usage)) : 0,
                min: metrics.length > 0 ? Math.min(...metrics.map(m => m.disk_usage)) : 0
            },
            response_time: {
                current: metrics.length > 0 ? metrics[0].response_time : 0,
                average: metrics.length > 0 ? 
                    metrics.reduce((sum, m) => sum + m.response_time, 0) / metrics.length : 0,
                max: metrics.length > 0 ? Math.max(...metrics.map(m => m.response_time)) : 0,
                min: metrics.length > 0 ? Math.min(...metrics.map(m => m.response_time)) : 0
            },
            requests_per_second: {
                current: metrics.length > 0 ? metrics[0].requests_per_second : 0,
                average: metrics.length > 0 ? 
                    metrics.reduce((sum, m) => sum + m.requests_per_second, 0) / metrics.length : 0,
                max: metrics.length > 0 ? Math.max(...metrics.map(m => m.requests_per_second)) : 0,
                min: metrics.length > 0 ? Math.min(...metrics.map(m => m.requests_per_second)) : 0
            }
        };
        
        // Get recent metrics for chart data
        const recentMetrics = metrics.slice(0, 50).map(m => ({
            timestamp: m.timestamp,
            cpu_usage: m.cpu_usage,
            memory_usage: m.memory_usage,
            bandwidth_usage: m.bandwidth_usage,
            disk_usage: m.disk_usage,
            response_time: m.response_time,
            requests_per_second: m.requests_per_second
        }));
        
        // Get the latest metrics for the current view
        const latestMetrics = metrics.length > 0 ? metrics[0] : null;
        
        res.json({
            success: true,
            data: {
                node_id: parseInt(id),
                metrics: latestMetrics ? {
                    cpu_usage: latestMetrics.cpu_usage,
                    memory_usage: latestMetrics.memory_usage,
                    disk_usage: latestMetrics.disk_usage,
                    network_in: latestMetrics.network_in_mbps,
                    network_out: latestMetrics.network_out_mbps,
                    response_time: latestMetrics.response_time,
                    cache_hit_rate: latestMetrics.cache_hit_rate,
                    connections: latestMetrics.active_connections,
                    timestamp: latestMetrics.timestamp
                } : {
                    cpu_usage: 0,
                    memory_usage: 0,
                    disk_usage: 0,
                    network_in: 0,
                    network_out: 0,
                    response_time: 0,
                    cache_hit_rate: 0,
                    connections: 0,
                    timestamp: new Date().toISOString()
                },
                alerts: [], // TODO: Implement alerts
                last_updated: metrics.length > 0 ? metrics[0].timestamp : new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Get node performance error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch node performance data'
        });
    }
});

// GET /api/nodes/:id/metrics/realtime - Lấy metrics real-time cho node
router.get('/:id/metrics/realtime', auth, requirePermission('view'), async (req, res) => {
    try {
        const { id } = req.params;
        const { timeRange = '1h' } = req.query;
        
        // Tính thời gian bắt đầu dựa trên timeRange
        let startTime;
        const now = new Date();
        switch (timeRange) {
            case '1h':
                startTime = new Date(now.getTime() - 60 * 60 * 1000);
                break;
            case '6h':
                startTime = new Date(now.getTime() - 6 * 60 * 60 * 1000);
                break;
            case '24h':
                startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                break;
            case '7d':
                startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            default:
                startTime = new Date(now.getTime() - 60 * 60 * 1000);
        }
        
        const query = `
            SELECT 
                cpu_usage, memory_usage, disk_usage,
                network_in_mbps, network_out_mbps,
                response_time_ms, error_rate,
                active_connections, cache_hit_rate,
                timestamp
            FROM node_metrics 
            WHERE node_id = ? AND timestamp >= ?
            ORDER BY timestamp ASC
        `;
        
        const [metrics] = await db.execute(query, [id, startTime]);
        
        // Transform data for frontend
        const transformedMetrics = metrics.map(metric => ({
            cpu_usage: parseFloat(metric.cpu_usage),
            memory_usage: parseFloat(metric.memory_usage),
            disk_usage: parseFloat(metric.disk_usage),
            network_in: parseFloat(metric.network_in_mbps),
            network_out: parseFloat(metric.network_out_mbps),
            response_time: parseInt(metric.response_time_ms),
            error_rate: parseFloat(metric.error_rate),
            connections: parseInt(metric.active_connections),
            cache_hit_rate: parseFloat(metric.cache_hit_rate),
            timestamp: metric.timestamp
        }));
        
        res.json({
            success: true,
            data: {
                nodeId: parseInt(id),
                metrics: transformedMetrics,
                timeRange,
                lastUpdated: new Date().toISOString()
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

module.exports = router; 