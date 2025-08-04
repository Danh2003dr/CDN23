const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
let sharp;
try {
    sharp = require('sharp');
} catch (error) {
    console.warn('Sharp not available, image optimization disabled');
    sharp = null;
}
const db = require('../config/database');

class ContentOptimizer {
    constructor() {
        this.supportedImageFormats = ['jpeg', 'jpg', 'png', 'webp', 'gif'];
        this.supportedVideoFormats = ['mp4', 'webm', 'ogg'];
        this.maxImageSize = 5 * 1024 * 1024; // 5MB
        this.maxVideoSize = 100 * 1024 * 1024; // 100MB
    }

    // 1. Optimize Image Content
    async optimizeImage(filePath, options = {}) {
        try {
            if (!sharp) {
                // If sharp is not available, return original file
                const stats = await fs.stat(filePath);
                return {
                    originalSize: stats.size,
                    optimizedSize: stats.size,
                    compressionRatio: 0,
                    optimizedPath: filePath,
                    format: path.extname(filePath).slice(1)
                };
            }

            const {
                quality = 85,
                width,
                height,
                format = 'webp',
                progressive = true
            } = options;

            const image = sharp(filePath);
            const metadata = await image.metadata();

            // Resize if dimensions provided
            if (width || height) {
                image.resize(width, height, {
                    fit: 'inside',
                    withoutEnlargement: true
                });
            }

            // Apply optimization based on format
            switch (format.toLowerCase()) {
                case 'webp':
                    image.webp({ quality, progressive });
                    break;
                case 'jpeg':
                case 'jpg':
                    image.jpeg({ quality, progressive });
                    break;
                case 'png':
                    image.png({ quality, progressive });
                    break;
                default:
                    image.webp({ quality, progressive });
            }

            const optimizedBuffer = await image.toBuffer();
            const optimizedPath = filePath.replace(/\.[^/.]+$/, `.optimized.${format}`);

            await fs.writeFile(optimizedPath, optimizedBuffer);

            return {
                originalSize: metadata.size,
                optimizedSize: optimizedBuffer.length,
                compressionRatio: ((metadata.size - optimizedBuffer.length) / metadata.size * 100).toFixed(2),
                optimizedPath,
                format: format.toLowerCase()
            };
        } catch (error) {
            console.error('Image optimization error:', error);
            // Return original file if optimization fails
            const stats = await fs.stat(filePath);
            return {
                originalSize: stats.size,
                optimizedSize: stats.size,
                compressionRatio: 0,
                optimizedPath: filePath,
                format: path.extname(filePath).slice(1)
            };
        }
    }

    // 2. Optimize Video Content
    async optimizeVideo(filePath, options = {}) {
        try {
            const {
                codec = 'libx264',
                bitrate = '1000k',
                resolution = '720p',
                format = 'mp4'
            } = options;

            // This would typically use FFmpeg
            // For now, we'll simulate video optimization
            const stats = await fs.stat(filePath);
            const originalSize = stats.size;
            
            // Simulate optimization (in real implementation, use FFmpeg)
            const optimizedSize = Math.floor(originalSize * 0.7); // 30% reduction
            const optimizedPath = filePath.replace(/\.[^/.]+$/, `.optimized.${format}`);

            return {
                originalSize,
                optimizedSize,
                compressionRatio: ((originalSize - optimizedSize) / originalSize * 100).toFixed(2),
                optimizedPath,
                codec,
                bitrate,
                resolution
            };
        } catch (error) {
            console.error('Video optimization error:', error);
            throw error;
        }
    }

    // 3. Optimize CSS/JS Content
    async optimizeCode(filePath, options = {}) {
        try {
            const content = await fs.readFile(filePath, 'utf8');
            const ext = path.extname(filePath).toLowerCase();
            
            let optimizedContent = content;
            let optimizations = [];

            // Remove comments and whitespace
            if (ext === '.css') {
                optimizedContent = this.minifyCSS(content);
                optimizations.push('CSS minification');
            } else if (ext === '.js') {
                optimizedContent = this.minifyJS(content);
                optimizations.push('JavaScript minification');
            } else if (ext === '.html') {
                optimizedContent = this.minifyHTML(content);
                optimizations.push('HTML minification');
            }

            const optimizedPath = filePath.replace(/\.[^/.]+$/, '.min' + ext);
            await fs.writeFile(optimizedPath, optimizedContent);

            return {
                originalSize: content.length,
                optimizedSize: optimizedContent.length,
                compressionRatio: ((content.length - optimizedContent.length) / content.length * 100).toFixed(2),
                optimizedPath,
                optimizations
            };
        } catch (error) {
            console.error('Code optimization error:', error);
            throw error;
        }
    }

    // 4. Generate Cache Headers
    generateCacheHeaders(contentType, options = {}) {
        const {
            maxAge = 86400, // 24 hours
            staleWhileRevalidate = 3600, // 1 hour
            immutable = false
        } = options;

        let cacheControl = `public, max-age=${maxAge}`;
        
        if (staleWhileRevalidate) {
            cacheControl += `, stale-while-revalidate=${staleWhileRevalidate}`;
        }
        
        if (immutable) {
            cacheControl += ', immutable';
        }

        return {
            'Cache-Control': cacheControl,
            'ETag': `"${crypto.createHash('md5').update(Date.now().toString()).digest('hex')}"`,
            'Last-Modified': new Date().toUTCString()
        };
    }

