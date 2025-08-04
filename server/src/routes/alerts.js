const express = require('express');
const { auth, requirePermission } = require('../middleware/auth');
const db = require('../config/database');

const router = express.Router();

// GET /api/alerts - Get all alerts
router.get('/', auth, requirePermission('monitor'), async (req, res) => {
  try {
    const { page = 1, limit = 20, severity, alert_type, hours = 24 } = req.query;
    
    let query = `
      SELECT 
        a.id, a.alert_type, a.severity, a.message, a.created_at,
        n.name as node_name, n.hostname
      FROM alerts a
      LEFT JOIN cdn_nodes n ON a.node_id = n.id
      WHERE a.created_at >= DATE_SUB(NOW(), INTERVAL ? HOUR)
    `;
    
    const queryParams = [parseInt(hours)];
    
    if (severity) {
      query += ' AND a.severity = ?';
      queryParams.push(severity);
    }
    
    if (alert_type) {
      query += ' AND a.alert_type = ?';
      queryParams.push(alert_type);
    }
    
    query += ' ORDER BY a.created_at DESC';
    
    const [alerts] = await db.execute(query, queryParams);
    
    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedAlerts = alerts.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      data: {
        alerts: paginatedAlerts,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(alerts.length / limit),
          total_items: alerts.length,
          items_per_page: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch alerts'
    });
  }
});

// GET /api/alerts/unread - Get unread alerts count
router.get('/unread', auth, requirePermission('monitor'), async (req, res) => {
  try {
    const query = `
      SELECT COUNT(*) as count
      FROM alerts 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
    `;
    
    const [result] = await db.execute(query);
    const unreadCount = result[0].count;
    
    res.json({
      success: true,
      data: {
        count: unreadCount
      }
    });
  } catch (error) {
    console.error('Get unread alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unread alerts count'
    });
  }
});

// PUT /api/alerts/:id/read - Mark alert as read
router.put('/:id/read', auth, requirePermission('monitor'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // In real app, update database
    console.log(`Marking alert ${id} as read`);
    
    res.json({
      success: true,
      message: 'Alert marked as read'
    });
  } catch (error) {
    console.error('Mark alert as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark alert as read'
    });
  }
});

// PUT /api/alerts/read-all - Mark all alerts as read
router.put('/read-all', auth, requirePermission('monitor'), async (req, res) => {
  try {
    // In real app, update database
    console.log('Marking all alerts as read');
    
    res.json({
      success: true,
      message: 'All alerts marked as read'
    });
  } catch (error) {
    console.error('Mark all alerts as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all alerts as read'
    });
  }
});

// GET /api/alerts/summary - Get alerts summary
router.get('/summary', auth, requirePermission('monitor'), async (req, res) => {
  try {
    const PerformanceMonitoringService = require('../services/performanceMonitoringService');
    const monitoringService = new PerformanceMonitoringService();
    
    const summary = await monitoringService.getPerformanceSummary();
    
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Get alerts summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch alerts summary'
    });
  }
});

// GET /api/alerts/node/:nodeId - Get alerts for specific node
router.get('/node/:nodeId', auth, requirePermission('monitor'), async (req, res) => {
  try {
    const { nodeId } = req.params;
    const { hours = 24 } = req.query;
    
    const PerformanceMonitoringService = require('../services/performanceMonitoringService');
    const monitoringService = new PerformanceMonitoringService();
    
    const alerts = await monitoringService.getNodeAlerts(nodeId, parseInt(hours));
    
    res.json({
      success: true,
      data: alerts
    });
  } catch (error) {
    console.error('Get node alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch node alerts'
    });
  }
});

// GET /api/alerts/anomalies/:nodeId - Get anomalies for specific node
router.get('/anomalies/:nodeId', auth, requirePermission('monitor'), async (req, res) => {
  try {
    const { nodeId } = req.params;
    const { hours = 24 } = req.query;
    
    const PerformanceMonitoringService = require('../services/performanceMonitoringService');
    const monitoringService = new PerformanceMonitoringService();
    
    const anomalies = await monitoringService.detectAnomalies(nodeId, parseInt(hours));
    
    res.json({
      success: true,
      data: anomalies
    });
  } catch (error) {
    console.error('Get anomalies error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch anomalies'
    });
  }
});

// POST /api/alerts/test - Test alert generation
router.post('/test', auth, requirePermission('system_admin'), async (req, res) => {
  try {
    const { nodeId, alertType, severity = 'medium' } = req.body;
    
    const PerformanceMonitoringService = require('../services/performanceMonitoringService');
    const monitoringService = new PerformanceMonitoringService();
    
    await monitoringService.testAlert(nodeId, alertType, severity);
    
    res.json({
      success: true,
      message: `Test alert generated for node ${nodeId}`
    });
  } catch (error) {
    console.error('Test alert error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate test alert'
    });
  }
});

// PUT /api/alerts/thresholds - Update monitoring thresholds
router.put('/thresholds', auth, requirePermission('system_admin'), async (req, res) => {
  try {
    const newThresholds = req.body;
    
    const PerformanceMonitoringService = require('../services/performanceMonitoringService');
    const monitoringService = new PerformanceMonitoringService();
    
    monitoringService.updateThresholds(newThresholds);
    
    res.json({
      success: true,
      message: 'Thresholds updated successfully',
      data: monitoringService.getThresholds()
    });
  } catch (error) {
    console.error('Update thresholds error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update thresholds'
    });
  }
});

module.exports = router; 