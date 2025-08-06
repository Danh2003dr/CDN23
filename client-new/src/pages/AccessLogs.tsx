import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Grid,
  IconButton,
  Tooltip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,



} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  FilterList as FilterIcon,
  Analytics as AnalyticsIcon,

} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

interface AccessLog {
  id: number;
  node_id: number;
  node_name: string;
  node_hostname: string;
  content_id: number | null;
  content_filename: string | null;
  content_original_filename: string | null;
  client_ip: string;
  user_agent: string | null;
  request_method: string;
  request_url: string;
  response_status: number;
  response_size: number | null;
  response_time_ms: number | null;
  cache_hit: boolean;
  timestamp: string;
}

interface AccessLogsSummary {
  total_access_logs: number;
  today_access_logs: number;
  top_content: Array<{
    filename: string;
    original_filename: string;
    access_count: number;
  }>;
  top_nodes: Array<{
    node_name: string;
    hostname: string;
    access_count: number;
  }>;
  cache_hit_rate: number;
  avg_response_time: number;
}

interface AccessLogsAnalytics {
  traffic_by_time: Array<{
    time_period: string;
    request_count: number;
    avg_response_time: number;
    cache_hits: number;
    cache_misses: number;
  }>;
  traffic_by_node: Array<{
    node_name: string;
    hostname: string;
    request_count: number;
    avg_response_time: number;
    cache_hits: number;
  }>;
  status_distribution: Array<{
    response_status: number;
    count: number;
  }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const AccessLogs: React.FC = () => {
  const { } = useAuth();
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [summary, setSummary] = useState<AccessLogsSummary | null>(null);
  const [analytics, setAnalytics] = useState<AccessLogsAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);

  // Filter states
  const [filters, setFilters] = useState({
    node_id: '',
    content_id: '',
    client_ip: '',
    start_date: '',
    end_date: '',
    cache_hit: '',
    response_status: '',
  });

  const [showFilters, setShowFilters] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  useEffect(() => {
    fetchAccessLogs();
    fetchSummary();
  }, [page, rowsPerPage, filters]);