    // 5. Content Type Detection and Optimization
    async optimizeContent(filePath, options = {}) {
        try {
            const ext = path.extname(filePath).toLowerCase();
            const stats = await fs.stat(filePath);
            
            // Check file size limits
            if (stats.size > this.maxImageSize && this.supportedImageFormats.includes(ext.slice(1))) {
                throw new Error('Image file too large');
            }
            
            if (stats.size > this.maxVideoSize && this.supportedVideoFormats.includes(ext.slice(1))) {
                throw new Error('Video file too large');
            }

            let optimizationResult = {};

            // Determine optimization strategy based on file type
            if (this.supportedImageFormats.includes(ext.slice(1))) {
                optimizationResult = await this.optimizeImage(filePath, options);
            } else if (this.supportedVideoFormats.includes(ext.slice(1))) {
                optimizationResult = await this.optimizeVideo(filePath, options);
            } else if (['.css', '.js', '.html'].includes(ext)) {
                optimizationResult = await this.optimizeCode(filePath, options);
            } else {
                // For other file types, just copy
                optimizationResult = {
                    originalSize: stats.size,
                    optimizedSize: stats.size,
                    compressionRatio: 0,
                    optimizedPath: filePath
                };
            }

            return {
                ...optimizationResult,
                contentType: this.getContentType(ext),
                cacheHeaders: this.generateCacheHeaders(this.getContentType(ext), options)
            };
        } catch (error) {
            console.error('Content optimization error:', error);
            throw error;
        }
    }

    // 6. Minification Helpers
    minifyCSS(css) {
        return css
            .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
            .replace(/\s+/g, ' ') // Collapse whitespace
            .replace(/\s*([{}:;,>+~])\s*/g, '$1') // Remove spaces around certain characters
            .replace(/;\s*}/g, '}') // Remove trailing semicolons
            .trim();
    }

    minifyJS(js) {
        return js
            .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
            .replace(/\/\/.*$/gm, '') // Remove line comments
            .replace(/\s+/g, ' ') // Collapse whitespace
            .replace(/\s*([{}:;,>+~])\s*/g, '$1') // Remove spaces around certain characters
            .trim();
    }

    minifyHTML(html) {
        return html
            .replace(/<!--[\s\S]*?-->/g, '') // Remove comments
            .replace(/\s+/g, ' ') // Collapse whitespace
            .replace(/>\s+</g, '><') // Remove spaces between tags
            .trim();
    }

    // 7. Content Type Detection
    getContentType(extension) {
        const mimeTypes = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.webp': 'image/webp',
            '.mp4': 'video/mp4',
            '.webm': 'video/webm',
            '.ogg': 'video/ogg',
            '.css': 'text/css',
            '.js': 'application/javascript',
            '.html': 'text/html',
            '.json': 'application/json',
            '.txt': 'text/plain',
            '.pdf': 'application/pdf'
        };
        
        return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
    }

    // 8. Generate CDN URLs
    generateCDNUrl(filePath, nodeId) {
        const fileName = path.basename(filePath);
        return `/cdn/node-${nodeId}/${fileName}`;
    }

    // 9. Content Validation
    async validateContent(filePath) {
        try {
            const stats = await fs.stat(filePath);
            const ext = path.extname(filePath).toLowerCase();
            
            const validation = {
                isValid: true,
                errors: [],
                warnings: []
            };

            // Check file size
            if (stats.size === 0) {
                validation.isValid = false;
                validation.errors.push('File is empty');
            }

            // Check file type
            const mimeType = this.getContentType(ext);
            if (mimeType === 'application/octet-stream') {
                validation.warnings.push('Unknown file type');
            }

            // Check for malicious content (basic check)
            const content = await fs.readFile(filePath);
            if (content.includes('<script>') || content.includes('javascript:')) {
                validation.warnings.push('Potential security risk detected');
            }

            return validation;
        } catch (error) {
            return {
                isValid: false,
                errors: [error.message],
                warnings: []
            };
        }
    }

    // 10. Performance Analysis
    async analyzePerformance(filePath) {
        try {
            const stats = await fs.stat(filePath);
            const ext = path.extname(filePath).toLowerCase();
            
            const analysis = {
                fileSize: stats.size,
                contentType: this.getContentType(ext),
                optimizationPotential: 0,
                recommendations: []
            };

            // Analyze optimization potential
            if (this.supportedImageFormats.includes(ext.slice(1))) {
                analysis.optimizationPotential = 60; // 60% potential reduction
                analysis.recommendations.push('Convert to WebP format');
                analysis.recommendations.push('Resize to appropriate dimensions');
            } else if (this.supportedVideoFormats.includes(ext.slice(1))) {
                analysis.optimizationPotential = 40; // 40% potential reduction
                analysis.recommendations.push('Use H.264 codec for better compatibility');
                analysis.recommendations.push('Optimize bitrate');
            } else if (['.css', '.js', '.html'].includes(ext)) {
                analysis.optimizationPotential = 30; // 30% potential reduction
                analysis.recommendations.push('Minify code');
                analysis.recommendations.push('Remove unnecessary whitespace');
            }

            return analysis;
        } catch (error) {
            console.error('Performance analysis error:', error);
            throw error;
        }
    }
}

module.exports = ContentOptimizer; 