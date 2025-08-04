const mysql = require('mysql2/promise');
const { broadcastAlert } = require('../websocket/websocketHandler');

class PerformanceMonitoringService {
    constructor() {
        this.db = mysql.createPool({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'cdn_management'
        });
        
        // Thresholds từ config
        this.thresholds = {
            cpu_usage: process.env.ALERT_CPU_THRESHOLD || 80,
            memory_usage: process.env.ALERT_MEMORY_THRESHOLD || 85,
            disk_usage: process.env.ALERT_DISK_THRESHOLD || 90,
            response_time_ms: process.env.ALERT_RESPONSE_TIME_THRESHOLD || 1000,
            error_rate: process.env.ALERT_ERROR_RATE_THRESHOLD || 5,
            cache_hit_rate: process.env.ALERT_CACHE_HIT_RATE_THRESHOLD || 70
        };
        
        this.isRunning = false;
        this.monitoringTimer = null;
        this.monitoringInterval = 30000; // 30 seconds
        this.alertCooldown = new Map(); // Prevent spam alerts
        this.cooldownPeriod = 300000; // 5 minutes
    }

    // Start performance monitoring
    async start() {
        if (this.isRunning) {
            console.log('⚠️  Performance monitoring service already running');
            return;
        }

        console.log('🚀 Starting Performance Monitoring Service...');
        this.isRunning = true;

        // Start monitoring loop
        this.monitoringTimer = setInterval(() => {
            this.checkPerformanceThresholds();
        }, this.monitoringInterval);

        console.log('✅ Performance Monitoring Service started');
        console.log('📊 Monitoring thresholds:', this.thresholds);
    }

    // Stop performance monitoring
    stop() {
        if (!this.isRunning) {
            console.log('⚠️  Performance monitoring service not running');
            return;
        }

        console.log('🛑 Stopping Performance Monitoring Service...');
        this.isRunning = false;

        if (this.monitoringTimer) {
            clearInterval(this.monitoringTimer);
            this.monitoringTimer = null;
        }

        console.log('✅ Performance Monitoring Service stopped');
    }

    // Check performance thresholds for all nodes
    async checkPerformanceThresholds() {
        try {
            // Get latest metrics for all nodes
            const query = `
                SELECT 
                    nm.node_id,
                    n.name as node_name,
                    n.hostname,
                    nm.cpu_usage,
                    nm.memory_usage,
                    nm.disk_usage,
                    nm.response_time_ms,
                    nm.error_rate,
                    nm.cache_hit_rate,
                    nm.timestamp
                FROM node_metrics nm
                JOIN cdn_nodes n ON nm.node_id = n.id
                WHERE nm.timestamp = (
                    SELECT MAX(timestamp) 
                    FROM node_metrics nm2 
                    WHERE nm2.node_id = nm.node_id
                )
            `;

            const [metrics] = await this.db.execute(query);

            for (const metric of metrics) {
                await this.checkNodeThresholds(metric);
            }

        } catch (error) {
            console.error('❌ Error checking performance thresholds:', error);
        }
    }

