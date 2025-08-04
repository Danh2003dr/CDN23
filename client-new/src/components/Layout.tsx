import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Chip,
  useTheme,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Storage as StorageIcon,
  ShowChart as ShowChartIcon,
  Assessment as AssessmentIcon,
  People as PeopleIcon,
  CloudUpload as ContentIcon,
  Security as SecurityIcon,
  AccountCircle,
  Logout,
  ChevronLeft,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';
import LanguageSelector from './LanguageSelector';
import NotificationBell from './NotificationBell';
import PermissionGuard from './PermissionGuard';

const drawerWidth = 240;

const Layout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const theme = useTheme();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleMenuClose();
  };

  const menuItems = [
    {
      text: t('navigation.dashboard'),
      icon: <DashboardIcon />,
      path: '/dashboard',
      permission: 'dashboard'
    },
    {
      text: t('navigation.nodes'),
      icon: <StorageIcon />,
      path: '/nodes',
      permission: 'view'
    },
    {
      text: t('navigation.metrics'),
      icon: <AssessmentIcon />,
      path: '/metrics',
      permission: 'metrics'
    },
    {
      text: t('navigation.analytics'),
      icon: <ShowChartIcon />,
      path: '/analytics',
      permission: 'analytics'
    },
    {
      text: 'Content Management',
      icon: <ContentIcon />,
      path: '/content',
      permission: 'content'
    },
    {
      text: 'User Management',
      icon: <PeopleIcon />,
      path: '/users',
      permission: 'user_management'
    },
    {
      text: 'Activity Logs',
      icon: <SecurityIcon />,
      path: '/activity-logs',
      permission: 'audit_logs'
    },
    {
      text: 'Access Logs',
      icon: <SecurityIcon />,
      path: '/access-logs',
      permission: 'audit_logs'
    },
  ];

  // Add User Management menu item for admin/manager roles
  if (user && (user.role_name === 'admin' || user.role_name === 'manager')) {
    menuItems.push({
      text: t('navigation.userManagement'),
      icon: <PeopleIcon />,
      path: '/users',
      permission: 'user_management'
    });
  }

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2,
          borderBottom: `1px solid ${theme.palette.divider}`,
          background: 'linear-gradient(135deg, #1976d2 0%, #2196f3 100%)',
          color: 'white',
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          CDN Manager
        </Typography>
      </Box>
      
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <List>
          {menuItems.map((item) => (
            <PermissionGuard key={item.text} permission={item.permission}>
              <ListItem disablePadding>
                <ListItemButton
                  onClick={() => navigate(item.path)}
                  selected={location.pathname === item.path}
                  sx={{
                    mx: 1,
                    borderRadius: 2,
                    mb: 0.5,
                    '&.Mui-selected': {
                      backgroundColor: 'rgba(25, 118, 210, 0.08)',
                      color: theme.palette.primary.main,
                      '&:hover': {
                        backgroundColor: 'rgba(25, 118, 210, 0.12)',
                      },
                    },
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.04)',
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: location.pathname === item.path ? theme.palette.primary.main : 'inherit',
                      minWidth: 40,
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text}
                    primaryTypographyProps={{
                      fontWeight: location.pathname === item.path ? 600 : 400,
                    }}
                  />
                </ListItemButton>
              </ListItem>
            </PermissionGuard>
          ))}
        </List>
      </Box>
      
      {user && (
        <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar
              sx={{
                width: 40,
                height: 40,
                bgcolor: theme.palette.primary.main,
                mr: 2,
              }}
            >
              {user.username?.charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                {user.username}
              </Typography>
                             <Chip
                 label={user.role_name}
                 size="small"
                 sx={{
                   height: 20,
                   fontSize: '0.75rem',
                   textTransform: 'capitalize',
                 }}
               />
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#ffffff' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          backgroundColor: '#ffffff',
          color: theme.palette.text.primary,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
              {menuItems.find(item => item.path === location.pathname)?.text || 'CDN Manager'}
            </Typography>
          </Box>

                      <LanguageSelector />
            <NotificationBell />
          {user && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton
                onClick={handleMenuClick}
                sx={{
                  p: 1,
                  borderRadius: 2,
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.04)',
                  },
                }}
              >
                <AccountCircle sx={{ color: theme.palette.primary.main }} />
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                PaperProps={{
                  sx: {
                    mt: 1,
                    minWidth: 200,
                    boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                    borderRadius: 2,
                  },
                }}
              >
                <MenuItem onClick={handleLogout} sx={{ color: theme.palette.error.main }}>
                  <Logout sx={{ mr: 1 }} />
                  {t('Logout')}
                </MenuItem>
              </Menu>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              backgroundColor: '#ffffff',
              borderRight: `1px solid ${theme.palette.divider}`,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              backgroundColor: '#ffffff',
              borderRight: `1px solid ${theme.palette.divider}`,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          backgroundColor: '#ffffff',
          minHeight: '100vh',
        }}
      >
        <Toolbar />
        <Box sx={{ mt: 2 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default Layout; 