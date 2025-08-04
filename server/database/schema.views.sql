-- Views for CDN Management System (MySQL)

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