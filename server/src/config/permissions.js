/**
 * Hệ thống phân quyền hoàn chỉnh cho CDN Management System
 * Dựa trên chức năng hiện tại của hệ thống
 */

// Định nghĩa tất cả permissions có thể có
const PERMISSIONS = {
    'view': 'Xem dữ liệu',
    'edit': 'Chỉnh sửa dữ liệu',
    'delete': 'Xóa dữ liệu',
    'create': 'Tạo mới',
    'manage': 'Quản lý hệ thống',
    'user_management': 'Quản lý người dùng',
    'system_admin': 'Quản trị hệ thống',
    'monitor': 'Giám sát',
    'analytics': 'Phân tích dữ liệu',
    'alerts': 'Quản lý cảnh báo',
    'content': 'Quản lý nội dung',
    'audit_logs': 'Xem logs kiểm toán',
    'export': 'Xuất dữ liệu',
    'import': 'Nhập dữ liệu',
    'backup': 'Sao lưu dữ liệu',
    'restore': 'Khôi phục dữ liệu',
    'settings': 'Cài đặt hệ thống',
    'reports': 'Báo cáo',
    'dashboard': 'Dashboard',
    'nodes': 'Quản lý nodes',
    'metrics': 'Xem metrics',
    'maintenance': 'Bảo trì',
    'security': 'Bảo mật',
    'api_access': 'Truy cập API',
    'webhook': 'Webhook',
    'notification': 'Thông báo',
    'logging': 'Logging',
    'performance': 'Hiệu suất'
};

// Định nghĩa quyền cho từng role
const ROLE_PERMISSIONS = {
    'admin': {
        'view': true,
        'edit': true,
        'delete': true,
        'create': true,
        'manage': true,
        'user_management': true,
        'system_admin': true,
        'monitor': true,
        'analytics': true,
        'alerts': true,
        'content': true,
        'audit_logs': true,
        'export': true,
        'import': true,
        'backup': true,
        'restore': true,
        'settings': true,
        'reports': true,
        'dashboard': true,
        'nodes': true,
        'metrics': true,
        'maintenance': true,
        'security': true,
        'api_access': true,
        'webhook': true,
        'notification': true,
        'logging': true,
        'performance': true
    },
    'manager': {
        'view': true,
        'edit': true,
        'delete': false,
        'create': true,
        'manage': true,
        'user_management': false,
        'system_admin': false,
        'monitor': true,
        'analytics': true,
        'alerts': true,
        'content': true,
        'audit_logs': true,
        'export': true,
        'import': false,
        'backup': false,
        'restore': false,
        'settings': false,
        'reports': true,
        'dashboard': true,
        'nodes': true,
        'metrics': true,
        'maintenance': true,
        'security': false,
        'api_access': true,
        'webhook': false,
        'notification': true,
        'logging': true,
        'performance': true
    },
    'operator': {
        'view': true,
        'edit': false,
        'delete': false,
        'create': false,
        'manage': false,
        'user_management': false,
        'system_admin': false,
        'monitor': true,
        'analytics': true,
        'alerts': true,
        'content': true,
        'audit_logs': false,
        'export': true,
        'import': false,
        'backup': false,
        'restore': false,
        'settings': false,
        'reports': true,
        'dashboard': true,
        'nodes': true,
        'metrics': true,
        'maintenance': false,
        'security': false,
        'api_access': false,
        'webhook': false,
        'notification': false,
        'logging': false,
        'performance': true
    },
    'viewer': {
        'view': true,
        'edit': false,
        'delete': false,
        'create': false,
        'manage': false,
        'user_management': false,
        'system_admin': false,
        'monitor': true,
        'analytics': true,
        'alerts': false,
        'content': false,
        'audit_logs': false,
        'export': false,
        'import': false,
        'backup': false,
        'restore': false,
        'settings': false,
        'reports': false,
        'dashboard': true,
        'nodes': true,
        'metrics': true,
        'maintenance': false,
        'security': false,
        'api_access': false,
        'webhook': false,
        'notification': false,
        'logging': false,
        'performance': false
    }
};

