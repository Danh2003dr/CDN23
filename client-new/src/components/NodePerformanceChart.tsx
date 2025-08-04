import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { Box, Typography, Paper, Chip } from '@mui/material';

interface NodeMetrics {
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  network_in: number;
  network_out: number;
  response_time: number;
  cache_hit_rate: number;
  connections: number;
  timestamp: string;
}

interface NodePerformanceChartProps {
  nodeId: number;
  nodeName: string;
  metrics: NodeMetrics[];
  timeRange: '1h' | '6h' | '24h' | '7d';
}

const NodePerformanceChart: React.FC<NodePerformanceChartProps> = ({
  nodeId,
  nodeName,
  metrics,
  timeRange
}) => {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  const formatValue = (value: number, unit: string = '') => {
    if (unit === '%') {
      return `${value.toFixed(1)}%`;
    }
    if (unit === 'ms') {
      return `${value.toFixed(0)}ms`;
    }
    if (unit === 'Mbps') {
      return `${value.toFixed(1)} Mbps`;
    }
    return value.toFixed(1);
  };

  const getPerformanceColor = (value: number, threshold: number = 80) => {
    if (value >= threshold) return '#f44336';
    if (value >= threshold * 0.7) return '#ff9800';
    return '#4caf50';
  };

  const chartData = metrics.map(metric => ({
    time: formatTime(metric.timestamp),
    cpu: metric.cpu_usage,
    memory: metric.memory_usage,
    disk: metric.disk_usage,
    responseTime: metric.response_time,
    cacheHitRate: metric.cache_hit_rate,
    networkIn: metric.network_in,
    networkOut: metric.network_out,
    connections: metric.connections
  }));

  return (
    <Paper sx={{ p: 3, borderRadius: 2 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          {nodeName} - Performance Metrics
        </Typography>
        <Chip 
          label={`Time Range: ${timeRange}`} 
          size="small" 
          variant="outlined" 
        />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
        {/* CPU and Memory Usage */}
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            System Resources
          </Typography>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  formatValue(value, '%'),
                  name === 'cpu' ? 'CPU' : name === 'memory' ? 'Memory' : 'Disk'
                ]}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="cpu"
                stackId="1"
                stroke="#8884d8"
                fill="#8884d8"
                fillOpacity={0.6}
                name="CPU"
              />
              <Area
                type="monotone"
                dataKey="memory"
                stackId="1"
                stroke="#82ca9d"
                fill="#82ca9d"
                fillOpacity={0.6}
                name="Memory"
              />
              <Area
                type="monotone"
                dataKey="disk"
                stackId="1"
                stroke="#ffc658"
                fill="#ffc658"
                fillOpacity={0.6}
                name="Disk"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Box>

        {/* Network Usage */}
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Network Traffic
          </Typography>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  formatValue(value, 'Mbps'),
                  name === 'networkIn' ? 'In' : 'Out'
                ]}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="networkIn"
                stroke="#2196f3"
                strokeWidth={2}
                name="Network In"
              />
              <Line
                type="monotone"
                dataKey="networkOut"
                stroke="#ff5722"
                strokeWidth={2}
                name="Network Out"
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>

        {/* Response Time and Cache Hit Rate */}
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Performance Metrics
          </Typography>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  name === 'responseTime' 
                    ? formatValue(value, 'ms') 
                    : formatValue(value, '%'),
                  name === 'responseTime' ? 'Response Time' : 'Cache Hit Rate'
                ]}
              />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="responseTime"
                stroke="#9c27b0"
                strokeWidth={2}
                name="Response Time"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="cacheHitRate"
                stroke="#4caf50"
                strokeWidth={2}
                name="Cache Hit Rate"
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>

        {/* Active Connections */}
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Active Connections
          </Typography>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => [
                  value.toLocaleString(),
                  'Active Connections'
                ]}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="connections"
                stroke="#ff9800"
                fill="#ff9800"
                fillOpacity={0.6}
                name="Connections"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Box>
      </Box>
    </Paper>
  );
};

export default NodePerformanceChart; 