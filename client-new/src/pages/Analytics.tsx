import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Grid,
  CircularProgress,
  Alert,
  useTheme,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip,
  Menu,
} from '@mui/material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  ComposedChart,
  Scatter,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Speed,
  Memory,
  Storage,
  NetworkCheck,
  Warning,
  Error,
  Info,
  ExpandMore,
  Refresh,
  FilterList,
  Analytics as AnalyticsIcon,
  Timeline,
  Assessment,
  LocationOn,
  Computer,
  Download,
  GetApp,
  FileDownload,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import LoadingSpinner from '../components/LoadingSpinner';
import MetricCard from '../components/MetricCard';

interface AnalyticsData {
  performanceTrends: any[];
  nodeComparison: any[];
  geographicDistribution: any[];
  realTimeMetrics: any[];
  userAccess: any[];
  anomalies: any[];
  summary?: any;
}

interface FilterState {
  period: string;
  nodeId: string;
  metric: string;
  threshold: string;
}

interface ExportOptions {
  format: 'csv' | 'excel';
  dataType: 'performance' | 'geographic' | 'realtime' | 'anomalies';
  period: string;
}

const Analytics: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState<FilterState>({
    period: '7',
    nodeId: '',
    metric: 'all',
    threshold: '2',
  });
  const [nodes, setNodes] = useState<any[]>([]);
  const [exportAnchorEl, setExportAnchorEl] = useState<null | HTMLElement>(null);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'csv',
    dataType: 'performance',
    period: '7',
  });
  const { t } = useTranslation();
  const theme = useTheme();

  useEffect(() => {
    fetchNodes();
    fetchAnalyticsData();
  }, [filters]);

  const fetchNodes = async () => {
    try {
      const response = await axios.get('/api/nodes');
      if (response.data.success) {
        setNodes(response.data.data.nodes);
      }
    } catch (error) {
      console.error('Failed to fetch nodes:', error);
    }
  };

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const [performanceRes, comparisonRes, geographicRes, realTimeRes, userAccessRes, anomaliesRes, summaryRes] = await Promise.all([
        axios.get(`/api/analytics/performance-trends?days=${filters.period}&nodeId=${filters.nodeId}&metric=${filters.metric}`),
        axios.get(`/api/analytics/node-comparison?period=${filters.period}&metric=${filters.metric}`),
        axios.get(`/api/analytics/geographic-distribution?period=${filters.period}`),
        axios.get(`/api/analytics/real-time-metrics?hours=24&interval=1`),
        axios.get(`/api/analytics/user-access?period=${filters.period}`),
        axios.get(`/api/analytics/anomaly-detection?threshold=${filters.threshold}&hours=24`),
        axios.get('/api/analytics/summary'),
      ]);

      setData({
        performanceTrends: Array.isArray(performanceRes.data.data?.trends) ? performanceRes.data.data.trends : [],
        nodeComparison: Array.isArray(comparisonRes.data.data?.nodes) ? comparisonRes.data.data.nodes : [],
        geographicDistribution: Array.isArray(geographicRes.data.data?.locations) ? geographicRes.data.data.locations : [],
        realTimeMetrics: Array.isArray(realTimeRes.data.data?.metrics) ? realTimeRes.data.data.metrics : [],
        userAccess: Array.isArray(userAccessRes.data.data?.userAccess) ? userAccessRes.data.data.userAccess : [],
        anomalies: Array.isArray(anomaliesRes.data.data?.anomalies) ? anomaliesRes.data.data.anomalies : [],
        summary: summaryRes.data.data,
      });
    } catch (err: any) {
      console.error('Error fetching analytics data:', err);
      setError('Không thể tải dữ liệu analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleFilterChange = (filter: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [filter]: value }));
  };

  const COLORS = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.error.main,
    theme.palette.info.main,
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return theme.palette.error.main;
      case 'warning': return theme.palette.warning.main;
      case 'normal': return theme.palette.success.main;
      default: return theme.palette.info.main;
    }
  };

  const getPerformanceGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return theme.palette.success.main;
      case 'B': return theme.palette.info.main;
      case 'C': return theme.palette.warning.main;
      case 'D': return theme.palette.error.main;
      case 'F': return theme.palette.error.dark;
      default: return theme.palette.text.secondary;
    }
  };

  const handleExportClick = (event: React.MouseEvent<HTMLElement>) => {
    setExportAnchorEl(event.currentTarget);
  };

  const handleExportClose = () => {
    setExportAnchorEl(null);
  };

  const handleExportData = async () => {
    try {
      const response = await axios.post('/api/analytics/export', {
        format: exportOptions.format,
        dataType: exportOptions.dataType,
        period: exportOptions.period,
        filters: filters,
      }, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `cdn-analytics-${exportOptions.dataType}-${exportOptions.period}days.${exportOptions.format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
    handleExportClose();
  };

  if (loading) {
    return <LoadingSpinner message="Đang tải dữ liệu analytics..." />;
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
          {t('analytics.title')}
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: theme.palette.text.secondary,
          }}
        >
          {t('analytics.subtitle')}
        </Typography>
      </Box>

      {/* Analytics Summary Cards */}
      {data?.summary && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Total Nodes"
              value={data.summary.nodes?.total || 0}
              subtitle={`${data.summary.nodes?.online || 0} online, ${data.summary.nodes?.offline || 0} offline`}
              color={theme.palette.primary.main}
              icon={<Computer />}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Avg CPU Usage"
              value={`${(data.summary.performance?.avgCpu || 0).toFixed(1)}%`}
              subtitle={`Max: ${(data.summary.performance?.maxCpu || 0).toFixed(1)}%`}
              color={theme.palette.warning.main}
              icon={<Speed />}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Avg Memory Usage"
              value={`${(data.summary.performance?.avgMemory || 0).toFixed(1)}%`}
              subtitle={`Max: ${(data.summary.performance?.maxMemory || 0).toFixed(1)}%`}
              color={theme.palette.info.main}
              icon={<Memory />}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Cache Hit Rate"
              value={`${(data.summary.performance?.avgCacheHitRate || 0).toFixed(1)}%`}
              subtitle="Average cache efficiency"
              color={theme.palette.success.main}
              icon={<Storage />}
            />
          </Grid>
        </Grid>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3, borderRadius: 3, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <FilterList sx={{ color: theme.palette.text.secondary }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Filters:
            </Typography>
            
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Period</InputLabel>
              <Select
                value={filters.period}
                label="Period"
                onChange={(e) => handleFilterChange('period', e.target.value)}
              >
                <MenuItem value="1">1 Day</MenuItem>
                <MenuItem value="7">7 Days</MenuItem>
                <MenuItem value="30">30 Days</MenuItem>
                <MenuItem value="90">90 Days</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Node</InputLabel>
              <Select
                value={filters.nodeId}
                label="Node"
                onChange={(e) => handleFilterChange('nodeId', e.target.value)}
              >
                <MenuItem value="">All Nodes</MenuItem>
                {nodes.map((node) => (
                  <MenuItem key={node.id} value={node.id}>
                    {node.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Metric</InputLabel>
              <Select
                value={filters.metric}
                label="Metric"
                onChange={(e) => handleFilterChange('metric', e.target.value)}
              >
                <MenuItem value="all">All Metrics</MenuItem>
                <MenuItem value="cpu">CPU</MenuItem>
                <MenuItem value="memory">Memory</MenuItem>
                <MenuItem value="disk">Disk</MenuItem>
                <MenuItem value="network">Network</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Threshold</InputLabel>
              <Select
                value={filters.threshold}
                label="Threshold"
                onChange={(e) => handleFilterChange('threshold', e.target.value)}
              >
                <MenuItem value="1.5">1.5σ</MenuItem>
                <MenuItem value="2">2σ</MenuItem>
                <MenuItem value="2.5">2.5σ</MenuItem>
                <MenuItem value="3">3σ</MenuItem>
              </Select>
            </FormControl>

            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={fetchAnalyticsData}
              size="small"
            >
              Refresh
            </Button>

            <Button
              variant="contained"
              startIcon={<Download />}
              onClick={handleExportClick}
              size="small"
              sx={{ ml: 1 }}
            >
              Export
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Export Menu */}
      <Menu
        anchorEl={exportAnchorEl}
        open={Boolean(exportAnchorEl)}
        onClose={handleExportClose}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 200,
            boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
            borderRadius: 2,
          },
        }}
      >
        <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Export Options
          </Typography>
        </Box>
        
        <Box sx={{ p: 2 }}>
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>Data Type</InputLabel>
            <Select
              value={exportOptions.dataType}
              label="Data Type"
              onChange={(e) => setExportOptions(prev => ({ ...prev, dataType: e.target.value as any }))}
            >
              <MenuItem value="performance">Performance Trends</MenuItem>
              <MenuItem value="geographic">Geographic Distribution</MenuItem>
              <MenuItem value="realtime">Real-time Metrics</MenuItem>
              <MenuItem value="anomalies">Anomalies</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>Format</InputLabel>
            <Select
              value={exportOptions.format}
              label="Format"
              onChange={(e) => setExportOptions(prev => ({ ...prev, format: e.target.value as any }))}
            >
              <MenuItem value="csv">CSV</MenuItem>
              <MenuItem value="excel">Excel</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>Period</InputLabel>
            <Select
              value={exportOptions.period}
              label="Period"
              onChange={(e) => setExportOptions(prev => ({ ...prev, period: e.target.value }))}
            >
              <MenuItem value="1">1 Day</MenuItem>
              <MenuItem value="7">7 Days</MenuItem>
              <MenuItem value="30">30 Days</MenuItem>
              <MenuItem value="90">90 Days</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="contained"
            fullWidth
            startIcon={<FileDownload />}
            onClick={handleExportData}
          >
            Download Report
          </Button>
        </Box>
      </Menu>

      <Card
        sx={{
          borderRadius: 3,
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
          border: '1px solid #e0e0e0',
          background: 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)',
        }}
      >
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 500,
                fontSize: '1rem',
                minHeight: 64,
                color: theme.palette.text.secondary,
                '&.Mui-selected': {
                  color: theme.palette.primary.main,
                  fontWeight: 600,
                },
              },
              '& .MuiTabs-indicator': {
                backgroundColor: theme.palette.primary.main,
                height: 3,
              },
            }}
          >
            <Tab label={t('analytics.performanceTrends')} />
            <Tab label={t('analytics.nodeComparison')} />
            <Tab label={t('analytics.geographicDistribution')} />
            <Tab label={t('analytics.realTimeMetrics')} />
            <Tab label={t('analytics.userAccess')} />
            <Tab label={t('analytics.anomalies')} />
          </Tabs>
        </Box>

        <Box sx={{ p: 3 }}>
          {activeTab === 0 && (
            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: theme.palette.text.primary,
                  mb: 3,
                }}
              >
                {t('analytics.performanceTrends')}
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={data?.performanceTrends || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis
                    dataKey="date"
                    stroke={theme.palette.text.secondary}
                    fontSize={12}
                  />
                  <YAxis stroke={theme.palette.text.secondary} fontSize={12} />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e0e0e0',
                      borderRadius: 8,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="cpu.avg"
                    name="CPU Usage"
                    stroke={theme.palette.primary.main}
                    strokeWidth={3}
                    dot={{ fill: theme.palette.primary.main, strokeWidth: 2 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="memory.avg"
                    name="Memory Usage"
                    stroke={theme.palette.secondary.main}
                    strokeWidth={3}
                    dot={{ fill: theme.palette.secondary.main, strokeWidth: 2 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="disk"
                    name="Disk Usage"
                    stroke={theme.palette.success.main}
                    strokeWidth={3}
                    dot={{ fill: theme.palette.success.main, strokeWidth: 2 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="responseTime"
                    name="Response Time"
                    stroke={theme.palette.warning.main}
                    fill={theme.palette.warning.main}
                    fillOpacity={0.3}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </Box>
          )}

          {activeTab === 1 && (
            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: theme.palette.text.primary,
                  mb: 3,
                }}
              >
                {t('analytics.nodeComparison')}
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={data?.nodeComparison || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                      <XAxis
                        dataKey="nodeName"
                        stroke={theme.palette.text.secondary}
                        fontSize={12}
                      />
                      <YAxis stroke={theme.palette.text.secondary} fontSize={12} />
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #e0e0e0',
                          borderRadius: 8,
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        }}
                      />
                      <Legend />
                      <Bar
                        dataKey="metrics.avgCpu"
                        name="CPU Usage"
                        fill={theme.palette.primary.main}
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="metrics.avgMemory"
                        name="Memory Usage"
                        fill={theme.palette.secondary.main}
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                      Performance Grades
                    </Typography>
                    <List>
                      {data?.nodeComparison?.slice(0, 5).map((node, index) => (
                        <ListItem key={node.nodeId} sx={{ px: 0 }}>
                          <ListItemIcon>
                            <Chip
                              label={node.performance?.grade || 'N/A'}
                              size="small"
                              sx={{
                                backgroundColor: getPerformanceGradeColor(node.performance?.grade || 'N/A'),
                                color: 'white',
                                fontWeight: 600,
                              }}
                            />
                          </ListItemIcon>
                          <ListItemText
                            primary={node.nodeName}
                            secondary={`Score: ${(node.performance?.score || 0).toFixed(1)}`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}

          {activeTab === 2 && (
            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: theme.palette.text.primary,
                  mb: 3,
                }}
              >
                {t('analytics.geographicDistribution')}
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={data?.geographicDistribution?.map(loc => ({
                          name: loc.location,
                          value: loc.nodeCount,
                          ...loc
                        })) || []}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name} ${(percent ? (percent * 100).toFixed(0) : 0)}%`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {data?.geographicDistribution?.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #e0e0e0',
                          borderRadius: 8,
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                      Location Performance
                    </Typography>
                    {data?.geographicDistribution?.map((location, index) => (
                      <Accordion key={location.location} sx={{ mb: 1 }}>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                            <LocationOn sx={{ color: COLORS[index % COLORS.length] }} />
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {location.location}
                            </Typography>
                            <Chip
                              label={location.performance?.grade || 'N/A'}
                              size="small"
                              sx={{
                                backgroundColor: getPerformanceGradeColor(location.performance?.grade || 'N/A'),
                                color: 'white',
                                fontWeight: 600,
                              }}
                            />
                            <Typography variant="caption" color="text.secondary">
                              {location.nodeCount || 0} nodes
                            </Typography>
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Grid container spacing={2}>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="text.secondary">
                                CPU: {(location.metrics?.avgCpu || 0).toFixed(1)}%
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="text.secondary">
                                Memory: {(location.metrics?.avgMemory || 0).toFixed(1)}%
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="text.secondary">
                                Response Time: {(location.metrics?.avgResponseTime || 0).toFixed(2)}ms
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="text.secondary">
                                Cache Hit: {(location.metrics?.avgCacheHitRate || 0).toFixed(1)}%
                              </Typography>
                            </Grid>
                          </Grid>
                        </AccordionDetails>
                      </Accordion>
                    ))}
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}

          {activeTab === 3 && (
            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: theme.palette.text.primary,
                  mb: 3,
                }}
              >
                {t('analytics.realTimeMetrics')}
              </Typography>
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <MetricCard
                    title="Active Nodes"
                    value={(() => {
                      const lastMetric = data?.realTimeMetrics?.[data.realTimeMetrics.length - 1];
                      return lastMetric?.activeNodes || 0;
                    })()}
                    subtitle="Currently active"
                    color={theme.palette.primary.main}
                    icon={<Computer />}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <MetricCard
                    title="Avg CPU"
                    value={`${(() => {
                      const lastMetric = data?.realTimeMetrics?.[data.realTimeMetrics.length - 1];
                      return (lastMetric?.cpu?.avg || 0).toFixed(1);
                    })()}%`}
                    subtitle="Current average"
                    color={theme.palette.warning.main}
                    icon={<Speed />}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <MetricCard
                    title="Avg Memory"
                    value={`${(() => {
                      const lastMetric = data?.realTimeMetrics?.[data.realTimeMetrics.length - 1];
                      return (lastMetric?.memory?.avg || 0).toFixed(1);
                    })()}%`}
                    subtitle="Current average"
                    color={theme.palette.info.main}
                    icon={<Memory />}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <MetricCard
                    title="Response Time"
                    value={`${(() => {
                      const lastMetric = data?.realTimeMetrics?.[data.realTimeMetrics.length - 1];
                      return (lastMetric?.responseTime || 0).toFixed(2);
                    })()}ms`}
                    subtitle="Average response"
                    color={theme.palette.success.main}
                    icon={<NetworkCheck />}
                  />
                </Grid>
              </Grid>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data?.realTimeMetrics || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis
                    dataKey="timestamp"
                    stroke={theme.palette.text.secondary}
                    fontSize={12}
                  />
                  <YAxis stroke={theme.palette.text.secondary} fontSize={12} />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e0e0e0',
                      borderRadius: 8,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="cpu.avg"
                    name="CPU Usage"
                    stroke={theme.palette.primary.main}
                    fill={theme.palette.primary.main}
                    fillOpacity={0.3}
                  />
                  <Area
                    type="monotone"
                    dataKey="memory.avg"
                    name="Memory Usage"
                    stroke={theme.palette.secondary.main}
                    fill={theme.palette.secondary.main}
                    fillOpacity={0.3}
                  />
                  <Area
                    type="monotone"
                    dataKey="disk"
                    name="Disk Usage"
                    stroke={theme.palette.success.main}
                    fill={theme.palette.success.main}
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          )}

          {activeTab === 4 && (
            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: theme.palette.text.primary,
                  mb: 3,
                }}
              >
                {t('analytics.userAccess')}
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data?.userAccess || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                      <XAxis
                        dataKey="region"
                        stroke={theme.palette.text.secondary}
                        fontSize={12}
                        angle={-45}
                        textAnchor="end"
                      />
                      <YAxis stroke={theme.palette.text.secondary} fontSize={12} />
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #e0e0e0',
                          borderRadius: 8,
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        }}
                      />
                      <Legend />
                      <Bar
                        dataKey="userCount"
                        name="User Count"
                        fill={theme.palette.primary.main}
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </Grid>
                <Grid item xs={12} md={6}>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data?.userAccess || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                      <XAxis
                        dataKey="region"
                        stroke={theme.palette.text.secondary}
                        fontSize={12}
                        angle={-45}
                        textAnchor="end"
                      />
                      <YAxis stroke={theme.palette.text.secondary} fontSize={12} />
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #e0e0e0',
                          borderRadius: 8,
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        }}
                      />
                      <Legend />
                      <Bar
                        dataKey="bandwidthUsage"
                        name="Bandwidth (Mbps)"
                        fill={theme.palette.secondary.main}
                        radius={[4, 4, 0, 0]}
                      />
                </BarChart>
              </ResponsiveContainer>
            </Grid>
          </Grid>
          
          <Grid container spacing={3} sx={{ mt: 2 }}>
            {data?.userAccess?.map((region, index) => (
              <Grid item xs={12} md={4} key={region.region}>
                <Card
                  sx={{
                    borderRadius: 3,
                    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                    border: '1px solid #e0e0e0',
                    background: 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)',
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <LocationOn sx={{ color: COLORS[index % COLORS.length] }} />
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {region.region}
                      </Typography>
                    </Box>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Users
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {region.userCount.toLocaleString()}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Bandwidth
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {region.bandwidthUsage.toFixed(1)} Mbps
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Response Time
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {region.avgResponseTime.toFixed(1)} ms
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Growth Rate
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.success.main }}>
                          +{region.growthRate}%
                        </Typography>
                      </Grid>
                    </Grid>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <Typography variant="caption" color="text.secondary">
                      Peak Hours: {region.peakHours}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {activeTab === 5 && (
            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: theme.palette.text.primary,
                  mb: 3,
                }}
              >
                {t('analytics.anomalies')}
              </Typography>
              <Grid container spacing={3}>
                {data?.anomalies?.map((anomaly, index) => (
                  <Grid item xs={12} md={6} key={index}>
                    <Card
                      sx={{
                        borderRadius: 3,
                        boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                        border: '1px solid #e0e0e0',
                        background: 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)',
                      }}
                    >
                      <CardContent sx={{ p: 3 }}>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            mb: 2,
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Computer sx={{ color: theme.palette.text.secondary }} />
                            <Typography
                              variant="h6"
                              sx={{
                                fontWeight: 600,
                                color: theme.palette.text.primary,
                              }}
                            >
                              {anomaly.nodeName}
                            </Typography>
                          </Box>
                          <Chip
                            label={anomaly.severity}
                            size="small"
                            sx={{
                              backgroundColor: getSeverityColor(anomaly.severity),
                              color: 'white',
                              fontWeight: 600,
                              textTransform: 'uppercase',
                            }}
                          />
                        </Box>
                        
                        <Typography
                          variant="body2"
                          sx={{
                            color: theme.palette.text.secondary,
                            mb: 2,
                          }}
                        >
                          {anomaly.description}
                        </Typography>
                        
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Location: {anomaly.location} | Type: {anomaly.nodeType}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Anomaly Type: {anomaly.anomalyType.replace('_', ' ')}
                          </Typography>
                        </Box>
                        
                        <Divider sx={{ my: 2 }} />
                        
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">
                              CPU: {(anomaly.metrics?.cpuUsage || 0).toFixed(1)}%
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">
                              Memory: {(anomaly.metrics?.memoryUsage || 0).toFixed(1)}%
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">
                              Response: {(anomaly.metrics?.responseTime || 0).toFixed(2)}ms
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">
                              Error Rate: {(anomaly.metrics?.errorRate || 0).toFixed(2)}%
                            </Typography>
                          </Grid>
                        </Grid>
                        
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            mt: 2,
                          }}
                        >
                          <Typography variant="caption" color="text.secondary">
                            {new Date(anomaly.timestamp).toLocaleString()}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="View Node Details">
                              <IconButton size="small">
                                <Assessment />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="View Performance">
                              <IconButton size="small">
                                <AnalyticsIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
              
              {(!data?.anomalies || data.anomalies.length === 0) && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Info sx={{ fontSize: 48, color: theme.palette.text.secondary, mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    No anomalies detected
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    All systems are operating normally
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </Box>
      </Card>
    </Box>
  );
};

export default Analytics; 