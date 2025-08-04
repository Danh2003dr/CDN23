# BÁO CÁO API KEYS - HỆ THỐNG CDN MANAGEMENT

## 📋 TỔNG QUAN

**API Keys** là cơ chế xác thực cho phép các ứng dụng bên ngoài truy cập vào hệ thống CDN Management mà không cần đăng nhập bằng username/password.

## 🔑 CÁC API KEYS ĐÃ TẠO

### **1. CDN Management API**
- **Key**: `ec4591fcddb3e81902c7f7fb779f744e9bbb5aca2dbe32c57e1e54babc62a355`
- **Permissions**: `monitor`, `alerts`, `content`, `metrics`, `nodes`
- **Expires**: 2026-08-03 (1 năm)
- **Mục đích**: Truy cập đầy đủ vào tất cả tính năng quản lý CDN

### **2. Content Distribution API**
- **Key**: `af75edf4fabda57b11a29c1ba57c0f0be124792cbd9de6d2fd4bacc346ec872e`
- **Permissions**: `content`, `content_upload`, `content_distribute`, `content_optimize`
- **Expires**: 2026-01-30 (6 tháng)
- **Mục đích**: Chuyên biệt cho việc upload và phân phối nội dung

### **3. Monitoring API**
- **Key**: `cfa00542ac5b651d6862d970d3ff0e94ae7caad3cb352259efbf421bfe2a5dfc`
- **Permissions**: `monitor`, `metrics`, `alerts`, `view`
- **Expires**: 2025-11-01 (3 tháng)
- **Mục đích**: Giám sát và theo dõi hiệu suất hệ thống

### **4. Read-Only API**
- **Key**: `bb273abe77895a7d1df48b34c460bbf20a0f48f9c700096aa6cb61865c80e843`
- **Permissions**: `view`, `monitor`
- **Expires**: 2025-09-02 (1 tháng)
- **Mục đích**: Chỉ đọc dữ liệu, không có quyền thay đổi

## 🗂️ CẤU TRÚC BẢNG API_KEYS

```sql
CREATE TABLE api_keys (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    key_hash VARCHAR(255) UNIQUE NOT NULL,
    permissions JSON,
    created_by INT,
    is_active BOOLEAN DEFAULT true,
    last_used TIMESTAMP NULL,
    expires_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);
```

### **Các trường chính:**
- **`id`**: Khóa chính tự động tăng
- **`name`**: Tên mô tả của API key
- **`key_hash`**: Hash SHA-256 của API key thực tế
- **`permissions`**: JSON chứa các quyền được cấp
- **`created_by`**: ID người dùng tạo key
- **`is_active`**: Trạng thái hoạt động
- **`last_used`**: Thời gian sử dụng cuối cùng
- **`expires_at`**: Thời gian hết hạn
- **`created_at`**: Thời gian tạo

## 🔐 CƠ CHẾ BẢO MẬT

### **1. Hash-based Storage**
- API key thực tế được hash bằng SHA-256 trước khi lưu
- Chỉ lưu hash, không lưu key gốc trong database
- Tăng tính bảo mật khi database bị xâm nhập

### **2. Permission-based Access**
- Mỗi API key có danh sách quyền cụ thể
- Kiểm tra quyền trước khi cho phép truy cập endpoint
- Nguyên tắc "least privilege" - chỉ cấp quyền cần thiết

### **3. Expiration Management**
- Mỗi key có thời gian hết hạn
- Tự động vô hiệu hóa khi hết hạn
- Có thể gia hạn hoặc tạo key mới

## 📊 SỬ DỤNG API KEYS

### **Headers cần thiết:**
```http
X-API-Key: your_api_key_here
Content-Type: application/json
```

### **Ví dụ sử dụng:**
```javascript
// Sử dụng với axios
const response = await axios.get('http://localhost:5000/api/metrics/dashboard', {
  headers: {
    'X-API-Key': 'ec4591fcddb3e81902c7f7fb779f744e9bbb5aca2dbe32c57e1e54babc62a355'
  }
});
```

## 🎯 CÁC ENDPOINT HỖ TRỢ

### **Dashboard & Monitoring**
- `GET /api/metrics/dashboard` - Dữ liệu dashboard
- `GET /api/metrics/overview` - Tổng quan hệ thống
- `GET /api/analytics/performance-trends` - Xu hướng hiệu suất

### **Node Management**
- `GET /api/nodes` - Danh sách nodes
- `GET /api/nodes/:id` - Chi tiết node
- `GET /api/nodes/:id/performance` - Hiệu suất node

### **Content Management**
- `GET /api/content` - Danh sách nội dung
- `POST /api/content/upload` - Upload nội dung
- `POST /api/content/:id/distribute` - Phân phối nội dung

### **Alerts & Logs**
- `GET /api/alerts` - Danh sách cảnh báo
- `GET /api/access-logs` - Log truy cập

## ⚠️ LƯU Ý BẢO MẬT

### **1. Bảo vệ API Keys**
- Không chia sẻ API keys trong code public
- Sử dụng environment variables
- Rotate keys định kỳ

### **2. Monitoring**
- Theo dõi usage patterns
- Phát hiện sử dụng bất thường
- Log tất cả API calls

### **3. Best Practices**
- Sử dụng HTTPS cho tất cả API calls
- Implement rate limiting
- Validate input data
- Log security events

## 🚀 LỢI ÍCH

### **1. External Integration**
- Cho phép tích hợp với hệ thống bên ngoài
- API-first architecture
- Standardized authentication

### **2. Security**
- Không cần chia sẻ user credentials
- Fine-grained permissions
- Audit trail cho mọi access

### **3. Scalability**
- Multiple API keys cho different purposes
- Easy revocation và rotation
- Usage tracking và analytics

## 📈 STATISTICS

- **Total API Keys**: 4
- **Active Keys**: 4
- **Average Expiration**: 6.5 months
- **Permission Types**: 8 different permissions
- **Security Level**: High (SHA-256 hashing)

## 🔄 QUẢN LÝ API KEYS

### **Tạo mới:**
```javascript
// Sử dụng script create-sample-api-keys.js
node create-sample-api-keys.js
```

### **Kiểm tra:**
```javascript
// Sử dụng script check-api-keys.js
node check-api-keys.js
```

### **Test functionality:**
```javascript
// Sử dụng script test-api-keys.js
node test-api-keys.js
```

---

**Kết luận**: Hệ thống API Keys đã được thiết lập hoàn chỉnh với 4 keys mẫu, đảm bảo bảo mật cao và linh hoạt trong việc tích hợp với các hệ thống bên ngoài. 