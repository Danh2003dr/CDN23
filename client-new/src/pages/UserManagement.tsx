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
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  CircularProgress,
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
  FormControlLabel,
  IconButton,
  Tooltip,
  Tabs,
  Tab
} from '@mui/material';
import {
  Person,
  AdminPanelSettings,
  Edit,
  Delete,
  Add,
  Visibility,
  Security,
  CheckCircle,
  Cancel,
  Group,

} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import axios from 'axios';

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role_name: string;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
}

interface Role {
  id: number;
  name: string;
  description: string;
}

interface Permission {
  name: string;
  description: string;
  granted: boolean;
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

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`user-management-tabpanel-${index}`}
      aria-labelledby={`user-management-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const UserManagement: React.FC = () => {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    role_name: '',
    password: '',
    is_active: true
  });

  // Permissions state
  const [currentUserPermissions, setCurrentUserPermissions] = useState<UserPermissions | null>(null);

  useEffect(() => {
    fetchUsersData();
  }, []);

  const fetchUsersData = async () => {
    try {
      setLoading(true);
      
      // Fetch users from API
      const usersResponse = await axios.get('/api/auth/users');
      if (usersResponse.data.success) {
        setUsers(usersResponse.data.data);
      }

      // Fetch roles
      const rolesResponse = await axios.get('/api/auth/users/roles');
      if (rolesResponse.data.success) {
        setRoles(rolesResponse.data.data);
      }

      // Fetch permissions data
      try {
        const currentUserResponse = await axios.get('/api/permissions/current-user');
        setCurrentUserPermissions(currentUserResponse.data.data);
      } catch (permError) {
        console.log('Permissions API not available, skipping permissions data');
      }

    } catch (err: any) {
      console.error('Error fetching users data:', err);
      setError('Không thể tải dữ liệu users');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      email: '',
      first_name: '',
      last_name: '',
      role_name: '',
      password: '',
      is_active: true
    });
    setDialogOpen(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role_name: user.role_name,
      password: '',
      is_active: user.is_active
    });
    setDialogOpen(true);
  };

  const handleSaveUser = async () => {
    try {
      // Find role_id from role_name
      const selectedRole = roles.find(role => role.name === formData.role_name);
      if (!selectedRole) {
        setError('Vui lòng chọn role');
        return;
      }

      const userData = {
        ...formData,
        role_id: selectedRole.id
      };

      if (editingUser) {
        // Update user
        await axios.put(`/api/auth/users/${editingUser.id}`, userData);
      } else {
        // Create user
        await axios.post('/api/auth/users', userData);
      }
      setDialogOpen(false);
      setFormData({
        username: '',
        email: '',
        first_name: '',
        last_name: '',
        role_name: '',
        password: '',
        is_active: true
      });
      setEditingUser(null);
      fetchUsersData();
    } catch (err: any) {
      console.error('Error saving user:', err);
      setError('Không thể lưu user');
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa user này?')) {
      try {
        await axios.delete(`/api/auth/users/${userId}`);
        fetchUsersData();
      } catch (err: any) {
        console.error('Error deleting user:', err);
        setError('Không thể xóa user');
      }
    }
  };

  const getRoleColor = (roleName: string) => {
    switch (roleName) {
      case 'admin': return 'error';
      case 'manager': return 'warning';
      case 'operator': return 'info';
      case 'technician': return 'secondary';
      case 'viewer': return 'default';
      default: return 'default';
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'success' : 'error';
  };

  const getPermissionIcon = (granted: boolean) => {
    return granted ? <CheckCircle color="success" /> : <Cancel color="error" />;
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
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

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Quản Lý Người Dùng
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Quản lý users và phân quyền hệ thống
        </Typography>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab 
            label="Danh Sách Người Dùng" 
            icon={<Person />} 
            iconPosition="start"
          />
          <Tab 
            label="Phân Quyền & Vai Trò" 
            icon={<Security />} 
            iconPosition="start"
          />
        </Tabs>
      </Paper>

      {/* Tab 1: User List */}
      <TabPanel value={tabValue} index={0}>
        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" component="div">
                  {users.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tổng Số Người Dùng
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" component="div">
                  {users.filter(u => u.is_active).length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Người Dùng Hoạt Động
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" component="div">
                  {roles.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Vai Trò
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" component="div">
                  {users.filter(u => u.last_login).length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Hoạt Động Gần Đây
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Users Table */}
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" component="h2">
              Danh Sách Người Dùng
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleAddUser}
            >
              Thêm Người Dùng
            </Button>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Người Dùng</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Vai Trò</TableCell>
                  <TableCell>Trạng Thái</TableCell>
                  <TableCell>Đăng Nhập Cuối</TableCell>
                  <TableCell>Thao Tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Box>
                        <Typography variant="body1" fontWeight="medium">
                          {user.first_name} {user.last_name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          @{user.username}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={user.role_name}
                        color={getRoleColor(user.role_name) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.is_active ? 'Hoạt Động' : 'Không Hoạt Động'}
                        color={getStatusColor(user.is_active) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {user.last_login ? (
                        new Date(user.last_login).toLocaleDateString()
                      ) : (
                        'Chưa đăng nhập'
                      )}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="Xem Chi Tiết">
                          <IconButton size="small">
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Sửa Người Dùng">
                          <IconButton size="small" onClick={() => handleEditUser(user)}>
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Xóa Người Dùng">
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </TabPanel>

      {/* Tab 2: Permissions */}
      <TabPanel value={tabValue} index={1}>
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
                    avatar={<Security />}
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
        {currentUserPermissions && (
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Visibility />
              Danh Sách Quyền Có Sẵn
            </Typography>
            
            <Grid container spacing={2}>
              {currentUserPermissions.available_permissions.map((permission) => (
                <Grid item xs={12} sm={6} md={4} key={permission.name}>
                  <Card 
                    sx={{ 
                      border: `2px solid ${permission.granted ? theme.palette.success.main : theme.palette.error.main}`,
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
        )}

        {/* Roles Information */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Group />
            Thông Tin Vai Trò
          </Typography>
          
          <Grid container spacing={2}>
            {roles.map((role) => (
              <Grid item xs={12} md={6} key={role.id}>
                <Card>
                  <CardHeader 
                    title={role.name}
                    subheader={role.description}
                    avatar={<AdminPanelSettings />}
                  />
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">
                      <strong>ID:</strong> {role.id}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Mô tả:</strong> {role.description}
                    </Typography>
                    <Chip 
                      label={`${users.filter(u => u.role_name === role.name).length} users`}
                      color="primary"
                      size="small"
                      sx={{ mt: 1 }}
                    />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      </TabPanel>

      {/* Add/Edit User Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingUser ? 'Sửa Người Dùng' : 'Thêm Người Dùng Mới'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Tên"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Họ"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Vai Trò</InputLabel>
                <Select
                  value={formData.role_name}
                  label="Vai Trò"
                  onChange={(e) => setFormData({ ...formData, role_name: e.target.value })}
                >
                  {roles.map((role) => (
                    <MenuItem key={role.id} value={role.name}>
                      {role.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Mật Khẩu"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                }
                label="Hoạt Động"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Hủy</Button>
          <Button onClick={handleSaveUser} variant="contained">
            {editingUser ? 'Cập Nhật' : 'Tạo'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement; 