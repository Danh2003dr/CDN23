# BÁO CÁO CẤU TRÚC DATABASE 3NF - HỆ THỐNG CDN MANAGEMENT

## 1. TỔNG QUAN VỀ CHUẨN 3NF

**3NF (Third Normal Form)** là chuẩn hóa dữ liệu bậc 3, đảm bảo:
- **1NF**: Không có dữ liệu lặp lại và các giá trị nguyên tử
- **2NF**: Không có phụ thuộc hàm bộ phận
- **3NF**: Không có phụ thuộc hàm bắc cầu

## 2. CÁC BẢNG DỮ LIỆU THEO 3NF

### 2.1. BẢNG CHÍNH (PRIMARY TABLES)

#### **1. Bảng `roles` (Phân quyền)**
```sql
CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    permissions JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```
**Mục đích**: Quản lý vai trò và quyền hạn của người dùng
**3NF Compliance**: ✅ Không có phụ thuộc hàm bắc cầu

#### **2. Bảng `users` (Người dùng)**
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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id)
);
```
**Mục đích**: Lưu trữ thông tin người dùng hệ thống
**3NF Compliance**: ✅ Foreign key đến `roles` thay vì lưu trực tiếp

#### **3. Bảng `cdn_nodes` (Node CDN)**
```sql
CREATE TABLE cdn_nodes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    hostname VARCHAR(255) UNIQUE NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    location VARCHAR(100),
    region VARCHAR(50),
    country VARCHAR(50),
    isp VARCHAR(100),
    status VARCHAR(20) DEFAULT 'offline',
    node_type VARCHAR(20) DEFAULT 'edge',
    capacity_gb BIGINT DEFAULT 0,
    bandwidth_mbps INT DEFAULT 0,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);
```
**Mục đích**: Quản lý các node CDN phân tán
**3NF Compliance**: ✅ Tách biệt thông tin node và metrics

#### **4. Bảng `content` (Nội dung)**
```sql
CREATE TABLE content (
    id INT AUTO_INCREMENT PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100),
    content_type VARCHAR(20) DEFAULT 'static',
    checksum VARCHAR(64),
    description TEXT,
    uploaded_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
);
```
**Mục đích**: Quản lý nội dung được upload lên CDN
**3NF Compliance**: ✅ Tách biệt metadata và file distribution

### 2.2. BẢNG QUAN HỆ (RELATIONSHIP TABLES)

#### **5. Bảng `node_metrics` (Metrics của node)**
```sql
CREATE TABLE node_metrics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    node_id INT,
    cpu_usage DECIMAL(5,2),
    memory_usage DECIMAL(5,2),
    disk_usage DECIMAL(5,2),
    network_in_mbps DECIMAL(10,2),
    network_out_mbps DECIMAL(10,2),
    response_time_ms INT,
    error_rate DECIMAL(5,2),
    active_connections INT,
    cache_hit_rate DECIMAL(5,2),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (node_id) REFERENCES cdn_nodes(id) ON DELETE CASCADE
);
```
**Mục đích**: Lưu trữ metrics hiệu suất của từng node
**3NF Compliance**: ✅ Tách biệt metrics khỏi thông tin node cơ bản

#### **6. Bảng `content_distribution` (Phân phối nội dung)**
```sql
CREATE TABLE content_distribution (
    id INT AUTO_INCREMENT PRIMARY KEY,
    content_id INT,
    node_id INT,
    status VARCHAR(20) DEFAULT 'pending',
    distribution_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    file_path VARCHAR(500),
    UNIQUE KEY unique_content_node (content_id, node_id),
    FOREIGN KEY (content_id) REFERENCES content(id) ON DELETE CASCADE,
    FOREIGN KEY (node_id) REFERENCES cdn_nodes(id) ON DELETE CASCADE
);
```
**Mục đích**: Quản lý việc phân phối nội dung đến các node
**3NF Compliance**: ✅ Quan hệ many-to-many giữa content và nodes

#### **7. Bảng `access_logs` (Log truy cập)**
```sql
CREATE TABLE access_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    node_id INT,
    content_id INT,
    client_ip VARCHAR(45),
    user_agent TEXT,
    request_method VARCHAR(10),
    request_url TEXT,
    response_status INT,
    response_size BIGINT,
    response_time_ms INT,
    cache_hit BOOLEAN,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (node_id) REFERENCES cdn_nodes(id),
    FOREIGN KEY (content_id) REFERENCES content(id)
);
```
**Mục đích**: Ghi log tất cả request truy cập CDN
**3NF Compliance**: ✅ Tách biệt log khỏi thông tin node/content

### 2.3. BẢNG QUẢN LÝ (MANAGEMENT TABLES)

#### **8. Bảng `alerts` (Cảnh báo)**
```sql
CREATE TABLE alerts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    node_id INT,
    alert_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    is_resolved BOOLEAN DEFAULT false,
    resolved_by INT,
    resolved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (node_id) REFERENCES cdn_nodes(id),
    FOREIGN KEY (resolved_by) REFERENCES users(id)
);
```
**Mục đích**: Quản lý cảnh báo hệ thống
**3NF Compliance**: ✅ Tách biệt alerts khỏi metrics

#### **9. Bảng `node_maintenance` (Bảo trì node)**
```sql
CREATE TABLE node_maintenance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    node_id INT,
    scheduled_by INT,
    maintenance_type VARCHAR(50),
    description TEXT,
    scheduled_start TIMESTAMP NOT NULL,
    scheduled_end TIMESTAMP NOT NULL,
    actual_start TIMESTAMP NULL,
    actual_end TIMESTAMP NULL,
    status VARCHAR(20) DEFAULT 'scheduled',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (node_id) REFERENCES cdn_nodes(id),
    FOREIGN KEY (scheduled_by) REFERENCES users(id)
);
```
**Mục đích**: Lập lịch và quản lý bảo trì node
**3NF Compliance**: ✅ Tách biệt maintenance khỏi thông tin node

#### **10. Bảng `api_keys` (API Keys)**
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
**Mục đích**: Quản lý API keys cho external access
**3NF Compliance**: ✅ Tách biệt API keys khỏi user credentials

## 3. PHÂN TÍCH 3NF COMPLIANCE

### 3.1. CÁC NGUYÊN TẮC 3NF ĐƯỢC TUÂN THỦ

#### ✅ **1NF (First Normal Form)**
- Tất cả các giá trị đều nguyên tử (atomic)
- Không có dữ liệu lặp lại
- Mỗi cột chỉ chứa một giá trị

#### ✅ **2NF (Second Normal Form)**
- Tất cả các thuộc tính không khóa đều phụ thuộc hoàn toàn vào khóa chính
- Không có phụ thuộc hàm bộ phận

#### ✅ **3NF (Third Normal Form)**
- Không có phụ thuộc hàm bắc cầu
- Các bảng được tách biệt theo chức năng rõ ràng

### 3.2. QUAN HỆ GIỮA CÁC BẢNG

```
users (1) ←→ (N) cdn_nodes
users (1) ←→ (N) content
users (1) ←→ (N) alerts
users (1) ←→ (N) node_maintenance
users (1) ←→ (N) api_keys

