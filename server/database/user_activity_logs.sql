-- Bảng user_activity_logs (Log hoạt động người dùng)
CREATE TABLE user_activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(100) NOT NULL, -- login, logout, create_node, update_node, delete_node, export_data, resolve_alert, etc.
    resource_type VARCHAR(50), -- node, content, alert, user, analytics, etc.
    resource_id INT, -- ID của resource được thao tác
    details JSON, -- Chi tiết thao tác (old_value, new_value, parameters, etc.)
    ip_address VARCHAR(45),
    user_agent TEXT,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes cho user_activity_logs
CREATE INDEX idx_user_activity_logs_user_id ON user_activity_logs(user_id);
CREATE INDEX idx_user_activity_logs_action ON user_activity_logs(action);
CREATE INDEX idx_user_activity_logs_resource_type ON user_activity_logs(resource_type);
CREATE INDEX idx_user_activity_logs_created_at ON user_activity_logs(created_at);
CREATE INDEX idx_user_activity_logs_success ON user_activity_logs(success);

-- View để xem log hoạt động người dùng
CREATE VIEW user_activity_summary AS
SELECT 
    ual.id,
    u.username,
    u.email,
    u.first_name,
    u.last_name,
    u.role_name,
    ual.action,
    ual.resource_type,
    ual.resource_id,
    ual.details,
    ual.ip_address,
    ual.success,
    ual.error_message,
    ual.created_at
FROM user_activity_logs ual
LEFT JOIN users u ON ual.user_id = u.id
ORDER BY ual.created_at DESC; 