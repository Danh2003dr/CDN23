import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Speed as SpeedIcon,
  Memory as MemoryIcon,
  Storage as StorageIcon,
  NetworkCheck as NetworkIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

interface NodeMetrics {
  node_id: number;
  node_name: string;
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  response_time: number;
  error_rate: number;
  cache_hit_rate: number;
  network_in: number;
  network_out: number;
  active_connections: number;
  timestamp: string;
}

interface SystemMetrics {
  total_nodes: number;
  avg_cpu_usage: number;
  avg_memory_usage: number;
  avg_disk_usage: number;
  avg_response_time: number;
  avg_error_rate: number;
  avg_cache_hit_rate: number;
  total_network_in: number;
  total_network_out: number;
}

const Metrics: React.FC = () => {
  const { t } = useTranslation();
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [nodeMetrics, setNodeMetrics] = useState<NodeMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedNode, setSelectedNode] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('1h');

  useEffect(() => {
    fetchMetrics();
  }, [timeRange]);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const [overviewRes, nodesRes] = await Promise.all([
        axios.get('/api/metrics/overview'),
        axios.get('/api/metrics/summary')
      ]);

      if (overviewRes.data && overviewRes.data.success) {
        const data = overviewRes.data.data || {};
        setSystemMetrics({
          total_nodes: Number(data.total_nodes || 0),
          avg_cpu_usage: Number(data.avg_cpu_usage || 0),
          avg_memory_usage: Number(data.avg_memory_usage || 0),
          avg_disk_usage: Number(data.avg_disk_usage || 0),
          avg_response_time: Number(data.avg_response_time || 0),
          avg_error_rate: Number(data.avg_error_rate || 0),
          avg_cache_hit_rate: Number(data.avg_cache_hit_rate || 0),
          total_network_in: Number(data.total_network_in || 0),
          total_network_out: Number(data.total_network_out || 0)
        });
      }

      // Simulate node metrics data since we don't have individual node metrics endpoint
      const mockNodeMetrics: NodeMetrics[] = [
        {
          node_id: 37,
          node_name: 'Edge Node - Can Tho',
          cpu_usage: 45.2,
          memory_usage: 52.8,
          disk_usage: 58.3,
          response_time: 32.1,
          error_rate: 2.1,
          cache_hit_rate: 85.7,
          network_in: 1250.5,
          network_out: 1890.2,
          active_connections: 1250,
          timestamp: new Date().toISOString()
        },
        {
          node_id: 38,
          node_name: 'Edge Node - Da Nang',
          cpu_usage: 38.9,
          memory_usage: 48.2,
          disk_usage: 52.1,
          response_time: 28.5,
          error_rate: 1.8,
          cache_hit_rate: 88.3,
          network_in: 980.3,
          network_out: 1450.7,
          active_connections: 980,
          timestamp: new Date().toISOString()
        },
        {
          node_id: 39,
          node_name: 'Origin Node - Hanoi',
          cpu_usage: 62.4,
          memory_usage: 68.9,
          disk_usage: 72.5,
          response_time: 45.2,
          error_rate: 3.2,
          cache_hit_rate: 78.9,
          network_in: 2100.8,
          network_out: 3200.1,
          active_connections: 2100,
          timestamp: new Date().toISOString()
        }
      ];
      setNodeMetrics(mockNodeMetrics);

    } catch (error) {
      console.error('Failed to fetch metrics:', error);
      setError('Failed to fetch metrics data');
    } finally {
      setLoading(false);
    }
  };

  const getPerformanceColor = (value: number, threshold: number = 80) => {
    if (value >= threshold) return 'error';
    if (value >= threshold * 0.7) return 'warning';
    return 'success';
  };

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <TrendingUpIcon color="error" />;
    if (current < previous) return <TrendingDownIcon color="success" />;
    return <TrendingUpIcon color="disabled" />;
  };

  const filteredNodeMetrics = selectedNode === 'all' 
    ? nodeMetrics 
    : nodeMetrics.filter(node => node.node_id.toString() === selectedNode);

  if (loading) {
    return (
      <Box sx={{ width: '100%' }}>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {t('Metrics')}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>{t('Node')}</InputLabel>
                <Select
                  value={selectedNode}
                  label={t('Node')}
                  onChange={(e) => setSelectedNode(e.target.value)}
                >
                  <MenuItem value="all">{t('All Nodes')}</MenuItem>
                  {nodeMetrics.map((node) => (
                    <MenuItem key={node.node_id} value={node.node_id.toString()}>
                      {node.node_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>{t('Time Range')}</InputLabel>
                <Select
                  value={timeRange}
                  label={t('Time Range')}
                  onChange={(e) => setTimeRange(e.target.value)}
                >
                  <MenuItem value="1h">{t('Last Hour')}</MenuItem>
                  <MenuItem value="6h">{t('Last 6 Hours')}</MenuItem>
                  <MenuItem value="24h">{t('Last 24 Hours')}</MenuItem>
                  <MenuItem value="7d">{t('Last 7 Days')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={fetchMetrics}
              >
                {t('Refresh')}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* System Overview */}
      {systemMetrics && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <SpeedIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">
                    {t('Avg Response Time')}
                  </Typography>
                </Box>
                <Typography variant="h4" color="primary">
                  {systemMetrics.avg_response_time.toFixed(1)}ms
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={Math.min(systemMetrics.avg_response_time / 2, 100)}
                  color={getPerformanceColor(systemMetrics.avg_response_time, 100)}
                  sx={{ mt: 1 }}
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <CheckCircleIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">
                    {t('Cache Hit Rate')}
                  </Typography>
                </Box>
                <Typography variant="h4" color="success">
                  {systemMetrics.avg_cache_hit_rate.toFixed(1)}%
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={systemMetrics.avg_cache_hit_rate}
                  color="success"
                  sx={{ mt: 1 }}
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <WarningIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">
                    {t('Error Rate')}
                  </Typography>
                </Box>
                <Typography variant="h4" color="error">
                  {systemMetrics.avg_error_rate.toFixed(2)}%
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={systemMetrics.avg_error_rate * 10}
                  color="error"
                  sx={{ mt: 1 }}
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <NetworkIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">
                    {t('Network Traffic')}
                  </Typography>
                </Box>
                <Typography variant="h4" color="info">
                  {(systemMetrics.total_network_in / 1024).toFixed(1)} Gbps
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={Math.min(systemMetrics.total_network_in / 1000, 100)}
                  color="info"
                  sx={{ mt: 1 }}
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Node Metrics Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {t('Node Performance Metrics')}
          </Typography>
          
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('Node Name')}</TableCell>
                  <TableCell align="center">{t('CPU')}</TableCell>
                  <TableCell align="center">{t('Memory')}</TableCell>
                  <TableCell align="center">{t('Disk')}</TableCell>
                  <TableCell align="center">{t('Response Time')}</TableCell>
                  <TableCell align="center">{t('Error Rate')}</TableCell>
                  <TableCell align="center">{t('Cache Hit')}</TableCell>
                  <TableCell align="center">{t('Network In')}</TableCell>
                  <TableCell align="center">{t('Network Out')}</TableCell>
                  <TableCell align="center">{t('Connections')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredNodeMetrics.map((node) => (
                  <TableRow key={node.node_id} hover>
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {node.node_name}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography variant="body2" sx={{ mr: 1 }}>
                          {node.cpu_usage.toFixed(1)}%
                        </Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={node.cpu_usage}
                          color={getPerformanceColor(node.cpu_usage)}
                          sx={{ width: 60, height: 6, borderRadius: 3 }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography variant="body2" sx={{ mr: 1 }}>
                          {node.memory_usage.toFixed(1)}%
                        </Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={node.memory_usage}
                          color={getPerformanceColor(node.memory_usage)}
                          sx={{ width: 60, height: 6, borderRadius: 3 }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography variant="body2" sx={{ mr: 1 }}>
                          {node.disk_usage.toFixed(1)}%
                        </Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={node.disk_usage}
                          color={getPerformanceColor(node.disk_usage)}
                          sx={{ width: 60, height: 6, borderRadius: 3 }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={`${node.response_time.toFixed(1)}ms`}
                        color={getPerformanceColor(node.response_time, 50) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={`${node.error_rate.toFixed(2)}%`}
                        color={getPerformanceColor(node.error_rate * 10, 5) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={`${node.cache_hit_rate.toFixed(1)}%`}
                        color="success"
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2">
                        {(node.network_in / 1024).toFixed(1)} Gbps
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2">
                        {(node.network_out / 1024).toFixed(1)} Gbps
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2">
                        {node.active_connections.toLocaleString()}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Metrics; 