// Mapping API endpoints với permissions cần thiết
const API_PERMISSIONS = {
    // Auth routes
    'POST /api/auth/login': [],
    'POST /api/auth/register': ['user_management'],
    'POST /api/auth/logout': [],
    'GET /api/auth/profile': [],
    'PUT /api/auth/profile': [],
    'GET /api/auth/users': ['user_management'],
    'POST /api/auth/users': ['user_management'],
    'PUT /api/auth/users/:id': ['user_management'],
    'DELETE /api/auth/users/:id': ['user_management'],

    // Nodes routes
    'GET /api/nodes': ['view'],
    'GET /api/nodes/:id': ['view'],
    'POST /api/nodes': ['create'],
    'PUT /api/nodes/:id': ['edit'],
    'DELETE /api/nodes/:id': ['delete'],
    'GET /api/nodes/:id/metrics': ['metrics'],
    'GET /api/nodes/:id/metrics/realtime': ['metrics'],
    'POST /api/nodes/:id/status': ['edit'],

    // Metrics routes
    'GET /api/metrics/dashboard': ['dashboard'],
    'GET /api/metrics/nodes': ['metrics'],
    'GET /api/metrics/node/:id': ['metrics'],
    'GET /api/metrics/performance': ['performance'],

    // Analytics routes
    'GET /api/analytics/summary': ['analytics'],
    'GET /api/analytics/performance-trends': ['analytics'],
    'GET /api/analytics/node-comparison': ['analytics'],
    'GET /api/analytics/geographic-distribution': ['analytics'],
    'GET /api/analytics/real-time-metrics': ['analytics'],
    'GET /api/analytics/user-access': ['analytics'],
    'GET /api/analytics/anomaly-detection': ['analytics'],
    'POST /api/analytics/export': ['export'],

    // Alerts routes
    'GET /api/alerts': ['alerts'],
    'GET /api/alerts/unread': ['alerts'],
    'GET /api/alerts/summary': ['alerts'],
    'GET /api/alerts/node/:nodeId': ['alerts'],
    'GET /api/alerts/anomalies/:nodeId': ['alerts'],
    'POST /api/alerts/test': ['alerts'],
    'PUT /api/alerts/thresholds': ['alerts'],
    'PUT /api/alerts/:id/resolve': ['alerts'],

    // Content routes
    'GET /api/content': ['content'],
    'POST /api/content': ['content'],
    'GET /api/content/:id': ['content'],
    'PUT /api/content/:id': ['content'],
    'DELETE /api/content/:id': ['content'],
    'POST /api/content/upload': ['content'],

    // Activity logs routes
    'GET /api/activity-logs': ['audit_logs'],
    'GET /api/activity-logs/summary': ['audit_logs'],
    'GET /api/activity-logs/user/:userId': ['audit_logs'],
    'GET /api/activity-logs/action/:action': ['audit_logs'],
    'GET /api/activity-logs/resource/:resourceType': ['audit_logs'],
    'GET /api/activity-logs/export': ['audit_logs'],

    // Permissions routes
    'GET /api/permissions': ['system_admin'],
    'GET /api/permissions/roles': ['system_admin'],
    'GET /api/permissions/current-user': [],
    'POST /api/permissions/check': ['system_admin'],
    'GET /api/permissions/endpoints': ['system_admin']
};

// Helper functions
const hasPermission = (userPermissions, permission) => {
    return userPermissions && userPermissions[permission] === true;
};

const getUserPermissions = (roleName) => {
    return ROLE_PERMISSIONS[roleName] || {};
};

const getRoleInfo = (roleName) => {
    const permissions = getUserPermissions(roleName);
    return {
        name: roleName,
        permissions: permissions,
        description: getRoleDescription(roleName)
    };
};

const getRoleDescription = (roleName) => {
    const descriptions = {
        'admin': 'Quản trị viên - Toàn quyền thao tác hệ thống',
        'manager': 'Quản lý - Quản lý cao cấp, không xóa node',
        'operator': 'Vận hành - Chỉ xem dữ liệu, không xóa node',
        'viewer': 'Người xem - Chỉ được xem dashboard'
    };
    return descriptions[roleName] || 'Không xác định';
};

const checkApiPermission = (userPermissions, method, path) => {
    const endpoint = `${method} ${path}`;
    const requiredPermissions = API_PERMISSIONS[endpoint] || [];
    
    if (requiredPermissions.length === 0) {
        return true; // Không cần permission
    }
    
    return requiredPermissions.some(permission => hasPermission(userPermissions, permission));
};

module.exports = {
    PERMISSIONS,
    ROLE_PERMISSIONS,
    API_PERMISSIONS,
    hasPermission,
    getUserPermissions,
    getRoleInfo,
    getRoleDescription,
    checkApiPermission
}; 