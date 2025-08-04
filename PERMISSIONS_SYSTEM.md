# 🔐 Hệ Thống Phân Quyền Hoàn Chỉnh

## 📋 Tổng Quan

Hệ thống phân quyền của CDN Management đã được thiết kế hoàn chỉnh với 5 vai trò chính và 29 quyền hạn chi tiết, đảm bảo bảo mật và kiểm soát truy cập theo nguyên tắc **Least Privilege**.

## 🏗️ Kiến Trúc Hệ Thống

### **1. Cấu Trúc Permissions**
```
📁 server/src/config/permissions.js
├── PERMISSIONS (29 permissions)
├── ROLE_PERMISSIONS (5 roles)
├── API_PERMISSIONS (endpoint mapping)
└── Helper Functions
```

### **2. Middleware Authentication**
```
📁 server/src/middleware/auth.js
├── auth (JWT verification)
├── requirePermission (single permission)
├── requireAnyPermission (OR logic)
├── requireAllPermissions (AND logic)
└── requireRole (role-based)
```

### **3. API Routes**
```
📁 server/src/routes/permissions.js
├── GET /api/permissions (list all)
├── GET /api/permissions/roles (list roles)
├── GET /api/permissions/current-user (user permissions)
├── POST /api/permissions/check (check permissions)
└── GET /api/permissions/endpoints (API mapping)
```

## 👥 Vai Trò (Roles)

### **1. Administrator (29 permissions)**
- **Mô tả**: Quản trị viên hệ thống - Toàn quyền
- **Quyền**: Tất cả 29 permissions
- **Tài khoản**: `admin@cdn.com` / `admin123`

### **2. Manager (19 permissions)**
- **Mô tả**: Quản lý - Quyền quản lý cao cấp
- **Quyền**: Dashboard, Analytics, Content, Nodes, Metrics
- **Tài khoản**: `manager1@cdn.com` / `manager123`

### **3. Operator (11 permissions)**
- **Mô tả**: Vận hành - Quyền vận hành hệ thống
- **Quyền**: Monitoring, Alerts, Content Upload, Basic View
- **Tài khoản**: `operator1@cdn.com` / `operator123`

### **4. Technician (8 permissions)**
- **Mô tả**: Kỹ thuật viên - Quyền bảo trì và giám sát
- **Quyền**: Monitoring, Alerts, Node Maintenance, Basic View
- **Tài khoản**: `technician1@cdn.com` / `technician123`

### **5. Viewer (8 permissions)**
- **Mô tả**: Người xem - Chỉ quyền xem
- **Quyền**: Dashboard, Analytics, Nodes, Metrics (read-only)
- **Tài khoản**: `viewer1@cdn.com` / `viewer123`

## 🔑 Danh Sách Permissions (29 quyền)

### **Quyền Cơ Bản (4)**
| Permission | Mô Tả | Admin | Manager | Operator | Technician | Viewer |
|------------|-------|-------|---------|----------|------------|--------|
| `view` | Xem dữ liệu cơ bản | ✅ | ✅ | ✅ | ✅ | ✅ |
| `edit` | Chỉnh sửa dữ liệu | ✅ | ✅ | ❌ | ❌ | ❌ |
| `delete` | Xóa dữ liệu | ✅ | ❌ | ❌ | ❌ | ❌ |
| `create` | Tạo mới dữ liệu | ✅ | ✅ | ❌ | ❌ | ❌ |

### **Quyền Quản Lý Hệ Thống (4)**
| Permission | Mô Tả | Admin | Manager | Operator | Technician | Viewer |
|------------|-------|-------|---------|----------|------------|--------|
| `system_admin` | Quản trị hệ thống | ✅ | ❌ | ❌ | ❌ | ❌ |
| `user_management` | Quản lý người dùng | ✅ | ❌ | ❌ | ❌ | ❌ |
| `role_management` | Quản lý vai trò | ✅ | ❌ | ❌ | ❌ | ❌ |
| `system_config` | Cấu hình hệ thống | ✅ | ❌ | ❌ | ❌ | ❌ |

