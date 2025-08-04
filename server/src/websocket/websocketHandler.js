const socketIo = require('socket.io');

let io;

const initializeWebSocket = (server) => {
  io = socketIo(server, {
    cors: {
      origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://localhost:3003", "http://localhost:3004", "http://localhost:3005"],
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log('🔌 Client connected:', socket.id);

    // Join user to their room for personalized notifications
    socket.on('join-user', (userId) => {
      socket.join(`user-${userId}`);
      console.log(`👤 User ${userId} joined their room`);
    });

    // Handle node status updates
    socket.on('node-status-update', (data) => {
      console.log('📊 Node status update:', data);
      io.emit('node-status-changed', data);
    });

    // Handle metrics updates
    socket.on('metrics-update', (data) => {
      console.log('📈 Metrics update:', data);
      io.emit('metrics-changed', data);
    });

    // Handle new alerts
    socket.on('new-alert', (alert) => {
      console.log('🚨 New alert:', alert);
      io.emit('alert-created', alert);
    });

    socket.on('disconnect', () => {
      console.log('🔌 Client disconnected:', socket.id);
    });
  });

  return io;
};

// Function to send real-time notifications
const sendNotification = (userId, notification) => {
  if (io) {
    io.to(`user-${userId}`).emit('new-notification', notification);
  }
};

// Function to broadcast system alerts
const broadcastAlert = (alert) => {
  if (io) {
    io.emit('system-alert', alert);
  }
};

// Function to send node status updates
const sendNodeStatusUpdate = (nodeId, status) => {
  if (io) {
    io.emit('node-status-update', { nodeId, status, timestamp: new Date() });
  }
};

// Function to send metrics updates
const sendMetricsUpdate = (metrics) => {
  if (io) {
    io.emit('metrics-update', { ...metrics, timestamp: new Date() });
  }
};

module.exports = {
  initializeWebSocket,
  sendNotification,
  broadcastAlert,
  sendNodeStatusUpdate,
  sendMetricsUpdate
}; 