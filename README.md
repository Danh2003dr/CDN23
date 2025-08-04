# 🚀 CDN Management System

[![Node.js](https://img.shields.io/badge/Node.js-16+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0+-orange.svg)](https://www.mysql.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> **Hệ thống quản lý Content Delivery Network (CDN) toàn diện** - Giám sát, quản lý và tối ưu hóa việc phân phối nội dung trên mạng lưới server phân tán.

## 📋 Tổng quan

CDN Management System là một giải pháp hoàn chỉnh cho việc quản lý Content Delivery Network, cung cấp:

- 🎯 **Dashboard tổng quan** với metrics real-time
- 🏗️ **Quản lý CDN nodes** phân tán
- 📊 **Analytics & Monitoring** chi tiết
- 🚨 **Alert system** thông minh
- 🔐 **Security & Access Control** mạnh mẽ
- 📱 **Modern UI** với Material-UI

## ✨ Tính năng chính

### 🎛️ Dashboard & Monitoring
- **System Overview**: Tổng quan hệ thống với metrics chính
- **Real-time Metrics**: CPU, RAM, Disk, Network usage
- **Performance Trends**: Biểu đồ xu hướng hiệu suất
- **Geographic Distribution**: Phân bố theo địa lý
- **Health Score**: Điểm số sức khỏe hệ thống

### 🏗️ Node Management
- **Node Status**: Online/Offline/Maintenance
- **Performance Monitoring**: Chi tiết hiệu suất từng node
- **Geographic Distribution**: Phân bố theo khu vực
- **Node Comparison**: So sánh hiệu suất giữa các node
- **Maintenance Scheduling**: Lập lịch bảo trì

### 📁 Content Management
- **Content Upload**: Upload và tối ưu hóa nội dung
- **Content Distribution**: Phân phối nội dung đến các node
- **Content Optimization**: Tối ưu hóa hình ảnh, video, code
- **Cache Management**: Quản lý cache và invalidation
- **Content Analytics**: Thống kê sử dụng nội dung

### 🚨 Alert System
- **Real-time Alerts**: Cảnh báo thời gian thực
- **Severity Levels**: Phân loại mức độ nghiêm trọng
- **Alert Management**: Quản lý và giải quyết cảnh báo
- **Notification System**: Thông báo qua email/SMS
- **Alert History**: Lịch sử cảnh báo

### 🔐 Security & Access Control
- **Role-based Access Control**: Phân quyền theo vai trò
- **Permission Management**: Quản lý quyền chi tiết
- **API Key Authentication**: Xác thực cho external access
- **Audit Logs**: Ghi log mọi hoạt động
- **Session Management**: Quản lý phiên đăng nhập

## 🚀 Quick Start

### Prerequisites
- **Node.js** 16+ 
- **MySQL** 8.0+
- **npm** hoặc **yarn**

### Installation

1. **Clone repository**
```bash
git clone https://github.com/your-username/cdn-management.git
cd cdn-management
```

2. **Setup Backend**
```bash
cd server
npm install
```

3. **Setup Database**
```bash
# Tạo database MySQL
mysql -u root -p
CREATE DATABASE cdn_management;
USE cdn_management;

# Chạy schema
node database/setup.js

# Seed dữ liệu mẫu
node database/seed.js
```

4. **Setup Frontend**
```bash
cd ../client-new
npm install
```

5. **Start Development Servers**
```bash
# Terminal 1 - Backend
cd server
npm start

# Terminal 2 - Frontend  
cd client-new
npm start
```

6. **Access Application**
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Default Admin**: admin@cdn.com / admin123

## 🏗️ Kiến trúc hệ thống

```
📁 CDN-Management/
├── 📁 server/                 # Backend (Node.js + Express)
│   ├── 📁 src/
│   │   ├── 📁 config/        # Database, permissions config
│   │   ├── 📁 middleware/    # Auth, validation middleware
│   │   ├── 📁 models/        # Database models
│   │   ├── 📁 routes/        # API endpoints
│   │   ├── 📁 services/      # Business logic
│   │   └── index.js          # Server entry point
│   ├── 📁 database/          # Schema & seed data
│   └── package.json
├── 📁 client-new/            # Frontend (React + Material-UI)
│   ├── 📁 src/
│   │   ├── 📁 components/    # Reusable components
│   │   ├── 📁 contexts/      # React contexts
│   │   ├── 📁 pages/         # Main pages
│   │   ├── 📁 services/      # API calls
│   │   └── App.tsx           # Main app component
│   └── package.json
└── README.md
```

## 📊 Database Schema

```sql
📊 Database Tables:
├── users                   # Người dùng hệ thống
├── roles                   # Vai trò và quyền hạn
├── cdn_nodes              # Các node CDN
├── node_metrics           # Metrics hiệu suất
├── content                # Nội dung được phân phối
├── content_distribution   # Thông tin phân phối
├── alerts                 # Cảnh báo hệ thống
├── access_logs            # Log truy cập
├── node_maintenance       # Lịch bảo trì
└── api_keys              # API keys cho external access
```

## 🔧 Công nghệ sử dụng

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MySQL** - Database management
- **Socket.IO** - Real-time communication
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **multer** - File upload handling
- **sharp** - Image optimization

### Frontend
- **React.js** - UI framework
- **Material-UI** - Component library
- **TypeScript** - Type safety
- **axios** - HTTP client
- **react-router-dom** - Routing
- **recharts** - Data visualization

## 📋 API Documentation

### Authentication
```http
POST /api/auth/login
POST /api/auth/logout
GET /api/auth/profile
```

### Dashboard
```http
GET /api/metrics/dashboard
GET /api/metrics/overview
GET /api/analytics/performance-trends
```

### Node Management
```http
GET /api/nodes
GET /api/nodes/:id
GET /api/nodes/:id/performance
```

### Content Management
```http
GET /api/content
POST /api/content/upload
POST /api/content/:id/distribute
```

### Alerts
```http
GET /api/alerts
GET /api/alerts/stats
POST /api/alerts/:id/resolve
```

## 🔐 Security Features

- **JWT Authentication** - Secure token-based auth
- **Role-based Access Control** - Fine-grained permissions
- **API Key Security** - SHA-256 hashing
- **Input Validation** - Sanitize user inputs
- **SQL Injection Prevention** - Parameterized queries
- **XSS Protection** - Content Security Policy

## 📈 Performance & Scalability

- **Database Indexing** - Optimized queries
- **Connection Pooling** - Efficient DB connections
- **Image Optimization** - WebP conversion, resizing
- **Code Minification** - CSS, JS, HTML compression
- **Modular Architecture** - Easy to extend
- **API-first Design** - RESTful endpoints

## 🚀 Deployment

### Development
```bash
# Backend
cd server && npm start

# Frontend
cd client-new && npm start
```

### Production
```bash
# Build frontend
cd client-new && npm run build

# Start backend with PM2
cd server && pm2 start src/index.js
```

## 📊 Sample Data

### Users & Roles
- **Admin**: Quyền quản trị toàn hệ thống
- **Manager**: Quản lý cao cấp
- **Operator**: Vận hành CDN
- **Technician**: Hỗ trợ kỹ thuật
- **Viewer**: Chỉ xem báo cáo

### CDN Nodes
- **9 Nodes** phân bố tại 4 thành phố
- **3 Node Types**: Edge, Origin, Cache
- **Real-time Metrics**: CPU, RAM, Disk, Network

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support

- **Documentation**: [PROJECT_DESCRIPTION.md](PROJECT_DESCRIPTION.md)
- **API Reference**: [API Documentation](#api-documentation)
- **Issues**: [GitHub Issues](https://github.com/your-username/cdn-management/issues)
- **Wiki**: [Project Wiki](https://github.com/your-username/cdn-management/wiki)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Material-UI** for the beautiful component library
- **Express.js** team for the robust web framework
- **React** team for the amazing UI library
- **MySQL** for the reliable database system

---

**Made with ❤️ for better content delivery**

> **CDN Management System** - Giải pháp toàn diện cho việc quản lý và tối ưu hóa Content Delivery Network #   C D N 2 3  
 