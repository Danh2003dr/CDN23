import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Alert,
  Snackbar,
  Tooltip,
  Badge,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  useTheme,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  CloudDownload as DownloadIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  Storage as StorageIcon,
  Speed as SpeedIcon,
  Memory as MemoryIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Pending as PendingIcon,
  FileCopy as FileIcon,
  Image as ImageIcon,
  VideoLibrary as VideoIcon,
  Code as CodeIcon,
  Description as TextIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

interface Content {
  id: number;
  filename: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  content_type: string;
  checksum: string;
  uploaded_by_name: string;
  created_at: string;
  distribution_count: number;
  distributed_count: number;
  description?: string;
}

interface ContentStats {
  total_content: number;
  total_size: number;
  avg_size: number;
  image_count: number;
  video_count: number;
  dynamic_count: number;
  static_count: number;
}

interface DistributionStats {
  total_distributions: number;
  distributed_count: number;
  pending_count: number;
  failed_count: number;
}

interface ContentData {
  content: Content[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

const ContentManagement: React.FC = () => {
  const [contentData, setContentData] = useState<ContentData | null>(null);
  const [stats, setStats] = useState<{ content: ContentStats; distribution: DistributionStats } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploadDialog, setUploadDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [distributionDialog, setDistributionDialog] = useState(false);
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);
  const [distributionData, setDistributionData] = useState<any>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  const { t } = useTranslation();
  const theme = useTheme();

  useEffect(() => {
    fetchContentData();
    fetchStats();
  }, []);

  const fetchContentData = async (page = 1) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/content?page=${page}&limit=10`);
      setContentData(response.data.data);
    } catch (error: any) {
      console.error('Error fetching content:', error);
      setError('Failed to fetch content data');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/content/stats');
      setStats(response.data.data);
    } catch (error: any) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploading(true);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('content_type', 'static');
      formData.append('description', '');

      const response = await axios.post('/api/content/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
          setUploadProgress(progress);
        },
      });

      if (response.data.success) {
        setSnackbar({
          open: true,
          message: 'Content uploaded successfully',
          severity: 'success'
        });
        setUploadDialog(false);
        setSelectedFile(null);
        fetchContentData();
        fetchStats();
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Upload failed',
        severity: 'error'
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (contentId: number) => {
    if (!window.confirm('Are you sure you want to delete this content?')) return;

    try {
      await axios.delete(`/api/content/${contentId}`);
      setSnackbar({
        open: true,
        message: 'Content deleted successfully',
        severity: 'success'
      });
      fetchContentData();
      fetchStats();
    } catch (error: any) {
      console.error('Delete error:', error);
      setSnackbar({
        open: true,
        message: 'Failed to delete content',
        severity: 'error'
      });
    }
  };

  const handleDistribute = async (contentId: number) => {
    try {
      await axios.post(`/api/content/${contentId}/distribute`);
      setSnackbar({
        open: true,
        message: 'Content distributed successfully',
        severity: 'success'
      });
      fetchContentData();
    } catch (error: any) {
      console.error('Distribute error:', error);
      setSnackbar({
        open: true,
        message: 'Failed to distribute content',
        severity: 'error'
      });
    }
  };

  const handleViewDistribution = async (content: Content) => {
    try {
      const response = await axios.get(`/api/content/${content.id}/distribution`);
      setDistributionData(response.data.data);
      setSelectedContent(content);
      setDistributionDialog(true);
    } catch (error: any) {
      console.error('Error fetching distribution:', error);
    }
  };

  const handleCacheInvalidate = async (contentId: number) => {
    try {
      await axios.post(`/api/content/${contentId}/cache-invalidate`);
      setSnackbar({
        open: true,
        message: 'Cache invalidation initiated',
        severity: 'success'
      });
      fetchContentData();
    } catch (error: any) {
      console.error('Cache invalidation error:', error);
      setSnackbar({
        open: true,
        message: 'Failed to invalidate cache',
        severity: 'error'
      });
    }
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <ImageIcon />;
      case 'video':
        return <VideoIcon />;
      case 'dynamic':
        return <CodeIcon />;
      default:
        return <TextIcon />;
    }
  };

  const getContentTypeColor = (type: string) => {
    switch (type) {
      case 'image':
        return theme.palette.success.main;
      case 'video':
        return theme.palette.warning.main;
      case 'dynamic':
        return theme.palette.info.main;
      default:
        return theme.palette.grey[500];
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 0 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
          Content Management
        </Typography>
        <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
          Upload, distribute, and manage content across CDN nodes
        </Typography>
      </Box>

      {/* Stats Cards */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <StorageIcon sx={{ color: theme.palette.primary.main, mr: 2 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Total Content
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                  {stats.content.total_content}
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  {formatFileSize(stats.content.total_size)} total size
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <SpeedIcon sx={{ color: theme.palette.success.main, mr: 2 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Distributed
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.success.main }}>
                  {stats.distribution.distributed_count}
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  of {stats.distribution.total_distributions} total
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <MemoryIcon sx={{ color: theme.palette.warning.main, mr: 2 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Pending
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.warning.main }}>
                  {stats.distribution.pending_count}
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  waiting for distribution
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Content Types
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<UploadIcon />}
                    onClick={() => setUploadDialog(true)}
                    size="small"
                  >
                    Upload
                  </Button>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Chip
                    icon={<ImageIcon />}
                    label={`${stats.content.image_count} Images`}
                    size="small"
                    color="success"
                  />
                  <Chip
                    icon={<VideoIcon />}
                    label={`${stats.content.video_count} Videos`}
                    size="small"
                    color="warning"
                  />
                  <Chip
                    icon={<CodeIcon />}
                    label={`${stats.content.dynamic_count} Dynamic`}
                    size="small"
                    color="info"
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Content Table */}
      <Card sx={{ borderRadius: 3, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Content Library
            </Typography>
            <Button
              variant="contained"
              startIcon={<UploadIcon />}
              onClick={() => setUploadDialog(true)}
            >
              Upload Content
            </Button>
          </Box>

          <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Content</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Size</TableCell>
                  <TableCell>Distribution</TableCell>
                  <TableCell>Uploaded</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(contentData?.content || []).map((content) => (
                  <TableRow key={content.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ bgcolor: getContentTypeColor(content.content_type), mr: 2 }}>
                          {getContentTypeIcon(content.content_type)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {content.original_filename}
                          </Typography>
                          <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                            by {content.uploaded_by_name}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getContentTypeIcon(content.content_type)}
                        label={content.content_type}
                        size="small"
                        sx={{ bgcolor: getContentTypeColor(content.content_type), color: 'white' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatFileSize(content.file_size)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Badge badgeContent={content.distributed_count} color="success">
                          <CheckIcon color="success" />
                        </Badge>
                        <Badge badgeContent={content.distribution_count - content.distributed_count} color="warning">
                          <PendingIcon color="warning" />
                        </Badge>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(content.created_at)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="View Distribution">
                          <IconButton
                            size="small"
                            onClick={() => handleViewDistribution(content)}
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Distribute">
                          <IconButton
                            size="small"
                            onClick={() => handleDistribute(content.id)}
                          >
                            <DownloadIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Invalidate Cache">
                          <IconButton
                            size="small"
                            onClick={() => handleCacheInvalidate(content.id)}
                          >
                            <RefreshIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(content.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={uploadDialog} onClose={() => setUploadDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Upload Content</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <input
              accept="image/*,video/*,.pdf,.css,.js,.html,.json,.txt"
              style={{ display: 'none' }}
              id="file-upload"
              type="file"
              onChange={handleFileSelect}
            />
            <label htmlFor="file-upload">
              <Button
                variant="outlined"
                component="span"
                startIcon={<UploadIcon />}
                fullWidth
                sx={{ height: 100, border: '2px dashed', borderColor: theme.palette.grey[300] }}
              >
                {selectedFile ? selectedFile.name : 'Choose file to upload'}
              </Button>
            </label>
          </Box>

          {selectedFile && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                File: {selectedFile.name}
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                Size: {formatFileSize(selectedFile.size)}
              </Typography>
            </Box>
          )}

          {uploading && (
            <Box sx={{ width: '100%', mb: 2 }}>
              <LinearProgress variant="determinate" value={uploadProgress} />
              <Typography variant="body2" sx={{ mt: 1 }}>
                Uploading... {uploadProgress}%
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialog(false)} disabled={uploading}>
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            variant="contained"
            disabled={!selectedFile || uploading}
          >
            Upload
          </Button>
        </DialogActions>
      </Dialog>

      {/* Distribution Dialog */}
      <Dialog open={distributionDialog} onClose={() => setDistributionDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Distribution Status - {selectedContent?.original_filename}
        </DialogTitle>
        <DialogContent>
          {distributionData && (
            <Box>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Distribution Statistics
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={3}>
                    <Card sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h4" sx={{ color: theme.palette.success.main }}>
                        {distributionData.stats.distributed}
                      </Typography>
                      <Typography variant="body2">Distributed</Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={3}>
                    <Card sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h4" sx={{ color: theme.palette.warning.main }}>
                        {distributionData.stats.pending}
                      </Typography>
                      <Typography variant="body2">Pending</Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={3}>
                    <Card sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h4" sx={{ color: theme.palette.error.main }}>
                        {distributionData.stats.failed}
                      </Typography>
                      <Typography variant="body2">Failed</Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={3}>
                    <Card sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h4" sx={{ color: theme.palette.info.main }}>
                        {distributionData.stats.total}
                      </Typography>
                      <Typography variant="body2">Total</Typography>
                    </Card>
                  </Grid>
                </Grid>
              </Box>

              <Typography variant="h6" sx={{ mb: 2 }}>
                Node Distribution Details
              </Typography>
              <List>
                {distributionData.distribution.map((dist: any) => (
                  <ListItem key={dist.id}>
                    <ListItemIcon>
                      {dist.status === 'distributed' ? (
                        <CheckIcon color="success" />
                      ) : dist.status === 'pending' ? (
                        <PendingIcon color="warning" />
                      ) : (
                        <ErrorIcon color="error" />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={dist.node_name}
                      secondary={`${dist.location} • ${dist.status}`}
                    />
                    <Chip
                      label={dist.status}
                      color={dist.status === 'distributed' ? 'success' : dist.status === 'pending' ? 'warning' : 'error'}
                      size="small"
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDistributionDialog(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ContentManagement; 