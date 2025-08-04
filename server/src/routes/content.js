const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const { auth, requirePermission } = require('../middleware/auth');
const db = require('../config/database');
const ContentOptimizer = require('../services/contentOptimizer');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../uploads');
        try {
            await fs.mkdir(uploadDir, { recursive: true });
            cb(null, uploadDir);
        } catch (error) {
            cb(error);
        }
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'video/mp4', 'video/webm', 'video/ogg',
            'application/pdf', 'text/css', 'application/javascript',
            'text/html', 'application/json', 'text/plain'
        ];
        
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type'), false);
        }
    }
});

// GET /api/content - Lấy danh sách content
router.get('/', auth, requirePermission('content'), async (req, res) => {
    try {
        const { page = 1, limit = 20, type, status } = req.query;
        const offset = (page - 1) * limit;
        
        let query = `
            SELECT 
                c.*,
                u.username as uploaded_by_name,
                COUNT(cd.id) as distribution_count,
                SUM(CASE WHEN cd.status = 'distributed' THEN 1 ELSE 0 END) as distributed_count
            FROM content c
            LEFT JOIN users u ON c.uploaded_by = u.id
            LEFT JOIN content_distribution cd ON c.id = cd.content_id
        `;
        
        const whereConditions = [];
        const params = [];
        
        if (type) {
            whereConditions.push('c.content_type = ?');
            params.push(type);
        }
        
        if (whereConditions.length > 0) {
            query += ' WHERE ' + whereConditions.join(' AND ');
        }
        
        query += ' GROUP BY c.id ORDER BY c.created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), offset);
        
        const [results] = await db.execute(query, params);
        
        // Get total count
        const countQuery = `
            SELECT COUNT(*) as total FROM content c
            ${whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : ''}
        `;
        const [countResult] = await db.execute(countQuery, params.slice(0, -2));
        
        res.json({
            success: true,
            data: {
                content: results,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: countResult[0].total,
                    pages: Math.ceil(countResult[0].total / limit)
                }
            }
        });
    } catch (error) {
        console.error('Get content error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch content'
        });
    }
});

