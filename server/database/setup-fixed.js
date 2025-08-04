const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function createDatabase() {
    let connection;
    try {
        // Tạo connection không có database
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
        });

        console.log('🔌 Kết nối thành công đến MySQL server');

        // Xóa database cũ nếu tồn tại
        await connection.execute('DROP DATABASE IF EXISTS cdn_management');
        console.log('🗑️ Đã xóa database cũ (nếu có)');

        // Tạo database mới
        const dbName = process.env.DB_NAME || 'cdn_management';
        await connection.execute(`CREATE DATABASE ${dbName} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        console.log(`✅ Đã tạo database '${dbName}' mới`);

        await connection.end();
        return true;
    } catch (error) {
        console.error('❌ Lỗi khi tạo database:', error.message);
        return false;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

async function createTables() {
    let connection;
    try {
        // Kết nối đến database đã tạo
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'cdn_management'
        });

        console.log('📋 Bắt đầu tạo các bảng...');

        // Tạo bảng roles trước
        console.log('1️⃣ Tạo bảng roles...');
        await connection.execute(`
            CREATE TABLE roles (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(50) UNIQUE NOT NULL,
                description TEXT,
                permissions JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ Bảng roles đã được tạo');

        // Tạo bảng users
        console.log('2️⃣ Tạo bảng users...');
        await connection.execute(`
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
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ Bảng users đã được tạo');

        // Tạo bảng cdn_nodes
        console.log('3️⃣ Tạo bảng cdn_nodes...');
        await connection.execute(`
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
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ Bảng cdn_nodes đã được tạo');

        // Tạo bảng node_metrics
        console.log('4️⃣ Tạo bảng node_metrics...');
        await connection.execute(`
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
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ Bảng node_metrics đã được tạo');

        // Tạo bảng content
        console.log('5️⃣ Tạo bảng content...');
        await connection.execute(`
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
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ Bảng content đã được tạo');

        // Tạo bảng content_distribution
        console.log('6️⃣ Tạo bảng content_distribution...');
        await connection.execute(`
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
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ Bảng content_distribution đã được tạo');

        // Tạo bảng access_logs
        console.log('7️⃣ Tạo bảng access_logs...');
        await connection.execute(`
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
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ Bảng access_logs đã được tạo');

        // Tạo bảng alerts
        console.log('8️⃣ Tạo bảng alerts...');
        await connection.execute(`
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
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ Bảng alerts đã được tạo');

        // Tạo bảng node_maintenance
        console.log('9️⃣ Tạo bảng node_maintenance...');
        await connection.execute(`
            CREATE TABLE node_maintenance (
                id INT AUTO_INCREMENT PRIMARY KEY,
                node_id INT,
                scheduled_by INT,
                maintenance_type VARCHAR(50),
                description TEXT,
                scheduled_start DATETIME NOT NULL,
                scheduled_end DATETIME NOT NULL,
                actual_start DATETIME NULL,
                actual_end DATETIME NULL,
                status VARCHAR(20) DEFAULT 'scheduled',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (node_id) REFERENCES cdn_nodes(id),
                FOREIGN KEY (scheduled_by) REFERENCES users(id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ Bảng node_maintenance đã được tạo');

        // Tạo bảng api_keys
        console.log('🔟 Tạo bảng api_keys...');
        await connection.execute(`
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
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ Bảng api_keys đã được tạo');

        console.log('🎉 Tất cả các bảng đã được tạo thành công!');
        return true;

    } catch (error) {
        console.error('❌ Lỗi khi tạo bảng:', error.message);
        console.error('SQL State:', error.sqlState);
        console.error('Error Code:', error.errno);
        return false;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

async function createIndexes() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'cdn_management'
        });

        console.log('🔗 Đang tạo các index...');

        const indexes = [
            'CREATE INDEX idx_cdn_nodes_status ON cdn_nodes(status)',
            'CREATE INDEX idx_cdn_nodes_location ON cdn_nodes(location)',
            'CREATE INDEX idx_node_metrics_node_id ON node_metrics(node_id)',
            'CREATE INDEX idx_node_metrics_timestamp ON node_metrics(timestamp)',
            'CREATE INDEX idx_access_logs_node_id ON access_logs(node_id)',
            'CREATE INDEX idx_access_logs_timestamp ON access_logs(timestamp)',
            'CREATE INDEX idx_access_logs_content_id ON access_logs(content_id)',
            'CREATE INDEX idx_alerts_node_id ON alerts(node_id)',
            'CREATE INDEX idx_alerts_is_resolved ON alerts(is_resolved)',
            'CREATE INDEX idx_content_distribution_status ON content_distribution(status)'
        ];

        for (const index of indexes) {
            try {
                await connection.execute(index);
                console.log('✅ Index đã được tạo');
            } catch (error) {
                if (error.code !== 'ER_DUP_KEYNAME') {
                    console.error('❌ Lỗi khi tạo index:', error.message);
                }
            }
        }

        console.log('🎉 Tất cả các index đã được tạo!');
        return true;

    } catch (error) {
        console.error('❌ Lỗi khi tạo index:', error.message);
        return false;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

async function createViews() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'cdn_management'
        });

        console.log('👁️ Đang tạo các view...');

        // Tạo view node_status_summary
        await connection.execute(`
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
            ) nm ON n.id = nm.node_id
        `);
        console.log('✅ View node_status_summary đã được tạo');

        // Tạo view alert_summary
        await connection.execute(`
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
            ORDER BY a.created_at DESC
        `);
        console.log('✅ View alert_summary đã được tạo');

        console.log('🎉 Tất cả các view đã được tạo!');
        return true;

    } catch (error) {
        console.error('❌ Lỗi khi tạo view:', error.message);
        return false;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

async function setupDatabase() {
    console.log('🚀 Bắt đầu setup database...');

    // Bước 1: Tạo database
    const dbCreated = await createDatabase();
    if (!dbCreated) {
        console.error('❌ Không thể tạo database');
        return false;
    }

    // Bước 2: Tạo bảng
    const tablesCreated = await createTables();
    if (!tablesCreated) {
        console.error('❌ Không thể tạo bảng');
        return false;
    }

    // Bước 3: Tạo index
    const indexesCreated = await createIndexes();
    if (!indexesCreated) {
        console.error('❌ Không thể tạo index');
        return false;
    }

    // Bước 4: Tạo view
    const viewsCreated = await createViews();
    if (!viewsCreated) {
        console.error('❌ Không thể tạo view');
        return false;
    }

    console.log('🎉 Setup database hoàn tất thành công!');
    return true;
}

// Chạy setup nếu file được gọi trực tiếp
if (require.main === module) {
    setupDatabase()
        .then((success) => {
            if (success) {
                console.log('✅ Setup database thành công!');
                process.exit(0);
            } else {
                console.error('❌ Setup database thất bại!');
                process.exit(1);
            }
        })
        .catch((error) => {
            console.error('❌ Lỗi không mong đợi:', error);
            process.exit(1);
        });
}

module.exports = setupDatabase; 