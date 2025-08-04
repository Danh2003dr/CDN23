import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
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
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Alert,
  Tooltip,
  Fab,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useTheme,
  Tabs,
  Tab
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  CheckCircle as OnlineIcon,
  Warning as WarningIcon,
  Build as MaintenanceIcon,
  ExpandMore as ExpandMoreIcon,
  Storage as StorageIcon,
  Speed as SpeedIcon,
  Memory as MemoryIcon,
  NetworkCheck as NetworkIcon,
  LocationOn as LocationIcon,
  Computer as ComputerIcon,
  Settings as SettingsIcon,
  Analytics as AnalyticsIcon,
  Timeline as TimelineIcon,
  Assessment as AssessmentIcon,
  Map as MapIcon,
  WifiTethering as WifiIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import NodesMap from '../components/NodesMap';
import useWebSocket from '../hooks/useWebSocket';

interface CdnNode {
  id: number;
  name: string;
  hostname: string;
  ip_address: string;
  location: string;
  region: string;
  country: string;
  status: 'online' | 'offline' | 'maintenance';
  node_type: 'edge' | 'origin' | 'cache';
  capacity_gb: number;
  bandwidth_mbps: number;
  created_at: string;
  created_by_name: string;
}

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

interface NodePerformance {
  node_id: number;
  metrics: NodeMetrics;
  alerts: string[];
  last_updated: string;
}

