import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  useTheme,
  Chip,

  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  Speed as SpeedIcon,

  Storage as StorageIcon,
  NetworkCheck as NetworkIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import MetricCard from '../components/MetricCard';

interface SystemOverview {
  totalNodes: number;
  activeNodes: number;
  totalTraffic: number;
  averageLatency: number;
  cacheHitRate: number;
  errorRate: number;
  onlineNodes: number;
  offlineNodes: number;
  maintenanceNodes: number;
  recentAlerts: number;
  trends: {
    cpu: { current: number; previous: number; change: number };
    memory: { current: number; previous: number; change: number };
    response_time: { current: number; previous: number; change: number };
  };
}

interface SystemStatus {
  status: 'online' | 'offline' | 'maintenance' | 'warning';
  message: string;
  timestamp: string;
}

interface RecentActivity {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
  timestamp: string;
  node_id?: number;
}

interface TopNode {
  id: number;
  name: string;
  status: string;
  location: string;
  avg_cpu: number;
  avg_memory: number;
  avg_response_time: number;
  avg_cache_hit_rate: number;
}

interface DashboardData {
  overview: SystemOverview;
  recentActivities: RecentActivity[];
  topNodes: TopNode[];
  healthScore: number;
  lastUpdated: string;
}

const Dashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    status: 'online',
    message: 'All systems operational',
    timestamp: new Date().toISOString(),
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { t } = useTranslation();
  const theme = useTheme();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return theme.palette.success.main;
      case 'warning':
        return theme.palette.warning.main;
      case 'maintenance':
        return theme.palette.info.main;
      case 'offline':
        return theme.palette.error.main;
      default:
        return theme.palette.text.secondary;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon color="success" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'error':
        return <ErrorIcon color="error" />;
      case 'info':
      default:
        return <InfoIcon color="info" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching dashboard data...');
      const response = await axios.get('/api/metrics/dashboard');
      
      console.log('📊 API Response:', response.data);
      
      if (response.data && response.data.success) {
        const data = response.data.data || {};
        console.log('📈 Raw data:', data);
        
        // Update system status based on health score
        const healthScore = data.healthScore || 85;
        let status: 'online' | 'offline' | 'maintenance' | 'warning' = 'online';
        let message = 'All systems operational';
        
        if (healthScore < 50) {
          status = 'offline';
          message = 'Critical system issues detected';
        } else if (healthScore < 80) {
          status = 'warning';
          message = 'System performance degraded';
        } else if (healthScore < 95) {
          status = 'maintenance';
          message = 'Minor issues detected';
        }
        
        setSystemStatus({
          status,
          message,
          timestamp: data.lastUpdated,
        });
        
        // Map API data to frontend expected format
        const mappedData = {
          overview: {
            totalNodes: data.overview.total_nodes || 0,
            activeNodes: data.overview.online_nodes || 0,
            totalTraffic: Number(data.overview.total_network_in || 0) + Number(data.overview.total_network_out || 0),
            averageLatency: data.overview.avg_response_time || 0,
            cacheHitRate: data.overview.avg_cache_hit_rate || 0,
            errorRate: data.overview.avg_error_rate || 0,
            onlineNodes: data.overview.online_nodes || 0,
            offlineNodes: data.overview.offline_nodes || 0,
            maintenanceNodes: data.overview.maintenance_nodes || 0,
            recentAlerts: data.overview.recent_alerts || 0,
            trends: data.overview.trends || {
              cpu: { current: 0, previous: 0, change: 0 },
              memory: { current: 0, previous: 0, change: 0 },
              response_time: { current: 0, previous: 0, change: 0 }
            }
          },
          recentActivities: data.recentActivities || [],
          topNodes: data.topNodes || [],
          healthScore: data.healthScore || 0,
          lastUpdated: data.lastUpdated || new Date().toISOString()
        };
        
        console.log('📊 Mapped data:', mappedData);
        setDashboardData(mappedData);
      } else {
        console.error('❌ API Error:', response.data.message);
        setError(response.data.message || 'Không thể tải dữ liệu hệ thống');
      }
    } catch (err: any) {
      console.error('❌ Error fetching dashboard data:', err);
      console.error('❌ Error details:', err.response?.data);
      setError('Không thể kết nối đến máy chủ');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px',
        }}
      >
        <CircularProgress size={60} sx={{ color: theme.palette.primary.main }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          {error}
        </Alert>
      </Box>
    );
  }

  if (!dashboardData) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          No dashboard data available
        </Alert>
      </Box>
    );
  }

  const { overview, recentActivities, topNodes, healthScore } = dashboardData;
  
  // Add safety checks for overview data
  if (!overview) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning" sx={{ borderRadius: 2 }}>
          Dashboard data is incomplete. Please refresh the page.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 0 }}>
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 600,
            color: theme.palette.text.primary,
            mb: 1,
          }}
        >
          {t('dashboard.title')}
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: theme.palette.text.secondary,
          }}
        >
          {t('dashboard.subtitle')}
        </Typography>
      </Box>

      {/* System Status */}
      <Box sx={{ mb: 3 }}>
        <Card
          sx={{
            borderRadius: 3,
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
            border: '1px solid #e0e0e0',
            background: 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)',
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: theme.palette.text.primary,
                }}
              >
                {t('dashboard.systemStatus')}
              </Typography>
              <Chip
                label={systemStatus.status.toUpperCase()}
                sx={{
                  backgroundColor: getStatusColor(systemStatus.status),
                  color: 'white',
                  fontWeight: 600,
                }}
              />
            </Box>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 1 }}>
              {systemStatus.message}
            </Typography>
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
              {t('dashboard.lastUpdated')}: {formatTimestamp(systemStatus.timestamp)}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Main Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title={t('dashboard.totalNodes')}
            value={overview.totalNodes || 0}
            subtitle={`${overview.onlineNodes || 0} ${t('dashboard.online')}, ${overview.offlineNodes || 0} offline`}
            color={theme.palette.primary.main}
            icon={<NetworkIcon />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title={t('dashboard.totalTraffic')}
            value={`${Number((overview.totalTraffic || 0) / 1000).toFixed(1)} GB`}
            subtitle={`${t('dashboard.traffic')} in last 24h`}
            color={theme.palette.success.main}
            icon={<SpeedIcon />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title={t('dashboard.averageLatency')}
            value={`${Number(overview.averageLatency || 0).toFixed(1)} ms`}
            subtitle={`${t('dashboard.latency')} average`}
            color={theme.palette.warning.main}
            icon={<NetworkIcon />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title={t('dashboard.cacheHitRate')}
            value={`${Number(overview.cacheHitRate || 0).toFixed(1)}%`}
            subtitle={t('dashboard.cacheHitRateDesc')}
            color={theme.palette.info.main}
            icon={<StorageIcon />}
          />
        </Grid>
      </Grid>

      {/* Performance Trends */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
              border: '1px solid #e0e0e0',
              background: 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)',
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Performance Trends (24h)
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
                      CPU
                    </Typography>
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                      {Number(overview.trends?.cpu?.current || 0).toFixed(1)}%
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 1 }}>
                      {(overview.trends?.cpu?.change || 0) > 0 ? (
                        <TrendingUpIcon color="error" fontSize="small" />
                      ) : (
                        <TrendingDownIcon color="success" fontSize="small" />
                      )}
                      <Typography variant="caption" sx={{ ml: 0.5 }}>
                        {Math.abs(Number(overview.trends?.cpu?.change || 0)).toFixed(1)}%
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.secondary.main }}>
                      Memory
                    </Typography>
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                      {Number(overview.trends?.memory?.current || 0).toFixed(1)}%
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 1 }}>
                      {(overview.trends?.memory?.change || 0) > 0 ? (
                        <TrendingUpIcon color="error" fontSize="small" />
                      ) : (
                        <TrendingDownIcon color="success" fontSize="small" />
                      )}
                      <Typography variant="caption" sx={{ ml: 0.5 }}>
                        {Math.abs(Number(overview.trends?.memory?.change || 0)).toFixed(1)}%
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.warning.main }}>
                      Response
                    </Typography>
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                      {Number(overview.trends?.response_time?.current || 0).toFixed(1)}ms
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 1 }}>
                      {(overview.trends?.response_time?.change || 0) > 0 ? (
                        <TrendingUpIcon color="error" fontSize="small" />
                      ) : (
                        <TrendingDownIcon color="success" fontSize="small" />
                      )}
                      <Typography variant="caption" sx={{ ml: 0.5 }}>
                        {Math.abs(Number(overview.trends?.response_time?.change || 0)).toFixed(1)}%
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
              border: '1px solid #e0e0e0',
              background: 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)',
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                System Health Score
              </Typography>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h2" sx={{ fontWeight: 700, color: getStatusColor(systemStatus.status) }}>
                  {healthScore || 0}
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  out of 100
                </Typography>
                <Chip
                  label={(healthScore || 0) >= 90 ? 'Excellent' : (healthScore || 0) >= 80 ? 'Good' : (healthScore || 0) >= 60 ? 'Fair' : 'Poor'}
                  sx={{
                    mt: 2,
                    backgroundColor: (healthScore || 0) >= 90 ? theme.palette.success.main : 
                                   (healthScore || 0) >= 80 ? theme.palette.info.main : 
                                   (healthScore || 0) >= 60 ? theme.palette.warning.main : theme.palette.error.main,
                    color: 'white',
                    fontWeight: 600,
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Top Performing Nodes */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
              border: '1px solid #e0e0e0',
              background: 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)',
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Top Performing Nodes
              </Typography>
              <List>
                {(topNodes || []).map((node, index) => (
                  <ListItem key={node.id} sx={{ px: 0 }}>
                    <ListItemIcon>
                      <Chip
                        label={node.status}
                        size="small"
                        sx={{
                          backgroundColor: getStatusColor(node.status),
                          color: 'white',
                          fontWeight: 600,
                        }}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={node.name}
                      secondary={`${node.location} • Cache: ${Number(node.avg_cache_hit_rate || 0).toFixed(1)}%`}
                    />
                    <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                      CPU: {Number(node.avg_cpu || 0).toFixed(1)}%
                    </Typography>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
              border: '1px solid #e0e0e0',
              background: 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)',
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                {t('dashboard.recentActivity')}
              </Typography>
              <List>
                {(recentActivities || []).map((activity) => (
                  <ListItem key={activity.id} sx={{ px: 0 }}>
                    <ListItemIcon>
                      {getActivityIcon(activity.type)}
                    </ListItemIcon>
                    <ListItemText
                      primary={activity.message}
                      secondary={formatTimestamp(activity.timestamp)}
                    />
                  </ListItem>
                ))}
                {(recentActivities || []).length === 0 && (
                  <ListItem>
                    <ListItemText
                      primary="No recent activity"
                      secondary="All systems are running smoothly"
                    />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 