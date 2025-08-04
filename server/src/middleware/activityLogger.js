const UserActivityLog = require('../models/UserActivityLog');

// Middleware để log hoạt động người dùng
const logUserActivity = (action, resourceType = null, resourceId = null) => {
    return async (req, res, next) => {
        const originalSend = res.send;
        const originalJson = res.json;
        
        // Override res.send để capture response
        res.send = function(data) {
            logActivity(req, res, action, resourceType, resourceId, data);
            return originalSend.call(this, data);
        };
        
        // Override res.json để capture response
        res.json = function(data) {
            logActivity(req, res, action, resourceType, resourceId, data);
            return originalJson.call(this, data);
        };
        
        next();
    };
};

// Function để log activity
const logActivity = async (req, res, action, resourceType, resourceId, responseData) => {
    try {
        if (!req.user) {
            return; // Không log nếu không có user
        }

        // Parse response data để xác định success/error
        let success = true;
        let errorMessage = null;
        
        if (responseData) {
            try {
                const data = typeof responseData === 'string' ? JSON.parse(responseData) : responseData;
                success = data.success !== false;
                errorMessage = data.message || null;
            } catch (e) {
                // Nếu không parse được JSON, coi như success
                success = true;
            }
        }

        // Lấy IP address
        const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
        
        // Lấy user agent
        const userAgent = req.headers['user-agent'];
        
        // Tạo details object
        const details = {
            method: req.method,
            url: req.originalUrl,
            params: req.params,
            query: req.query,
            body: req.body,
            response: responseData
        };

        // Log activity
        await UserActivityLog.create({
            user_id: req.user.id,
            action: action,
            resource_type: resourceType,
            resource_id: resourceId,
            details: details,
            ip_address: ipAddress,
            user_agent: userAgent,
            success: success,
            error_message: errorMessage
        });

    } catch (error) {
        console.error('Error logging user activity:', error);
        // Không throw error để không ảnh hưởng đến response
    }
};

// Helper functions cho các action cụ thể
const logLogin = logUserActivity('login', 'auth');
const logLogout = logUserActivity('logout', 'auth');
const logCreateNode = logUserActivity('create_node', 'node');
const logUpdateNode = logUserActivity('update_node', 'node');
const logDeleteNode = logUserActivity('delete_node', 'node');
const logExportData = logUserActivity('export_data', 'analytics');
const logResolveAlert = logUserActivity('resolve_alert', 'alert');
const logViewAnalytics = logUserActivity('view_analytics', 'analytics');
const logViewDashboard = logUserActivity('view_dashboard', 'dashboard');
const logViewNodes = logUserActivity('view_nodes', 'nodes');
const logViewUsers = logUserActivity('view_users', 'users');
const logCreateUser = logUserActivity('create_user', 'user');
const logUpdateUser = logUserActivity('update_user', 'user');
const logDeleteUser = logUserActivity('delete_user', 'user');

// Middleware để log tất cả API calls
const logAllAPI = async (req, res, next) => {
    const originalSend = res.send;
    const originalJson = res.json;
    
    res.send = function(data) {
        logActivity(req, res, 'api_call', 'api', null, data);
        return originalSend.call(this, data);
    };
    
    res.json = function(data) {
        logActivity(req, res, 'api_call', 'api', null, data);
        return originalJson.call(this, data);
    };
    
    next();
};

module.exports = {
    logUserActivity,
    logLogin,
    logLogout,
    logCreateNode,
    logUpdateNode,
    logDeleteNode,
    logExportData,
    logResolveAlert,
    logViewAnalytics,
    logViewDashboard,
    logViewNodes,
    logViewUsers,
    logCreateUser,
    logUpdateUser,
    logDeleteUser,
    logAllAPI
}; 