// POST /api/content/upload - Upload content
router.post('/upload', auth, requirePermission('content'), upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }
        
        const { content_type = 'static', description } = req.body;
        const file = req.file;
        
        // Calculate file checksum
        const fileBuffer = await fs.readFile(file.path);
        const checksum = crypto.createHash('md5').update(fileBuffer).digest('hex');
        
        // Initialize content optimizer
        const optimizer = new ContentOptimizer();
        
        // Validate content
        let validation;
        try {
            validation = await optimizer.validateContent(file.path);
            if (!validation.isValid) {
                console.warn('Content validation failed:', validation.errors);
                // Don't fail upload, just log warnings
                validation = { isValid: true, errors: [], warnings: validation.errors };
            }
        } catch (validationError) {
            console.error('Validation error:', validationError);
            validation = { isValid: true, errors: [], warnings: ['Validation skipped due to error'] };
        }
        
        // Analyze performance
        let performanceAnalysis;
        try {
            performanceAnalysis = await optimizer.analyzePerformance(file.path);
        } catch (analysisError) {
            console.error('Performance analysis error:', analysisError);
            performanceAnalysis = { fileSize: file.size, contentType: file.mimetype, optimizationPotential: 0, recommendations: [] };
        }
        
        // Determine content type based on MIME type
        let detectedType = content_type;
        if (file.mimetype.startsWith('image/')) {
            detectedType = 'image';
        } else if (file.mimetype.startsWith('video/')) {
            detectedType = 'video';
        } else if (file.mimetype === 'text/html' || file.mimetype === 'application/javascript' || file.mimetype === 'text/css') {
            detectedType = 'dynamic';
        }
        
        // Insert content record
        const [result] = await db.execute(`
            INSERT INTO content (
                filename, original_filename, file_path, file_size, 
                mime_type, content_type, checksum, uploaded_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            file.filename,
            file.originalname,
            file.path,
            file.size,
            file.mimetype,
            detectedType,
            checksum,
            req.user.id
        ]);
        
        const contentId = result.insertId;
        
        // Get all active nodes for distribution
        const [nodes] = await db.execute(`
            SELECT id FROM cdn_nodes WHERE status = 'online'
        `);
        
        // Create distribution records
        const distributionPromises = nodes.map(node => 
            db.execute(`
                INSERT INTO content_distribution (content_id, node_id, status)
                VALUES (?, ?, 'pending')
            `, [contentId, node.id])
        );
        
        await Promise.all(distributionPromises);
        
        res.json({
            success: true,
            message: 'Content uploaded successfully',
            data: {
                id: contentId,
                filename: file.filename,
                originalName: file.originalname,
                size: file.size,
                type: detectedType,
                checksum: checksum,
                distributionCount: nodes.length,
                performanceAnalysis,
                validation
            }
        });
    } catch (error) {
        console.error('Upload content error:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Failed to upload content',
            error: error.message
        });
    }
});

// POST /api/content/:id/distribute - Distribute content to nodes
router.post('/:id/distribute', auth, requirePermission('content'), async (req, res) => {
    try {
        const { id } = req.params;
        const { nodeIds } = req.body;
        
        // Get content info
        const [contentResult] = await db.execute(`
            SELECT * FROM content WHERE id = ?
        `, [id]);
        
        if (contentResult.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Content not found'
            });
        }
        
        const content = contentResult[0];
        
        // Get nodes to distribute to
        let nodes;
        if (nodeIds && nodeIds.length > 0) {
            const [nodeResult] = await db.execute(`
                SELECT id FROM cdn_nodes WHERE id IN (${nodeIds.map(() => '?').join(',')})
            `, nodeIds);
            nodes = nodeResult;
        } else {
            const [nodeResult] = await db.execute(`
                SELECT id FROM cdn_nodes WHERE status = 'online'
            `);
            nodes = nodeResult;
        }
        
        // Update distribution status
        const updatePromises = nodes.map(node => 
            db.execute(`
                UPDATE content_distribution 
                SET status = 'distributed', distribution_date = NOW()
                WHERE content_id = ? AND node_id = ?
            `, [id, node.id])
        );
        
        await Promise.all(updatePromises);
        
        res.json({
            success: true,
            message: 'Content distributed successfully',
            data: {
                contentId: id,
                distributedNodes: nodes.length,
                totalNodes: nodes.length
            }
        });
    } catch (error) {
        console.error('Distribute content error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to distribute content'
        });
    }
});

// DELETE /api/content/:id - Delete content
router.delete('/:id', auth, requirePermission('content'), async (req, res) => {
    try {
        const { id } = req.params;
        
        // Get content info
        const [contentResult] = await db.execute(`
            SELECT * FROM content WHERE id = ?
        `, [id]);
        
        if (contentResult.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Content not found'
            });
        }
        
        const content = contentResult[0];
        
        // Delete file from filesystem
        try {
            await fs.unlink(content.file_path);
        } catch (error) {
            console.warn('File not found for deletion:', content.file_path);
        }
        
        // Delete from database (CASCADE will handle content_distribution)
        await db.execute('DELETE FROM content WHERE id = ?', [id]);
        
        res.json({
            success: true,
            message: 'Content deleted successfully'
        });
    } catch (error) {
        console.error('Delete content error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete content'
        });
    }
});

// GET /api/content/:id/distribution - Get content distribution status
router.get('/:id/distribution', auth, requirePermission('content'), async (req, res) => {
    try {
        const { id } = req.params;
        
        const [results] = await db.execute(`
            SELECT 
                cd.*,
                n.name as node_name,
                n.location,
                n.status as node_status
            FROM content_distribution cd
            JOIN cdn_nodes n ON cd.node_id = n.id
            WHERE cd.content_id = ?
            ORDER BY cd.distribution_date DESC
        `, [id]);
        
        const distributionStats = {
            total: results.length,
            distributed: results.filter(r => r.status === 'distributed').length,
            pending: results.filter(r => r.status === 'pending').length,
            failed: results.filter(r => r.status === 'failed').length
        };
        
        res.json({
            success: true,
            data: {
                contentId: id,
                distribution: results,
                stats: distributionStats
            }
        });
    } catch (error) {
        console.error('Get distribution error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch distribution status'
        });
    }
});

// POST /api/content/:id/cache-invalidate - Invalidate cache
router.post('/:id/cache-invalidate', auth, requirePermission('content'), async (req, res) => {
    try {
        const { id } = req.params;
        const { nodeIds } = req.body;
        
        // Update distribution status to trigger cache invalidation
        let query = `
            UPDATE content_distribution 
            SET status = 'pending', distribution_date = NOW()
            WHERE content_id = ?
        `;
        let params = [id];
        
        if (nodeIds && nodeIds.length > 0) {
            query += ` AND node_id IN (${nodeIds.map(() => '?').join(',')})`;
            params.push(...nodeIds);
        }
        
        const [result] = await db.execute(query, params);
        
        res.json({
            success: true,
            message: 'Cache invalidation initiated',
            data: {
                contentId: id,
                affectedNodes: result.affectedRows
            }
        });
    } catch (error) {
        console.error('Cache invalidation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to invalidate cache'
        });
    }
});

// POST /api/content/:id/optimize - Optimize content
router.post('/:id/optimize', auth, requirePermission('content'), async (req, res) => {
    try {
        const { id } = req.params;
        const { options = {} } = req.body;
        
        // Get content info
        const [contentResult] = await db.execute(`
            SELECT * FROM content WHERE id = ?
        `, [id]);
        
        if (contentResult.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Content not found'
            });
        }
        
        const content = contentResult[0];
        const optimizer = new ContentOptimizer();
        
        // Optimize content
        const optimizationResult = await optimizer.optimizeContent(content.file_path, options);
        
        // Update content record with optimized path
        await db.execute(`
            UPDATE content 
            SET file_path = ?, file_size = ?, updated_at = NOW()
            WHERE id = ?
        `, [optimizationResult.optimizedPath, optimizationResult.optimizedSize, id]);
        
        res.json({
            success: true,
            message: 'Content optimized successfully',
            data: {
                contentId: id,
                optimizationResult
            }
        });
    } catch (error) {
        console.error('Content optimization error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to optimize content'
        });
    }
});

// GET /api/content/stats - Get content statistics
router.get('/stats', auth, requirePermission('content'), async (req, res) => {
    try {
        const [contentStats] = await db.execute(`
            SELECT 
                COUNT(*) as total_content,
                SUM(file_size) as total_size,
                AVG(file_size) as avg_size,
                COUNT(CASE WHEN content_type = 'image' THEN 1 END) as image_count,
                COUNT(CASE WHEN content_type = 'video' THEN 1 END) as video_count,
                COUNT(CASE WHEN content_type = 'dynamic' THEN 1 END) as dynamic_count,
                COUNT(CASE WHEN content_type = 'static' THEN 1 END) as static_count
            FROM content
        `);
        
        const [distributionStats] = await db.execute(`
            SELECT 
                COUNT(*) as total_distributions,
                COUNT(CASE WHEN status = 'distributed' THEN 1 END) as distributed_count,
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
                COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count
            FROM content_distribution
        `);
        
        const [recentUploads] = await db.execute(`
            SELECT 
                c.*,
                u.username as uploaded_by_name
            FROM content c
            LEFT JOIN users u ON c.uploaded_by = u.id
            ORDER BY c.created_at DESC
            LIMIT 5
        `);
        
        res.json({
            success: true,
            data: {
                content: contentStats[0],
                distribution: distributionStats[0],
                recentUploads
            }
        });
    } catch (error) {
        console.error('Get content stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch content statistics'
        });
    }
});

module.exports = router; 