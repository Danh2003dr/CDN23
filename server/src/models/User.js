const db = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
    static async create(userData) {
        const { username, email, password, first_name, last_name, role_id = 3 } = userData;
        
        // Hash password
        const saltRounds = 10;
        const password_hash = await bcrypt.hash(password, saltRounds);
        
        const query = `
            INSERT INTO users (username, email, password_hash, first_name, last_name, role_id)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        
        const values = [username, email, password_hash, first_name, last_name, role_id];
        const [result] = await db.execute(query, values);
        
        // Get the inserted user
        const [user] = await db.execute(`
            SELECT id, username, email, first_name, last_name, role_id, is_active, created_at
            FROM users WHERE id = ?
        `, [result.insertId]);
        
        return user[0];
    }
    
    static async findByEmail(email) {
        const query = `
            SELECT u.*, r.name as role_name, r.permissions
            FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE u.email = ?
        `;
        const [result] = await db.execute(query, [email]);
        if (result[0]) {
            // Parse permissions JSON string to object
            result[0].permissions = JSON.parse(result[0].permissions);
        }
        return result[0];
    }
    
    static async findByUsername(username) {
        const query = `
            SELECT u.*, r.name as role_name, r.permissions
            FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE u.username = ?
        `;
        const [result] = await db.execute(query, [username]);
        if (result[0]) {
            // Parse permissions JSON string to object
            result[0].permissions = JSON.parse(result[0].permissions);
        }
        return result[0];
    }
    
    static async findById(id) {
        const query = `
            SELECT u.*, r.name as role_name, r.permissions
            FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE u.id = ?
        `;
        const [result] = await db.execute(query, [id]);
        if (result[0]) {
            // Parse permissions JSON string to object
            result[0].permissions = JSON.parse(result[0].permissions);
        }
        return result[0];
    }
    
    static async findAll() {
        const query = `
            SELECT u.id, u.username, u.email, u.first_name, u.last_name, 
                   u.is_active, u.last_login, u.created_at, r.name as role_name
            FROM users u
            JOIN roles r ON u.role_id = r.id
            ORDER BY u.created_at DESC
        `;
        const [result] = await db.execute(query);
        return result;
    }
    
    static async update(id, updateData) {
        const { username, first_name, last_name, email, is_active, role_id } = updateData;
        
        const query = `
            UPDATE users 
            SET username = COALESCE(?, username),
                first_name = COALESCE(?, first_name),
                last_name = COALESCE(?, last_name),
                email = COALESCE(?, email),
                is_active = COALESCE(?, is_active),
                role_id = COALESCE(?, role_id),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;
        
        const values = [username, first_name, last_name, email, is_active, role_id, id];
        await db.execute(query, values);
        
        // Get the updated user
        const [user] = await db.execute(`
            SELECT id, username, email, first_name, last_name, role_id, is_active
            FROM users WHERE id = ?
        `, [id]);
        
        return user[0];
    }
    
    static async updatePassword(id, newPassword) {
        const saltRounds = 10;
        const password_hash = await bcrypt.hash(newPassword, saltRounds);
        
        const query = `
            UPDATE users 
            SET password_hash = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;
        
        await db.execute(query, [password_hash, id]);
        
        // Get the updated user
        const [user] = await db.execute(`
            SELECT id FROM users WHERE id = ?
        `, [id]);
        
        return user[0];
    }
    
    static async updateLastLogin(id) {
        const query = `
            UPDATE users 
            SET last_login = CURRENT_TIMESTAMP
            WHERE id = ?
        `;
        await db.execute(query, [id]);
    }
    
    static async delete(id) {
        const query = 'DELETE FROM users WHERE id = ?';
        const [result] = await db.execute(query, [id]);
        return result.affectedRows > 0 ? { id } : null;
    }
    
    static async validatePassword(password, hash) {
        return await bcrypt.compare(password, hash);
    }
    
    static async getRoles() {
        const query = 'SELECT id, name, description FROM roles ORDER BY name';
        const [result] = await db.execute(query);
        return result;
    }

    static async getAllRoles() {
        const query = 'SELECT id, name, description, permissions FROM roles ORDER BY name';
        const [result] = await db.execute(query);
        
        // Parse permissions JSON for each role
        return result.map(role => ({
            ...role,
            permissions: JSON.parse(role.permissions)
        }));
    }
}

module.exports = User; 