const Nodes: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [nodes, setNodes] = useState<CdnNode[]>([]);
  const [nodePerformance, setNodePerformance] = useState<{ [key: number]: NodePerformance }>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [nodeTypeFilter, setNodeTypeFilter] = useState<string>('');
  const [selectedNode, setSelectedNode] = useState<CdnNode | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [performanceDialogOpen, setPerformanceDialogOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<CdnNode | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    hostname: '',
    ip_address: '',
    location: '',
    region: '',
    country: '',
    node_type: 'edge' as 'edge' | 'origin' | 'cache',
    capacity_gb: 100,
    bandwidth_mbps: 1000,
    status: 'online' as 'online' | 'offline' | 'maintenance'
  });
  const [error, setError] = useState<string>('');
  const [viewMode, setViewMode] = useState<'table' | 'grid' | 'map'>('table');

  // WebSocket hook
  const {
    isConnected,
    nodeStatusUpdates,
    metricsUpdates,
    alerts,
    joinUserRoom,
    sendNodeStatusUpdate,
    sendMetricsUpdate,
  } = useWebSocket();

  useEffect(() => {
    fetchNodes();
  }, []);

  // Real-time updates from WebSocket
  useEffect(() => {
    // Update node status based on WebSocket updates
    if (nodeStatusUpdates.length > 0) {
      const latestUpdate = nodeStatusUpdates[nodeStatusUpdates.length - 1];
      setNodes(prevNodes => 
        prevNodes.map(node => 
          node.id === latestUpdate.nodeId 
            ? { ...node, status: latestUpdate.status }
            : node
        )
      );
    }
  }, [nodeStatusUpdates]);

  // Update performance data from WebSocket
  useEffect(() => {
    if (metricsUpdates.length > 0) {
      const latestUpdate = metricsUpdates[metricsUpdates.length - 1];
      setNodePerformance(prev => ({
        ...prev,
        [latestUpdate.nodeId]: {
          node_id: latestUpdate.nodeId,
          metrics: {
            ...latestUpdate.metrics,
            timestamp: latestUpdate.timestamp
          },
          alerts: [],
          last_updated: latestUpdate.timestamp
        }
      }));
    }
  }, [metricsUpdates]);

  const fetchNodes = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/nodes');
      if (response.data.success && response.data.data && response.data.data.nodes) {
        const nodesData = response.data.data.nodes;
        setNodes(nodesData);
        
        // Fetch performance data for each node
        const performanceData: { [key: number]: NodePerformance } = {};
        for (const node of nodesData) {
          try {
            const perfResponse = await axios.get(`/api/nodes/${node.id}/performance`);
            if (perfResponse.data.success) {
              performanceData[node.id] = perfResponse.data.data;
            }
          } catch (error) {
            console.warn(`Failed to fetch performance for node ${node.id}:`, error);
          }
        }
        setNodePerformance(performanceData);
      } else {
        console.error('Invalid response format:', response.data);
        setError('Invalid response format');
      }
    } catch (error) {
      console.error('Failed to fetch nodes:', error);
      setError('Failed to fetch nodes');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <OnlineIcon color="success" />;
      case 'offline': return <WarningIcon color="error" />;
      case 'maintenance': return <MaintenanceIcon color="warning" />;
      default: return <WarningIcon />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'success';
      case 'offline': return 'error';
      case 'maintenance': return 'warning';
      default: return 'default';
    }
  };

  const getNodeTypeColor = (type: string) => {
    switch (type) {
      case 'edge': return 'primary';
      case 'origin': return 'secondary';
      case 'cache': return 'info';
      default: return 'default';
    }
  };

  const getPerformanceColor = (value: number, threshold: number = 80) => {
    if (value >= threshold) return theme.palette.error.main;
    if (value >= threshold * 0.7) return theme.palette.warning.main;
    return theme.palette.success.main;
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return date.toLocaleDateString();
  };

  const filteredNodes = (nodes || []).filter(node => {
    const matchesSearch = node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         node.hostname.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         node.ip_address.includes(searchTerm) ||
                         node.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || node.status === statusFilter;
    const matchesType = !nodeTypeFilter || node.node_type === nodeTypeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleViewNode = (node: CdnNode) => {
    setSelectedNode(node);
    setViewDialogOpen(true);
  };

  const handleCloseViewDialog = () => {
    setViewDialogOpen(false);
    setSelectedNode(null);
  };

  const handleViewPerformance = (node: CdnNode) => {
    setSelectedNode(node);
    setPerformanceDialogOpen(true);
  };

  const handleClosePerformanceDialog = () => {
    setPerformanceDialogOpen(false);
    setSelectedNode(null);
  };

  const handleAddNode = () => {
    setEditingNode(null);
    setFormData({
      name: '',
      hostname: '',
      ip_address: '',
      location: '',
      region: '',
      country: '',
      node_type: 'edge',
      capacity_gb: 100,
      bandwidth_mbps: 1000,
      status: 'online'
    });
    setDialogOpen(true);
  };

  const handleEditNode = (node: CdnNode) => {
    setEditingNode(node);
    setFormData({
      name: node.name,
      hostname: node.hostname,
      ip_address: node.ip_address,
      location: node.location,
      region: node.region,
      country: node.country,
      node_type: node.node_type,
      capacity_gb: node.capacity_gb,
      bandwidth_mbps: node.bandwidth_mbps,
      status: node.status
    });
    setDialogOpen(true);
  };

  const handleSaveNode = async () => {
    try {
      if (editingNode) {
        await axios.put(`/api/nodes/${editingNode.id}`, formData);
      } else {
        await axios.post('/api/nodes', formData);
      }
      setDialogOpen(false);
      setFormData({
        name: '',
        hostname: '',
        ip_address: '',
        location: '',
        region: '',
        country: '',
        node_type: 'edge',
        capacity_gb: 100,
        bandwidth_mbps: 1000,
        status: 'online'
      });
      setEditingNode(null);
      fetchNodes();
    } catch (err: any) {
      console.error('Error saving node:', err);
      setError('Không thể lưu node');
    }
  };

  const handleDeleteNode = async (nodeId: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa node này?')) {
      try {
        await axios.delete(`/api/nodes/${nodeId}`);
        fetchNodes();
      } catch (err: any) {
        console.error('Error deleting node:', err);
        setError('Không thể xóa node');
      }
    }
  };

  const handleStatusChange = async (nodeId: number, newStatus: string) => {
    try {
      await axios.post(`/api/nodes/${nodeId}/status`, { status: newStatus });
      fetchNodes();
    } catch (err: any) {
      console.error('Error updating node status:', err);
      setError('Không thể cập nhật trạng thái node');
    }
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%' }}>
        <LinearProgress />
      </Box>
    );
  }

  // Safety check for nodes data
  if (!nodes || !Array.isArray(nodes)) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning" sx={{ borderRadius: 2 }}>
          No nodes data available. Please refresh the page.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {t('CDN Nodes')}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Filters and Search */}
      <Card sx={{ mb: 3, borderRadius: 3, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label={t('Search Nodes')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>{t('Status')}</InputLabel>
                <Select
                  value={statusFilter}
                  label={t('Status')}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="">{t('All')}</MenuItem>
                  <MenuItem value="online">{t('Online')}</MenuItem>
                  <MenuItem value="offline">{t('Offline')}</MenuItem>
                  <MenuItem value="maintenance">{t('Maintenance')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>{t('Node Type')}</InputLabel>
                <Select
                  value={nodeTypeFilter}
                  label={t('Node Type')}
                  onChange={(e) => setNodeTypeFilter(e.target.value)}
                >
                  <MenuItem value="">{t('All')}</MenuItem>
                  <MenuItem value="edge">{t('Edge')}</MenuItem>
                  <MenuItem value="origin">{t('Origin')}</MenuItem>
                  <MenuItem value="cache">{t('Cache')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={fetchNodes}
              >
                {t('Refresh')}
              </Button>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleAddNode}
                  sx={{ mr: 1 }}
                >
                  Add Node
                </Button>
                <Button
                  variant={viewMode === 'table' ? 'contained' : 'outlined'}
                  onClick={() => setViewMode('table')}
                  startIcon={<AssessmentIcon />}
                >
                  Table
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'contained' : 'outlined'}
                  onClick={() => setViewMode('grid')}
                  startIcon={<AnalyticsIcon />}
                >
                  Grid
                </Button>
                <Button
                  variant={viewMode === 'map' ? 'contained' : 'outlined'}
                  onClick={() => setViewMode('map')}
                  startIcon={<MapIcon />}
                >
                  Map
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Real-time Status Indicator */}
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Chip
          icon={<WifiIcon />}
          label={isConnected ? 'Real-time Connected' : 'Real-time Disconnected'}
          color={isConnected ? 'success' : 'error'}
          size="small"
        />
        {alerts.length > 0 && (
          <Chip
            label={`${alerts.length} New Alerts`}
            color="warning"
            size="small"
          />
        )}
      </Box>

      {/* Nodes Display */}
      {viewMode === 'table' ? (
        <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t('Name')}</TableCell>
                <TableCell>{t('Hostname')}</TableCell>
                <TableCell>{t('IP Address')}</TableCell>
                <TableCell>{t('Location')}</TableCell>
                <TableCell>{t('Status')}</TableCell>
                <TableCell>{t('Type')}</TableCell>
                <TableCell>{t('Capacity')}</TableCell>
                <TableCell>{t('Bandwidth')}</TableCell>
                <TableCell>{t('Performance')}</TableCell>
                <TableCell>{t('Actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredNodes.map((node) => {
                const performance = nodePerformance[node.id] || null;
                return (
                  <TableRow key={node.id} hover>
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {node.name}
                      </Typography>
                    </TableCell>
                    <TableCell>{node.hostname}</TableCell>
                    <TableCell>{node.ip_address}</TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {node.location}
                        {node.region && `, ${node.region}`}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getStatusIcon(node.status)}
                        label={t(node.status)}
                        color={getStatusColor(node.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={t(node.node_type)}
                        color={getNodeTypeColor(node.node_type) as any}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{node.capacity_gb} GB</TableCell>
                    <TableCell>{node.bandwidth_mbps} Mbps</TableCell>
                    <TableCell>
                      {performance && performance.metrics ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography
                            variant="caption"
                            sx={{ color: getPerformanceColor(performance?.metrics?.cpu_usage || 0) }}
                          >
                            CPU: {Number(performance?.metrics?.cpu_usage || 0).toFixed(1)}%
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ color: getPerformanceColor(performance?.metrics?.memory_usage || 0) }}
                          >
                            RAM: {Number(performance?.metrics?.memory_usage || 0).toFixed(1)}%
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          No data
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Tooltip title={t('View Details')}>
                        <IconButton
                          size="small"
                          onClick={() => handleViewNode(node)}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="View Performance">
                        <IconButton
                          size="small"
                          onClick={() => handleViewPerformance(node)}
                        >
                          <AnalyticsIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={t('Edit Node')}>
                        <IconButton size="small" onClick={() => handleEditNode(node)}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={t('Delete Node')}>
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => handleDeleteNode(node.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={t('Change Status')}>
                        <IconButton size="small">
                          <SettingsIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      ) : viewMode === 'grid' ? (
        <Grid container spacing={3}>
          {filteredNodes.map((node) => {
            const performance = nodePerformance[node.id] || null;
            return (
              <Grid item xs={12} sm={6} md={4} key={node.id}>
                <Card sx={{ 
                  borderRadius: 3, 
                  boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                  border: `1px solid ${theme.palette.divider}`,
                  '&:hover': {
                    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                    transform: 'translateY(-2px)',
                    transition: 'all 0.3s ease-in-out'
                  }
                }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Typography variant="h6" fontWeight="bold">
                        {node.name}
                      </Typography>
                      <Chip
                        icon={getStatusIcon(node.status)}
                        label={t(node.status)}
                        color={getStatusColor(node.status) as any}
                        size="small"
                      />
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        <ComputerIcon sx={{ fontSize: '1rem', mr: 0.5, verticalAlign: 'middle' }} />
                        {node.hostname}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        <NetworkIcon sx={{ fontSize: '1rem', mr: 0.5, verticalAlign: 'middle' }} />
                        {node.ip_address}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        <LocationIcon sx={{ fontSize: '1rem', mr: 0.5, verticalAlign: 'middle' }} />
                        {node.location}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                      <Chip
                        label={t(node.node_type)}
                        color={getNodeTypeColor(node.node_type) as any}
                        size="small"
                        variant="outlined"
                      />
                      <Typography variant="caption" color="text.secondary">
                        {node.capacity_gb} GB
                      </Typography>
                    </Box>

                    {performance && performance.metrics && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Performance Metrics
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                          <Box>
                            <Typography
                              variant="caption"
                              sx={{ color: getPerformanceColor(performance?.metrics?.cpu_usage || 0) }}
                            >
                              CPU: {Number(performance?.metrics?.cpu_usage || 0).toFixed(1)}%
                            </Typography>
                          </Box>
                          <Box>
                            <Typography
                              variant="caption"
                              sx={{ color: getPerformanceColor(performance?.metrics?.memory_usage || 0) }}
                            >
                              RAM: {Number(performance?.metrics?.memory_usage || 0).toFixed(1)}%
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    )}

                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Button
                        size="small"
                        startIcon={<ViewIcon />}
                        onClick={() => handleViewNode(node)}
                      >
                        Details
                      </Button>
                      <Button
                        size="small"
                        startIcon={<AnalyticsIcon />}
                        onClick={() => handleViewPerformance(node)}
                      >
                        Performance
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      ) : viewMode === 'map' ? (
        <Card sx={{ borderRadius: 3, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {t('Geographic Distribution')}
            </Typography>
            <NodesMap 
              nodes={filteredNodes} 
              onNodeClick={handleViewNode}
            />
          </CardContent>
        </Card>
      ) : null}

      {/* Node Details Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={handleCloseViewDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {t('Node Details')} - {selectedNode?.name || 'Unknown'}
        </DialogTitle>
        <DialogContent>
          {selectedNode && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  {t('Basic Information')}
                </Typography>
                <Box sx={{ mt: 1 }}>
                  <Typography><strong>{t('Name')}:</strong> {selectedNode?.name || 'N/A'}</Typography>
                  <Typography><strong>{t('Hostname')}:</strong> {selectedNode?.hostname || 'N/A'}</Typography>
                  <Typography><strong>{t('IP Address')}:</strong> {selectedNode?.ip_address || 'N/A'}</Typography>
                  <Typography><strong>{t('Status')}:</strong> 
                    <Chip
                      icon={getStatusIcon(selectedNode?.status || 'offline')}
                      label={t(selectedNode?.status || 'offline')}
                      color={getStatusColor(selectedNode?.status || 'offline') as any}
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  {t('Location & Type')}
                </Typography>
                <Box sx={{ mt: 1 }}>
                  <Typography><strong>{t('Location')}:</strong> {selectedNode?.location || 'N/A'}</Typography>
                  <Typography><strong>{t('Region')}:</strong> {selectedNode?.region || 'N/A'}</Typography>
                  <Typography><strong>{t('Country')}:</strong> {selectedNode?.country || 'N/A'}</Typography>
                  <Typography><strong>{t('Type')}:</strong> 
                    <Chip
                                              label={t(selectedNode?.node_type || 'edge')}
                        color={getNodeTypeColor(selectedNode?.node_type || 'edge') as any}
                      size="small"
                      variant="outlined"
                      sx={{ ml: 1 }}
                    />
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  {t('Specifications')}
                </Typography>
                <Box sx={{ mt: 1 }}>
                  <Typography><strong>{t('Capacity')}:</strong> {selectedNode?.capacity_gb || 0} GB</Typography>
                  <Typography><strong>{t('Bandwidth')}:</strong> {selectedNode?.bandwidth_mbps || 0} Mbps</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  {t('System Information')}
                </Typography>
                <Box sx={{ mt: 1 }}>
                  <Typography><strong>{t('Created')}:</strong> {selectedNode?.created_at ? new Date(selectedNode.created_at).toLocaleDateString() : 'N/A'}</Typography>
                  <Typography><strong>{t('Created By')}:</strong> {selectedNode?.created_by_name || 'N/A'}</Typography>
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseViewDialog}>
            {t('Close')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Performance Dialog */}
      <Dialog
        open={performanceDialogOpen}
        onClose={handleClosePerformanceDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AnalyticsIcon />
            Performance Metrics - {selectedNode?.name || 'Unknown'}
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedNode && nodePerformance[selectedNode.id] && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Real-time Metrics
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Last updated: {formatTime(nodePerformance[selectedNode.id]?.last_updated || new Date().toISOString())}
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card sx={{ p: 2, borderRadius: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    System Resources
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <SpeedIcon sx={{ color: getPerformanceColor(nodePerformance[selectedNode.id]?.metrics?.cpu_usage || 0) }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={`CPU Usage: ${Number(nodePerformance[selectedNode.id]?.metrics?.cpu_usage || 0).toFixed(1)}%`}
                        secondary="Processor utilization"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <MemoryIcon sx={{ color: getPerformanceColor(nodePerformance[selectedNode.id]?.metrics?.memory_usage || 0) }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={`Memory Usage: ${Number(nodePerformance[selectedNode.id]?.metrics?.memory_usage || 0).toFixed(1)}%`}
                        secondary="RAM utilization"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <StorageIcon sx={{ color: getPerformanceColor(nodePerformance[selectedNode.id]?.metrics?.disk_usage || 0) }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={`Disk Usage: ${Number(nodePerformance[selectedNode.id]?.metrics?.disk_usage || 0).toFixed(1)}%`}
                        secondary="Storage utilization"
                      />
                    </ListItem>
                  </List>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card sx={{ p: 2, borderRadius: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Network Performance
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <NetworkIcon sx={{ color: theme.palette.info.main }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={`Network In: ${formatBytes(nodePerformance[selectedNode.id]?.metrics?.network_in || 0)}`}
                        secondary="Incoming traffic"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <NetworkIcon sx={{ color: theme.palette.info.main }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={`Network Out: ${formatBytes(nodePerformance[selectedNode.id]?.metrics?.network_out || 0)}`}
                        secondary="Outgoing traffic"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <TimelineIcon sx={{ color: theme.palette.warning.main }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={`Response Time: ${Number(nodePerformance[selectedNode.id]?.metrics?.response_time || 0).toFixed(2)}ms`}
                        secondary="Average response time"
                      />
                    </ListItem>
                  </List>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card sx={{ p: 2, borderRadius: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Cache Performance
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <AssessmentIcon sx={{ color: theme.palette.success.main }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={`Cache Hit Rate: ${Number(nodePerformance[selectedNode.id]?.metrics?.cache_hit_rate || 0).toFixed(1)}%`}
                        secondary="Cache efficiency"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <ComputerIcon sx={{ color: theme.palette.primary.main }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={`Active Connections: ${nodePerformance[selectedNode.id]?.metrics?.connections || 0}`}
                        secondary="Current connections"
                      />
                    </ListItem>
                  </List>
                </Card>
              </Grid>

              {nodePerformance[selectedNode.id]?.alerts?.length > 0 && (
                <Grid item xs={12}>
                  <Card sx={{ p: 2, borderRadius: 2, bgcolor: theme.palette.warning.light }}>
                    <Typography variant="subtitle2" gutterBottom color="warning.dark">
                      Active Alerts
                    </Typography>
                    <List dense>
                      {(nodePerformance[selectedNode.id]?.alerts || []).map((alert, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <WarningIcon sx={{ color: theme.palette.warning.dark }} />
                          </ListItemIcon>
                          <ListItemText
                            primary={alert}
                            primaryTypographyProps={{ color: 'warning.dark' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Card>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePerformanceDialog}>
            {t('Close')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add/Edit Node Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingNode ? 'Edit Node' : 'Add New Node'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Node Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Hostname"
                value={formData.hostname}
                onChange={(e) => setFormData({ ...formData, hostname: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="IP Address"
                value={formData.ip_address}
                onChange={(e) => setFormData({ ...formData, ip_address: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Node Type</InputLabel>
                <Select
                  value={formData.node_type}
                  label="Node Type"
                  onChange={(e) => setFormData({ ...formData, node_type: e.target.value as 'edge' | 'origin' | 'cache' })}
                >
                  <MenuItem value="edge">Edge</MenuItem>
                  <MenuItem value="origin">Origin</MenuItem>
                  <MenuItem value="cache">Cache</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Region"
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  label="Status"
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'online' | 'offline' | 'maintenance' })}
                >
                  <MenuItem value="online">Online</MenuItem>
                  <MenuItem value="offline">Offline</MenuItem>
                  <MenuItem value="maintenance">Maintenance</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Capacity (GB)"
                type="number"
                value={formData.capacity_gb}
                onChange={(e) => setFormData({ ...formData, capacity_gb: parseInt(e.target.value) || 0 })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Bandwidth (Mbps)"
                type="number"
                value={formData.bandwidth_mbps}
                onChange={(e) => setFormData({ ...formData, bandwidth_mbps: parseInt(e.target.value) || 0 })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveNode} variant="contained">
            {editingNode ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Nodes; 