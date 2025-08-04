import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Security,
  AdminPanelSettings,
  Person,
  Group,
  CheckCircle,
  Cancel,
  ExpandMore,
  Visibility,
  Edit,
  Delete,
  Add,
  Settings
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import axios from 'axios';

interface Permission {
  name: string;
  description: string;
  granted: boolean;
}

interface Role {
  name: string;
  displayName: string;
  description: string;
  permissions: { [key: string]: boolean };
}

interface UserPermissions {
  user: {
    id: number;
    username: string;
    email: string;
    role_name: string;
  };
  permissions: { [key: string]: boolean };
  available_permissions: Permission[];
  role_info: {
    name: string;
    description: string;
  };
  summary: {
    total_permissions: number;
    granted_permissions: number;
    denied_permissions: number;
  };
}

const Permissions: React.FC = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserPermissions, setCurrentUserPermissions] = useState<UserPermissions | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<{ [key: string]: string }>({});
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchPermissionsData();
  }, []);

  const fetchPermissionsData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch current user permissions
      const currentUserResponse = await axios.get('/api/permissions/current-user');
      setCurrentUserPermissions(currentUserResponse.data.data);

      // Fetch all roles
      const rolesResponse = await axios.get('/api/permissions/roles');
      setRoles(rolesResponse.data.data.roles);

      // Fetch all permissions
      const permissionsResponse = await axios.get('/api/permissions');
      setPermissions(permissionsResponse.data.data.permissions);

    } catch (error: any) {
      console.error('Error fetching permissions data:', error);
      setError(error.response?.data?.message || 'Failed to fetch permissions data');
    } finally {
      setLoading(false);
    }
  };

  const getPermissionColor = (granted: boolean) => {
    return granted ? theme.palette.success.main : theme.palette.error.main;
  };

  const getPermissionIcon = (granted: boolean) => {
    return granted ? <CheckCircle color="success" /> : <Cancel color="error" />;
  };

  const handleRoleSelect = (roleName: string) => {
    setSelectedRole(roleName);
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Security />
        Quản Lý Phân Quyền
      </Typography>

      {/* Current User Permissions */}
      {currentUserPermissions && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Person />
            Quyền Của Bạn
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader 
                  title="Thông Tin User"
                  avatar={<AdminPanelSettings />}
                />
                <CardContent>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Username:</strong> {currentUserPermissions.user.username}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Email:</strong> {currentUserPermissions.user.email}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Role:</strong> {currentUserPermissions.role_info.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Description:</strong> {currentUserPermissions.role_info.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader 
                  title="Tổng Quan Quyền"
                  avatar={<Settings />}
                />
                <CardContent>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Tổng số quyền:</strong> {currentUserPermissions.summary.total_permissions}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Quyền được cấp:</strong> {currentUserPermissions.summary.granted_permissions}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Quyền bị từ chối:</strong> {currentUserPermissions.summary.denied_permissions}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Tỷ lệ quyền:</strong> {((currentUserPermissions.summary.granted_permissions / currentUserPermissions.summary.total_permissions) * 100).toFixed(1)}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Available Permissions */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Visibility />
          Danh Sách Quyền Có Sẵn
        </Typography>
        
        <Grid container spacing={2}>
          {currentUserPermissions?.available_permissions.map((permission) => (
            <Grid item xs={12} sm={6} md={4} key={permission.name}>
              <Card 
                sx={{ 
                  border: `2px solid ${getPermissionColor(permission.granted)}`,
                  opacity: permission.granted ? 1 : 0.7
                }}
              >
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                    <Typography variant="subtitle2" fontWeight="bold">
                      {permission.name}
                    </Typography>
                    {getPermissionIcon(permission.granted)}
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {permission.description}
                  </Typography>
                  <Chip 
                    label={permission.granted ? 'Được cấp' : 'Bị từ chối'}
                    color={permission.granted ? 'success' : 'error'}
                    size="small"
                    sx={{ mt: 1 }}
                  />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Roles and Permissions */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Group />
          Vai Trò Và Quyền Hạn
        </Typography>
        
        <Grid container spacing={2}>
          {roles.map((role) => (
            <Grid item xs={12} key={role.name}>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box display="flex" alignItems="center" gap={2} width="100%">
                    <Typography variant="h6">{role.displayName}</Typography>
                    <Chip 
                      label={`${Object.keys(role.permissions).filter(p => role.permissions[p]).length} quyền`}
                      color="primary"
                      size="small"
                    />
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {role.description}
                  </Typography>
                  
                  <TableContainer component={Paper} sx={{ mt: 2 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell><strong>Quyền</strong></TableCell>
                          <TableCell><strong>Mô Tả</strong></TableCell>
                          <TableCell><strong>Trạng Thái</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {Object.entries(role.permissions).map(([permission, granted]) => (
                          <TableRow key={permission}>
                            <TableCell>
                              <Typography variant="body2" fontWeight="bold">
                                {permission}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="text.secondary">
                                {permissions[permission] || 'Không có mô tả'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={granted ? 'Được cấp' : 'Bị từ chối'}
                                color={granted ? 'success' : 'error'}
                                size="small"
                                icon={getPermissionIcon(granted)}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </AccordionDetails>
              </Accordion>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Permission Categories */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Settings />
          Phân Loại Quyền Hạn
        </Typography>
        
        <Grid container spacing={2}>
          {(() => {
            const categories: { [key: string]: { permission: string; description: string }[] } = {};
            Object.entries(permissions).forEach(([permission, description]) => {
              const category = permission.includes('_') ? permission.split('_')[0] : 'basic';
              if (!categories[category]) categories[category] = [];
              categories[category].push({ permission, description });
            });
            
            return Object.entries(categories).map(([category, perms]) => (
              <Grid item xs={12} md={6} key={category}>
                <Card>
                  <CardHeader 
                    title={`${category.charAt(0).toUpperCase() + category.slice(1)} Permissions`}
                    subheader={`${perms.length} permissions`}
                  />
                  <CardContent>
                    <List dense>
                      {perms.map(({ permission, description }) => (
                        <ListItem key={permission}>
                          <ListItemIcon>
                            <CheckCircle color="primary" />
                          </ListItemIcon>
                          <ListItemText
                            primary={permission}
                            secondary={description}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            ));
          })()}
        </Grid>
      </Paper>
    </Box>
  );
};

export default Permissions; 