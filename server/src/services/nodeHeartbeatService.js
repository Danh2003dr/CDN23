const mysql = require('mysql2/promise');
const { sendNodeStatusUpdate, sendMetricsUpdate, broadcastAlert } = require('../websocket/websocketHandler');

class NodeHeartbeatService {
    constructor() {
        this.db = mysql.createPool({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'cdn_management'
        });
        this.nodeStatus = new Map(); // Track node status: { nodeId: { lastHeartbeat, status, metrics } }
        this.heartbeatInterval = 5000; // 5 seconds
        this.offlineThreshold = 10000; // 10 seconds
        this.isRunning = false;
        this.heartbeatTimer = null;
    }

    // Start heartbeat monitoring
    async start() {
        if (this.isRunning) {
            console.log('⚠️  Node heartbeat service already running');
            return;
        }

        console.log('🚀 Starting Node Heartbeat Service...');
        this.isRunning = true;

        // Initialize node status from database
        await this.initializeNodeStatus();

        // Start heartbeat simulation
        this.heartbeatTimer = setInterval(() => {
            this.simulateHeartbeats();
        }, this.heartbeatInterval);

        console.log('✅ Node Heartbeat Service started');
    }

    // Stop heartbeat monitoring
    stop() {
        if (!this.isRunning) {
            console.log('⚠️  Node heartbeat service not running');
            return;
        }

        console.log('🛑 Stopping Node Heartbeat Service...');
        this.isRunning = false;

        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }

