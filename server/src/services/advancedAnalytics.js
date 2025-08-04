const db = require('../config/database');
const moment = require('moment');

class AdvancedAnalytics {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }

    // 1. Performance Trend Analysis
    async getPerformanceTrends(nodeId, timeRange = '7d') {
        try {
            const startDate = moment().subtract(this.parseTimeRange(timeRange), 'days');
            
            const query = `
                SELECT 
                    DATE(timestamp) as date,
                    AVG(cpu_usage) as avg_cpu,
                    AVG(memory_usage) as avg_memory,
                    AVG(disk_usage) as avg_disk,
                    AVG(response_time_ms) as avg_response_time,
                    AVG(error_rate) as avg_error_rate,
                    AVG(cache_hit_rate) as avg_cache_hit_rate,
                    SUM(network_in_mbps) as total_network_in,
                    SUM(network_out_mbps) as total_network_out
                FROM node_metrics 
                WHERE node_id = ? AND timestamp >= ?
                GROUP BY DATE(timestamp)
                ORDER BY date ASC
            `;
            
            const [results] = await db.execute(query, [nodeId, startDate.format('YYYY-MM-DD')]);
            
            return {
                nodeId,
                timeRange,
                trends: results.map(row => ({
                    date: row.date,
                    cpu: parseFloat(row.avg_cpu),
                    memory: parseFloat(row.avg_memory),
                    disk: parseFloat(row.avg_disk),
                    responseTime: parseFloat(row.avg_response_time),
                    errorRate: parseFloat(row.avg_error_rate),
                    cacheHitRate: parseFloat(row.avg_cache_hit_rate),
                    networkIn: parseFloat(row.total_network_in),
                    networkOut: parseFloat(row.total_network_out)
                }))
            };
        } catch (error) {
            console.error('Error getting performance trends:', error);
            throw error;
        }
    }

    // 2. Anomaly Detection
    async detectAnomalies(nodeId, threshold = 2.0) {
        try {
            const query = `
                SELECT 
                    cpu_usage, memory_usage, disk_usage, response_time_ms, error_rate
                FROM node_metrics 
                WHERE node_id = ? 
                AND timestamp >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
                ORDER BY timestamp DESC
            `;
            
            const [metrics] = await db.execute(query, [nodeId]);
            
            if (metrics.length < 10) return { anomalies: [] };
            
            const anomalies = [];
            const fields = ['cpu_usage', 'memory_usage', 'disk_usage', 'response_time_ms', 'error_rate'];
            
            fields.forEach(field => {
                const values = metrics.map(m => parseFloat(m[field]));
                const mean = values.reduce((a, b) => a + b, 0) / values.length;
                const stdDev = Math.sqrt(values.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / values.length);
                
                metrics.forEach((metric, index) => {
                    const value = parseFloat(metric[field]);
                    const zScore = Math.abs((value - mean) / stdDev);
                    
                    if (zScore > threshold) {
                        anomalies.push({
                            field,
                            value,
                            expected: mean,
                            zScore,
                            timestamp: metric.timestamp,
                            severity: zScore > 3 ? 'high' : zScore > 2 ? 'medium' : 'low'
                        });
                    }
                });
            });
            
            return { anomalies: anomalies.slice(0, 10) }; // Return top 10 anomalies
        } catch (error) {
            console.error('Error detecting anomalies:', error);
            throw error;
        }
    }

    // 3. Capacity Planning
    async getCapacityAnalysis(nodeId) {
        try {
            const query = `
                SELECT 
                    AVG(cpu_usage) as avg_cpu,
                    MAX(cpu_usage) as max_cpu,
                    AVG(memory_usage) as avg_memory,
                    MAX(memory_usage) as max_memory,
                    AVG(disk_usage) as avg_disk,
                    MAX(disk_usage) as max_disk,
                    AVG(active_connections) as avg_connections,
                    MAX(active_connections) as max_connections
                FROM node_metrics 
                WHERE node_id = ? 
                AND timestamp >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            `;
            
            const [results] = await db.execute(query, [nodeId]);
            const data = results[0];
            
            const analysis = {
                cpu: {
                    average: parseFloat(data.avg_cpu),
                    peak: parseFloat(data.max_cpu),
                    utilization: parseFloat(data.avg_cpu) / 100,
                    recommendation: this.getRecommendation(parseFloat(data.avg_cpu), parseFloat(data.max_cpu))
                },
                memory: {
                    average: parseFloat(data.avg_memory),
                    peak: parseFloat(data.max_memory),
                    utilization: parseFloat(data.avg_memory) / 100,
                    recommendation: this.getRecommendation(parseFloat(data.avg_memory), parseFloat(data.max_memory))
                },
                disk: {
                    average: parseFloat(data.avg_disk),
                    peak: parseFloat(data.max_disk),
                    utilization: parseFloat(data.avg_disk) / 100,
                    recommendation: this.getRecommendation(parseFloat(data.avg_disk), parseFloat(data.max_disk))
                },
                connections: {
                    average: parseInt(data.avg_connections),
                    peak: parseInt(data.max_connections),
                    recommendation: this.getConnectionRecommendation(parseInt(data.avg_connections), parseInt(data.max_connections))
                }
            };
            
            return analysis;
        } catch (error) {
            console.error('Error getting capacity analysis:', error);
            throw error;
        }
    }

    // 4. Geographic Performance Analysis
    async getGeographicPerformance() {
        try {
            const query = `
                SELECT 
                    n.location,
                    n.region,
                    n.country,
                    AVG(nm.cpu_usage) as avg_cpu,
                    AVG(nm.memory_usage) as avg_memory,
                    AVG(nm.response_time_ms) as avg_response_time,
                    AVG(nm.error_rate) as avg_error_rate,
                    COUNT(nm.id) as metrics_count
                FROM cdn_nodes n
                LEFT JOIN node_metrics nm ON n.id = nm.node_id
                WHERE nm.timestamp >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
                GROUP BY n.location, n.region, n.country
                ORDER BY avg_response_time ASC
            `;
            
            const [results] = await db.execute(query);
            
            return results.map(row => ({
                location: row.location,
                region: row.region,
                country: row.country,
                avgCpu: parseFloat(row.avg_cpu),
                avgMemory: parseFloat(row.avg_memory),
                avgResponseTime: parseFloat(row.avg_response_time),
                avgErrorRate: parseFloat(row.avg_error_rate),
                metricsCount: parseInt(row.metrics_count)
            }));
        } catch (error) {
            console.error('Error getting geographic performance:', error);
            throw error;
        }
    }

    // 5. SLA Compliance Report
    async getSLAComplianceReport(nodeId, slaTargets = {}) {
        try {
            const defaultTargets = {
                responseTime: 100, // ms
                errorRate: 1, // %
                uptime: 99.9, // %
                cacheHitRate: 90 // %
            };
            
            const targets = { ...defaultTargets, ...slaTargets };
            
            const query = `
                SELECT 
                    COUNT(*) as total_metrics,
                    SUM(CASE WHEN response_time_ms <= ? THEN 1 ELSE 0 END) as response_time_compliant,
                    SUM(CASE WHEN error_rate <= ? THEN 1 ELSE 0 END) as error_rate_compliant,
                    SUM(CASE WHEN cache_hit_rate >= ? THEN 1 ELSE 0 END) as cache_hit_compliant,
                    AVG(response_time_ms) as avg_response_time,
                    AVG(error_rate) as avg_error_rate,
                    AVG(cache_hit_rate) as avg_cache_hit_rate
                FROM node_metrics 
                WHERE node_id = ? 
                AND timestamp >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
            `;
            
            const [results] = await db.execute(query, [
                targets.responseTime,
                targets.errorRate,
                targets.cacheHitRate,
                nodeId
            ]);
            
            const data = results[0];
            const total = parseInt(data.total_metrics);
            
            return {
                nodeId,
                period: '24h',
                targets,
                compliance: {
                    responseTime: {
                        target: targets.responseTime,
                        actual: parseFloat(data.avg_response_time),
                        compliance: (parseInt(data.response_time_compliant) / total) * 100,
                        status: parseFloat(data.avg_response_time) <= targets.responseTime ? 'compliant' : 'non-compliant'
                    },
                    errorRate: {
                        target: targets.errorRate,
                        actual: parseFloat(data.avg_error_rate),
                        compliance: (parseInt(data.error_rate_compliant) / total) * 100,
                        status: parseFloat(data.avg_error_rate) <= targets.errorRate ? 'compliant' : 'non-compliant'
                    },
                    cacheHitRate: {
                        target: targets.cacheHitRate,
                        actual: parseFloat(data.avg_cache_hit_rate),
                        compliance: (parseInt(data.cache_hit_compliant) / total) * 100,
                        status: parseFloat(data.avg_cache_hit_rate) >= targets.cacheHitRate ? 'compliant' : 'non-compliant'
                    }
                },
                overallCompliance: this.calculateOverallCompliance(data, total, targets)
            };
        } catch (error) {
            console.error('Error getting SLA compliance report:', error);
            throw error;
        }
    }

    // 6. Predictive Analytics
    async getPredictiveAnalysis(nodeId, forecastDays = 7) {
        try {
            // Simple linear regression for prediction
            const query = `
                SELECT 
                    cpu_usage, memory_usage, disk_usage, response_time_ms, error_rate,
                    timestamp
                FROM node_metrics 
                WHERE node_id = ? 
                AND timestamp >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                ORDER BY timestamp ASC
            `;
            
            const [metrics] = await db.execute(query, [nodeId]);
            
            if (metrics.length < 10) {
                return { predictions: [], message: 'Insufficient data for prediction' };
            }
            
            const predictions = this.calculatePredictions(metrics, forecastDays);
            
            return {
                nodeId,
                forecastDays,
                predictions,
                confidence: this.calculateConfidence(metrics)
            };
        } catch (error) {
            console.error('Error getting predictive analysis:', error);
            throw error;
        }
    }

    // Helper methods
    parseTimeRange(timeRange) {
        const ranges = {
            '1d': 1, '7d': 7, '30d': 30, '90d': 90
        };
        return ranges[timeRange] || 7;
    }

    getRecommendation(average, peak) {
        if (peak > 90) return 'CRITICAL: Immediate scaling required';
        if (peak > 80) return 'HIGH: Consider scaling soon';
        if (average > 70) return 'MEDIUM: Monitor closely';
        if (average > 50) return 'LOW: Normal operation';
        return 'OPTIMAL: Under-utilized';
    }

    getConnectionRecommendation(average, peak) {
        if (peak > 10000) return 'CRITICAL: Connection limit reached';
        if (peak > 5000) return 'HIGH: Monitor connection growth';
        if (average > 1000) return 'MEDIUM: Normal load';
        return 'LOW: Light load';
    }

    calculateOverallCompliance(data, total, targets) {
        const responseTimeCompliance = (parseInt(data.response_time_compliant) / total) * 100;
        const errorRateCompliance = (parseInt(data.error_rate_compliant) / total) * 100;
        const cacheHitCompliance = (parseInt(data.cache_hit_compliant) / total) * 100;
        
        return (responseTimeCompliance + errorRateCompliance + cacheHitCompliance) / 3;
    }

    calculatePredictions(metrics, forecastDays) {
        // Simple linear regression implementation
        const predictions = [];
        const fields = ['cpu_usage', 'memory_usage', 'disk_usage', 'response_time_ms', 'error_rate'];
        
        fields.forEach(field => {
            const values = metrics.map(m => parseFloat(m[field]));
            const n = values.length;
            
            // Calculate linear regression
            const x = Array.from({length: n}, (_, i) => i);
            const y = values;
            
            const sumX = x.reduce((a, b) => a + b, 0);
            const sumY = y.reduce((a, b) => a + b, 0);
            const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
            const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
            
            const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
            const intercept = (sumY - slope * sumX) / n;
            
            // Generate predictions
            for (let i = 1; i <= forecastDays; i++) {
                const predictedValue = slope * (n + i) + intercept;
                predictions.push({
                    field,
                    day: i,
                    predictedValue: Math.max(0, Math.min(100, predictedValue)), // Clamp to 0-100
                    trend: slope > 0 ? 'increasing' : slope < 0 ? 'decreasing' : 'stable'
                });
            }
        });
        
        return predictions;
    }

    calculateConfidence(metrics) {
        // Simple confidence calculation based on data consistency
        const cpuValues = metrics.map(m => parseFloat(m.cpu_usage));
        const stdDev = Math.sqrt(cpuValues.reduce((sq, n) => sq + Math.pow(n - cpuValues.reduce((a, b) => a + b, 0) / cpuValues.length, 2), 0) / cpuValues.length);
        const mean = cpuValues.reduce((a, b) => a + b, 0) / cpuValues.length;
        const coefficientOfVariation = stdDev / mean;
        
        if (coefficientOfVariation < 0.1) return 'HIGH';
        if (coefficientOfVariation < 0.2) return 'MEDIUM';
        return 'LOW';
    }

    // Cache management
    getCachedData(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }
        return null;
    }

    setCachedData(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }
}

module.exports = AdvancedAnalytics; 