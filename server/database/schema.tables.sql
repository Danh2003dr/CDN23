-- Tables for CDN Management System (MySQL)

CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    permissions JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

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
) ENGINE=InnoDB;

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
) ENGINE=InnoDB;

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
) ENGINE=InnoDB;

CREATE TABLE content (
    id INT AUTO_INCREMENT PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100),
    content_type VARCHAR(20) DEFAULT 'static',
    checksum VARCHAR(64),
    uploaded_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
) ENGINE=InnoDB;

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
) ENGINE=InnoDB;

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
) ENGINE=InnoDB;

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
) ENGINE=InnoDB;

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
) ENGINE=InnoDB;

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
) ENGINE=InnoDB; 