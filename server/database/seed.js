const db = require('../src/config/database');
const bcrypt = require('bcryptjs');

async function seedDatabase() {
    try {
        console.log('🌱 Starting database seeding...');

        // Clear existing data in correct order (respecting foreign keys)
        await db.execute('DELETE FROM node_metrics');
        await db.execute('DELETE FROM alerts');
        await db.execute('DELETE FROM cdn_nodes');
        await db.execute('DELETE FROM users WHERE id > 1');
        await db.execute('DELETE FROM roles WHERE id > 5');

        // Insert roles
        const roles = [
            { id: 1, name: 'admin', description: 'Administrator with full system access', permissions: '{"all": true, "user_management": true, "system_config": true}' },
            { id: 2, name: 'manager', description: 'System manager with management access', permissions: '{"monitor": true, "alerts": true, "content": true, "manage": true, "user_management": true}' },
            { id: 3, name: 'operator', description: 'CDN operator with monitoring access', permissions: '{"monitor": true, "alerts": true, "content": true, "manage": true}' },
            { id: 4, name: 'technician', description: 'Technical support with limited access', permissions: '{"monitor": true, "alerts": true, "view": true}' },
            { id: 5, name: 'viewer', description: 'Read-only access to dashboard', permissions: '{"view": true}' }
        ];

        for (const role of roles) {
            await db.execute(
                'INSERT INTO roles (id, name, description, permissions) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description), permissions = VALUES(permissions)',
                [role.id, role.name, role.description, role.permissions]
            );
        }

        // Insert sample users
        const users = [
            { username: 'manager1', email: 'manager1@cdn.com', password: 'manager123', first_name: 'Manager', last_name: 'One', role_id: 2 },
            { username: 'operator1', email: 'operator1@cdn.com', password: 'operator123', first_name: 'Operator', last_name: 'One', role_id: 3 },
            { username: 'technician1', email: 'technician1@cdn.com', password: 'tech123', first_name: 'Technician', last_name: 'One', role_id: 4 },
            { username: 'viewer1', email: 'viewer1@cdn.com', password: 'viewer123', first_name: 'Viewer', last_name: 'One', role_id: 5 }
        ];

        for (const user of users) {
            const password_hash = await bcrypt.hash(user.password, 10);
            await db.execute(
                'INSERT INTO users (username, email, password_hash, first_name, last_name, role_id) VALUES (?, ?, ?, ?, ?, ?)',
                [user.username, user.email, password_hash, user.first_name, user.last_name, user.role_id]
            );
        }

        // Insert sample CDN nodes
        const nodes = [
            { name: 'Edge Node 1', hostname: 'edge-01.cdn.com', ip_address: '192.168.1.101', location: 'Ho Chi Minh City', region: 'Asia', country: 'Vietnam', isp: 'VNPT', status: 'online', node_type: 'edge', capacity_gb: 1000, bandwidth_mbps: 1000 },
            { name: 'Edge Node 2', hostname: 'edge-02.cdn.com', ip_address: '192.168.1.102', location: 'Hanoi', region: 'Asia', country: 'Vietnam', isp: 'FPT', status: 'online', node_type: 'edge', capacity_gb: 800, bandwidth_mbps: 800 },
            { name: 'Edge Node 3', hostname: 'edge-03.cdn.com', ip_address: '192.168.1.103', location: 'Da Nang', region: 'Asia', country: 'Vietnam', isp: 'Viettel', status: 'online', node_type: 'edge', capacity_gb: 600, bandwidth_mbps: 600 },
            { name: 'Origin Node 1', hostname: 'origin-01.cdn.com', ip_address: '192.168.1.201', location: 'Ho Chi Minh City', region: 'Asia', country: 'Vietnam', isp: 'VNPT', status: 'online', node_type: 'origin', capacity_gb: 2000, bandwidth_mbps: 2000 },
            { name: 'Cache Node 1', hostname: 'cache-01.cdn.com', ip_address: '192.168.1.301', location: 'Hanoi', region: 'Asia', country: 'Vietnam', isp: 'FPT', status: 'maintenance', node_type: 'cache', capacity_gb: 1500, bandwidth_mbps: 1500 },
            { name: 'Edge Node 4', hostname: 'edge-04.cdn.com', ip_address: '192.168.1.104', location: 'Can Tho', region: 'Asia', country: 'Vietnam', isp: 'Viettel', status: 'offline', node_type: 'edge', capacity_gb: 500, bandwidth_mbps: 500 },
            { name: 'Edge Node 5', hostname: 'edge-05.cdn.com', ip_address: '192.168.1.105', location: 'Hai Phong', region: 'Asia', country: 'Vietnam', isp: 'VNPT', status: 'online', node_type: 'edge', capacity_gb: 700, bandwidth_mbps: 700 },
            { name: 'Cache Node 2', hostname: 'cache-02.cdn.com', ip_address: '192.168.1.302', location: 'Da Nang', region: 'Asia', country: 'Vietnam', isp: 'FPT', status: 'online', node_type: 'cache', capacity_gb: 1200, bandwidth_mbps: 1200 },
            { name: 'Origin Node 2', hostname: 'origin-02.cdn.com', ip_address: '192.168.1.202', location: 'Hanoi', region: 'Asia', country: 'Vietnam', isp: 'Viettel', status: 'online', node_type: 'origin', capacity_gb: 1800, bandwidth_mbps: 1800 }
        ];

        for (const node of nodes) {
            const [result] = await db.execute(
                'INSERT INTO cdn_nodes (name, hostname, ip_address, location, region, country, isp, status, node_type, capacity_gb, bandwidth_mbps, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [node.name, node.hostname, node.ip_address, node.location, node.region, node.country, node.isp, node.status, node.node_type, node.capacity_gb, node.bandwidth_mbps, 1]
            );
            
            const nodeId = result.insertId;
            
            // Insert sample metrics for each node
            const metrics = [
                { cpu_usage: 45.2, memory_usage: 67.8, disk_usage: 34.5, network_in_mbps: 125.6, network_out_mbps: 234.7, response_time_ms: 45, error_rate: 0.5, active_connections: 1250, cache_hit_rate: 89.2 },
                { cpu_usage: 38.7, memory_usage: 72.3, disk_usage: 41.2, network_in_mbps: 98.4, network_out_mbps: 187.3, response_time_ms: 52, error_rate: 0.3, active_connections: 980, cache_hit_rate: 91.5 },
                { cpu_usage: 42.1, memory_usage: 65.9, disk_usage: 38.7, network_in_mbps: 156.8, network_out_mbps: 298.4, response_time_ms: 38, error_rate: 0.7, active_connections: 1450, cache_hit_rate: 87.8 },
                { cpu_usage: 55.6, memory_usage: 78.4, disk_usage: 52.1, network_in_mbps: 234.7, network_out_mbps: 456.2, response_time_ms: 28, error_rate: 0.2, active_connections: 2100, cache_hit_rate: 94.1 },
                { cpu_usage: 25.3, memory_usage: 45.6, disk_usage: 28.9, network_in_mbps: 67.3, network_out_mbps: 89.4, response_time_ms: 75, error_rate: 1.2, active_connections: 450, cache_hit_rate: 82.3 },
                { cpu_usage: 0.0, memory_usage: 0.0, disk_usage: 0.0, network_in_mbps: 0.0, network_out_mbps: 0.0, response_time_ms: 0, error_rate: 0.0, active_connections: 0, cache_hit_rate: 0.0 },
                { cpu_usage: 41.8, memory_usage: 69.2, disk_usage: 36.8, network_in_mbps: 134.5, network_out_mbps: 267.8, response_time_ms: 42, error_rate: 0.4, active_connections: 1150, cache_hit_rate: 88.9 },
                { cpu_usage: 48.7, memory_usage: 74.1, disk_usage: 44.3, network_in_mbps: 187.6, network_out_mbps: 345.2, response_time_ms: 35, error_rate: 0.6, active_connections: 1650, cache_hit_rate: 90.3 },
                { cpu_usage: 62.3, memory_usage: 81.7, disk_usage: 58.9, network_in_mbps: 298.4, network_out_mbps: 567.1, response_time_ms: 25, error_rate: 0.1, active_connections: 2400, cache_hit_rate: 95.2 }
            ];
            
            const nodeMetrics = metrics[nodes.indexOf(node)];
            await db.execute(
                'INSERT INTO node_metrics (node_id, cpu_usage, memory_usage, disk_usage, network_in_mbps, network_out_mbps, response_time_ms, error_rate, active_connections, cache_hit_rate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [nodeId, nodeMetrics.cpu_usage, nodeMetrics.memory_usage, nodeMetrics.disk_usage, nodeMetrics.network_in_mbps, nodeMetrics.network_out_mbps, nodeMetrics.response_time_ms, nodeMetrics.error_rate, nodeMetrics.active_connections, nodeMetrics.cache_hit_rate]
            );
        }

        console.log('✅ Database seeded successfully!');
        console.log('📊 Sample data created:');
        console.log('   - 5 roles (admin, manager, operator, technician, viewer)');
        console.log('   - 5 sample users (1 for each role)');
        console.log('   - 9 CDN nodes with metrics');
        console.log('   - Node status: 7 online, 1 maintenance, 1 offline');
        
    } catch (error) {
        console.error('❌ Error seeding database:', error);
    } finally {
        await db.end();
    }
}

seedDatabase(); 