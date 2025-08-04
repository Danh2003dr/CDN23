const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runSqlFile(connection, filePath, type) {
    const sql = fs.readFileSync(filePath, 'utf8');
    const statements = sql
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    for (const statement of statements) {
        try {
            await connection.execute(statement);
            console.log(`✅ ${type}: ${statement.substring(0, 60)}...`);
        } catch (error) {
            console.error(`❌ Lỗi khi tạo ${type}:`, error.message);
            console.error('Statement:', statement.substring(0, 100) + '...');
            if (type === 'TABLE') throw error; // Nếu lỗi khi tạo bảng thì dừng lại
        }
    }
}

async function setupDatabase() {
    let connection;
    try {
        // Tạo connection không có database để tạo database
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
        });

        console.log('🔌 Kết nối thành công đến MySQL server');

        // Tạo database nếu chưa tồn tại
        const dbName = process.env.DB_NAME || 'cdn_management';
        await connection.execute(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
        console.log(`✅ Database '${dbName}' đã được tạo hoặc đã tồn tại`);

        // Đóng connection cũ và tạo connection mới với database
        await connection.end();
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: dbName
        });

        // 1. Tạo bảng
        console.log('📋 Đang tạo các bảng...');
        await runSqlFile(connection, path.join(__dirname, 'schema.tables.sql'), 'TABLE');

        // 2. Tạo index
        console.log('🔗 Đang tạo các index...');
        await runSqlFile(connection, path.join(__dirname, 'schema.indexes.sql'), 'INDEX');

        // 3. Tạo view
        console.log('👁️ Đang tạo các view...');
        await runSqlFile(connection, path.join(__dirname, 'schema.views.sql'), 'VIEW');

        console.log('🎉 Setup database hoàn tất!');
        // Kiểm tra các bảng đã được tạo
        const [tables] = await connection.execute('SHOW TABLES');
        console.log('📊 Các bảng đã được tạo:');
        tables.forEach(table => {
            console.log(`  - ${Object.values(table)[0]}`);
        });
    } catch (error) {
        console.error('❌ Lỗi setup database:', error);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Chạy setup nếu file được gọi trực tiếp
if (require.main === module) {
    setupDatabase()
        .then(() => {
            console.log('✅ Setup database thành công!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Setup database thất bại:', error);
            process.exit(1);
        });
}

module.exports = setupDatabase; 