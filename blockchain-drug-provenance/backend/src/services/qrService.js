const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const logger = require('../utils/logger');

class QRService {
  constructor() {
    this.baseUrl = process.env.QR_CODE_BASE_URL || 'http://localhost:3000/verify';
    this.qrDir = path.join(process.env.UPLOAD_PATH || './uploads', 'qrcodes');
    this.ensureQRDir();
  }

  /**
   * Ensure QR codes directory exists
   */
  ensureQRDir() {
    if (!fs.existsSync(this.qrDir)) {
      fs.mkdirSync(this.qrDir, { recursive: true });
    }
  }

  /**
   * Generate QR code for drug batch
   */
  async generateBatchQR(batchData) {
    try {
      const {
        batchCode,
        drugName,
        manufacturer,
        expiryDate,
        blockchainId
      } = batchData;

      // Create QR data object
      const qrData = {
        type: 'DRUG_BATCH',
        batchCode: batchCode,
        drugName: drugName,
        manufacturer: manufacturer,
        expiryDate: expiryDate,
        blockchainId: blockchainId,
        verifyUrl: `${this.baseUrl}/${batchCode}`,
        timestamp: new Date().toISOString(),
        version: '1.0'
      };

      // Generate secure hash for verification
      const hash = this.generateSecureHash(qrData);
      qrData.hash = hash;

      // Convert to JSON string
      const qrDataString = JSON.stringify(qrData);

      // Generate filename
      const filename = `batch-${batchCode}-${Date.now()}.png`;
      const filePath = path.join(this.qrDir, filename);

      // Generate QR code image
      await QRCode.toFile(filePath, qrDataString, {
        type: 'png',
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 300,
        errorCorrectionLevel: 'H' // High error correction for better scanning
      });

      logger.info(`QR code generated for batch: ${batchCode}`);

      return {
        data: qrDataString,
        imageUrl: `/uploads/qrcodes/${filename}`,
        filePath: filePath,
        filename: filename,
        hash: hash,
        verifyUrl: qrData.verifyUrl
      };

    } catch (error) {
      logger.error('Error generating QR code:', error);
      throw new Error(`QR code generation failed: ${error.message}`);
    }
  }

  /**
   * Generate QR code for supply chain event
   */
  async generateSupplyChainEventQR(eventData) {
    try {
      const {
        batchId,
        eventType,
        fromEntity,
        toEntity,
        location,
        timestamp,
        transactionHash
      } = eventData;

      const qrData = {
        type: 'SUPPLY_CHAIN_EVENT',
        batchId: batchId,
        eventType: eventType,
        fromEntity: fromEntity,
        toEntity: toEntity,
        location: location,
        timestamp: timestamp,
        transactionHash: transactionHash,
        verifyUrl: `${this.baseUrl}/event/${transactionHash}`,
        version: '1.0'
      };

      const hash = this.generateSecureHash(qrData);
      qrData.hash = hash;

      const qrDataString = JSON.stringify(qrData);
      const filename = `event-${batchId}-${Date.now()}.png`;
      const filePath = path.join(this.qrDir, filename);

      await QRCode.toFile(filePath, qrDataString, {
        type: 'png',
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 250,
        errorCorrectionLevel: 'H'
      });

      logger.info(`QR code generated for supply chain event: ${eventType}`);

      return {
        data: qrDataString,
        imageUrl: `/uploads/qrcodes/${filename}`,
        filePath: filePath,
        filename: filename,
        hash: hash,
        verifyUrl: qrData.verifyUrl
      };

    } catch (error) {
      logger.error('Error generating supply chain event QR code:', error);
      throw new Error(`Supply chain QR generation failed: ${error.message}`);
    }
  }

  /**
   * Generate simple verification QR code
   */
  async generateSimpleQR(url, filename) {
    try {
      const filePath = path.join(this.qrDir, filename);

      await QRCode.toFile(filePath, url, {
        type: 'png',
        quality: 0.92,
        margin: 1,
        width: 200,
        errorCorrectionLevel: 'M'
      });

      return {
        imageUrl: `/uploads/qrcodes/${filename}`,
        filePath: filePath,
        filename: filename
      };

    } catch (error) {
      logger.error('Error generating simple QR code:', error);
      throw new Error(`Simple QR generation failed: ${error.message}`);
    }
  }

