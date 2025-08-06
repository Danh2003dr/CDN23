import React, { useState, useEffect } from 'react';
import {
  Badge,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  Box,
  Divider,
  useTheme,
  Button,
  Chip,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Circle as CircleIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';

interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'info' | 'warning' | 'error' | 'success';
  node_id?: number;
  node_name?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

const NotificationBell: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [, setLoading] = useState(false);
  const [, setSocket] = useState<Socket | null>(null);
  const { t } = useTranslation();
  const theme = useTheme();

  // Generate realistic notifications
  const generateNotifications = (): Notification[] => {
    const now = new Date();
    const nodeNames = ['Edge Node - Ho Chi Minh', 'Origin Node - Hanoi', 'Cache Node - Da Nang', 'Edge Node - Can Tho'];
    const nodeIds = [1, 2, 3, 4];
    
    return [
      {
        id: '1',
        title: 'High CPU Usage Alert',
        message: `${nodeNames[0]} is experiencing high CPU usage (85%)`,
        timestamp: '2 minutes ago',
        read: false,
        type: 'warning',
        node_id: nodeIds[0],
        node_name: nodeNames[0],
        severity: 'high',
      },
      {
        id: '2',
        title: 'Cache Hit Rate Improved',
        message: 'System cache hit rate has improved by 15% to 92%',
        timestamp: '1 hour ago',
        read: false,
        type: 'success',
        severity: 'low',
      },
      {
        id: '3',
        title: 'Scheduled Maintenance',
        message: `Scheduled maintenance for ${nodeNames[1]} at 2:00 AM`,
        timestamp: '3 hours ago',
        read: true,
        type: 'info',
        node_id: nodeIds[1],
        node_name: nodeNames[1],
        severity: 'medium',
      },
      {
        id: '4',
        title: 'Network Latency Alert',
        message: `${nodeNames[2]} showing increased latency (150ms)`,
        timestamp: '5 hours ago',
        read: false,
        type: 'error',
        node_id: nodeIds[2],
        node_name: nodeNames[2],
        severity: 'critical',
      },
      {
        id: '5',
        title: 'System Update Complete',
        message: 'CDN system update v2.1.0 has been successfully deployed',
        timestamp: '1 day ago',
        read: true,
        type: 'success',
        severity: 'low',
      },
    ];
  };

  // Initialize notifications and WebSocket
  useEffect(() => {
    fetchNotifications();
    initializeWebSocket();
  }, []);

  const initializeWebSocket = () => {
    const newSocket = io('http://localhost:5000');
    
    newSocket.on('connect', () => {
      console.log('🔌 Connected to WebSocket');
    });

    newSocket.on('new-notification', (notification) => {
      console.log('🔔 New notification received:', notification);
      setNotifications(prev => [notification, ...prev]);
    });

    newSocket.on('system-alert', (alert) => {
      console.log('🚨 System alert received:', alert);
      // Convert alert to notification format
      const notification: Notification = {
        id: alert.id || Date.now().toString(),
        title: `${alert.severity?.toUpperCase() || 'ALERT'} - ${alert.type || 'System Alert'}`,
        message: alert.message || 'System alert received',
        timestamp: alert.timestamp || new Date().toISOString(),
        read: false,
        type: alert.severity === 'critical' ? 'error' : alert.severity === 'high' ? 'warning' : 'info',
        node_id: alert.nodeId,
        severity: alert.severity || 'medium'
      };
      setNotifications(prev => [notification, ...prev]);
    });

    newSocket.on('disconnect', () => {
      console.log('🔌 Disconnected from WebSocket');
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/alerts');
      if (response.data.success) {
        // Convert API response to notification format
        const alerts = response.data.data.alerts || response.data.data || [];
        const notifications = alerts.map((alert: any) => ({
          id: alert.id?.toString() || Date.now().toString(),
          title: `${alert.severity?.toUpperCase() || 'ALERT'} - ${alert.alert_type || 'System Alert'}`,
          message: alert.message || 'System alert',
          timestamp: alert.created_at || new Date().toISOString(),
          read: false,
          type: alert.severity === 'critical' ? 'error' : alert.severity === 'high' ? 'warning' : 'info',
          node_id: alert.node_id,
          node_name: alert.node_name,
          severity: alert.severity || 'medium'
        }));
        setNotifications(notifications);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      // Fallback to mock data
      setNotifications(generateNotifications());
    } finally {
      setLoading(false);
    }
  };

  const unreadCount = Array.isArray(notifications) ? notifications.filter(n => !n.read).length : 0;

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await axios.put(`/api/alerts/${notificationId}/read`);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await axios.put('/api/alerts/read-all');
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      );
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const handleViewNode = (nodeId: number) => {
    // Navigate to node details
    window.location.href = `/nodes/${nodeId}`;
    handleClose();
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'error':
        return theme.palette.error.main;
      case 'warning':
        return theme.palette.warning.main;
      case 'success':
        return theme.palette.success.main;
      default:
        return theme.palette.info.main;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <ErrorIcon />;
      case 'warning':
        return <WarningIcon />;
      case 'success':
        return <CheckCircleIcon />;
      default:
        return <InfoIcon />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return theme.palette.error.main;
      case 'high':
        return theme.palette.warning.main;
      case 'medium':
        return theme.palette.info.main;
      case 'low':
        return theme.palette.success.main;
      default:
        return theme.palette.grey[500];
    }
  };

  return (
    <>
      <IconButton
        onClick={handleClick}
        sx={{
          p: 1,
          borderRadius: 2,
          mr: 1,
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.04)',
          },
        }}
      >
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon sx={{ color: theme.palette.primary.main }} />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 320,
            maxHeight: 400,
            boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
            borderRadius: 2,
          },
        }}
      >
                 <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
           <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
             <Typography variant="h6" sx={{ fontWeight: 600 }}>
               {t('Notifications')}
             </Typography>
             {unreadCount > 0 && (
               <Chip 
                 label={`${unreadCount} ${t('unread')}`}
                 size="small"
                 color="error"
                 sx={{ fontSize: '0.75rem' }}
               />
             )}
           </Box>
           <Typography variant="caption" color="text.secondary">
             System alerts and updates
           </Typography>
         </Box>

                 <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
           {!Array.isArray(notifications) || notifications.length === 0 ? (
             <MenuItem disabled>
               <Typography variant="body2" color="text.secondary">
                 {t('No notifications')}
               </Typography>
             </MenuItem>
           ) : (
             notifications.map((notification, index) => (
               <Box key={notification.id}>
                 <MenuItem
                   sx={{
                     py: 2,
                     px: 2,
                     '&:hover': {
                       backgroundColor: 'rgba(0, 0, 0, 0.04)',
                     },
                   }}
                 >
                   <Box sx={{ display: 'flex', alignItems: 'flex-start', width: '100%' }}>
                     <Box sx={{ mr: 1.5, mt: 0.5 }}>
                       {getNotificationIcon(notification.type)}
                     </Box>
                     <Box sx={{ flex: 1 }}>
                       <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                         <Typography
                           variant="subtitle2"
                           sx={{
                             fontWeight: notification.read ? 400 : 600,
                             color: notification.read ? 'text.secondary' : 'text.primary',
                           }}
                         >
                           {notification.title}
                         </Typography>
                         <Box sx={{ display: 'flex', gap: 0.5 }}>
                           {notification.severity && (
                             <Chip
                               label={notification.severity}
                               size="small"
                               sx={{
                                 fontSize: '0.6rem',
                                 height: 16,
                                 backgroundColor: getSeverityColor(notification.severity),
                                 color: 'white',
                               }}
                             />
                           )}
                           {!notification.read && (
                             <CircleIcon
                               sx={{
                                 fontSize: 8,
                                 color: theme.palette.primary.main,
                                 mt: 0.5,
                               }}
                             />
                           )}
                         </Box>
                       </Box>
                       <Typography
                         variant="body2"
                         sx={{
                           color: 'text.secondary',
                           mb: 1,
                           lineHeight: 1.4,
                         }}
                       >
                         {notification.message}
                       </Typography>
                       <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                         <Typography variant="caption" color="text.secondary">
                           {notification.timestamp}
                         </Typography>
                         <Box sx={{ display: 'flex', gap: 0.5 }}>
                           {notification.node_id && (
                             <Button
                               size="small"
                               variant="outlined"
                               onClick={() => handleViewNode(notification.node_id!)}
                               sx={{ fontSize: '0.7rem', py: 0, px: 1 }}
                             >
                               View Node
                             </Button>
                           )}
                           {!notification.read && (
                             <Button
                               size="small"
                               variant="text"
                               onClick={() => handleMarkAsRead(notification.id)}
                               sx={{ fontSize: '0.7rem', py: 0, px: 1 }}
                             >
                               Mark Read
                             </Button>
                           )}
                         </Box>
                       </Box>
                     </Box>
                   </Box>
                 </MenuItem>
                 {index < notifications.length - 1 && <Divider />}
               </Box>
             ))
           )}
         </Box>

                 {unreadCount > 0 && (
           <>
             <Divider />
             <MenuItem
               onClick={handleMarkAllAsRead}
               sx={{
                 py: 1.5,
                 px: 2,
                 color: theme.palette.primary.main,
                 fontWeight: 600,
                 '&:hover': {
                   backgroundColor: 'rgba(25, 118, 210, 0.04)',
                 },
               }}
             >
               {t('Mark all read')}
             </MenuItem>
           </>
         )}
      </Menu>
    </>
  );
};

export default NotificationBell; 