        console.log('✅ Node Heartbeat Service stopped');
    }

    // Initialize node status from database
    async initializeNodeStatus() {
        try {
            const [nodes] = await this.db.execute('SELECT id, name, status FROM cdn_nodes');
            
            for (const node of nodes) {
                this.nodeStatus.set(node.id, {
                    lastHeartbeat: Date.now(),
                    status: node.status,
                    metrics: null,
                    name: node.name
                });
            }

            console.log(`📍 Initialized ${nodes.length} nodes for heartbeat monitoring`);
        } catch (error) {
            console.error('❌ Error initializing node status:', error);
        }
    }

    // Simulate heartbeats for all nodes
    async simulateHeartbeats() {
        try {
            const now = Date.now();
            const updates = [];

            for (const [nodeId, nodeInfo] of this.nodeStatus) {
                // Check if node should go offline (no heartbeat for 10 seconds)
                const timeSinceLastHeartbeat = now - nodeInfo.lastHeartbeat;
                
                if (timeSinceLastHeartbeat > this.offlineThreshold && nodeInfo.status !== 'offline') {
                    // Node went offline
                    await this.updateNodeStatus(nodeId, 'offline');
                    await this.createOfflineAlert(nodeId, nodeInfo.name);
                    console.log(`🔴 Node ${nodeId} (${nodeInfo.name}) went offline`);
                } else if (timeSinceLastHeartbeat <= this.offlineThreshold && nodeInfo.status === 'offline') {
                    // Node came back online
                    await this.updateNodeStatus(nodeId, 'online');
                    console.log(`🟢 Node ${nodeId} (${nodeInfo.name}) came back online`);
                }

                // Generate realistic metrics for online nodes
                if (nodeInfo.status === 'online') {
                    const metrics = this.generateRealisticMetrics(nodeId);
                    await this.updateNodeMetrics(nodeId, metrics);
                    
                    // Update last heartbeat
                    this.nodeStatus.get(nodeId).lastHeartbeat = now;
                    this.nodeStatus.get(nodeId).metrics = metrics;

                    updates.push({
                        nodeId,
                        status: nodeInfo.status,
                        metrics,
                        timestamp: new Date().toISOString()
                    });
                }
            }

            // Send real-time updates via WebSocket
            if (updates.length > 0) {
                this.broadcastUpdates(updates);
            }

        } catch (error) {
            console.error('❌ Error in heartbeat simulation:', error);
        }
    }

    // Generate realistic metrics for a node
    generateRealisticMetrics(nodeId) {
        const baseMetrics = {
            cpu_usage: Math.random() * 80 + 10, // 10-90%
            memory_usage: Math.random() * 70 + 20, // 20-90%
            disk_usage: Math.random() * 60 + 30, // 30-90%
            network_in_mbps: Math.random() * 500 + 100, // 100-600 Mbps
            network_out_mbps: Math.random() * 400 + 80, // 80-480 Mbps
            response_time_ms: Math.random() * 50 + 10, // 10-60ms
            error_rate: Math.random() * 5, // 0-5%
            active_connections: Math.floor(Math.random() * 1000) + 100, // 100-1100
            cache_hit_rate: Math.random() * 30 + 70, // 70-100%
            timestamp: new Date().toISOString()
        };

        // Add some variation based on node ID
        const variation = (nodeId % 5) * 0.1;
        baseMetrics.cpu_usage = Math.min(100, baseMetrics.cpu_usage + variation * 20);
        baseMetrics.memory_usage = Math.min(100, baseMetrics.memory_usage + variation * 15);

        return baseMetrics;
    }

    // Update node status in database
    async updateNodeStatus(nodeId, status) {
        try {
            await this.db.execute(
                'UPDATE cdn_nodes SET status = ?, updated_at = NOW() WHERE id = ?',
                [status, nodeId]
            );

            // Update local status
            if (this.nodeStatus.has(nodeId)) {
                this.nodeStatus.get(nodeId).status = status;
            }

            // Send WebSocket update
            sendNodeStatusUpdate(nodeId, status);

        } catch (error) {
            console.error(`❌ Error updating node ${nodeId} status:`, error);
        }
    }

    // Update node metrics in database
    async updateNodeMetrics(nodeId, metrics) {
        try {
            const query = `
                INSERT INTO node_metrics (
                    node_id, cpu_usage, memory_usage, disk_usage,
                    network_in_mbps, network_out_mbps, response_time_ms,
                    error_rate, active_connections, cache_hit_rate, timestamp
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const values = [
                nodeId,
                metrics.cpu_usage.toFixed(2),
                metrics.memory_usage.toFixed(2),
                metrics.disk_usage.toFixed(2),
                metrics.network_in_mbps.toFixed(2),
                metrics.network_out_mbps.toFixed(2),
                metrics.response_time_ms.toFixed(2),
                metrics.error_rate.toFixed(2),
                metrics.active_connections,
                metrics.cache_hit_rate.toFixed(2),
                metrics.timestamp
            ];

            await this.db.execute(query, values);

        } catch (error) {
            console.error(`❌ Error updating node ${nodeId} metrics:`, error);
        }
    }

    // Create offline alert
    async createOfflineAlert(nodeId, nodeName) {
        try {
                    const alertQuery = `
            INSERT INTO alerts (
                alert_type, severity, message, node_id, created_at
            ) VALUES (?, ?, ?, ?, NOW())
        `;

        const alertValues = [
            'node_offline',
            'high',
            `Node ${nodeName} (ID: ${nodeId}) is offline`,
            nodeId
        ];

            await this.db.execute(alertQuery, alertValues);

            // Send WebSocket alert
            broadcastAlert({
                type: 'node_offline',
                severity: 'high',
                message: `Node ${nodeName} (ID: ${nodeId}) is offline`,
                nodeId,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error(`❌ Error creating offline alert for node ${nodeId}:`, error);
        }
    }

    // Broadcast updates via WebSocket
    broadcastUpdates(updates) {
        for (const update of updates) {
            // Send metrics update
            sendMetricsUpdate({
                nodeId: update.nodeId,
                metrics: update.metrics,
                timestamp: update.timestamp
            });

            // Send status update if changed
            if (update.status) {
                sendNodeStatusUpdate(update.nodeId, update.status);
            }
        }
    }

    // Get current node status
    getNodeStatus() {
        return Array.from(this.nodeStatus.entries()).map(([nodeId, info]) => ({
            nodeId,
            name: info.name,
            status: info.status,
            lastHeartbeat: info.lastHeartbeat,
            metrics: info.metrics
        }));
    }

    // Force node offline (for testing)
    async forceNodeOffline(nodeId) {
        if (this.nodeStatus.has(nodeId)) {
            this.nodeStatus.get(nodeId).lastHeartbeat = Date.now() - this.offlineThreshold - 1000;
            console.log(`🔧 Forced node ${nodeId} offline for testing`);
        }
    }

    // Force node online (for testing)
    async forceNodeOnline(nodeId) {
        if (this.nodeStatus.has(nodeId)) {
            this.nodeStatus.get(nodeId).lastHeartbeat = Date.now();
            this.nodeStatus.get(nodeId).status = 'online';
            await this.updateNodeStatus(nodeId, 'online');
            console.log(`🔧 Forced node ${nodeId} online for testing`);
        }
    }
}

module.exports = NodeHeartbeatService; 