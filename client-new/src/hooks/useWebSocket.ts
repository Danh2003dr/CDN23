import { useEffect, useRef, useState } from 'react';
import io, { Socket } from 'socket.io-client';

interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
}

interface NodeStatusUpdate {
  nodeId: number;
  status: 'online' | 'offline' | 'maintenance';
  timestamp: string;
}

interface MetricsUpdate {
  nodeId: number;
  metrics: {
    cpu_usage: number;
    memory_usage: number;
    disk_usage: number;
    network_in: number;
    network_out: number;
    response_time: number;
    cache_hit_rate: number;
    connections: number;
  };
  timestamp: string;
}

interface AlertMessage {
  id: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  nodeId?: number;
  timestamp: string;
}

const useWebSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [nodeStatusUpdates, setNodeStatusUpdates] = useState<NodeStatusUpdate[]>([]);
  const [metricsUpdates, setMetricsUpdates] = useState<MetricsUpdate[]>([]);
  const [alerts, setAlerts] = useState<AlertMessage[]>([]);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Connect to WebSocket server
    socketRef.current = io('http://localhost:5000', {
      transports: ['websocket', 'polling'],
    });

    const socket = socketRef.current;

    // Connection events
    socket.on('connect', () => {
      console.log('🔌 WebSocket connected');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('🔌 WebSocket disconnected');
      setIsConnected(false);
    });

    // Node status updates
    socket.on('node-status-changed', (data: NodeStatusUpdate) => {
      console.log('📊 Node status update:', data);
      setNodeStatusUpdates(prev => [...prev, data]);
    });

    // Metrics updates
    socket.on('metrics-changed', (data: MetricsUpdate) => {
      console.log('📈 Metrics update:', data);
      setMetricsUpdates(prev => [...prev, data]);
    });

    // Alert updates
    socket.on('alert-created', (alert: AlertMessage) => {
      console.log('🚨 New alert:', alert);
      setAlerts(prev => [...prev, alert]);
    });

    socket.on('system-alert', (alert: AlertMessage) => {
      console.log('🚨 System alert:', alert);
      setAlerts(prev => [...prev, alert]);
    });

    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  // Join user room
  const joinUserRoom = (userId: number) => {
    if (socketRef.current) {
      socketRef.current.emit('join-user', userId);
    }
  };

  // Send node status update
  const sendNodeStatusUpdate = (nodeId: number, status: string) => {
    if (socketRef.current) {
      socketRef.current.emit('node-status-update', { nodeId, status });
    }
  };

  // Send metrics update
  const sendMetricsUpdate = (metrics: any) => {
    if (socketRef.current) {
      socketRef.current.emit('metrics-update', metrics);
    }
  };

  // Clear old updates (keep only last 100)
  useEffect(() => {
    if (nodeStatusUpdates.length > 100) {
      setNodeStatusUpdates(prev => prev.slice(-100));
    }
  }, [nodeStatusUpdates]);

  useEffect(() => {
    if (metricsUpdates.length > 100) {
      setMetricsUpdates(prev => prev.slice(-100));
    }
  }, [metricsUpdates]);

  useEffect(() => {
    if (alerts.length > 50) {
      setAlerts(prev => prev.slice(-50));
    }
  }, [alerts]);

  return {
    isConnected,
    nodeStatusUpdates,
    metricsUpdates,
    alerts,
    joinUserRoom,
    sendNodeStatusUpdate,
    sendMetricsUpdate,
  };
};

export default useWebSocket; 