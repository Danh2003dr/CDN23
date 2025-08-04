# 🎯 Hướng dẫn Hệ thống Phân quyền và Đăng ký Tài khoản

## 📋 Tổng quan

Hệ thống CDN Management đã được hoàn thiện với **hệ thống phân quyền đầy đủ** và **chức năng đăng ký tài khoản**. Dưới đây là hướng dẫn chi tiết:

## 🔐 Hệ thống Phân quyền

### 🎭 5 Vai trò (Roles) được định nghĩa:

#### 1. **👑 Admin** (ID: 1)
- **Quyền:** Toàn bộ hệ thống
- **Permissions:** `{"all": true, "user_management": true, "system_config": true}`
- **Chức năng:**
  - Quản lý tất cả users
  - Cấu hình hệ thống
  - Truy cập toàn bộ tính năng
  - Xóa users

#### 2. **👨‍💼 Manager** (ID: 2)
- **Quyền:** Quản lý và giám sát
- **Permissions:** `{"monitor": true, "alerts": true, "content": true, "manage": true, "user_management": true}`
- **Chức năng:**
  - Quản lý users (không xóa)
  - Giám sát hệ thống
  - Quản lý nodes
  - Xem báo cáo

#### 3. **👨‍💻 Operator** (ID: 3)
- **Quyền:** Vận hành CDN
- **Permissions:** `{"monitor": true, "alerts": true, "content": true, "manage": true}`
- **Chức năng:**
  - Giám sát nodes
  - Quản lý content
  - Xử lý alerts
  - Không quản lý users

#### 4. **🔧 Technician** (ID: 4)
- **Quyền:** Hỗ trợ kỹ thuật
- **Permissions:** `{"monitor": true, "alerts": true, "view": true}`
- **Chức năng:**
  - Xem dashboard
  - Giám sát hệ thống
  - Xem alerts
  - Không quản lý

#### 5. **👁️ Viewer** (ID: 5)
- **Quyền:** Chỉ xem
- **Permissions:** `{"view": true}`
- **Chức năng:**
  - Xem dashboard
  - Xem nodes
  - Không chỉnh sửa

## 📝 Chức năng Đăng ký Tài khoản

### 🎯 **Đăng ký dành cho ai:**

#### ✅ **Có thể đăng ký:**
- **Nhân viên mới** của công ty
- **Đối tác** cần truy cập hệ thống
- **Khách hàng** cần giám sát CDN
- **Nhà cung cấp dịch vụ** cần hỗ trợ kỹ thuật

#### ❌ **Không thể đăng ký:**
- **Admin** - Chỉ tạo thủ công
- **Manager** - Cần phê duyệt từ admin
- **Tài khoản test** - Chỉ dùng cho development

### 🔄 **Quy trình đăng ký:**

1. **Truy cập:** `/register`
2. **Điền thông tin:**
   - Username (tối thiểu 3 ký tự)
   - Email (duy nhất)
   - Password (tối thiểu 6 ký tự)
   - First Name, Last Name
   - Chọn Role (mặc định: Viewer)

3. **Xác thực:**
   - Email validation
   - Password strength
   - Username uniqueness

4. **Kích hoạt:**
   - Tài khoản được tạo với trạng thái Active
   - Có thể đăng nhập ngay

## 🛠️ API Endpoints

### 🔐 Authentication
```http
POST /api/auth/register          # Đăng ký tài khoản
POST /api/auth/login            # Đăng nhập
POST /api/auth/logout           # Đăng xuất
GET  /api/auth/profile          # Thông tin user
PUT  /api/auth/profile          # Cập nhật profile
PUT  /api/auth/change-password  # Đổi mật khẩu
```

### 👥 User Management (Admin/Manager)
```http
GET    /api/auth/users                    # Danh sách users
GET    /api/auth/users/roles              # Danh sách roles
GET    /api/auth/users/:id                # Chi tiết user
PUT    /api/auth/users/:id                # Cập nhật user
DELETE /api/auth/users/:id                # Xóa user (chỉ admin)
PUT    /api/auth/users/:id/activate       # Kích hoạt user
PUT    /api/auth/users/:id/deactivate     # Vô hiệu hóa user
```

## 🎮 Sử dụng trong Frontend

### 📱 **Trang đăng ký:**
- **URL:** `http://localhost:3000/register`
- **Form fields:** Username, Email, Password, Confirm Password, First Name, Last Name, Role
- **Validation:** Real-time validation
- **Success:** Redirect to login page

### 👥 **Trang quản lý user (Admin/Manager):**
- **URL:** `http://localhost:3000/users`
- **Features:**
  - Danh sách tất cả users
  - Thêm user mới
  - Chỉnh sửa thông tin user
  - Kích hoạt/vô hiệu hóa user
  - Xóa user (chỉ admin)
  - Filter theo role, status

### 🔒 **Phân quyền trong UI:**
- **Menu items** hiển thị theo role
- **Buttons/Actions** ẩn/hiện theo permission
- **API calls** được bảo vệ bởi middleware

## 🗄️ Database Schema

### 📊 **Bảng Roles:**
```sql
CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    permissions JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 👤 **Bảng Users:**
```sql
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    role_id INT,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id)
);
```

## 🔧 Cài đặt và Chạy

### 1. **Cập nhật database:**
```bash
cd server
node database/setup.js
node database/seed.js
```

### 2. **Khởi động hệ thống:**
```bash
# Terminal 1 - Backend
cd server
node src/index.js

# Terminal 2 - Frontend
cd client-new
npm start
```

### 3. **Truy cập:**
- **Frontend:** http://localhost:3000
- **Đăng ký:** http://localhost:3000/register
- **Đăng nhập:** http://localhost:3000/login

## 👥 Users mẫu

### 🔑 **Tài khoản test:**
```
Admin:     admin@cdn.com     / admin123
Manager:   manager@cdn.com   / manager123
Operator:  operator@cdn.com  / operator123
Technician: tech@cdn.com     / tech123
Viewer:    viewer@cdn.com    / viewer123
```

## 🛡️ Bảo mật

### ✅ **Đã triển khai:**
- **JWT Authentication** - Token-based auth
- **Password Hashing** - bcrypt với salt rounds
- **Role-based Access Control** - Phân quyền chi tiết
- **Permission-based Middleware** - Bảo vệ API
- **Input Validation** - Sanitize và validate
- **Rate Limiting** - Chống brute force

### 🔒 **Best Practices:**
- **Password Policy:** Tối thiểu 6 ký tự
- **Email Validation:** Format chuẩn
- **Username Uniqueness:** Không trùng lặp
- **Role Assignment:** Mặc định Viewer role
- **Account Status:** Active/Inactive toggle

## 🎯 Kết luận

Hệ thống đã được **hoàn thiện đầy đủ** với:

✅ **5 vai trò phân quyền rõ ràng**  
✅ **Chức năng đăng ký tài khoản**  
✅ **Quản lý user cho admin/manager**  
✅ **Bảo mật JWT + bcrypt**  
✅ **UI/UX thân thiện**  
✅ **API endpoints đầy đủ**  
✅ **Database schema tối ưu**  

**Sẵn sàng sử dụng trong production!** 🚀 