    // Check thresholds for a specific node
    async checkNodeThresholds(metric) {
        const alerts = [];

        // Check CPU usage
        const cpuUsage = parseFloat(metric.cpu_usage) || 0;
        if (cpuUsage > this.thresholds.cpu_usage) {
            alerts.push({
                type: 'cpu_high',
                severity: this.getSeverity(cpuUsage, this.thresholds.cpu_usage),
                message: `High CPU usage: ${cpuUsage.toFixed(1)}% (threshold: ${this.thresholds.cpu_usage}%)`,
                value: cpuUsage,
                threshold: this.thresholds.cpu_usage
            });
        }

        // Check memory usage
        const memoryUsage = parseFloat(metric.memory_usage) || 0;
        if (memoryUsage > this.thresholds.memory_usage) {
            alerts.push({
                type: 'memory_high',
                severity: this.getSeverity(memoryUsage, this.thresholds.memory_usage),
                message: `High memory usage: ${memoryUsage.toFixed(1)}% (threshold: ${this.thresholds.memory_usage}%)`,
                value: memoryUsage,
                threshold: this.thresholds.memory_usage
            });
        }

        // Check disk usage
        const diskUsage = parseFloat(metric.disk_usage) || 0;
        if (diskUsage > this.thresholds.disk_usage) {
            alerts.push({
                type: 'disk_full',
                severity: this.getSeverity(diskUsage, this.thresholds.disk_usage),
                message: `High disk usage: ${diskUsage.toFixed(1)}% (threshold: ${this.thresholds.disk_usage}%)`,
                value: diskUsage,
                threshold: this.thresholds.disk_usage
            });
        }

        // Check response time
        const responseTime = parseFloat(metric.response_time_ms) || 0;
        if (responseTime > this.thresholds.response_time_ms) {
            alerts.push({
                type: 'latency_high',
                severity: this.getSeverity(responseTime, this.thresholds.response_time_ms),
                message: `High latency: ${responseTime}ms (threshold: ${this.thresholds.response_time_ms}ms)`,
                value: responseTime,
                threshold: this.thresholds.response_time_ms
            });
        }

        // Check error rate
        const errorRate = parseFloat(metric.error_rate) || 0;
        if (errorRate > this.thresholds.error_rate) {
            alerts.push({
                type: 'error_rate_high',
                severity: this.getSeverity(errorRate, this.thresholds.error_rate),
                message: `High error rate: ${errorRate.toFixed(1)}% (threshold: ${this.thresholds.error_rate}%)`,
                value: errorRate,
                threshold: this.thresholds.error_rate
            });
        }

        // Check cache hit rate (lower is worse)
        const cacheHitRate = parseFloat(metric.cache_hit_rate) || 0;
        if (cacheHitRate < this.thresholds.cache_hit_rate) {
            alerts.push({
                type: 'cache_hit_low',
                severity: this.getSeverity(this.thresholds.cache_hit_rate - cacheHitRate, 0),
                message: `Low cache hit rate: ${cacheHitRate.toFixed(1)}% (threshold: ${this.thresholds.cache_hit_rate}%)`,
                value: cacheHitRate,
                threshold: this.thresholds.cache_hit_rate
            });
        }

        // Create alerts for each threshold violation
        for (const alert of alerts) {
            await this.createAlert(metric.node_id, metric.node_name, alert);
        }
    }

    // Determine alert severity based on how much threshold is exceeded
    getSeverity(value, threshold) {
        const ratio = value / threshold;
        if (ratio >= 1.5) return 'critical';
        if (ratio >= 1.2) return 'high';
        if (ratio >= 1.1) return 'medium';
        return 'low';
    }

    // Create alert in database and send notification
    async createAlert(nodeId, nodeName, alertData) {
        try {
            // Check cooldown to prevent spam
            const alertKey = `${nodeId}_${alertData.type}`;
            const now = Date.now();
            const lastAlert = this.alertCooldown.get(alertKey);
            
            if (lastAlert && (now - lastAlert) < this.cooldownPeriod) {
                return; // Skip if within cooldown period
            }

            // Create alert in database
            const alertQuery = `
                INSERT INTO alerts (
                    alert_type, severity, message, node_id, created_at
                ) VALUES (?, ?, ?, ?, NOW())
            `;

            const alertValues = [
                alertData.type,
                alertData.severity,
                `${nodeName}: ${alertData.message}`,
                nodeId
            ];

            await this.db.execute(alertQuery, alertValues);

            // Update cooldown
            this.alertCooldown.set(alertKey, now);

            // Send WebSocket notification
            broadcastAlert({
                type: alertData.type,
                severity: alertData.severity,
                message: `${nodeName}: ${alertData.message}`,
                nodeId,
                value: alertData.value,
                threshold: alertData.threshold,
                timestamp: new Date().toISOString()
            });

            console.log(`🚨 Alert created: ${alertData.severity.toUpperCase()} - ${nodeName} - ${alertData.message}`);

        } catch (error) {
            console.error(`❌ Error creating alert for node ${nodeId}:`, error);
        }
    }

