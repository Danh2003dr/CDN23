import apiService from './apiService';
import { QRScanResult, ApiResponse } from '../types';

export const qrService = {
  // Verify QR code data
  async verifyQR(qrData: string): Promise<ApiResponse<QRScanResult['data']>> {
    return apiService.post('/qr/verify', { qrData });
  },

  // Get batch info by QR scan
  async scanBatch(batchCode: string): Promise<ApiResponse<QRScanResult['data']>> {
    return apiService.get(`/qr/batch/${batchCode}`);
  },

  // Generate QR code for batch
  async generateBatchQR(batchData: any): Promise<ApiResponse<{ data: string; imageUrl: string; hash: string; verifyUrl: string }>> {
    return apiService.post('/qr/generate/batch', { batchData });
  },

  // Generate simple QR code
  async generateSimpleQR(url: string, filename?: string): Promise<ApiResponse<{ imageUrl: string; filename: string }>> {
    return apiService.post('/qr/generate/simple', { url, filename });
  },

  // Generate QR as data URL
  async generateDataURL(data: string, options?: any): Promise<ApiResponse<{ dataURL: string; data: string }>> {
    return apiService.post('/qr/dataurl', { data, options });
  },

  // Get QR statistics
  async getQRStats(): Promise<ApiResponse<{ totalQRCodes: number; batchQRs: number; eventQRs: number; totalSize: number; totalSizeMB: string }>> {
    return apiService.get('/qr/stats');
  }
};