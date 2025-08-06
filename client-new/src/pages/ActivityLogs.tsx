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
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Download as DownloadIcon,

} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

interface ActivityLog {
  id: number;
  user_id: number;
  username: string;
  action: string;
  resource_type: string;
  resource_id: number | null;
  details: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

interface ActivityStats {
  total_activities: number;
  activities_today: number;
  top_actions: Array<{ action: string; count: number }>;
  top_users: Array<{ username: string; count: number }>;
}

const ActivityLogs: React.FC = () => {
  const { } = useAuth();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    fetchActivityLogs();
    fetchActivityStats();
  }, []);

  const fetchActivityLogs = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/activity-logs');
      if (response.data && response.data.success) {
        setLogs(response.data.data?.logs || []);
      } else {
        setError('Không thể tải dữ liệu activity logs');
        setLogs([]);
      }
    } catch (err: any) {
      console.error('Error fetching activity logs:', err);
      setError('Không thể kết nối đến server. Vui lòng kiểm tra backend đang chạy.');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchActivityStats = async () => {
    try {
      const response = await axios.get('/api/activity-logs/summary');
      if (response.data && response.data.success) {
        setStats(response.data.data || {
          total_activities: 0,
          activities_today: 0,
          top_actions: [],
          top_users: []
        });
      } else {
        setStats({
          total_activities: 0,
          activities_today: 0,
          top_actions: [],
          top_users: []
        });
      }
    } catch (err: any) {
      console.error('Error fetching activity stats:', err);
      // Set default stats if API fails
      setStats({
        total_activities: 0,
        activities_today: 0,
        top_actions: [],
        top_users: []
      });
    }
  };

  const handleRefresh = () => {
    fetchActivityLogs();
    fetchActivityStats();
  };

  const handleExport = async () => {
    try {
      const response = await axios.get('/api/activity-logs/export', {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'activity-logs.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      console.error('Error exporting logs:', err);
      setError('Không thể xuất dữ liệu');
    }
  };

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'login':
      case 'logout':
        return 'primary';
      case 'create':
      case 'add':
        return 'success';
      case 'update':
      case 'edit':
        return 'warning';
      case 'delete':
      case 'remove':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN');
  };

  if (loading) {
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
          Activity Logs
        </Typography>
        <Box>
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

      {/* Stats Cards */}
      {stats && typeof stats === 'object' && (
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Activities
                </Typography>
                <Typography variant="h4">
                  {stats?.total_activities || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Today's Activities
                </Typography>
                <Typography variant="h4">
                  {stats?.activities_today || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Top Action
                </Typography>
                <Typography variant="h6">
                  {stats?.top_actions?.[0]?.action || 'N/A'}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {stats?.top_actions?.[0]?.count || 0} times
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Most Active User
                </Typography>
                <Typography variant="h6">
                  {stats?.top_users?.[0]?.username || 'N/A'}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {stats?.top_users?.[0]?.count || 0} activities
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Activity Logs Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Resource</TableCell>
                <TableCell>Details</TableCell>
                <TableCell>IP Address</TableCell>
                <TableCell>Date</TableCell>
              </TableRow>
            </TableHead>
                         <TableBody>
               {Array.isArray(logs) && logs.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {log.username}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={log.action}
                      color={getActionColor(log.action) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {log.resource_type}
                      {log.resource_id && ` #${log.resource_id}`}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap>
                      {log.details}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="textSecondary">
                      {log.ip_address}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="textSecondary">
                      {formatDate(log.created_at)}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
                 <TablePagination
           rowsPerPageOptions={[10, 25, 50]}
           component="div"
           count={Array.isArray(logs) ? logs.length : 0}
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

export default ActivityLogs; 