cdn_nodes (1) ←→ (N) node_metrics
cdn_nodes (1) ←→ (N) alerts
cdn_nodes (1) ←→ (N) node_maintenance
cdn_nodes (N) ←→ (N) content (via content_distribution)

content (1) ←→ (N) content_distribution
content (1) ←→ (N) access_logs
```

## 4. INDEXES VÀ OPTIMIZATION

### 4.1. INDEXES CHÍNH
```sql
CREATE INDEX idx_cdn_nodes_status ON cdn_nodes(status);
CREATE INDEX idx_cdn_nodes_location ON cdn_nodes(location);
CREATE INDEX idx_node_metrics_node_id ON node_metrics(node_id);
CREATE INDEX idx_node_metrics_timestamp ON node_metrics(timestamp);
CREATE INDEX idx_access_logs_node_id ON access_logs(node_id);
CREATE INDEX idx_access_logs_timestamp ON access_logs(timestamp);
CREATE INDEX idx_access_logs_content_id ON access_logs(content_id);
CREATE INDEX idx_alerts_node_id ON alerts(node_id);
CREATE INDEX idx_alerts_is_resolved ON alerts(is_resolved);
CREATE INDEX idx_content_distribution_status ON content_distribution(status);
```

### 4.2. UNIQUE CONSTRAINTS
```sql
UNIQUE KEY unique_content_node (content_id, node_id)
```

## 5. VIEWS ĐỂ TỐI ƯU TRUY VẤN

### 5.1. `node_status_summary`
```sql
CREATE VIEW node_status_summary AS
SELECT 
    n.id, n.name, n.hostname, n.status, n.location,
    nm.cpu_usage, nm.memory_usage, nm.disk_usage,
    nm.response_time_ms, nm.timestamp as last_metrics
FROM cdn_nodes n
LEFT JOIN (
    SELECT node_id, cpu_usage, memory_usage, disk_usage, 
           response_time_ms, timestamp
    FROM node_metrics nm1
    WHERE timestamp = (
        SELECT MAX(timestamp) 
        FROM node_metrics nm2 
        WHERE nm2.node_id = nm1.node_id
    )
) nm ON n.id = nm.node_id;
```

### 5.2. `alert_summary`
```sql
CREATE VIEW alert_summary AS
SELECT 
    a.id, a.alert_type, a.severity, a.message, a.is_resolved,
    n.name as node_name, n.hostname, a.created_at
FROM alerts a
JOIN cdn_nodes n ON a.node_id = n.id
ORDER BY a.created_at DESC;
```

## 6. LỢI ÍCH CỦA THIẾT KẾ 3NF

### 6.1. **Tính nhất quán dữ liệu**
- Tránh dữ liệu trùng lặp
- Đảm bảo tính toàn vẹn tham chiếu

### 6.2. **Hiệu suất truy vấn**
- Indexes được tối ưu cho các truy vấn phổ biến
- Views giúp truy vấn phức tạp nhanh hơn

### 6.3. **Bảo trì và mở rộng**
- Dễ dàng thêm tính năng mới
- Cấu trúc rõ ràng, dễ hiểu

### 6.4. **Bảo mật**
- Tách biệt thông tin nhạy cảm
- Quản lý quyền truy cập theo role

## 7. KẾT LUẬN

Hệ thống CDN Management đã được thiết kế tuân thủ hoàn toàn chuẩn 3NF với:

- **10 bảng chính** được phân chia theo chức năng rõ ràng
- **Quan hệ khóa ngoại** được thiết kế hợp lý
- **Indexes và Views** được tối ưu cho hiệu suất
- **Cấu trúc mở rộng** cho phép phát triển tương lai

Thiết kế này đảm bảo tính nhất quán, hiệu suất cao và dễ bảo trì cho hệ thống CDN Management. 