### **Quyền Giám Sát và Phân Tích (4)**
| Permission | Mô Tả | Admin | Manager | Operator | Technician | Viewer |
|------------|-------|-------|---------|----------|------------|--------|
| `monitor` | Giám sát hệ thống | ✅ | ✅ | ✅ | ✅ | ✅ |
| `analytics` | Phân tích dữ liệu | ✅ | ✅ | ✅ | ❌ | ✅ |
| `reports` | Tạo báo cáo | ✅ | ✅ | ❌ | ❌ | ❌ |
| `alerts` | Quản lý cảnh báo | ✅ | ✅ | ✅ | ✅ | ✅ |

### **Quyền Quản Lý Nội Dung (5)**
| Permission | Mô Tả | Admin | Manager | Operator | Technician | Viewer |
|------------|-------|-------|---------|----------|------------|--------|
| `content` | Quản lý nội dung | ✅ | ✅ | ✅ | ❌ | ❌ |
| `content_upload` | Upload nội dung | ✅ | ✅ | ✅ | ❌ | ❌ |
| `content_distribute` | Phân phối nội dung | ✅ | ✅ | ✅ | ❌ | ❌ |
| `content_optimize` | Tối ưu hóa nội dung | ✅ | ✅ | ❌ | ❌ | ❌ |
| `cache_manage` | Quản lý cache | ✅ | ✅ | ❌ | ❌ | ❌ |

### **Quyền Quản Lý Nodes (4)**
| Permission | Mô Tả | Admin | Manager | Operator | Technician | Viewer |
|------------|-------|-------|---------|----------|------------|--------|
| `nodes` | Quản lý nodes | ✅ | ✅ | ✅ | ✅ | ✅ |
| `node_manage` | Quản lý nodes (CRUD) | ✅ | ✅ | ❌ | ❌ | ❌ |
| `node_monitor` | Giám sát nodes | ✅ | ✅ | ✅ | ✅ | ✅ |
| `node_maintenance` | Bảo trì nodes | ✅ | ❌ | ❌ | ✅ | ❌ |

### **Quyền Quản Lý Metrics (4)**
| Permission | Mô Tả | Admin | Manager | Operator | Technician | Viewer |
|------------|-------|-------|---------|----------|------------|--------|
| `metrics` | Quản lý metrics | ✅ | ✅ | ✅ | ✅ | ✅ |
| `metrics_view` | Xem metrics | ✅ | ✅ | ✅ | ✅ | ✅ |
| `metrics_export` | Xuất metrics | ✅ | ✅ | ❌ | ❌ | ❌ |
| `performance_analysis` | Phân tích hiệu suất | ✅ | ✅ | ❌ | ❌ | ❌ |

### **Quyền Bảo Mật (4)**
| Permission | Mô Tả | Admin | Manager | Operator | Technician | Viewer |
|------------|-------|-------|---------|----------|------------|--------|
| `security` | Quản lý bảo mật | ✅ | ❌ | ❌ | ❌ | ❌ |
| `audit_logs` | Xem logs kiểm toán | ✅ | ❌ | ❌ | ❌ | ❌ |
| `api_keys` | Quản lý API keys | ✅ | ❌ | ❌ | ❌ | ❌ |
| `backup_restore` | Sao lưu và khôi phục | ✅ | ❌ | ❌ | ❌ | ❌ |

## 🌐 API Endpoints và Permissions

### **Auth Routes**
| Endpoint | Permission Required | Method |
|----------|-------------------|--------|
| `/api/auth/users` | `user_management` | GET |
| `/api/auth/users/roles` | `user_management` | GET |
| `/api/auth/users/:id` | `user_management` | GET/PUT |

### **Nodes Routes**
| Endpoint | Permission Required | Method |
|----------|-------------------|--------|
| `/api/nodes` | `view` | GET |
| `/api/nodes/:id` | `view` | GET |
| `/api/nodes/summary/status` | `view` | GET |
| `/api/nodes/:id/performance` | `view` | GET |

### **Metrics Routes**
| Endpoint | Permission Required | Method |
|----------|-------------------|--------|
| `/api/metrics/overview` | `monitor` | GET |
| `/api/metrics/dashboard` | `monitor` | GET |
| `/api/metrics/summary` | `monitor` | GET |
| `/api/metrics/node/:nodeId` | `monitor` | GET |

### **Analytics Routes**
| Endpoint | Permission Required | Method |
|----------|-------------------|--------|
| `/api/analytics/summary` | `monitor` | GET |
| `/api/analytics/performance-trends` | `monitor` | GET |
| `/api/analytics/anomaly-detection` | `monitor` | GET |
| `/api/analytics/real-time-metrics` | `monitor` | GET |

