require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const compression = require('compression');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

// Import routes
const authRoutes = require('./routes/auth');
const nodesRoutes = require('./routes/nodes');
const metricsRoutes = require('./routes/metrics');
const alertsRoutes = require('./routes/alerts');
const contentRoutes = require('./routes/content');
const analyticsRoutes = require('./routes/analytics');
const permissionsRoutes = require('./routes/permissions');
const activityLogsRoutes = require('./routes/activityLogs');
const accessLogsRoutes = require('./routes/accessLogs');

// Import middleware
const { auth } = require('./middleware/auth');

// Import WebSocket handler
const { initializeWebSocket } = require('./websocket/websocketHandler');

// Import Real Data Collector
const RealDataCollector = require('./services/realDataCollector');
const realDataConfig = require('./config/realDataConfig');

// Import Node Heartbeat Service
const NodeHeartbeatService = require('./services/nodeHeartbeatService');

// Import Performance Monitoring Service
const PerformanceMonitoringService = require('./services/performanceMonitoringService');

const app = express();
const server = http.createServer(app);

// Initialize WebSocket
const io = initializeWebSocket(server);

// Initialize Real Data Collector
const dataCollector = new RealDataCollector();

// Initialize Node Heartbeat Service
const heartbeatService = new NodeHeartbeatService();

// Initialize Performance Monitoring Service
const monitoringService = new PerformanceMonitoringService();

// Security middleware
app.use(helmet());
app.use(compression());

// CORS configuration
app.use(cors({
    origin: [
        process.env.CLIENT_URL || "http://localhost:3000",
        "http://localhost:3002",
        "http://localhost:3001",
        "http://localhost:3003",
        "http://localhost:3004",
        "http://localhost:3005"
    ],
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // limit each IP to 1000 requests per windowMs
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.'
    }
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // limit each IP to 50 requests per windowMs
    message: {
        success: false,
        message: 'Too many authentication attempts, please try again later.'
    }
});

app.use('/api/auth', authLimiter);
app.use('/api', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'CDN Management System is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/nodes', nodesRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/permissions', permissionsRoutes);
app.use('/api/activity-logs', activityLogsRoutes);
app.use('/api/access-logs', accessLogsRoutes);

// WebSocket connection handling
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Start real data collection and heartbeat service
const startServices = async () => {
    try {
        // Start Node Heartbeat Service (always enabled for real-time updates)
        console.log('🚀 Starting Node Heartbeat Service...');
        await heartbeatService.start();
        console.log('✅ Node Heartbeat Service started successfully');
        
        // Start Performance Monitoring Service
        console.log('🚀 Starting Performance Monitoring Service...');
        await monitoringService.start();
        console.log('✅ Performance Monitoring Service started successfully');
        
        // Check if real data collection is enabled
        const useRealData = process.env.USE_REAL_DATA === 'true';
        
        if (useRealData) {
            console.log('🚀 Starting real data collection...');
            
            // Start collecting real data
            dataCollector.startCollection(realDataConfig.nodes);
            
            console.log('✅ Real data collection started successfully');
            console.log(`📊 Collecting data from ${realDataConfig.nodes.length} nodes`);
            
            // Log collection sources
            realDataConfig.nodes.forEach(node => {
                console.log(`  - ${node.name}: ${node.dataSource}`);
            });
        } else {
            console.log('📊 Using demo data (real data collection disabled)');
            console.log('💡 To enable real data, set USE_REAL_DATA=true in .env');
        }
    } catch (error) {
        console.error('❌ Failed to start services:', error);
        console.log('📊 Falling back to demo data');
    }
};

// Graceful shutdown
const gracefulShutdown = () => {
    console.log('🛑 Shutting down gracefully...');
    
    // Stop heartbeat service
    heartbeatService.stop();
    
    // Stop monitoring service
    monitoringService.stop();
    
    // Stop real data collection
    dataCollector.stopCollection();
    
    // Close server
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
    
    // Force close after 10 seconds
    setTimeout(() => {
        console.error('❌ Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 10000);
};

// Handle shutdown signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`🚀 CDN Management Server running on port ${PORT}`);
    console.log(`🌐 Health check: http://localhost:${PORT}/health`);
    console.log(`📊 API Base URL: http://localhost:${PORT}/api`);
    
    // Start services after server is ready
    startServices();
});

// Error handling
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    // Log error but don't shutdown to prevent auto-shutdown
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    // Log error but don't shutdown to prevent auto-shutdown
});

module.exports = { app, server, io }; 