  const fetchAccessLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: (page + 1).toString(),
        limit: rowsPerPage.toString(),
        ...filters,
      });

      const response = await axios.get(`/api/access-logs?${params}`);
      if (response.data && response.data.success) {
        setLogs(response.data.data?.logs || []);
        setTotal(response.data.data?.pagination?.total || 0);
      } else {
        setError('Không thể tải dữ liệu access logs');
      }
    } catch (err: any) {
      console.error('Error fetching access logs:', err);
      setError('Không thể tải dữ liệu access logs');
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await axios.get('/api/access-logs/summary');
      if (response.data.success) {
        setSummary(response.data.data);
      }
    } catch (err: any) {
      console.error('Error fetching summary:', err);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get('/api/access-logs/analytics');
      if (response.data.success) {
        setAnalytics(response.data.data);
      }
    } catch (err: any) {
      console.error('Error fetching analytics:', err);
    }
  };

  const handleRefresh = () => {
    fetchAccessLogs();
    fetchSummary();
  };

  const handleExport = async () => {
    try {
      const response = await axios.get('/api/access-logs/export', {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'access-logs.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      console.error('Error exporting logs:', err);
      setError('Không thể xuất dữ liệu');
    }
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(0);
  };

  const clearFilters = () => {
    setFilters({
      node_id: '',
      content_id: '',
      client_ip: '',
      start_date: '',
      end_date: '',
      cache_hit: '',
      response_status: '',
    });
    setPage(0);
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'success';
    if (status >= 300 && status < 400) return 'warning';
    if (status >= 400 && status < 500) return 'error';
    if (status >= 500) return 'error';
    return 'default';
  };

  const getMethodColor = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET': return 'primary';
      case 'POST': return 'success';
      case 'PUT': return 'warning';
      case 'DELETE': return 'error';
      default: return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN');
  };

  const formatBytes = (bytes: number | null) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading && page === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" gutterBottom>
          Access Logs
        </Typography>
        <Box>
          <Tooltip title="Filters">
            <IconButton 
              onClick={() => setShowFilters(!showFilters)} 
              color={showFilters ? 'primary' : 'default'}
            >
              <FilterIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Analytics">
            <IconButton 
              onClick={() => {
                setShowAnalytics(!showAnalytics);
                if (!showAnalytics) {
                  fetchAnalytics();
                }
              }} 
              color={showAnalytics ? 'primary' : 'default'}
            >
              <AnalyticsIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Refresh">
            <IconButton onClick={handleRefresh} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Export CSV">
            <IconButton onClick={handleExport} color="primary">
              <DownloadIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      {showFilters && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Filters
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Client IP"
                value={filters.client_ip}
                onChange={(e) => handleFilterChange('client_ip', e.target.value)}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Start Date"
                type="datetime-local"
                value={filters.start_date}
                onChange={(e) => handleFilterChange('start_date', e.target.value)}
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="End Date"
                type="datetime-local"
                value={filters.end_date}
                onChange={(e) => handleFilterChange('end_date', e.target.value)}
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Cache Hit</InputLabel>
                <Select
                  value={filters.cache_hit}
                  onChange={(e) => handleFilterChange('cache_hit', e.target.value)}
                  label="Cache Hit"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="true">Hit</MenuItem>
                  <MenuItem value="false">Miss</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.response_status}
                  onChange={(e) => handleFilterChange('response_status', e.target.value)}
                  label="Status"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="200">200 OK</MenuItem>
                  <MenuItem value="404">404 Not Found</MenuItem>
                  <MenuItem value="500">500 Error</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button onClick={clearFilters} variant="outlined" size="small">
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Summary Cards */}
      {summary && (
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Access Logs
                </Typography>
                <Typography variant="h4">
                  {summary.total_access_logs.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Today's Logs
                </Typography>
                <Typography variant="h4">
                  {summary.today_access_logs.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Cache Hit Rate
                </Typography>
                                 <Typography variant="h4">
                   {summary.cache_hit_rate ? Number(summary.cache_hit_rate).toFixed(1) : 0}%
                 </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Avg Response Time
                </Typography>
                                 <Typography variant="h4">
                   {summary.avg_response_time ? Number(summary.avg_response_time).toFixed(0) : 0}ms
                 </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Analytics Dialog */}
      <Dialog 
        open={showAnalytics} 
        onClose={() => setShowAnalytics(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Access Logs Analytics</DialogTitle>
        <DialogContent>
          {analytics && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Traffic Over Time
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics.traffic_by_time}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time_period" />
                    <YAxis />
                    <RechartsTooltip />
                    <Line type="monotone" dataKey="request_count" stroke="#8884d8" />
                  </LineChart>
                </ResponsiveContainer>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Traffic by Node
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.traffic_by_node}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="node_name" />
                    <YAxis />
                    <RechartsTooltip />
                    <Bar dataKey="request_count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Response Status Distribution
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics.status_distribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                                             label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {analytics.status_distribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAnalytics(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Access Logs Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Timestamp</TableCell>
                <TableCell>Node</TableCell>
                <TableCell>Content</TableCell>
                <TableCell>Client IP</TableCell>
                <TableCell>Method</TableCell>
                <TableCell>URL</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Size</TableCell>
                <TableCell>Response Time</TableCell>
                <TableCell>Cache</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <Typography variant="body2" color="textSecondary">
                      {formatDate(log.timestamp)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {log.node_name || 'Unknown'}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {log.node_hostname}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap>
                      {log.content_filename || log.content_original_filename || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="textSecondary">
                      {log.client_ip}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={log.request_method}
                      color={getMethodColor(log.request_method) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                      {log.request_url}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={log.response_status}
                      color={getStatusColor(log.response_status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="textSecondary">
                      {formatBytes(log.response_size)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="textSecondary">
                      {log.response_time_ms ? `${log.response_time_ms}ms` : 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={log.cache_hit ? 'Hit' : 'Miss'}
                      color={log.cache_hit ? 'success' : 'error'}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={total}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(event, newPage) => setPage(newPage)}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(parseInt(event.target.value, 10));
            setPage(0);
          }}
        />
      </Paper>
    </Box>
  );
};

export default AccessLogs; 