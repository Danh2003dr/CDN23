-- Indexes for CDN Management System (MySQL)

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