-- Hệ thống Quản Lý CDN - Database Schema (MySQL)
-- Tạo database
CREATE DATABASE IF NOT EXISTS cdn_management;
USE cdn_management;

-- Bảng roles (Phân quyền)
CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    permissions JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Bảng users (Người dùng)
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

-- Bảng cdn_nodes (Node CDN)
CREATE TABLE cdn_nodes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    hostname VARCHAR(255) UNIQUE NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    location VARCHAR(100),
    region VARCHAR(50),
    country VARCHAR(50),
    isp VARCHAR(100),
    status VARCHAR(20) DEFAULT 'offline', -- online, offline, maintenance
    node_type VARCHAR(20) DEFAULT 'edge', -- edge, origin, cache
    capacity_gb BIGINT DEFAULT 0,
    bandwidth_mbps INT DEFAULT 0,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Bảng node_metrics (Metrics của node)
CREATE TABLE node_metrics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    node_id INT,
    cpu_usage DECIMAL(5,2), -- Percentage
    memory_usage DECIMAL(5,2), -- Percentage
    disk_usage DECIMAL(5,2), -- Percentage
    network_in_mbps DECIMAL(10,2),
    network_out_mbps DECIMAL(10,2),
    response_time_ms INT,
    error_rate DECIMAL(5,2), -- Percentage
    active_connections INT,
    cache_hit_rate DECIMAL(5,2), -- Percentage
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (node_id) REFERENCES cdn_nodes(id) ON DELETE CASCADE
);

-- Bảng content (Nội dung)
CREATE TABLE content (
    id INT AUTO_INCREMENT PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100),
    content_type VARCHAR(20) DEFAULT 'static', -- static, dynamic, video, image
    checksum VARCHAR(64),
    description TEXT,
    uploaded_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

-- Bảng content_distribution (Phân phối nội dung)
CREATE TABLE content_distribution (
    id INT AUTO_INCREMENT PRIMARY KEY,
    content_id INT,
    node_id INT,
    status VARCHAR(20) DEFAULT 'pending', -- pending, distributed, failed
    distribution_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    file_path VARCHAR(500),
    UNIQUE KEY unique_content_node (content_id, node_id),
    FOREIGN KEY (content_id) REFERENCES content(id) ON DELETE CASCADE,
    FOREIGN KEY (node_id) REFERENCES cdn_nodes(id) ON DELETE CASCADE
);

-- Bảng access_logs (Log truy cập)
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

-- Bảng alerts (Cảnh báo)
CREATE TABLE alerts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    node_id INT,
    alert_type VARCHAR(50) NOT NULL, -- cpu_high, memory_high, disk_full, node_offline, error_rate_high
    severity VARCHAR(20) NOT NULL, -- low, medium, high, critical
    message TEXT NOT NULL,
    is_resolved BOOLEAN DEFAULT false,
    resolved_by INT,
    resolved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (node_id) REFERENCES cdn_nodes(id),
    FOREIGN KEY (resolved_by) REFERENCES users(id)
);

-- Bảng node_maintenance (Bảo trì node)
CREATE TABLE node_maintenance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    node_id INT,
    scheduled_by INT,
    maintenance_type VARCHAR(50), -- hardware, software, network
    description TEXT,
    scheduled_start TIMESTAMP NOT NULL,
    scheduled_end TIMESTAMP NOT NULL,
    actual_start TIMESTAMP NULL,
    actual_end TIMESTAMP NULL,
    status VARCHAR(20) DEFAULT 'scheduled', -- scheduled, in_progress, completed, cancelled
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (node_id) REFERENCES cdn_nodes(id),
    FOREIGN KEY (scheduled_by) REFERENCES users(id)
);

-- Bảng api_keys (API Keys cho external access)
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

-- Indexes để tối ưu hiệu suất
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

-- Views để dễ dàng truy vấn
CREATE VIEW node_status_summary AS
SELECT 
    n.id,
    n.name,
    n.hostname,
    n.status,
    n.location,
    nm.cpu_usage,
    nm.memory_usage,
    nm.disk_usage,
    nm.response_time_ms,
    nm.timestamp as last_metrics
FROM cdn_nodes n
LEFT JOIN (
    SELECT 
        node_id, 
        cpu_usage, 
        memory_usage, 
        disk_usage, 
        response_time_ms, 
        timestamp
    FROM node_metrics nm1
    WHERE timestamp = (
        SELECT MAX(timestamp) 
        FROM node_metrics nm2 
        WHERE nm2.node_id = nm1.node_id
    )
) nm ON n.id = nm.node_id;

CREATE VIEW alert_summary AS
SELECT 
    a.id,
    a.alert_type,
    a.severity,
    a.message,
    a.is_resolved,
    n.name as node_name,
    n.hostname,
    a.created_at
FROM alerts a
JOIN cdn_nodes n ON a.node_id = n.id
ORDER BY a.created_at DESC; 