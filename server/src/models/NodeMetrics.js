const db = require('../config/database');

class NodeMetrics {
    static async create(metricsData) {
        const {
            node_id, cpu_usage, memory_usage, disk_usage,
            network_in_mbps, network_out_mbps, response_time_ms,
            error_rate, active_connections, cache_hit_rate
        } = metricsData;
        
        const query = `
            INSERT INTO node_metrics (
                node_id, cpu_usage, memory_usage, disk_usage,
                network_in_mbps, network_out_mbps, response_time_ms,
                error_rate, active_connections, cache_hit_rate
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const values = [
            node_id, cpu_usage, memory_usage, disk_usage,
            network_in_mbps, network_out_mbps, response_time_ms,
            error_rate, active_connections, cache_hit_rate
        ];
        
        const [result] = await db.execute(query, values);
        
        // Get the inserted metrics
        const [metrics] = await db.execute(`
            SELECT * FROM node_metrics WHERE id = ?
        `, [result.insertId]);
        
        return metrics[0];
    }
    
    static async findByNodeId(nodeId, limit = 100) {
        const query = `
            SELECT * FROM node_metrics 
            WHERE node_id = ? 
            ORDER BY timestamp DESC 
            LIMIT ?
        `;
        const [result] = await db.execute(query, [nodeId, limit]);
        return result;
    }
    
    static async getLatestByNodeId(nodeId) {
        const query = `
            SELECT * FROM node_metrics 
            WHERE node_id = ? 
            ORDER BY timestamp DESC 
            LIMIT 1
        `;
        const [result] = await db.execute(query, [nodeId]);
        return result[0];
    }
    
    static async getLatestForAllNodes() {
        const query = `
            SELECT 
                nm1.node_id, nm1.cpu_usage, nm1.memory_usage, nm1.disk_usage,
                nm1.network_in_mbps, nm1.network_out_mbps, nm1.response_time_ms,
                nm1.error_rate, nm1.active_connections, nm1.cache_hit_rate, nm1.timestamp
            FROM node_metrics nm1
            INNER JOIN (
                SELECT node_id, MAX(timestamp) as max_timestamp
                FROM node_metrics
                GROUP BY node_id
            ) nm2 ON nm1.node_id = nm2.node_id AND nm1.timestamp = nm2.max_timestamp
        `;
        const [result] = await db.execute(query);
        return result;
    }
    
    static async getMetricsByTimeRange(nodeId, startTime, endTime) {
        const query = `
            SELECT * FROM node_metrics 
            WHERE node_id = ? 
              AND timestamp BETWEEN ? AND ?
            ORDER BY timestamp ASC
        `;
        const [result] = await db.execute(query, [nodeId, startTime, endTime]);
        return result;
    }
    
    static async getAggregatedMetrics(nodeId, interval = 'HOUR') {
        const query = `
            SELECT 
                DATE_FORMAT(timestamp, CASE 
                    WHEN ? = 'HOUR' THEN '%Y-%m-%d %H:00:00'
                    WHEN ? = 'DAY' THEN '%Y-%m-%d 00:00:00'
                    WHEN ? = 'MINUTE' THEN '%Y-%m-%d %H:%i:00'
                    ELSE '%Y-%m-%d %H:00:00'
                END) as time_bucket,
                AVG(cpu_usage) as avg_cpu_usage,
                AVG(memory_usage) as avg_memory_usage,
                AVG(disk_usage) as avg_disk_usage,
                AVG(network_in_mbps) as avg_network_in,
                AVG(network_out_mbps) as avg_network_out,
                AVG(response_time_ms) as avg_response_time,
                AVG(error_rate) as avg_error_rate,
                AVG(active_connections) as avg_active_connections,
                AVG(cache_hit_rate) as avg_cache_hit_rate,
                MAX(cpu_usage) as max_cpu_usage,
                MAX(memory_usage) as max_memory_usage,
                MAX(disk_usage) as max_disk_usage
            FROM node_metrics 
            WHERE node_id = ? 
              AND timestamp >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
            GROUP BY time_bucket
            ORDER BY time_bucket ASC
        `;
        const [result] = await db.execute(query, [interval, interval, interval, nodeId]);
        return result;
    }
    
    static async getSystemOverview() {
        try {
            // Get basic metrics overview (last 24 hours)
            const metricsQuery = `
                SELECT 
                    COUNT(DISTINCT node_id) as total_nodes,
                    AVG(cpu_usage) as avg_cpu_usage,
                    AVG(memory_usage) as avg_memory_usage,
                    AVG(disk_usage) as avg_disk_usage,
                    AVG(response_time_ms) as avg_response_time,
                    AVG(error_rate) as avg_error_rate,
                    AVG(cache_hit_rate) as avg_cache_hit_rate,
                    SUM(network_in_mbps) as total_network_in,
                    SUM(network_out_mbps) as total_network_out,
                    COUNT(*) as total_metrics,
                    MAX(timestamp) as latest_metric_time
                FROM node_metrics nm
                WHERE nm.timestamp >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
            `;
            const [metricsResult] = await db.execute(metricsQuery);
            
            // Get node status counts
            const nodeStatusQuery = `
                SELECT 
                    COUNT(*) as total_nodes,
                    SUM(CASE WHEN status = 'online' THEN 1 ELSE 0 END) as online_nodes,
                    SUM(CASE WHEN status = 'offline' THEN 1 ELSE 0 END) as offline_nodes,
                    SUM(CASE WHEN status = 'maintenance' THEN 1 ELSE 0 END) as maintenance_nodes
                FROM cdn_nodes
            `;
            const [nodeStatusResult] = await db.execute(nodeStatusQuery);
            
            // Get recent alerts count
            const alertsQuery = `
                SELECT COUNT(*) as recent_alerts
                FROM alerts 
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
            `;
            const [alertsResult] = await db.execute(alertsQuery);
            
            // Get performance trends (last 24 hours vs previous 24 hours)
            const trendsQuery = `
                SELECT 
                    AVG(CASE WHEN timestamp >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN cpu_usage END) as current_avg_cpu,
                    AVG(CASE WHEN timestamp >= DATE_SUB(NOW(), INTERVAL 48 HOUR) AND timestamp < DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN cpu_usage END) as previous_avg_cpu,
                    AVG(CASE WHEN timestamp >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN memory_usage END) as current_avg_memory,
                    AVG(CASE WHEN timestamp >= DATE_SUB(NOW(), INTERVAL 48 HOUR) AND timestamp < DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN memory_usage END) as previous_avg_memory,
                    AVG(CASE WHEN timestamp >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN response_time_ms END) as current_avg_response,
                    AVG(CASE WHEN timestamp >= DATE_SUB(NOW(), INTERVAL 48 HOUR) AND timestamp < DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN response_time_ms END) as previous_avg_response
                FROM node_metrics
            `;
            const [trendsResult] = await db.execute(trendsQuery);
            
            // Calculate trends
            const cpuTrend = trendsResult[0].previous_avg_cpu ? 
                ((trendsResult[0].current_avg_cpu - trendsResult[0].previous_avg_cpu) / trendsResult[0].previous_avg_cpu * 100) : 0;
            const memoryTrend = trendsResult[0].previous_avg_memory ? 
                ((trendsResult[0].current_avg_memory - trendsResult[0].previous_avg_memory) / trendsResult[0].previous_avg_memory * 100) : 0;
            const responseTrend = trendsResult[0].previous_avg_response ? 
                ((trendsResult[0].current_avg_response - trendsResult[0].previous_avg_response) / trendsResult[0].previous_avg_response * 100) : 0;
            
            return {
                ...metricsResult[0],
                ...nodeStatusResult[0],
                recent_alerts: alertsResult[0].recent_alerts,
                trends: {
                    cpu: {
                        current: trendsResult[0].current_avg_cpu || 0,
                        previous: trendsResult[0].previous_avg_cpu || 0,
                        change: cpuTrend
                    },
                    memory: {
                        current: trendsResult[0].current_avg_memory || 0,
                        previous: trendsResult[0].previous_avg_memory || 0,
                        change: memoryTrend
                    },
                    response_time: {
                        current: trendsResult[0].current_avg_response || 0,
                        previous: trendsResult[0].previous_avg_response || 0,
                        change: responseTrend
                    }
                }
            };
        } catch (error) {
            console.error('Error in getSystemOverview:', error);
            throw error;
        }
    }
    
    static async getTopNodesByMetric(metric, limit = 10) {
        const validMetrics = ['cpu_usage', 'memory_usage', 'disk_usage', 'response_time_ms', 'error_rate'];
        if (!validMetrics.includes(metric)) {
            throw new Error('Invalid metric');
        }
        
        const query = `
            SELECT 
                nm1.node_id,
                n.name as node_name,
                n.hostname,
                nm1.${metric},
                nm1.timestamp
            FROM node_metrics nm1
            INNER JOIN (
                SELECT node_id, MAX(timestamp) as max_timestamp
                FROM node_metrics
                GROUP BY node_id
            ) nm2 ON nm1.node_id = nm2.node_id AND nm1.timestamp = nm2.max_timestamp
            JOIN cdn_nodes n ON nm1.node_id = n.id
            ORDER BY nm1.${metric} DESC
            LIMIT ?
        `;
        
        const [result] = await db.execute(query, [limit]);
        return result;
    }
    
    static async getPerformanceTrends(nodeId, days = 7) {
        const query = `
            SELECT 
                DATE(timestamp) as date,
                AVG(cpu_usage) as avg_cpu,
                AVG(memory_usage) as avg_memory,
                AVG(disk_usage) as avg_disk,
                AVG(response_time_ms) as avg_response_time,
                AVG(error_rate) as avg_error_rate,
                COUNT(*) as data_points
            FROM node_metrics 
            WHERE node_id = ? 
              AND timestamp >= DATE_SUB(NOW(), INTERVAL ? DAY)
            GROUP BY DATE(timestamp)
            ORDER BY date ASC
        `;
        const [result] = await db.execute(query, [nodeId, days]);
        return result;
    }
    
    static async cleanupOldMetrics(daysToKeep = 30) {
        const query = `
            DELETE FROM node_metrics 
            WHERE timestamp < DATE_SUB(NOW(), INTERVAL ? DAY)
        `;
        const [result] = await db.execute(query, [daysToKeep]);
        return result.affectedRows;
    }
    
    static async getMetricsSummary() {
        const query = `
            SELECT 
                COUNT(*) as total_metrics,
                COUNT(DISTINCT node_id) as active_nodes,
                MIN(timestamp) as oldest_metric,
                MAX(timestamp) as newest_metric
            FROM node_metrics
        `;
        const [result] = await db.execute(query);
        return result[0];
    }
    
        static async getPerformanceByNodeId(nodeId, hours = 24) {
        const query = `
            SELECT
                cpu_usage,
                memory_usage,
                disk_usage,
                network_in_mbps + network_out_mbps as bandwidth_usage,
                response_time_ms as response_time,
                active_connections as requests_per_second,
                timestamp
            FROM node_metrics
            WHERE node_id = ?
              AND timestamp >= DATE_SUB(NOW(), INTERVAL ? HOUR)
            ORDER BY timestamp DESC
        `;
        const [result] = await db.execute(query, [nodeId, hours]);
        return result;
    }

    static async getMetricsByNodeId(nodeId, hours = 24, interval = '1h') {
        let timeFormat;
        let groupBy;
        
        switch (interval) {
            case '5m':
                timeFormat = '%Y-%m-%d %H:%i:00';
                groupBy = 'MINUTE';
                break;
            case '1h':
                timeFormat = '%Y-%m-%d %H:00:00';
                groupBy = 'HOUR';
                break;
            case '1d':
                timeFormat = '%Y-%m-%d 00:00:00';
                groupBy = 'DAY';
                break;
            default:
                timeFormat = '%Y-%m-%d %H:00:00';
                groupBy = 'HOUR';
        }

        const query = `
            SELECT 
                DATE_FORMAT(timestamp, ?) as time_bucket,
                AVG(cpu_usage) as cpu_usage,
                AVG(memory_usage) as memory_usage,
                AVG(disk_usage) as disk_usage,
                AVG(network_in_mbps) as network_in,
                AVG(network_out_mbps) as network_out,
                AVG(response_time_ms) as response_time,
                AVG(cache_hit_rate) as cache_hit_rate,
                AVG(active_connections) as connections,
                COUNT(*) as data_points
            FROM node_metrics
            WHERE node_id = ?
              AND timestamp >= DATE_SUB(NOW(), INTERVAL ? HOUR)
            GROUP BY time_bucket
            ORDER BY time_bucket ASC
        `;
        
        const [result] = await db.execute(query, [timeFormat, nodeId, hours]);
        return result;
    }

    static async getAnomalyDetection(nodeId, threshold = 2) {
        const query = `
            SELECT 
                nm.*,
                CASE 
                    WHEN nm.cpu_usage > (avg_stats.avg_cpu + ? * avg_stats.std_cpu) THEN 'high_cpu'
                    WHEN nm.memory_usage > (avg_stats.avg_memory + ? * avg_stats.std_memory) THEN 'high_memory'
                    WHEN nm.disk_usage > (avg_stats.avg_disk + ? * avg_stats.std_disk) THEN 'high_disk'
                    ELSE 'normal'
                END as anomaly_type
            FROM node_metrics nm
            CROSS JOIN (
                SELECT 
                    AVG(cpu_usage) as avg_cpu,
                    AVG(memory_usage) as avg_memory,
                    AVG(disk_usage) as avg_disk,
                    STDDEV(cpu_usage) as std_cpu,
                    STDDEV(memory_usage) as std_memory,
                    STDDEV(disk_usage) as std_disk
                FROM node_metrics 
                WHERE node_id = ? 
                  AND timestamp >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
            ) avg_stats
            WHERE nm.node_id = ? 
              AND nm.timestamp >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
            ORDER BY nm.timestamp DESC
        `;
        const [result] = await db.execute(query, [threshold, threshold, threshold, nodeId, nodeId]);
        return result;
    }
}

module.exports = NodeMetrics; 