### **Content Routes**
| Endpoint | Permission Required | Method |
|----------|-------------------|--------|
| `/api/content` | `content` | GET |
| `/api/content/upload` | `content_upload` | POST |
| `/api/content/:id/distribute` | `content_distribute` | POST |
| `/api/content/:id/optimize` | `content_optimize` | POST |
| `/api/content/stats` | `content` | GET |

### **Alerts Routes**
| Endpoint | Permission Required | Method |
|----------|-------------------|--------|
| `/api/alerts` | `alerts` | GET |
| `/api/alerts/unread` | `alerts` | GET |
| `/api/alerts/:id/read` | `alerts` | PUT |
| `/api/alerts/read-all` | `alerts` | PUT |

## 🔧 Cách Sử Dụng

### **1. Kiểm Tra Permission Trong Backend**
```javascript
// Middleware trong routes
router.get('/api/nodes', auth, requirePermission('view'), async (req, res) => {
  // Route logic
});

// Kiểm tra nhiều permissions
router.post('/api/content/upload', auth, requireAnyPermission(['content_upload', 'content']), async (req, res) => {
  // Route logic
});
```

### **2. Kiểm Tra Permission Trong Frontend**
```javascript
// Kiểm tra permission của user hiện tại
const checkPermission = async (permission) => {
  try {
    const response = await axios.post('/api/permissions/check', {
      permissions: [permission]
    });
    return response.data.data.permissions[permission];
  } catch (error) {
    return false;
  }
};

// Sử dụng
if (await checkPermission('content_upload')) {
  // Hiển thị nút upload
}
```

### **3. Lấy Thông Tin Permissions**
```javascript
// Lấy permissions của user hiện tại
const getUserPermissions = async () => {
  const response = await axios.get('/api/permissions/current-user');
  return response.data.data;
};

// Lấy danh sách roles
const getRoles = async () => {
  const response = await axios.get('/api/permissions/roles');
  return response.data.data.roles;
};
```

## 🛡️ Bảo Mật

### **1. JWT Authentication**
- Token-based authentication
- Automatic token validation
- Session management

### **2. Rate Limiting**
- Auth endpoints: 50 requests/15min
- API endpoints: 1000 requests/15min
- Upload endpoints: 100 requests/15min

### **3. Permission Validation**
- Server-side permission checking
- API-level security
- Role-based access control

### **4. Error Handling**
- Graceful permission denial
- Detailed error messages
- Audit logging

## 📊 Monitoring và Logging

### **1. Permission Checks**
```javascript
// Log permission checks
const logPermissionCheck = (permission) => {
  return (req, res, next) => {
    if (req.user) {
      console.log(`🔐 Permission check: ${req.user.username} (${req.user.role_name}) -> ${permission}`);
    }
    next();
  };
};
```

### **2. Audit Trail**
- Track permission checks
- Log access attempts
- Monitor role changes

## 🚀 Deployment

### **1. Database Setup**
```sql
-- Roles table
CREATE TABLE roles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) UNIQUE NOT NULL,
  permissions JSON NOT NULL
);

-- Users table
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role_id INT,
  is_active BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (role_id) REFERENCES roles(id)
);
```

### **2. Environment Variables**
```env
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h
```

### **3. Testing**
```bash
# Test permissions
node update-permissions-complete.js

# Test multi-user access
node test-multi-users.js
```

## 📈 Performance

### **1. Caching**
- Permission checks cached
- Role information cached
- API responses cached

### **2. Optimization**
- Efficient permission checking
- Minimal database queries
- Fast response times

### **3. Scalability**
- Support for multiple users
- Concurrent access handling
- Load balancing ready

## 🎯 Kết Luận

Hệ thống phân quyền đã được thiết kế hoàn chỉnh với:

- ✅ **29 permissions** chi tiết
- ✅ **5 roles** với quyền hạn rõ ràng
- ✅ **API-level security** cho tất cả endpoints
- ✅ **Frontend integration** với UI quản lý
- ✅ **Multi-user support** với concurrent access
- ✅ **Audit logging** và monitoring
- ✅ **Performance optimization** và caching

**Hệ thống sẵn sàng cho production use!** 🎉 