  /**
   * Parse and verify QR code data
   */
  verifyQRData(qrDataString) {
    try {
      const qrData = JSON.parse(qrDataString);

      // Check required fields
      if (!qrData.type || !qrData.hash || !qrData.timestamp) {
        return {
          isValid: false,
          error: 'Invalid QR code format'
        };
      }

      // Verify hash
      const expectedHash = this.generateSecureHash({ ...qrData, hash: undefined });
      if (expectedHash !== qrData.hash) {
        return {
          isValid: false,
          error: 'QR code has been tampered with'
        };
      }

      // Check expiry (if applicable)
      if (qrData.expiryDate) {
        const expiryDate = new Date(qrData.expiryDate);
        if (expiryDate < new Date()) {
          return {
            isValid: true,
            isExpired: true,
            data: qrData
          };
        }
      }

      return {
        isValid: true,
        isExpired: false,
        data: qrData
      };

    } catch (error) {
      logger.error('Error verifying QR data:', error);
      return {
        isValid: false,
        error: 'Invalid QR code data'
      };
    }
  }

  /**
   * Generate batch verification URL
   */
  generateVerificationURL(batchCode) {
    return `${this.baseUrl}/${batchCode}`;
  }

  /**
   * Generate secure hash for QR data
   */
  generateSecureHash(data) {
    const secretKey = process.env.QR_SECRET_KEY || 'default-secret-key';
    const dataString = JSON.stringify(data, Object.keys(data).sort());
    return crypto.createHmac('sha256', secretKey).update(dataString).digest('hex');
  }

  /**
   * Generate QR code as base64 data URL
   */
  async generateQRDataURL(data, options = {}) {
    try {
      const defaultOptions = {
        type: 'image/png',
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 300,
        errorCorrectionLevel: 'H'
      };

      const qrOptions = { ...defaultOptions, ...options };
      const dataURL = await QRCode.toDataURL(data, qrOptions);

      return {
        dataURL: dataURL,
        data: data
      };

    } catch (error) {
      logger.error('Error generating QR data URL:', error);
      throw new Error(`QR data URL generation failed: ${error.message}`);
    }
  }

  /**
   * Generate bulk QR codes for multiple batches
   */
  async generateBulkBatchQRs(batchesData) {
    try {
      const results = [];

      for (const batchData of batchesData) {
        try {
          const qrResult = await this.generateBatchQR(batchData);
          results.push({
            batchCode: batchData.batchCode,
            success: true,
            qr: qrResult
          });
        } catch (error) {
          results.push({
            batchCode: batchData.batchCode,
            success: false,
            error: error.message
          });
        }
      }

      logger.info(`Bulk QR generation completed: ${results.length} codes processed`);

      return {
        success: true,
        results: results,
        totalProcessed: results.length,
        successCount: results.filter(r => r.success).length,
        failureCount: results.filter(r => !r.success).length
      };

    } catch (error) {
      logger.error('Error in bulk QR generation:', error);
      throw new Error(`Bulk QR generation failed: ${error.message}`);
    }
  }

  /**
   * Delete QR code file
   */
  async deleteQRFile(filename) {
    try {
      const filePath = path.join(this.qrDir, filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        logger.info(`QR code file deleted: ${filename}`);
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Error deleting QR file:', error);
      throw error;
    }
  }

  /**
   * Get QR code statistics
   */
  getQRStats() {
    try {
      const files = fs.readdirSync(this.qrDir);
      const stats = {
        totalQRCodes: files.length,
        batchQRs: files.filter(f => f.startsWith('batch-')).length,
        eventQRs: files.filter(f => f.startsWith('event-')).length,
        totalSize: 0
      };

      files.forEach(file => {
        const filePath = path.join(this.qrDir, file);
        const fileStats = fs.statSync(filePath);
        stats.totalSize += fileStats.size;
      });

      stats.totalSizeMB = (stats.totalSize / (1024 * 1024)).toFixed(2);

      return stats;

    } catch (error) {
      logger.error('Error getting QR stats:', error);
      throw error;
    }
  }

  /**
   * Cleanup old QR files
   */
  async cleanupOldQRs(daysOld = 30) {
    try {
      const files = fs.readdirSync(this.qrDir);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      let deletedCount = 0;

      files.forEach(file => {
        const filePath = path.join(this.qrDir, file);
        const stats = fs.statSync(filePath);

        if (stats.mtime < cutoffDate) {
          fs.unlinkSync(filePath);
          deletedCount++;
        }
      });

      logger.info(`Cleaned up ${deletedCount} old QR code files`);

      return {
        deletedCount: deletedCount,
        cutoffDate: cutoffDate
      };

    } catch (error) {
      logger.error('Error cleaning up old QRs:', error);
      throw error;
    }
  }
}

// Create singleton instance
const qrService = new QRService();

module.exports = qrService;