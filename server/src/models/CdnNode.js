const db = require('../config/database');

class CdnNode {
    static async create(nodeData) {
        try {
            const {
                name, hostname, ip_address, location, region, country, isp = null,
                node_type, capacity_gb, bandwidth_mbps, created_by
            } = nodeData;
            
            const query = `
                INSERT INTO cdn_nodes (
                    name, hostname, ip_address, location, region, country, isp,
                    node_type, capacity_gb, bandwidth_mbps, created_by
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            const values = [
                name, hostname, ip_address, location || null, region || null, country || null, isp || null,
                node_type, capacity_gb || 0, bandwidth_mbps || 0, created_by || 1
            ];
            
            const [result] = await db.execute(query, values);
            
            // Get the inserted node
            const [node] = await db.execute(`
                SELECT * FROM cdn_nodes WHERE id = ?
            `, [result.insertId]);
            
            return node[0];
        } catch (error) {
            console.error('❌ Error creating node:', error);
            console.error('❌ Error code:', error.code);
            console.error('❌ Error message:', error.message);
            throw error;
        }
    }
    
    static async findAll() {
        const query = `
            SELECT n.*, u.username as created_by_name,
                   (SELECT COUNT(*) FROM node_metrics nm WHERE nm.node_id = n.id) as metrics_count
            FROM cdn_nodes n
            LEFT JOIN users u ON n.created_by = u.id
            ORDER BY n.created_at DESC
        `;
        const [result] = await db.execute(query);
        return result;
    }
    
    static async findById(id) {
        const query = `
            SELECT n.*, u.username as created_by_name
            FROM cdn_nodes n
            LEFT JOIN users u ON n.created_by = u.id
            WHERE n.id = ?
        `;
        const [result] = await db.execute(query, [id]);
        return result[0];
    }
    
    static async findByStatus(status) {
        const query = `
            SELECT n.*, u.username as created_by_name
            FROM cdn_nodes n
            LEFT JOIN users u ON n.created_by = u.id
            WHERE n.status = ?
            ORDER BY n.name
        `;
        const [result] = await db.execute(query, [status]);
        return result;
    }
    
    static async update(id, updateData) {
        const {
            name, hostname, ip_address, location, region, country, isp,
            status, node_type, capacity_gb, bandwidth_mbps
        } = updateData;
        
        const query = `
            UPDATE cdn_nodes 
            SET name = COALESCE(?, name),
                hostname = COALESCE(?, hostname),
                ip_address = COALESCE(?, ip_address),
                location = COALESCE(?, location),
                region = COALESCE(?, region),
                country = COALESCE(?, country),
                isp = COALESCE(?, isp),
                status = COALESCE(?, status),
                node_type = COALESCE(?, node_type),
                capacity_gb = COALESCE(?, capacity_gb),
                bandwidth_mbps = COALESCE(?, bandwidth_mbps),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;
        
        const values = [
            name, hostname, ip_address, location, region, country, isp,
            status, node_type, capacity_gb, bandwidth_mbps, id
        ];
        
        await db.execute(query, values);
        
        // Get the updated node
        const [node] = await db.execute(`
            SELECT * FROM cdn_nodes WHERE id = ?
        `, [id]);
        
        return node[0];
    }
    
    static async updateStatus(id, status) {
        const query = `
            UPDATE cdn_nodes 
            SET status = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;
        await db.execute(query, [status, id]);
        
        // Get the updated node
        const [node] = await db.execute(`
            SELECT id, name, status FROM cdn_nodes WHERE id = ?
        `, [id]);
        
        return node[0];
    }
    
    static async delete(id) {
        const query = 'DELETE FROM cdn_nodes WHERE id = ?';
        const [result] = await db.execute(query, [id]);
        return result.affectedRows > 0 ? { id } : null;
    }
    
    static async getStatusSummary() {
        const query = `
            SELECT 
                status,
                COUNT(*) as count,
                COUNT(*) * 100.0 / (SELECT COUNT(*) FROM cdn_nodes) as percentage
            FROM cdn_nodes 
            GROUP BY status
        `;
        const [result] = await db.execute(query);
        return result;
    }
    
    static async getLocationSummary() {
        const query = `
            SELECT 
                location,
                COUNT(*) as count
            FROM cdn_nodes 
            WHERE location IS NOT NULL
            GROUP BY location
            ORDER BY count DESC
        `;
        const [result] = await db.execute(query);
        return result;
    }
    
    static async getNodeTypes() {
        const query = `
            SELECT 
                node_type,
                COUNT(*) as count
            FROM cdn_nodes 
            GROUP BY node_type
            ORDER BY count DESC
        `;
        const [result] = await db.execute(query);
        return result;
    }
    
    static async getOnlineNodes() {
        return await this.findByStatus('online');
    }
    
    static async getOfflineNodes() {
        return await this.findByStatus('offline');
    }
    
    static async getMaintenanceNodes() {
        return await this.findByStatus('maintenance');
    }
    
    static async search(searchTerm) {
        const query = `
            SELECT n.*, u.username as created_by_name
            FROM cdn_nodes n
            LEFT JOIN users u ON n.created_by = u.id
            WHERE n.name LIKE ? 
               OR n.hostname LIKE ? 
               OR n.ip_address LIKE ?
               OR n.location LIKE ?
            ORDER BY n.name
        `;
        const searchPattern = `%${searchTerm}%`;
        const [result] = await db.execute(query, [searchPattern, searchPattern, searchPattern, searchPattern]);
        return result;
    }
}

module.exports = CdnNode; 