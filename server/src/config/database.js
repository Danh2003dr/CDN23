const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'cdn_management',
    waitForConnections: true,
    connectionLimit: 20,
    queueLimit: 0
});

// Test connection
pool.on('connection', (connection) => {
    console.log('✅ Connected to MySQL database');
});

pool.on('error', (err) => {
    console.error('❌ Database connection error:', err);
});

module.exports = pool; 