    // Detect anomalies using statistical analysis
    async detectAnomalies(nodeId, hours = 24) {
        try {
            const query = `
                SELECT 
                    cpu_usage, memory_usage, disk_usage, 
                    response_time_ms, error_rate, cache_hit_rate
                FROM node_metrics 
                WHERE node_id = ? 
                AND timestamp >= DATE_SUB(NOW(), INTERVAL ? HOUR)
                ORDER BY timestamp DESC
            `;

            const [metrics] = await this.db.execute(query, [nodeId, hours]);

            if (metrics.length < 10) return [];

            const anomalies = [];
            const fields = ['cpu_usage', 'memory_usage', 'disk_usage', 'response_time_ms', 'error_rate'];

            for (const field of fields) {
                const values = metrics.map(m => parseFloat(m[field]));
                const mean = values.reduce((a, b) => a + b, 0) / values.length;
                const stdDev = Math.sqrt(values.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / values.length);

                if (stdDev === 0) continue;

                metrics.forEach((metric, index) => {
                    const value = parseFloat(metric[field]);
                    const zScore = Math.abs((value - mean) / stdDev);

                    if (zScore > 2.5) { // Anomaly threshold
                        anomalies.push({
                            field,
                            value,
                            expected: mean,
                            zScore,
                            timestamp: metric.timestamp,
                            severity: zScore > 4 ? 'critical' : zScore > 3 ? 'high' : 'medium'
                        });
                    }
                });
            }

            return anomalies.slice(0, 5); // Return top 5 anomalies

        } catch (error) {
            console.error(`❌ Error detecting anomalies for node ${nodeId}:`, error);
            return [];
        }
    }

    // Get performance summary for dashboard
    async getPerformanceSummary() {
        try {
            const query = `
                SELECT 
                    COUNT(*) as total_nodes,
                    SUM(CASE WHEN status = 'online' THEN 1 ELSE 0 END) as online_nodes,
                    SUM(CASE WHEN status = 'offline' THEN 1 ELSE 0 END) as offline_nodes,
                    SUM(CASE WHEN status = 'maintenance' THEN 1 ELSE 0 END) as maintenance_nodes
                FROM cdn_nodes
            `;

            const [summary] = await this.db.execute(query);

            // Get alert counts
            const alertQuery = `
                SELECT 
                    severity,
                    COUNT(*) as count
                FROM alerts 
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
                GROUP BY severity
            `;

            const [alerts] = await this.db.execute(alertQuery);

            return {
                nodes: summary[0],
                alerts: alerts,
                thresholds: this.thresholds
            };

        } catch (error) {
            console.error('❌ Error getting performance summary:', error);
            return null;
        }
    }

    // Get alerts for a specific node
    async getNodeAlerts(nodeId, hours = 24) {
        try {
            const query = `
                SELECT 
                    id, alert_type, severity, message, created_at
                FROM alerts 
                WHERE node_id = ? 
                AND created_at >= DATE_SUB(NOW(), INTERVAL ? HOUR)
                ORDER BY created_at DESC
            `;

            const [alerts] = await this.db.execute(query, [nodeId, hours]);
            return alerts;

        } catch (error) {
            console.error(`❌ Error getting alerts for node ${nodeId}:`, error);
            return [];
        }
    }

    // Update thresholds
    updateThresholds(newThresholds) {
        this.thresholds = { ...this.thresholds, ...newThresholds };
        console.log('📊 Updated monitoring thresholds:', this.thresholds);
    }

    // Get current thresholds
    getThresholds() {
        return this.thresholds;
    }

    // Test alert generation (for testing purposes)
    async testAlert(nodeId, alertType, severity = 'medium') {
        const testAlerts = {
            'cpu_high': {
                message: 'Test CPU alert',
                value: 95,
                threshold: 80
            },
            'memory_high': {
                message: 'Test memory alert',
                value: 90,
                threshold: 85
            },
            'latency_high': {
                message: 'Test latency alert',
                value: 1500,
                threshold: 1000
            }
        };

        const alertData = testAlerts[alertType];
        if (alertData) {
            await this.createAlert(nodeId, 'Test Node', {
                type: alertType,
                severity,
                message: alertData.message,
                value: alertData.value,
                threshold: alertData.threshold
            });
        }
    }
}

module.exports = PerformanceMonitoringService; 